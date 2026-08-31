-- VS015: immutable projected-supply snapshots and atomic vehicle traceability.
create table if not exists public.supply_evaluations (
  id uuid primary key default gen_random_uuid(), forecast_id uuid not null references public.forecasts(id) on delete restrict,
  evaluated_at timestamptz not null default timezone('utc', now()), evaluated_by uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null unique, required_units_snapshot integer not null check (required_units_snapshot >= 0),
  projected_supply integer not null check (projected_supply >= 0), shortage_units integer not null check (shortage_units >= 0),
  surplus_units integer not null check (surplus_units >= 0), data_quality_state text, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.supply_evaluation_vehicles (
  id uuid primary key default gen_random_uuid(), evaluation_id uuid not null references public.supply_evaluations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict, eligible boolean not null,
  booking_conflict boolean not null default false, rental_conflict boolean not null default false, future_maintenance_conflict boolean not null default false,
  exclusion_reasons jsonb not null default '[]'::jsonb, created_at timestamptz not null default timezone('utc', now()), unique(evaluation_id, vehicle_id)
);
alter table public.supply_evaluations enable row level security; alter table public.supply_evaluation_vehicles enable row level security;
revoke all on public.supply_evaluations, public.supply_evaluation_vehicles from anon, authenticated; grant select on public.supply_evaluations, public.supply_evaluation_vehicles to authenticated;
create or replace function public.persist_supply_evaluation(p_forecast_id uuid,p_evaluated_by uuid,p_idempotency_key text,p_required_units integer,p_projected_supply integer,p_shortage_units integer,p_surplus_units integer,p_items jsonb)
returns public.supply_evaluations language plpgsql security definer set search_path=public as $$
declare e public.supply_evaluations; item jsonb;
begin
  if not exists(select 1 from profiles where id=p_evaluated_by and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into e from supply_evaluations where idempotency_key=p_idempotency_key;
  if found then return e; end if;
  insert into supply_evaluations(forecast_id,evaluated_by,idempotency_key,required_units_snapshot,projected_supply,shortage_units,surplus_units) values(p_forecast_id,p_evaluated_by,p_idempotency_key,p_required_units,p_projected_supply,p_shortage_units,p_surplus_units) returning * into e;
  for item in select value from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    insert into supply_evaluation_vehicles(evaluation_id,vehicle_id,eligible,booking_conflict,rental_conflict,future_maintenance_conflict,exclusion_reasons) values(e.id,(item->>'vehicle_id')::uuid,(item->>'eligible')::boolean,coalesce((item->>'booking_conflict')::boolean,false),coalesce((item->>'rental_conflict')::boolean,false),coalesce((item->>'future_maintenance_conflict')::boolean,false),coalesce(item->'exclusion_reasons','[]'::jsonb));
  end loop; return e;
end; $$;
revoke all on function public.persist_supply_evaluation(uuid,uuid,text,integer,integer,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.persist_supply_evaluation(uuid,uuid,text,integer,integer,integer,integer,jsonb) to service_role;
