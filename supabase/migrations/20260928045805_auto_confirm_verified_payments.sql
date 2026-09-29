-- Payment approval confirms a ready booking in the same workflow. When a
-- known operational check blocks confirmation, the approved payment remains
-- intact and the exception is recorded for an owner to resolve.
alter table public.booking_requests
  add column if not exists confirmation_exception_code text,
  add column if not exists confirmation_exception_message text,
  add column if not exists confirmation_exception_at timestamptz;

alter table public.booking_requests
  drop constraint if exists booking_requests_confirmation_exception_code_check;

alter table public.booking_requests
  add constraint booking_requests_confirmation_exception_code_check
  check (
    confirmation_exception_code is null
    or confirmation_exception_code in (
      'assignment_required',
      'vehicle_unavailable',
      'vehicle_maintenance_unready',
      'vehicle_conflict',
      'stale_assignment',
      'assignment_expectation_required',
      'pickup_window_elapsed',
      'substitution_ack_required',
      'cross_branch_ack_required',
      'booking_not_submitted'
    )
  );

create or replace function public.confirm_booking_atomic(
  p_booking_id uuid,
  p_actor_id uuid,
  p_expected_vehicle_id uuid default null,
  p_expected_assigned_at timestamptz default null
) returns public.booking_requests
language plpgsql security definer set search_path=public
as $$
declare
  b public.booking_requests;
  v public.vehicles;
  result public.booking_requests;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and user_type = 'Owner/Admin'
      and account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;
  select * into b from public.booking_requests where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  if b.pickup_at <= timezone('utc', now()) then raise exception 'pickup_window_elapsed'; end if;
  if b.assigned_vehicle_id is null then raise exception 'assignment_required'; end if;
  if p_expected_vehicle_id is null or p_expected_assigned_at is null then
    raise exception 'assignment_expectation_required';
  end if;
  if b.assigned_vehicle_id is distinct from p_expected_vehicle_id
    or b.assigned_at is distinct from p_expected_assigned_at then
    raise exception 'stale_assignment';
  end if;
  if not exists (
    select 1 from public.renter_requirement_sets
    where booking_id = b.id and status = 'Verified'
  ) then raise exception 'requirements_not_verified'; end if;
  if not exists (
    select 1 from public.payments
    where booking_id = b.id and status = 'Verified'
  ) then raise exception 'payment_not_verified'; end if;

  select * into v from public.vehicles where id = b.assigned_vehicle_id;
  perform public.assert_vehicle_rental_ready(b.assigned_vehicle_id);
  perform pg_advisory_xact_lock(hashtextextended(b.assigned_vehicle_id::text, 0));
  if exists (
    select 1 from public.booking_requests x
    where x.id <> b.id
      and x.booking_status = 'Confirmed'
      and x.assigned_vehicle_id = b.assigned_vehicle_id
      and b.pickup_at < x.return_at
      and b.return_at > x.pickup_at
  ) then raise exception 'vehicle_conflict'; end if;
  if b.assigned_vehicle_id <> b.requested_vehicle_id
    and (not b.substitution_acknowledged
      or nullif(trim(coalesce(b.assignment_note, '')), '') is null) then
    raise exception 'substitution_ack_required';
  end if;
  if v.branch_id <> b.pickup_branch_id
    and (not b.cross_branch_acknowledged
      or nullif(trim(coalesce(b.assignment_note, '')), '') is null) then
    raise exception 'cross_branch_ack_required';
  end if;

  update public.booking_requests
  set booking_status = 'Confirmed',
      confirmed_by = p_actor_id,
      confirmed_at = timezone('utc', now()),
      confirmation_exception_code = null,
      confirmation_exception_message = null,
      confirmation_exception_at = null
  where id = b.id
  returning * into result;
  return result;
end;
$$;

create or replace function public.review_payment_atomic(
  p_payment_id uuid,
  p_reviewer_id uuid,
  p_action text,
  p_proof_version integer,
  p_submitted_amount numeric,
  p_transaction_reference text,
  p_reason text default null
) returns public.payments
language plpgsql security definer set search_path=public
as $$
declare
  p public.payments;
  proof public.payment_proofs;
  result public.payments;
  booking public.booking_requests;
  confirmation_error text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_reviewer_id
      and user_type = 'Owner/Admin'
      and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  if p_action not in ('verify', 'resubmit', 'pending') then raise exception 'invalid_action'; end if;

  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.status <> 'Pending Verification' then raise exception 'not_pending'; end if;
  select * into proof from public.payment_proofs
  where payment_id = p.id and is_current for update;
  if not found or proof.version <> p_proof_version then raise exception 'stale_proof'; end if;
  if p.submitted_amount is distinct from p_submitted_amount
    or p.transaction_reference is distinct from nullif(trim(p_transaction_reference), '') then
    raise exception 'stale_snapshot';
  end if;
  if p_action = 'resubmit'
    and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'missing_reason';
  end if;
  if p_action = 'verify'
    and p.required_amount is not null
    and p.submitted_amount < p.required_amount then
    raise exception 'insufficient_amount';
  end if;

  update public.payments
  set status = case p_action
        when 'verify' then 'Verified'
        when 'resubmit' then 'Needs Resubmission'
        else 'Pending Verification'
      end,
      resubmission_reason = case when p_action = 'resubmit' then trim(p_reason) else null end,
      reviewed_by = p_reviewer_id,
      reviewed_at = timezone('utc', now()),
      reviewed_proof_version = proof.version,
      reviewed_submitted_amount = p.submitted_amount,
      reviewed_transaction_reference = p.transaction_reference
  where id = p.id
  returning * into result;

  if p_action = 'verify' then
    select * into booking
    from public.booking_requests
    where id = result.booking_id;

    if found and booking.booking_status = 'Submitted' then
      begin
        perform public.confirm_booking_atomic(
          booking.id,
          p_reviewer_id,
          booking.assigned_vehicle_id,
          booking.assigned_at
        );
      exception when others then
        get stacked diagnostics confirmation_error = message_text;
        if confirmation_error = any (array[
          'assignment_required',
          'vehicle_unavailable',
          'vehicle_maintenance_unready',
          'vehicle_conflict',
          'stale_assignment',
          'assignment_expectation_required',
          'pickup_window_elapsed',
          'substitution_ack_required',
          'cross_branch_ack_required',
          'booking_not_submitted'
        ]) then
          update public.booking_requests
          set confirmation_exception_code = confirmation_error,
              confirmation_exception_message = case confirmation_error
                when 'assignment_required' then 'Assign an available vehicle before confirming this rental.'
                when 'vehicle_unavailable' then 'The assigned vehicle is unavailable. Assign another vehicle before confirming.'
                when 'vehicle_maintenance_unready' then 'The assigned vehicle is blocked by maintenance or a due service requirement.'
                when 'vehicle_conflict' then 'The assigned vehicle has a conflicting confirmed booking.'
                when 'stale_assignment' then 'The vehicle assignment changed while this payment was being approved. Refresh the assignment before confirming this rental.'
                when 'assignment_expectation_required' then 'Refresh the vehicle assignment before confirming this rental.'
                when 'pickup_window_elapsed' then 'The pickup time has passed. Review the schedule with the customer.'
                when 'substitution_ack_required' then 'The replacement vehicle needs a documented substitution acknowledgement.'
                when 'cross_branch_ack_required' then 'The cross-branch assignment needs a documented acknowledgement.'
                else 'This booking is no longer ready for automatic confirmation.'
              end,
              confirmation_exception_at = timezone('utc', now())
          where id = booking.id;
        else
          raise;
        end if;
      end;
    end if;
  end if;

  return result;
end;
$$;
