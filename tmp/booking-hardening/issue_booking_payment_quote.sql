CREATE OR REPLACE FUNCTION public.issue_booking_payment_quote(p_booking_id uuid, p_delivery_fee numeric, p_actor_id uuid)
 RETURNS booking_payment_quotes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_booking public.booking_requests; v_vehicle public.vehicles; v_payment public.payments;
  v_quote public.booking_payment_quotes; v_elapsed_seconds numeric; v_days integer;
  v_subtotal numeric(12,2); v_total numeric(12,2); v_down_payment numeric(12,2);
begin
  if p_delivery_fee is null or p_delivery_fee < 0 then raise exception 'invalid_delivery_fee'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_actor_id and p.user_type = 'Owner/Admin' and p.account_status = 'Active') then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_booking from public.booking_requests where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if not exists (select 1 from public.renter_requirement_sets r where r.booking_id = p_booking_id and r.status = 'Verified') then raise exception 'requirements_not_verified'; end if;
  select * into v_vehicle from public.vehicles where id = v_booking.requested_vehicle_id for update;
  if not found or v_vehicle.daily_rate is null or v_vehicle.daily_rate <= 0 then raise exception 'daily_rate_unavailable'; end if;
  select * into v_payment from public.payments where booking_id = p_booking_id for update;
  if found and v_payment.status <> 'Not Submitted' then raise exception 'quote_locked_by_payment'; end if;
  v_elapsed_seconds := extract(epoch from (v_booking.return_at - v_booking.pickup_at));
  if v_elapsed_seconds <= 0 then raise exception 'invalid_rental_period'; end if;
  v_days := greatest(1, ceil((v_elapsed_seconds - 3600) / 86400.0)::integer);
  v_subtotal := round(v_vehicle.daily_rate * v_days, 2);
  v_total := round(v_subtotal + p_delivery_fee, 2);
  v_down_payment := round(v_total * 0.50, 2);
  insert into public.booking_payment_quotes (booking_id, vehicle_id, daily_rate, pickup_at, return_at, billable_days, rental_subtotal, delivery_fee, total_amount, down_payment_amount, remaining_balance_amount, issued_by)
  values (p_booking_id, v_vehicle.id, v_vehicle.daily_rate, v_booking.pickup_at, v_booking.return_at, v_days, v_subtotal, round(p_delivery_fee, 2), v_total, v_down_payment, v_total - v_down_payment, p_actor_id)
  on conflict (booking_id) do update set vehicle_id = excluded.vehicle_id, daily_rate = excluded.daily_rate, pickup_at = excluded.pickup_at, return_at = excluded.return_at, billable_days = excluded.billable_days, rental_subtotal = excluded.rental_subtotal, delivery_fee = excluded.delivery_fee, total_amount = excluded.total_amount, down_payment_amount = excluded.down_payment_amount, remaining_balance_amount = excluded.remaining_balance_amount, quote_version = public.booking_payment_quotes.quote_version + 1, issued_by = excluded.issued_by, issued_at = timezone('utc', now()), updated_at = timezone('utc', now())
  returning * into v_quote;
  if v_payment.id is not null then update public.payments set required_amount = v_down_payment where id = v_payment.id;
  else insert into public.payments (booking_id, customer_id, required_amount, payment_method_label) values (p_booking_id, v_booking.customer_id, v_down_payment, ''); end if;
  perform public.append_user_audit_event(p_actor_id, 'payment.quote_issued', 'payment', coalesce(v_payment.id, (select id from public.payments where booking_id = p_booking_id)), p_booking_id, jsonb_build_object('total_amount', v_total, 'down_payment_amount', v_down_payment, 'security_deposit_amount', 3000, 'billable_days', v_days, 'delivery_fee', p_delivery_fee));
  return v_quote;
end;
$function$
