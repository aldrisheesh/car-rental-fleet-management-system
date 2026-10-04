alter table public.booking_requests drop constraint booking_requests_confirmation_exception_code_check;
alter table public.booking_requests add constraint booking_requests_confirmation_exception_code_check check(confirmation_exception_code is null or confirmation_exception_code in (
'assignment_required','vehicle_unavailable','vehicle_inspection_pending','vehicle_maintenance_unready','vehicle_conflict','stale_assignment','assignment_expectation_required','pickup_window_elapsed','substitution_ack_required','cross_branch_ack_required','booking_not_submitted','pickup_arrangement_required'));
-- Fix the observed payment/assignment ordering without relaxing confirmation checks.
CREATE OR REPLACE FUNCTION public.review_payment_atomic(p_payment_id uuid, p_reviewer_id uuid, p_action text, p_proof_version integer, p_submitted_amount numeric, p_transaction_reference text, p_reason text DEFAULT NULL::text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        if booking.assigned_vehicle_id is null then
          booking := public.assign_booking_vehicle(
            booking.id, booking.requested_vehicle_id, p_reviewer_id
          );
        end if;
        perform public.confirm_booking_atomic(
          booking.id,
          p_reviewer_id,
          booking.assigned_vehicle_id,
          booking.assigned_at
        );
      exception when others then
        get stacked diagnostics confirmation_error = message_text;
        if confirmation_error = any (array[
          'vehicle_inspection_pending',
          'pickup_arrangement_required',
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
                when 'vehicle_inspection_pending' then 'Complete the vehicle return inspection in Fleet before confirming this rental.'
                when 'pickup_arrangement_required' then 'Save the agreed pickup and return meeting points and instructions before confirming this rental.'
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
$function$
;
