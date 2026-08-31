-- VS012 correction: additive integrity hardening; the original VS012 migration is immutable.
create or replace function public.advance_vehicle_odometer(p_vehicle_id uuid, p_odometer numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v numeric;
begin
  if p_odometer is null or p_odometer < 0 then raise exception 'invalid_odometer'; end if;
  select current_odometer_km into v from vehicles where id = p_vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  if v is not null and p_odometer < v then raise exception 'odometer_regression'; end if;
  update vehicles set current_odometer_km = p_odometer where id = p_vehicle_id;
  return p_odometer;
end; $$;

create or replace function public.enforce_maintenance_transition()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status <> 'Open' or new.status not in ('Open','Completed','Cancelled') then
    raise exception 'unsupported_maintenance_transition';
  end if;
  if new.status = 'Completed' and new.completed_at is null then
    raise exception 'completion_timestamp_required';
  end if;
  new.created_by = old.created_by;
  return new;
end; $$;
drop trigger if exists maintenance_records_transition_guard on public.maintenance_records;
create trigger maintenance_records_transition_guard before update on public.maintenance_records
for each row execute function public.enforce_maintenance_transition();

create or replace function public.create_maintenance_atomic(
  p_vehicle_id uuid, p_maintenance_type text, p_description text, p_blocks boolean,
  p_started_at timestamptz, p_odometer numeric, p_next_odometer numeric,
  p_next_date date, p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql security definer set search_path = public as $$
declare v public.vehicles; m public.maintenance_records;
begin
  select * into v from vehicles where id = p_vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  if p_odometer is not null and (p_odometer < 0 or (v.current_odometer_km is not null and p_odometer < v.current_odometer_km)) then raise exception 'odometer_regression'; end if;
  insert into maintenance_records(vehicle_id,maintenance_type,description,status,blocks_rental_use,service_started_at,odometer_at_service,next_service_odometer,next_service_date,cost_php,remarks,created_by,updated_by)
  values(p_vehicle_id,trim(p_maintenance_type),trim(p_description),'Open',coalesce(p_blocks,false),coalesce(p_started_at,timezone('utc',now())),p_odometer,p_next_odometer,p_next_date,p_cost,nullif(trim(p_remarks),''),p_actor,p_actor) returning * into m;
  if p_odometer is not null and (v.current_odometer_km is null or p_odometer > v.current_odometer_km) then update vehicles set current_odometer_km=p_odometer where id=p_vehicle_id; end if;
  return m;
end; $$;

create or replace function public.update_maintenance_atomic(
  p_record_id uuid, p_status text, p_odometer numeric, p_next_odometer numeric,
  p_next_date date, p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql security definer set search_path = public as $$
declare old_m public.maintenance_records; m public.maintenance_records; v public.vehicles;
begin
  select * into old_m from maintenance_records where id=p_record_id for update;
  if not found or old_m.status <> 'Open' or p_status not in ('Completed','Cancelled') then raise exception 'unsupported_maintenance_transition'; end if;
  select * into v from vehicles where id=old_m.vehicle_id for update;
  if p_odometer is not null and (p_odometer < 0 or (v.current_odometer_km is not null and p_odometer < v.current_odometer_km)) then raise exception 'odometer_regression'; end if;
  update maintenance_records set status=p_status, completed_at=case when p_status='Completed' then timezone('utc',now()) else null end,
    odometer_at_service=coalesce(p_odometer,odometer_at_service), next_service_odometer=coalesce(p_next_odometer,next_service_odometer),
    next_service_date=coalesce(p_next_date,next_service_date), cost_php=coalesce(p_cost,cost_php), remarks=coalesce(nullif(trim(p_remarks),''),remarks), updated_by=p_actor
    where id=p_record_id returning * into m;
  if p_odometer is not null and (v.current_odometer_km is null or p_odometer > v.current_odometer_km) then update vehicles set current_odometer_km=p_odometer where id=v.id; end if;
  return m;
end; $$;

revoke all on function public.advance_vehicle_odometer(uuid,numeric), public.enforce_maintenance_transition(), public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,numeric,date,numeric,text,uuid), public.update_maintenance_atomic(uuid,text,numeric,numeric,date,numeric,text,uuid) from public, anon, authenticated;
