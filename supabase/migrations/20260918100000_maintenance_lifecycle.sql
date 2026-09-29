-- Maintenance lifecycle: preserve legacy history while separating scheduling from service work.
alter table public.maintenance_records
  add column if not exists scheduled_for timestamptz;

alter table public.maintenance_records
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id);

update public.maintenance_records
set status = 'In Progress'
where status = 'Open';

alter table public.maintenance_records
  drop constraint if exists maintenance_records_status_check,
  alter column status drop default,
  alter column status set default 'Scheduled',
  alter column service_started_at drop not null,
  alter column service_started_at drop default,
  add constraint maintenance_records_status_check
    check (status in ('Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled')),
  add constraint maintenance_records_lifecycle_timestamps_check check (
    (status = 'Scheduled' and scheduled_for is not null and service_started_at is null)
    or (status in ('In Progress', 'Completed') and service_started_at is not null)
    or status in ('Overdue', 'Cancelled')
  );

create index if not exists maintenance_records_vehicle_lifecycle_idx
  on public.maintenance_records (vehicle_id, status, scheduled_for);
create index if not exists maintenance_records_open_queue_idx
  on public.maintenance_records (status, created_at desc)
  where archived_at is null;

-- Replace the former overloads so the public API has one lifecycle contract.
drop function if exists public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,numeric,date,numeric,text,uuid);
drop function if exists public.update_maintenance_atomic(uuid,text,numeric,numeric,date,numeric,text,uuid);

create or replace function public.enforce_maintenance_transition()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'Scheduled' and new.status not in ('Scheduled', 'In Progress', 'Cancelled', 'Overdue') then
    raise exception 'unsupported_maintenance_transition';
  end if;
  if old.status = 'In Progress' and new.status not in ('In Progress', 'Completed') then
    raise exception 'unsupported_maintenance_transition';
  end if;
  if old.status = 'Overdue' and new.status not in ('Overdue', 'In Progress', 'Cancelled') then
    raise exception 'unsupported_maintenance_transition';
  end if;
  if old.status in ('Completed', 'Cancelled') and new.status <> old.status then
    raise exception 'unsupported_maintenance_transition';
  end if;
  if new.status = 'In Progress' and new.service_started_at is null then
    raise exception 'service_start_timestamp_required';
  end if;
  if new.status = 'Completed' and (new.service_started_at is null or new.completed_at is null) then
    raise exception 'completion_timestamps_required';
  end if;
  new.created_by = old.created_by;
  return new;
end; $$;

create or replace function public.create_maintenance_atomic(
  p_vehicle_id uuid, p_maintenance_type text, p_description text, p_blocks boolean,
  p_scheduled_for timestamptz, p_next_odometer numeric, p_next_date date,
  p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql security definer set search_path = public as $$
declare m public.maintenance_records;
begin
  if p_scheduled_for is null then raise exception 'scheduled_service_required'; end if;
  if not exists (select 1 from public.vehicles where id = p_vehicle_id for update) then
    raise exception 'vehicle_not_found';
  end if;
  insert into public.maintenance_records(
    vehicle_id, maintenance_type, description, status, blocks_rental_use, scheduled_for,
    next_service_odometer, next_service_date, cost_php, remarks, created_by, updated_by
  ) values (
    p_vehicle_id, trim(p_maintenance_type), trim(p_description), 'Scheduled', coalesce(p_blocks, false), p_scheduled_for,
    p_next_odometer, p_next_date, p_cost, nullif(trim(p_remarks), ''), p_actor, p_actor
  ) returning * into m;
  return m;
end; $$;

create or replace function public.update_maintenance_atomic(
  p_record_id uuid, p_status text, p_started_at timestamptz, p_odometer numeric,
  p_next_odometer numeric, p_next_date date, p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql security definer set search_path = public as $$
declare old_m public.maintenance_records; m public.maintenance_records; v public.vehicles;
begin
  select * into old_m from public.maintenance_records where id = p_record_id for update;
  if not found then raise exception 'maintenance_not_found'; end if;
  select * into v from public.vehicles where id = old_m.vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  if p_odometer is not null and (p_odometer < 0 or (v.current_odometer_km is not null and p_odometer < v.current_odometer_km)) then
    raise exception 'odometer_regression';
  end if;
  update public.maintenance_records set
    status = p_status,
    service_started_at = case when p_status = 'In Progress' then coalesce(p_started_at, timezone('utc', now())) else service_started_at end,
    completed_at = case when p_status = 'Completed' then timezone('utc', now()) else completed_at end,
    odometer_at_service = coalesce(p_odometer, odometer_at_service),
    next_service_odometer = coalesce(p_next_odometer, next_service_odometer),
    next_service_date = coalesce(p_next_date, next_service_date),
    cost_php = coalesce(p_cost, cost_php),
    remarks = coalesce(nullif(trim(p_remarks), ''), remarks),
    updated_by = p_actor
  where id = old_m.id returning * into m;
  if p_odometer is not null and (v.current_odometer_km is null or p_odometer > v.current_odometer_km) then
    update public.vehicles set current_odometer_km = p_odometer where id = v.id;
  end if;
  return m;
end; $$;

create or replace function public.archive_maintenance_record(
  p_record_id uuid, p_actor uuid
) returns public.maintenance_records
language plpgsql security definer set search_path = public as $$
declare m public.maintenance_records;
begin
  update public.maintenance_records
  set archived_at = timezone('utc', now()), archived_by = p_actor, updated_by = p_actor
  where id = p_record_id
    and status in ('Completed', 'Cancelled')
    and archived_at is null
  returning * into m;
  if not found then raise exception 'maintenance_record_not_closable'; end if;
  return m;
end; $$;

revoke all on function public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,date,numeric,text,uuid) from public, anon, authenticated;
revoke all on function public.update_maintenance_atomic(uuid,text,timestamptz,numeric,numeric,date,numeric,text,uuid) from public, anon, authenticated;
revoke all on function public.archive_maintenance_record(uuid,uuid) from public, anon, authenticated;
grant execute on function public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,date,numeric,text,uuid) to service_role;
grant execute on function public.update_maintenance_atomic(uuid,text,timestamptz,numeric,numeric,date,numeric,text,uuid) to service_role;
grant execute on function public.archive_maintenance_record(uuid,uuid) to service_role;

-- Booking eligibility must use the same vehicle-wide maintenance rules as the
-- monitoring queue. Historical completion/cancellation alone never clears a block.
create or replace function public.assert_vehicle_rental_ready(p_vehicle_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v public.vehicles;
begin
  select * into v from public.vehicles where id = p_vehicle_id;
  if not found or not v.is_active then
    raise exception 'vehicle_unavailable';
  end if;

  if v.condition_blocks_rental_use or exists (
    select 1 from public.maintenance_records
    where vehicle_id = p_vehicle_id
      and (
        status in ('In Progress', 'Overdue')
        or (status in ('Scheduled', 'In Progress', 'Overdue') and blocks_rental_use)
      )
  ) then
    raise exception 'vehicle_maintenance_unready';
  end if;

  if exists (
    select 1
    from (
      select distinct on (coalesce(nullif(trim(maintenance_type), ''), '__uncategorized__'))
        next_service_odometer, next_service_date
      from public.maintenance_records
      where vehicle_id = p_vehicle_id
        and status = 'Completed'
        and (next_service_odometer is not null or next_service_date is not null)
      order by coalesce(nullif(trim(maintenance_type), ''), '__uncategorized__'),
        completed_at desc nulls last, created_at desc
    ) as target
    where target.next_service_date <= timezone('Asia/Manila', now())::date
      or (
        target.next_service_odometer is not null
        and (v.current_odometer_km is null or v.current_odometer_km >= target.next_service_odometer)
      )
  ) then
    raise exception 'vehicle_maintenance_unready';
  end if;
end;
$$;

revoke all on function public.assert_vehicle_rental_ready(uuid)
  from public, anon, authenticated;
