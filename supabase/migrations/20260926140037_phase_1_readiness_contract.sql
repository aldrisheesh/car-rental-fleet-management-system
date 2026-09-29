-- Phase 1: restore the operational contracts already represented in the app.
-- This is intentionally additive because the linked project's older migration
-- history is not present in this checkout.

-- A completed rental stays unavailable until an Owner/Admin records its return
-- inspection. Historic returned rentals predate this workflow and are cleared.
alter table public.rental_transactions
  add column if not exists inspection_status text not null default 'Not required',
  add column if not exists inspection_remarks text,
  add column if not exists inspected_at timestamptz,
  add column if not exists inspected_by uuid references public.profiles(id) on delete restrict;

alter table public.rental_transactions
  drop constraint if exists rental_transactions_inspection_status_check;
alter table public.rental_transactions
  add constraint rental_transactions_inspection_status_check
  check (inspection_status in ('Not required', 'Pending', 'Cleared', 'Maintenance scheduled'));

update public.rental_transactions
set inspection_status = 'Cleared',
    inspected_at = coalesce(ended_at, timezone('utc', now()))
where ended_at is not null
  and inspection_status = 'Not required';

create index if not exists rental_transactions_vehicle_pending_inspection_idx
  on public.rental_transactions (vehicle_id, ended_at desc)
  where inspection_status = 'Pending';
create index if not exists rental_transactions_inspected_by_idx
  on public.rental_transactions (inspected_by)
  where inspected_by is not null;

create or replace function public.queue_returned_vehicle_for_inspection()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.ended_at is null and new.ended_at is not null then
    new.inspection_status := 'Pending';
    new.inspection_remarks := null;
    new.inspected_at := null;
    new.inspected_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists rental_transactions_queue_inspection on public.rental_transactions;
create trigger rental_transactions_queue_inspection
before update of ended_at on public.rental_transactions
for each row execute function public.queue_returned_vehicle_for_inspection();

-- Scheduling and servicing are distinct lifecycle states. Existing Open work
-- becomes in-progress work, preserving the original service-start timestamp.
alter table public.maintenance_records
  add column if not exists scheduled_for timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete restrict;

-- The legacy guard only allowed Open -> Completed/Cancelled, so remove it
-- before converting historical Open rows into the new lifecycle vocabulary.
drop trigger if exists maintenance_records_transition_guard on public.maintenance_records;
drop trigger if exists maintenance_records_enforce_transition on public.maintenance_records;
alter table public.maintenance_records
  drop constraint if exists maintenance_records_status_check;

update public.maintenance_records
set status = 'In Progress'
where status = 'Open';

update public.maintenance_records
set service_started_at = coalesce(service_started_at, completed_at, created_at)
where status in ('In Progress', 'Completed')
  and service_started_at is null;

alter table public.maintenance_records
  alter column status drop default,
  alter column status set default 'Scheduled',
  alter column service_started_at drop not null,
  alter column service_started_at drop default,
  drop constraint if exists maintenance_records_status_check,
  drop constraint if exists maintenance_records_lifecycle_timestamps_check;

alter table public.maintenance_records
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
create index if not exists maintenance_records_archived_by_idx
  on public.maintenance_records (archived_by)
  where archived_by is not null;

create or replace function public.enforce_maintenance_transition()
returns trigger
language plpgsql
set search_path = public
as $$
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
end;
$$;

create trigger maintenance_records_transition_guard
before update on public.maintenance_records
for each row execute function public.enforce_maintenance_transition();

create or replace function public.audit_maintenance_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.append_user_audit_event(
      new.created_by,
      'maintenance.created',
      'maintenance',
      new.id,
      null,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'maintenance_type', new.maintenance_type,
        'status', new.status
      )
    );
  elsif new.status = 'Completed' and old.status <> 'Completed' then
    perform public.append_user_audit_event(
      new.updated_by,
      'maintenance.completed',
      'maintenance',
      new.id,
      null,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'maintenance_type', new.maintenance_type,
        'previous_status', old.status,
        'new_status', new.status
      )
    );
  elsif new.status = 'Cancelled' and old.status <> 'Cancelled' then
    perform public.append_user_audit_event(
      new.updated_by,
      'maintenance.cancelled',
      'maintenance',
      new.id,
      null,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'maintenance_type', new.maintenance_type,
        'previous_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

drop function if exists public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,numeric,date,numeric,text,uuid);
drop function if exists public.update_maintenance_atomic(uuid,text,numeric,numeric,date,numeric,text,uuid);

create or replace function public.create_maintenance_atomic(
  p_vehicle_id uuid, p_maintenance_type text, p_description text, p_blocks boolean,
  p_scheduled_for timestamptz, p_next_odometer numeric, p_next_date date,
  p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql
security definer
set search_path = public
as $$
declare m public.maintenance_records;
begin
  if p_scheduled_for is null then raise exception 'scheduled_service_required'; end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
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
end;
$$;

create or replace function public.update_maintenance_atomic(
  p_record_id uuid, p_status text, p_started_at timestamptz, p_odometer numeric,
  p_next_odometer numeric, p_next_date date, p_cost numeric, p_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql
security definer
set search_path = public
as $$
declare old_m public.maintenance_records; m public.maintenance_records; v public.vehicles;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
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
end;
$$;

create or replace function public.archive_maintenance_record(
  p_record_id uuid, p_actor uuid
) returns public.maintenance_records
language plpgsql
security definer
set search_path = public
as $$
declare m public.maintenance_records;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  update public.maintenance_records
  set archived_at = timezone('utc', now()), archived_by = p_actor, updated_by = p_actor
  where id = p_record_id
    and status in ('Completed', 'Cancelled')
    and archived_at is null
  returning * into m;
  if not found then raise exception 'maintenance_record_not_closable'; end if;
  return m;
end;
$$;

-- Recording that an inspection needs maintenance creates the blocking service
-- record and resolves the inspection in one transaction.
create or replace function public.schedule_return_maintenance(
  p_rental_id uuid, p_vehicle_id uuid, p_maintenance_type text, p_description text,
  p_scheduled_for timestamptz, p_next_odometer numeric, p_next_date date,
  p_cost numeric, p_maintenance_remarks text, p_inspection_remarks text, p_actor uuid
) returns public.maintenance_records
language plpgsql
security definer
set search_path = public
as $$
declare r public.rental_transactions; m public.maintenance_records;
begin
  if p_scheduled_for is null then raise exception 'scheduled_service_required'; end if;
  if nullif(trim(coalesce(p_inspection_remarks, '')), '') is null then
    raise exception 'inspection_remarks_required';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  select * into r from public.rental_transactions where id = p_rental_id for update;
  if not found then raise exception 'rental_not_found'; end if;
  if r.vehicle_id <> p_vehicle_id then raise exception 'inspection_vehicle_mismatch'; end if;
  if r.ended_at is null or r.inspection_status <> 'Pending' then
    raise exception 'inspection_not_pending';
  end if;
  perform 1 from public.vehicles where id = p_vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  insert into public.maintenance_records(
    vehicle_id, maintenance_type, description, status, blocks_rental_use, scheduled_for,
    next_service_odometer, next_service_date, cost_php, remarks, created_by, updated_by
  ) values (
    p_vehicle_id, trim(p_maintenance_type), trim(p_description), 'Scheduled', true, p_scheduled_for,
    p_next_odometer, p_next_date, p_cost, nullif(trim(p_maintenance_remarks), ''), p_actor, p_actor
  ) returning * into m;
  update public.rental_transactions
  set inspection_status = 'Maintenance scheduled',
      inspection_remarks = trim(p_inspection_remarks),
      inspected_at = timezone('utc', now()),
      inspected_by = p_actor
  where id = r.id;
  return m;
end;
$$;

create or replace function public.resolve_return_inspection(
  p_rental_id uuid,
  p_outcome text,
  p_remarks text,
  p_actor_id uuid
) returns public.rental_transactions
language plpgsql
security definer
set search_path = public
as $$
declare r public.rental_transactions;
begin
  if p_outcome <> 'Cleared' then raise exception 'invalid_inspection_outcome'; end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  select * into r from public.rental_transactions where id = p_rental_id for update;
  if not found then raise exception 'rental_not_found'; end if;
  if r.ended_at is null or r.inspection_status <> 'Pending' then
    raise exception 'inspection_not_pending';
  end if;
  update public.rental_transactions
  set inspection_status = 'Cleared',
      inspection_remarks = nullif(trim(coalesce(p_remarks, '')), ''),
      inspected_at = timezone('utc', now()),
      inspected_by = p_actor_id
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Every allocation path, including rental release, uses the same readiness
-- guard. A returned vehicle with a pending inspection cannot be reused.
create or replace function public.assert_vehicle_rental_ready(p_vehicle_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare v public.vehicles;
begin
  select * into v from public.vehicles where id = p_vehicle_id;
  if not found or not v.is_active then
    raise exception 'vehicle_unavailable';
  end if;
  if exists (
    select 1 from public.rental_transactions
    where vehicle_id = p_vehicle_id
      and ended_at is not null
      and inspection_status = 'Pending'
  ) then
    raise exception 'vehicle_inspection_pending';
  end if;
  if v.condition_blocks_rental_use or exists (
    select 1 from public.maintenance_records
    where vehicle_id = p_vehicle_id
      and (
        status in ('In Progress', 'Overdue')
        or (status = 'Scheduled' and blocks_rental_use)
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
language plpgsql
security definer
set search_path = public
as $$
declare b public.booking_requests; v public.vehicles; r public.rental_transactions;
begin
  if not exists (select 1 from public.profiles where id = p_actor_id and user_type = 'Owner/Admin' and account_status = 'Active') then raise exception 'forbidden'; end if;
  if p_expected_vehicle_id is null or p_expected_confirmed_at is null then raise exception 'release_expectation_required'; end if;
  if p_release_odometer is not null and p_release_odometer < 0 then raise exception 'invalid_odometer'; end if;
  if p_release_fuel_level not in ('Empty','1/4','1/2','3/4','Full','Other/Unknown') then raise exception 'invalid_fuel_level'; end if;
  if nullif(trim(coalesce(p_release_condition_summary,'')),'') is null then raise exception 'condition_required'; end if;
  select * into b from public.booking_requests where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Confirmed' then raise exception 'booking_not_confirmed'; end if;
  if b.assigned_vehicle_id is distinct from p_expected_vehicle_id or b.confirmed_at is distinct from p_expected_confirmed_at then raise exception 'stale_release'; end if;
  if exists (select 1 from public.rental_transactions where booking_id = b.id) then raise exception 'booking_already_released'; end if;
  select * into v from public.vehicles where id = b.assigned_vehicle_id for update;
  if not found or not v.is_active then raise exception 'vehicle_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(b.assigned_vehicle_id::text, 0));
  perform public.assert_vehicle_rental_ready(b.assigned_vehicle_id);
  if exists (select 1 from public.rental_transactions where vehicle_id = b.assigned_vehicle_id and started_at is not null and ended_at is null) then raise exception 'vehicle_already_rented'; end if;
  insert into public.rental_transactions (booking_id,customer_id,vehicle_id,scheduled_pickup_at,scheduled_return_at,started_at,released_by,release_odometer,release_fuel_level,release_condition_summary,existing_damage_notes,agreement_acknowledged,condition_acknowledged,return_schedule_acknowledged)
  values (b.id,b.customer_id,b.assigned_vehicle_id,b.pickup_at,b.return_at,timezone('utc',now()),p_actor_id,p_release_odometer,p_release_fuel_level,trim(p_release_condition_summary),nullif(trim(p_existing_damage_notes),''),p_agreement_acknowledged,p_condition_acknowledged,p_return_schedule_acknowledged)
  returning * into r;
  return r;
end;
$$;

revoke all on function public.queue_returned_vehicle_for_inspection() from public, anon, authenticated;
revoke all on function public.resolve_return_inspection(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,date,numeric,text,uuid) from public, anon, authenticated;
revoke all on function public.update_maintenance_atomic(uuid,text,timestamptz,numeric,numeric,date,numeric,text,uuid) from public, anon, authenticated;
revoke all on function public.archive_maintenance_record(uuid,uuid) from public, anon, authenticated;
revoke all on function public.schedule_return_maintenance(uuid,uuid,text,text,timestamptz,numeric,date,numeric,text,text,uuid) from public, anon, authenticated;
revoke all on function public.assert_vehicle_rental_ready(uuid) from public, anon, authenticated;
revoke all on function public.release_vehicle_start_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,boolean,boolean,boolean) from public, anon, authenticated;

grant execute on function public.resolve_return_inspection(uuid, text, text, uuid) to service_role;
grant execute on function public.create_maintenance_atomic(uuid,text,text,boolean,timestamptz,numeric,date,numeric,text,uuid) to service_role;
grant execute on function public.update_maintenance_atomic(uuid,text,timestamptz,numeric,numeric,date,numeric,text,uuid) to service_role;
grant execute on function public.archive_maintenance_record(uuid,uuid) to service_role;
grant execute on function public.schedule_return_maintenance(uuid,uuid,text,text,timestamptz,numeric,date,numeric,text,text,uuid) to service_role;
grant execute on function public.release_vehicle_start_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,boolean,boolean,boolean) to service_role;
