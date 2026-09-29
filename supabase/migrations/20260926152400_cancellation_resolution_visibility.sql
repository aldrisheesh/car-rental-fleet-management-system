-- Preserve the cancellation reason on the booking itself so the customer can
-- see the same operational outcome that is retained in the audit event.
create or replace function public.cancel_confirmed_booking_atomic(
  p_booking_id uuid,
  p_actor_id uuid,
  p_expected_confirmed_at timestamptz,
  p_cancellation_reason text
)
returns public.booking_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.booking_requests;
  v_result public.booking_requests;
  v_reason text;
begin
  if not exists (
    select 1
    from public.profiles profile
    where profile.id = p_actor_id
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;

  v_reason := nullif(trim(coalesce(p_cancellation_reason, '')), '');
  if v_reason is null then
    raise exception 'cancellation_reason_required';
  end if;

  select * into v_booking
  from public.booking_requests
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_booking.booking_status <> 'Confirmed' then
    raise exception 'booking_not_confirmed';
  end if;
  if p_expected_confirmed_at is null
    or v_booking.confirmed_at is distinct from p_expected_confirmed_at then
    raise exception 'stale_cancellation';
  end if;
  if exists (
    select 1
    from public.rental_transactions rental
    where rental.booking_id = v_booking.id
  ) then
    raise exception 'booking_already_released';
  end if;

  update public.booking_requests
  set booking_status = 'Cancelled',
      resolution_reason = v_reason,
      resolved_by = p_actor_id,
      resolved_at = timezone('utc', now())
  where id = v_booking.id
  returning * into v_result;

  perform public.append_user_audit_event(
    p_actor_id,
    'booking.cancelled',
    'booking',
    v_booking.id,
    v_booking.id,
    jsonb_build_object(
      'previous_status', v_booking.booking_status,
      'new_status', v_result.booking_status,
      'reason', v_reason,
      'assigned_vehicle_id', v_booking.assigned_vehicle_id
    )
  );

  return v_result;
end;
$$;

revoke all on function public.cancel_confirmed_booking_atomic(uuid, uuid, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.cancel_confirmed_booking_atomic(uuid, uuid, timestamptz, text)
  to service_role;
