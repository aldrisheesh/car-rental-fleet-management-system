-- VS012: canonical maintenance records and deterministic vehicle readiness inputs.
alter table public.vehicles
  add column if not exists current_odometer_km numeric(12,1),
  add column if not exists condition_blocks_rental_use boolean not null default false;

alter table public.vehicles
  drop constraint if exists vehicles_current_odometer_km_check;
alter table public.vehicles
  add constraint vehicles_current_odometer_km_check
  check (current_odometer_km is null or current_odometer_km >= 0);

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  maintenance_type text not null,
  description text not null,
  status text not null default 'Open' check (status in ('Open','Completed','Cancelled')),
  blocks_rental_use boolean not null default false,
  service_started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  odometer_at_service numeric(12,1),
  next_service_odometer numeric(12,1),
  next_service_date date,
  cost_php numeric(12,2),
  remarks text,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_odometer_check check (odometer_at_service is null or odometer_at_service >= 0),
  constraint maintenance_next_odometer_check check (next_service_odometer is null or next_service_odometer >= 0),
  constraint maintenance_cost_check check (cost_php is null or cost_php >= 0),
  constraint maintenance_completion_check check ((status = 'Completed' and completed_at is not null) or status <> 'Completed')
);

create index if not exists maintenance_records_vehicle_idx on public.maintenance_records(vehicle_id, created_at desc);
create trigger maintenance_records_set_updated_at before update on public.maintenance_records
for each row execute function public.set_updated_at();

alter table public.maintenance_records enable row level security;
revoke all on public.maintenance_records from anon, authenticated;
-- Trusted server handlers use the service role; no client role receives raw history.
