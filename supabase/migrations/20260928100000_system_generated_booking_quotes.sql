-- Final booking quotes use the booked vehicle's daily rate and elapsed rental
-- time. The issued record is immutable once the customer submits a payment.
create table public.booking_payment_quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.booking_requests(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  daily_rate numeric(12,2) not null check (daily_rate > 0),
  pickup_at timestamptz not null,
  return_at timestamptz not null check (return_at > pickup_at),
  grace_minutes integer not null default 60 check (grace_minutes between 0 and 240),
  billable_days integer not null check (billable_days > 0),
  rental_subtotal numeric(12,2) not null check (rental_subtotal > 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  down_payment_amount numeric(12,2) not null check (down_payment_amount > 0),
  remaining_balance_amount numeric(12,2) not null check (remaining_balance_amount >= 0),
  security_deposit_amount numeric(12,2) not null default 3000 check (security_deposit_amount = 3000),
  quote_version integer not null default 1 check (quote_version > 0),
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (total_amount = rental_subtotal + delivery_fee),
  check (down_payment_amount = round(total_amount * 0.50, 2)),
  check (remaining_balance_amount = total_amount - down_payment_amount)
);

create trigger booking_payment_quotes_set_updated_at
before update on public.booking_payment_quotes
for each row execute function public.set_updated_at();

alter table public.booking_payment_quotes enable row level security;
revoke all on public.booking_payment_quotes from anon, authenticated;
grant select on public.booking_payment_quotes to authenticated;

create policy booking_payment_quotes_customer_select on public.booking_payment_quotes
for select to authenticated
using (exists (select 1 from public.booking_requests b where b.id = booking_id and b.customer_id = auth.uid()));

create policy booking_payment_quotes_owner_select on public.booking_payment_quotes
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Owner/Admin' and p.account_status = 'Active'));

alter table public.audit_events drop constraint if exists audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check (action in (
  'booking.created', 'booking.edited', 'booking.vehicle_assigned', 'booking.confirmed', 'booking.cancelled', 'booking.rejected', 'booking.withdrawn', 'booking.location_reconciled',
  'requirements.submitted', 'requirements.resubmitted', 'requirements.needs_resubmission', 'requirements.verified',
  'payment.quote_issued', 'payment.submitted', 'payment.resubmitted', 'payment.needs_resubmission', 'payment.verified', 'payment.requirement_set',
  'rental.released', 'rental.returned', 'maintenance.created', 'maintenance.started', 'maintenance.completed', 'maintenance.cancelled'
));

create or replace function public.issue_booking_payment_quote(
  p_booking_id uuid,
  p_delivery_fee numeric,
  p_actor_id uuid
) returns public.booking_payment_quotes
language plpgsql security definer set search_path = public as $$
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
$$;

revoke all on function public.issue_booking_payment_quote(uuid,numeric,uuid) from public, anon, authenticated;
grant execute on function public.issue_booking_payment_quote(uuid,numeric,uuid) to service_role;
