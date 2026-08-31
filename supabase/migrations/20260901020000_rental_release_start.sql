-- VS010: canonical rental transaction and Owner/Admin vehicle release.
create table if not exists public.rental_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.booking_requests(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  scheduled_pickup_at timestamptz not null,
  scheduled_return_at timestamptz not null,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  released_by uuid not null references public.profiles(id) on delete restrict,
  release_odometer numeric(12,2) check (release_odometer is null or release_odometer >= 0),
  release_fuel_level text not null check (release_fuel_level in ('Empty','1/4','1/2','3/4','Full','Other/Unknown')),
  release_condition_summary text not null,
  existing_damage_notes text,
  agreement_acknowledged boolean not null default false,
  condition_acknowledged boolean not null default false,
  return_schedule_acknowledged boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists rental_transactions_active_vehicle_idx
  on public.rental_transactions(vehicle_id) where started_at is not null and ended_at is null;
create trigger rental_transactions_set_updated_at before update on public.rental_transactions
for each row execute function public.set_updated_at();

alter table public.rental_transactions enable row level security;
revoke all on public.rental_transactions from anon, authenticated;
grant select on public.rental_transactions to authenticated;
drop policy if exists rental_transactions_read_own on public.rental_transactions;
create policy rental_transactions_read_own on public.rental_transactions
  for select to authenticated using (customer_id = auth.uid());

create or replace function public.release_vehicle_start_rental(
  p_booking_id uuid,
  p_actor_id uuid,
  p_expected_vehicle_id uuid,
  p_expected_confirmed_at timestamptz,
  p_release_odometer numeric default null,
  p_release_fuel_level text default 'Other/Unknown',
  p_release_condition_summary text default 'Condition recorded at release.',
  p_existing_damage_notes text default null,
  p_agreement_acknowledged boolean default false,
  p_condition_acknowledged boolean default false,
  p_return_schedule_acknowledged boolean default false
) returns public.rental_transactions
language plpgsql security definer set search_path=public as $$
declare b public.booking_requests; v public.vehicles; r public.rental_transactions;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if p_expected_vehicle_id is null or p_expected_confirmed_at is null then raise exception 'release_expectation_required'; end if;
  if p_release_odometer is not null and p_release_odometer < 0 then raise exception 'invalid_odometer'; end if;
  if p_release_fuel_level not in ('Empty','1/4','1/2','3/4','Full','Other/Unknown') then raise exception 'invalid_fuel_level'; end if;
  if nullif(trim(coalesce(p_release_condition_summary,'')),'') is null then raise exception 'condition_required'; end if;
  select * into b from booking_requests where id=p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Confirmed' then raise exception 'booking_not_confirmed'; end if;
  if b.assigned_vehicle_id is distinct from p_expected_vehicle_id or b.confirmed_at is distinct from p_expected_confirmed_at then raise exception 'stale_release'; end if;
  if exists (select 1 from rental_transactions where booking_id=b.id) then raise exception 'booking_already_released'; end if;
  select * into v from vehicles where id=b.assigned_vehicle_id for update;
  if not found or not v.is_active then raise exception 'vehicle_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(b.assigned_vehicle_id::text, 0));
  if exists (select 1 from rental_transactions where vehicle_id=b.assigned_vehicle_id and started_at is not null and ended_at is null) then raise exception 'vehicle_already_rented'; end if;
  insert into rental_transactions (booking_id,customer_id,vehicle_id,scheduled_pickup_at,scheduled_return_at,started_at,released_by,release_odometer,release_fuel_level,release_condition_summary,existing_damage_notes,agreement_acknowledged,condition_acknowledged,return_schedule_acknowledged)
  values (b.id,b.customer_id,b.assigned_vehicle_id,b.pickup_at,b.return_at,timezone('utc',now()),p_actor_id,p_release_odometer,p_release_fuel_level,trim(p_release_condition_summary),nullif(trim(p_existing_damage_notes),''),p_agreement_acknowledged,p_condition_acknowledged,p_return_schedule_acknowledged)
  returning * into r;
  return r;
end; $$;
revoke all on function public.release_vehicle_start_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,boolean,boolean,boolean) from public,anon,authenticated;
