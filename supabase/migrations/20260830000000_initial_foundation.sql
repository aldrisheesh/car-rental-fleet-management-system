-- Vertical Slice 001: stable persistence foundation only.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text not null default '',
  phone_number text,
  user_type text not null default 'Customers / Renters',
  account_status text not null default 'Active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicle_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references public.vehicle_categories (id),
  branch_id uuid not null references public.branches (id),
  license_plate text unique,
  transmission text,
  fuel_type text,
  seat_capacity integer check (seat_capacity is null or seat_capacity > 0),
  daily_rate numeric(12, 2) check (daily_rate is null or daily_rate >= 0),
  reference_fuel_efficiency_km_per_liter numeric(8, 2)
    check (reference_fuel_efficiency_km_per_liter is null or reference_fuel_efficiency_km_per_liter > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at before update on public.branches
for each row execute function public.set_updated_at();
drop trigger if exists vehicle_categories_set_updated_at on public.vehicle_categories;
create trigger vehicle_categories_set_updated_at before update on public.vehicle_categories
for each row execute function public.set_updated_at();
drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Authorization/account state comes from database defaults, never signup metadata.
  insert into public.profiles (id, email, full_name, phone_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.branches (name) values
  ('Taft, Manila'),
  ('Antipolo, Rizal')
on conflict (name) do nothing;

insert into public.vehicle_categories (name) values
  ('Economy'), ('Sedan'), ('SUV'), ('MPV'), ('Van'), ('Pickup')
on conflict (name) do nothing;

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.vehicle_categories enable row level security;
alter table public.vehicles enable row level security;

-- Profiles are created by the Auth trigger. Customers may update ordinary
-- profile fields only; role and account state are not client-writable.
revoke insert on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone_number) on public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists branches_read_active on public.branches;
create policy branches_read_active on public.branches
  for select to authenticated using (is_active);
drop policy if exists categories_read_active on public.vehicle_categories;
create policy categories_read_active on public.vehicle_categories
  for select to authenticated using (is_active);
drop policy if exists vehicles_read_active on public.vehicles;
create policy vehicles_read_active on public.vehicles
  for select to authenticated using (is_active);
