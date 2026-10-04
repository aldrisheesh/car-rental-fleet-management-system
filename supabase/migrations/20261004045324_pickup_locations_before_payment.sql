-- A pickup customer must be able to review complete meeting arrangements
-- with the quote before submitting a down payment. Existing payment reviews
-- remain valid; only quote issuance and new proof submissions use this gate.
create or replace function public.require_pickup_arrangements_before_payment()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_booking public.booking_requests;
begin
  select * into v_booking from public.booking_requests where id = new.booking_id for update;
  if v_booking.pickup_delivery_option = 'pickup' and (
    nullif(btrim(v_booking.pickup_meeting_address), '') is null or
    nullif(btrim(v_booking.pickup_meeting_instructions), '') is null or
    nullif(btrim(v_booking.return_meeting_address), '') is null or
    nullif(btrim(v_booking.return_meeting_instructions), '') is null
  ) then raise exception 'pickup_arrangement_required'; end if;
  if tg_table_name = 'payments' and v_booking.pickup_delivery_option = 'pickup'
    and not exists (select 1 from public.booking_payment_quotes where booking_id = new.booking_id)
  then raise exception 'payment_quote_required'; end if;
  return new;
end;
$$;
revoke all on function public.require_pickup_arrangements_before_payment() from public, anon, authenticated;
grant execute on function public.require_pickup_arrangements_before_payment() to service_role;
create trigger quote_requires_pickup_arrangements
before insert or update on public.booking_payment_quotes
for each row execute function public.require_pickup_arrangements_before_payment();
create trigger proof_requires_pickup_arrangements
before update on public.payments
for each row when (new.status = 'Pending Verification' and new.submitted_at is distinct from old.submitted_at)
execute function public.require_pickup_arrangements_before_payment();
