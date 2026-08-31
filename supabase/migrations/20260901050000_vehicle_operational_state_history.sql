-- VS013: prospective operational-state history for vehicle analytics.
create table if not exists public.vehicle_operational_state_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  is_active boolean not null,
  effective_at timestamptz not null default timezone('utc', now()),
  recorded_by uuid references auth.users(id),
  source text not null default 'vehicle_mutation',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists vehicle_operational_state_events_vehicle_time_idx
  on public.vehicle_operational_state_events(vehicle_id, effective_at);
alter table public.vehicle_operational_state_events enable row level security;
revoke all on public.vehicle_operational_state_events from anon, authenticated;

create or replace function public.record_vehicle_operational_state_event()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'INSERT' or new.is_active is distinct from old.is_active then
    insert into public.vehicle_operational_state_events(vehicle_id,is_active,effective_at,recorded_by,source)
    values (new.id,new.is_active,timezone('utc',now()),
      case when current_setting('app.actor_id', true) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then current_setting('app.actor_id', true)::uuid else null end,
      case when tg_op = 'INSERT' then 'vehicle_create' else 'vehicle_update' end);
  end if;
  return new;
end; $$;
drop trigger if exists vehicles_operational_state_history on public.vehicles;
create trigger vehicles_operational_state_history
after insert or update of is_active on public.vehicles
for each row execute function public.record_vehicle_operational_state_event();

insert into public.vehicle_operational_state_events(vehicle_id,is_active,effective_at,source)
select v.id,v.is_active,timezone('utc',now()),'vs013_tracking_start'
from public.vehicles v
where not exists (select 1 from public.vehicle_operational_state_events e where e.vehicle_id=v.id);
