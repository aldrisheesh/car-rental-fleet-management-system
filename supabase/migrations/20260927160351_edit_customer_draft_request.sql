-- Customers may revise an unsubmitted request without creating a second one.
-- The operation is deliberately limited to drafts: once requirements have been
-- submitted, the booking is locked for staff review.
alter table public.audit_events
  drop constraint if exists audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check check (action in (
    'booking.created', 'booking.edited', 'booking.vehicle_assigned', 'booking.confirmed',
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

create function public.edit_customer_draft_booking_atomic(
  p_booking_id uuid,
  p_customer_id uuid,
  p_requested_vehicle_id uuid,
  p_pickup_branch_id uuid,
  p_return_branch_id uuid,
  p_pickup_at timestamptz,
  p_return_at timestamptz,
  p_destination text,
  p_purpose_of_use text,
  p_pickup_delivery_option text,
  p_pickup_location text,
  p_dropoff_location text,
  p_preferred_seat_count integer
)
returns public.booking_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking_requests;
  v_result public.booking_requests;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_customer_id
      and user_type = 'Customer/Renter'
      and account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_booking
  from public.booking_requests
  where id = p_booking_id and customer_id = p_customer_id
  for update;

  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.booking_status <> 'Draft' then
    raise exception 'booking_not_editable';
  end if;
  if exists (
    select 1 from public.rental_transactions where booking_id = v_booking.id
  ) then
    raise exception 'booking_already_released';
  end if;
  if p_requested_vehicle_id <> v_booking.requested_vehicle_id then
    raise exception 'vehicle_change_not_supported';
  end if;
  if not exists (
    select 1 from public.vehicles where id = p_requested_vehicle_id and is_active
  ) then
    raise exception 'vehicle_not_available';
  end if;
  if not exists (
    select 1 from public.branches where id = p_pickup_branch_id and is_active
  ) or not exists (
    select 1 from public.branches where id = p_return_branch_id and is_active
  ) then
    raise exception 'branch_not_available';
  end if;
  if p_return_at <= p_pickup_at then raise exception 'invalid_dates'; end if;
  if p_pickup_delivery_option not in ('pickup', 'delivery') then
    raise exception 'invalid_pickup_option';
  end if;
  if p_pickup_delivery_option = 'delivery' and (
    nullif(trim(coalesce(p_pickup_location, '')), '') is null
    or nullif(trim(coalesce(p_dropoff_location, '')), '') is null
  ) then
    raise exception 'delivery_locations_required';
  end if;
  if p_preferred_seat_count is not null and p_preferred_seat_count <= 0 then
    raise exception 'invalid_preferred_seat_count';
  end if;

  update public.booking_requests
  set pickup_branch_id = p_pickup_branch_id,
      return_branch_id = p_return_branch_id,
      pickup_at = p_pickup_at,
      return_at = p_return_at,
      destination = nullif(trim(coalesce(p_destination, '')), ''),
      purpose_of_use = nullif(trim(coalesce(p_purpose_of_use, '')), ''),
      pickup_delivery_option = p_pickup_delivery_option,
      pickup_location = case when p_pickup_delivery_option = 'delivery'
        then nullif(trim(coalesce(p_pickup_location, '')), '') else null end,
      dropoff_location = case when p_pickup_delivery_option = 'delivery'
        then nullif(trim(coalesce(p_dropoff_location, '')), '') else null end,
      preferred_seat_count = p_preferred_seat_count
  where id = v_booking.id
  returning * into v_result;

  perform public.append_user_audit_event(
    p_customer_id, 'booking.edited', 'booking', v_booking.id, v_booking.id,
    jsonb_build_object('previous_status', v_booking.booking_status)
  );
  return v_result;
end;
$$;

revoke all on function public.edit_customer_draft_booking_atomic(
  uuid, uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text, text,
  text, text, integer
) from public, anon, authenticated;
grant execute on function public.edit_customer_draft_booking_atomic(
  uuid, uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text, text,
  text, text, integer
) to service_role;
