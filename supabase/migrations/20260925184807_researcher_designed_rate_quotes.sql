-- Researcher-designed capstone baseline: versioned vehicle rate cards and an
-- approved subtotal that makes the recorded 50% down-payment threshold explicit.
-- These records are not a claim about the participating business's commercial terms.

create table public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  package_code text not null check (length(trim(package_code)) between 1 and 80),
  package_label text not null check (length(trim(package_label)) between 1 and 160),
  duration_hours integer not null check (duration_hours > 0 and duration_hours <= 8760),
  base_rate numeric(12,2) not null check (base_rate > 0),
  effective_from date not null,
  effective_until date,
  is_active boolean not null default true,
  researcher_designed boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (researcher_designed),
  check (effective_until is null or effective_until >= effective_from),
  unique (vehicle_id, package_code, effective_from)
);

create index rate_cards_vehicle_effective_idx
  on public.rate_cards (vehicle_id, is_active, effective_from desc);

create trigger rate_cards_set_updated_at
before update on public.rate_cards
for each row execute function public.set_updated_at();

create table public.booking_rate_quotes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.booking_requests(id) on delete restrict,
  rate_card_id uuid not null references public.rate_cards(id) on delete restrict,
  package_code text not null,
  package_label text not null,
  duration_hours integer not null check (duration_hours > 0),
  base_rental_amount numeric(12,2) not null check (base_rental_amount > 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  approved_discount numeric(12,2) not null default 0 check (approved_discount >= 0),
  approved_subtotal numeric(12,2) generated always as
    (base_rental_amount + delivery_fee - approved_discount) stored,
  required_down_payment numeric(12,2) generated always as
    (round((base_rental_amount + delivery_fee - approved_discount) * 0.50, 2)) stored,
  quote_version integer not null default 1 check (quote_version > 0),
  status text not null default 'Approved' check (status = 'Approved'),
  researcher_designed boolean not null default true,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  approved_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (researcher_designed),
  check (base_rental_amount + delivery_fee >= approved_discount)
);

create trigger booking_rate_quotes_set_updated_at
before update on public.booking_rate_quotes
for each row execute function public.set_updated_at();

alter table public.rate_cards enable row level security;
alter table public.booking_rate_quotes enable row level security;
revoke all on public.rate_cards, public.booking_rate_quotes from anon, authenticated;
grant select on public.rate_cards, public.booking_rate_quotes to authenticated;
grant select, insert, update on public.rate_cards to service_role;
grant select on public.booking_rate_quotes to service_role;

create policy rate_cards_owner_select on public.rate_cards
for select to authenticated
using (
  exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  )
);

create policy booking_rate_quotes_owner_select on public.booking_rate_quotes
for select to authenticated
using (
  exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  )
);

create policy booking_rate_quotes_customer_select on public.booking_rate_quotes
for select to authenticated
using (
  exists (
    select 1 from public.booking_requests booking
    where booking.id = booking_rate_quotes.booking_id
      and booking.customer_id = auth.uid()
  )
);

create or replace function public.upsert_booking_rate_quote_atomic(
  p_booking_id uuid,
  p_rate_card_id uuid,
  p_delivery_fee numeric,
  p_approved_discount numeric,
  p_actor_id uuid
)
returns public.booking_rate_quotes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking_requests;
  v_requirements public.renter_requirement_sets;
  v_rate_card public.rate_cards;
  v_payment public.payments;
  v_quote public.booking_rate_quotes;
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_actor_id
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;
  if p_delivery_fee is null or p_delivery_fee < 0
    or p_approved_discount is null or p_approved_discount < 0 then
    raise exception 'invalid_quote_amount';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_booking from public.booking_requests where id = p_booking_id for update;
  if not found or v_booking.booking_status not in ('Draft', 'Submitted') then
    raise exception 'booking_not_quotable';
  end if;
  select * into v_requirements from public.renter_requirement_sets
  where booking_id = p_booking_id for update;
  if not found or v_requirements.status <> 'Verified' then
    raise exception 'requirements_not_verified';
  end if;
  select * into v_rate_card from public.rate_cards
  where id = p_rate_card_id for update;
  if not found or not v_rate_card.is_active
    or v_rate_card.vehicle_id <> v_booking.requested_vehicle_id
    or v_rate_card.effective_from > current_date
    or (v_rate_card.effective_until is not null and v_rate_card.effective_until < current_date) then
    raise exception 'rate_card_not_eligible';
  end if;
  if v_rate_card.base_rate + p_delivery_fee < p_approved_discount then
    raise exception 'invalid_quote_amount';
  end if;
  select * into v_payment from public.payments where booking_id = p_booking_id for update;
  if found and v_payment.status in ('Pending Verification', 'Verified') then
    raise exception 'quote_locked_by_payment';
  end if;

  insert into public.booking_rate_quotes (
    booking_id, rate_card_id, package_code, package_label, duration_hours,
    base_rental_amount, delivery_fee, approved_discount, approved_by
  ) values (
    p_booking_id, v_rate_card.id, v_rate_card.package_code, v_rate_card.package_label,
    v_rate_card.duration_hours, v_rate_card.base_rate, p_delivery_fee,
    p_approved_discount, p_actor_id
  ) on conflict (booking_id) do update set
    rate_card_id = excluded.rate_card_id,
    package_code = excluded.package_code,
    package_label = excluded.package_label,
    duration_hours = excluded.duration_hours,
    base_rental_amount = excluded.base_rental_amount,
    delivery_fee = excluded.delivery_fee,
    approved_discount = excluded.approved_discount,
    quote_version = public.booking_rate_quotes.quote_version + 1,
    approved_by = excluded.approved_by,
    approved_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning * into v_quote;
  return v_quote;
end;
$$;

create or replace function public.submit_payment_proof_atomic(
  p_booking_id uuid,
  p_customer_id uuid,
  p_payment_method_id uuid,
  p_submitted_amount numeric,
  p_transaction_reference text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_proof public.payment_proofs;
  v_method public.payment_methods;
  v_quote public.booking_rate_quotes;
  v_version integer;
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_customer_id
      and profile.user_type = 'Customer/Renter'
      and profile.account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  if not exists (
    select 1 from public.booking_requests booking
    where booking.id = p_booking_id and booking.customer_id = p_customer_id
  ) then raise exception 'booking_not_found'; end if;
  if not exists (
    select 1 from public.renter_requirement_sets requirement_set
    where requirement_set.booking_id = p_booking_id
      and requirement_set.customer_id = p_customer_id
      and requirement_set.status = 'Verified'
  ) then raise exception 'requirements_not_verified'; end if;
  if p_submitted_amount is null or p_submitted_amount <= 0
    or nullif(trim(coalesce(p_transaction_reference, '')), '') is null
  then raise exception 'invalid_submission'; end if;

  select * into v_method from public.payment_methods
  where id = p_payment_method_id and is_active;
  if not found then raise exception 'invalid_payment_method'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_quote from public.booking_rate_quotes
  where booking_id = p_booking_id and status = 'Approved' for update;
  if not found then raise exception 'quote_not_approved'; end if;
  select * into v_payment from public.payments where booking_id = p_booking_id for update;
  if not found then
    insert into public.payments (booking_id, customer_id, required_amount, payment_method_label)
    values (p_booking_id, p_customer_id, v_quote.required_down_payment, '')
    returning * into v_payment;
  end if;
  if v_payment.customer_id <> p_customer_id then raise exception 'forbidden'; end if;
  if v_payment.status not in ('Not Submitted', 'Needs Resubmission') then
    raise exception 'not_submittable';
  end if;

  select coalesce(max(proof.version), 0) + 1 into v_version
  from public.payment_proofs proof where proof.payment_id = v_payment.id;
  update public.payment_proofs set is_current = false, superseded_at = timezone('utc', now())
  where payment_id = v_payment.id and is_current;
  insert into public.payment_proofs (
    payment_id, booking_id, customer_id, storage_path, original_filename,
    mime_type, size_bytes, version
  ) values (
    v_payment.id, p_booking_id, p_customer_id, p_storage_path, p_original_filename,
    p_mime_type, p_size_bytes, v_version
  ) returning * into v_proof;
  update public.payments set
    required_amount = v_quote.required_down_payment,
    payment_method_id = v_method.id,
    payment_method_label = v_method.label,
    submitted_amount = p_submitted_amount,
    transaction_reference = trim(p_transaction_reference),
    status = 'Pending Verification',
    submitted_at = timezone('utc', now()),
    resubmission_reason = null,
    reviewed_by = null,
    reviewed_at = null,
    reviewed_proof_version = null,
    reviewed_submitted_amount = null,
    reviewed_transaction_reference = null
  where id = v_payment.id returning * into v_payment;
  return jsonb_build_object('payment', to_jsonb(v_payment), 'proof', to_jsonb(v_proof));
end;
$$;

revoke all on function public.upsert_booking_rate_quote_atomic(uuid,uuid,numeric,numeric,uuid)
  from public, anon, authenticated;
grant execute on function public.upsert_booking_rate_quote_atomic(uuid,uuid,numeric,numeric,uuid)
  to service_role;
revoke all on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint)
  from public, anon, authenticated;
grant execute on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint)
  to service_role;
