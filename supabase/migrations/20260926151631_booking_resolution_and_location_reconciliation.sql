-- Resolve unfinished requests and make a vehicle-location change explicit when
-- it affects a customer's pending request.
alter table public.booking_requests
  add column if not exists resolution_reason text,
  add column if not exists resolved_by uuid references public.profiles(id) on delete restrict,
  add column if not exists resolved_at timestamptz;

alter table public.audit_events
  drop constraint if exists audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check check (action in (
    'booking.created', 'booking.vehicle_assigned', 'booking.confirmed',
    'booking.cancelled', 'booking.rejected', 'booking.withdrawn',
    'booking.location_reconciled',
    'requirements.submitted', 'requirements.resubmitted',
    'requirements.needs_resubmission', 'requirements.verified',
    'payment.submitted', 'payment.resubmitted', 'payment.needs_resubmission',
    'payment.verified', 'payment.requirement_set',
    'rental.released', 'rental.returned',
    'maintenance.created', 'maintenance.started', 'maintenance.completed',
    'maintenance.cancelled'
  ));

create or replace function public.reject_unconfirmed_booking_atomic(
  p_booking_id uuid,
  p_actor_id uuid,
  p_reason text
)
returns public.booking_requests
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.booking_requests;
  v_result public.booking_requests;
  v_reason text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  v_reason := nullif(trim(coalesce(p_reason, '')), '');
  if v_reason is null then raise exception 'resolution_reason_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_booking from public.booking_requests where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.booking_status not in ('Draft', 'Submitted') then
    raise exception 'booking_not_unconfirmed';
  end if;
  if exists (select 1 from public.rental_transactions where booking_id = v_booking.id) then
    raise exception 'booking_already_released';
  end if;
  update public.booking_requests
  set booking_status = 'Rejected', resolution_reason = v_reason,
      resolved_by = p_actor_id, resolved_at = timezone('utc', now())
  where id = v_booking.id returning * into v_result;
  perform public.append_user_audit_event(
    p_actor_id, 'booking.rejected', 'booking', v_booking.id, v_booking.id,
    jsonb_build_object('previous_status', v_booking.booking_status,
      'new_status', v_result.booking_status, 'reason', v_reason)
  );
  return v_result;
end;
$$;

create or replace function public.withdraw_customer_booking_atomic(
  p_booking_id uuid,
  p_customer_id uuid,
  p_reason text
)
returns public.booking_requests
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.booking_requests;
  v_result public.booking_requests;
  v_reason text;
  v_payment_status text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_customer_id and user_type = 'Customer/Renter' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  v_reason := nullif(trim(coalesce(p_reason, '')), '');
  if v_reason is null then raise exception 'resolution_reason_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_booking from public.booking_requests
  where id = p_booking_id and customer_id = p_customer_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.booking_status not in ('Draft', 'Submitted') then
    raise exception 'booking_not_withdrawable';
  end if;
  if exists (select 1 from public.rental_transactions where booking_id = v_booking.id) then
    raise exception 'booking_already_released';
  end if;
  select status into v_payment_status from public.payments where booking_id = v_booking.id for update;
  if v_payment_status in ('Pending Verification', 'Verified') then
    raise exception 'payment_resolution_required';
  end if;
  update public.booking_requests
  set booking_status = 'Cancelled', resolution_reason = v_reason,
      resolved_by = p_customer_id, resolved_at = timezone('utc', now())
  where id = v_booking.id returning * into v_result;
  perform public.append_user_audit_event(
    p_customer_id, 'booking.withdrawn', 'booking', v_booking.id, v_booking.id,
    jsonb_build_object('previous_status', v_booking.booking_status,
      'new_status', v_result.booking_status, 'reason', v_reason)
  );
  return v_result;
end;
$$;

create or replace function public.reconcile_vehicle_location_atomic(
  p_vehicle_id uuid,
  p_actor_id uuid,
  p_branch_id uuid,
  p_acknowledge_impacts boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_vehicle public.vehicles;
  v_impact record;
  v_impact_count integer := 0;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.branches where id = p_branch_id and is_active) then
    raise exception 'branch_not_found';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text, 0));
  select * into v_vehicle from public.vehicles where id = p_vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  if v_vehicle.branch_id = p_branch_id then
    return jsonb_build_object('vehicle_id', v_vehicle.id, 'impacted_bookings', 0);
  end if;
  if exists (
    select 1 from public.booking_requests
    where assigned_vehicle_id = p_vehicle_id and booking_status = 'Confirmed'
  ) then raise exception 'vehicle_reserved'; end if;
  for v_impact in
    select id from public.booking_requests
    where booking_status in ('Draft', 'Submitted')
      and (requested_vehicle_id = p_vehicle_id or assigned_vehicle_id = p_vehicle_id)
    for update
  loop
    v_impact_count := v_impact_count + 1;
  end loop;
  if v_impact_count > 0 and not p_acknowledge_impacts then
    raise exception 'pending_bookings_affected';
  end if;
  update public.vehicles set branch_id = p_branch_id where id = p_vehicle_id;
  for v_impact in
    select id from public.booking_requests
    where booking_status in ('Draft', 'Submitted')
      and (requested_vehicle_id = p_vehicle_id or assigned_vehicle_id = p_vehicle_id)
  loop
    perform public.append_user_audit_event(
      p_actor_id, 'booking.location_reconciled', 'booking', v_impact.id, v_impact.id,
      jsonb_build_object('vehicle_id', p_vehicle_id,
        'previous_branch_id', v_vehicle.branch_id, 'new_branch_id', p_branch_id)
    );
  end loop;
  return jsonb_build_object('vehicle_id', v_vehicle.id, 'impacted_bookings', v_impact_count);
end;
$$;

revoke all on function public.reject_unconfirmed_booking_atomic(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.reject_unconfirmed_booking_atomic(uuid,uuid,text)
  to service_role;
revoke all on function public.withdraw_customer_booking_atomic(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.withdraw_customer_booking_atomic(uuid,uuid,text)
  to service_role;
revoke all on function public.reconcile_vehicle_location_atomic(uuid,uuid,uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.reconcile_vehicle_location_atomic(uuid,uuid,uuid,boolean)
  to service_role;
