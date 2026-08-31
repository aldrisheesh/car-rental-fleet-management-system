-- VS014: immutable WMA forecast runs and auditable calculation inputs.
create table if not exists public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default timezone('utc', now()),
  generated_by uuid not null references public.profiles(id) on delete restrict,
  method text not null default 'WMA' check (method = 'WMA'),
  idempotency_key text not null unique,
  coverage_start date
);
create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.forecast_runs(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  vehicle_category_id uuid not null references public.vehicle_categories(id) on delete restrict,
  horizon smallint not null check (horizon between 1 and 3),
  target_week_start date not null,
  target_week_end date not null,
  forecasted_demand numeric(18,8) not null check (forecasted_demand >= 0),
  required_vehicle_units integer not null check (required_vehicle_units >= 0),
  actual_demand numeric(18,8),
  ape numeric(18,8),
  created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.forecast_inputs (
  id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.forecasts(id) on delete restrict,
  source_type text not null check (source_type in ('Actual','Forecast')),
  source_week_start date not null,
  source_value numeric(18,8) not null,
  input_order smallint not null check (input_order between 1 and 3),
  weight numeric(5,4) not null,
  weighted_contribution numeric(18,8) not null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists forecasts_lookup_idx on public.forecasts(branch_id, vehicle_category_id, target_week_start);
create index if not exists forecast_inputs_record_idx on public.forecast_inputs(forecast_id, input_order);
alter table public.forecast_runs enable row level security;
alter table public.forecasts enable row level security;
alter table public.forecast_inputs enable row level security;
revoke all on public.forecast_runs, public.forecasts, public.forecast_inputs from anon, authenticated;
grant select on public.forecast_runs, public.forecasts, public.forecast_inputs to authenticated;
drop policy if exists forecast_runs_internal_read on public.forecast_runs;
create policy forecast_runs_internal_read on public.forecast_runs for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));
drop policy if exists forecasts_internal_read on public.forecasts;
create policy forecasts_internal_read on public.forecasts for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));
drop policy if exists forecast_inputs_internal_read on public.forecast_inputs;
create policy forecast_inputs_internal_read on public.forecast_inputs for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));
