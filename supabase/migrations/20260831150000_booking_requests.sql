-- Vertical Slice 005: canonical booking request foundation.
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  requested_vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  assigned_vehicle_id uuid references public.vehicles (id) on delete restrict,
  pickup_branch_id uuid not null references public.branches (id) on delete restrict,
  return_branch_id uuid not null references public.branches (id) on delete restrict,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  destination text,
  purpose_of_use text not null,
  pickup_delivery_option text not null,
  pickup_location text,
  dropoff_location text,
  preferred_seat_count integer check (preferred_seat_count is null or preferred_seat_count > 0),
  customer_contact_number text,
  booking_status text not null default 'Submitted' check (booking_status = 'Submitted'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (return_at > pickup_at),
  check (pickup_delivery_option in ('pickup', 'delivery')),
  check ((pickup_delivery_option = 'pickup' and pickup_location is null) or pickup_delivery_option = 'delivery'),
  check ((pickup_delivery_option = 'delivery' and pickup_location is not null and dropoff_location is not null) or pickup_delivery_option = 'pickup')
);

create index if not exists booking_requests_customer_idx on public.booking_requests (customer_id, created_at desc);
create index if not exists booking_requests_status_idx on public.booking_requests (booking_status, created_at desc);

drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at before update on public.booking_requests
for each row execute function public.set_updated_at();

alter table public.booking_requests enable row level security;
revoke all on public.booking_requests from anon, authenticated;
grant select, insert on public.booking_requests to authenticated;

drop policy if exists booking_requests_customer_insert on public.booking_requests;
create policy booking_requests_customer_insert on public.booking_requests
  for insert to authenticated
  with check (
    auth.uid() = customer_id and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Customer/Renter' and p.account_status = 'Active')
  );

drop policy if exists booking_requests_customer_select on public.booking_requests;
create policy booking_requests_customer_select on public.booking_requests
  for select to authenticated using (auth.uid() = customer_id);

drop policy if exists booking_requests_internal_select on public.booking_requests;
create policy booking_requests_internal_select on public.booking_requests
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type in ('Owner/Admin', 'Operations Staff') and p.account_status = 'Active')
  );
