-- VS011: Owner/Admin-controlled physical vehicle return and rental closure.
alter table public.rental_transactions
  add column if not exists returned_by uuid references public.profiles(id) on delete restrict,
  add column if not exists return_odometer numeric(12,2) check (return_odometer is null or return_odometer >= 0),
  add column if not exists return_fuel_level text,
  add column if not exists return_condition_summary text,
  add column if not exists observed_damage_notes text,
  add column if not exists return_remarks text;

alter table public.rental_transactions
  drop constraint if exists rental_transactions_return_fuel_level_check;
alter table public.rental_transactions
  add constraint rental_transactions_return_fuel_level_check
  check (return_fuel_level is null or return_fuel_level in ('Empty','1/4','1/2','3/4','Full','Other/Unknown'));

create or replace function public.return_vehicle_close_rental(
  p_rental_id uuid,
  p_actor_id uuid,
  p_expected_vehicle_id uuid,
  p_expected_started_at timestamptz,
  p_return_odometer numeric default null,
  p_return_fuel_level text default 'Other/Unknown',
  p_return_condition_summary text default null,
  p_observed_damage_notes text default null,
  p_return_remarks text default null
) returns public.rental_transactions
language plpgsql security definer set search_path=public as $$
declare r public.rental_transactions; b public.booking_requests; v public.vehicles;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if p_return_odometer is not null and (p_return_odometer < 0 or p_return_odometer = 'NaN'::numeric) then raise exception 'invalid_odometer'; end if;
  if p_return_fuel_level not in ('Empty','1/4','1/2','3/4','Full','Other/Unknown') then raise exception 'invalid_fuel_level'; end if;
  if nullif(trim(coalesce(p_return_condition_summary,'')),'') is null then raise exception 'condition_required'; end if;
  select * into r from rental_transactions where id=p_rental_id for update;
  if not found then raise exception 'rental_not_found'; end if;
  if r.vehicle_id is distinct from p_expected_vehicle_id or r.started_at is distinct from p_expected_started_at then raise exception 'stale_rental'; end if;
  if r.started_at is null or r.ended_at is not null then raise exception 'rental_not_active'; end if;
  select * into b from booking_requests where id=r.booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Confirmed' then raise exception 'booking_not_confirmed'; end if;
  select * into v from vehicles where id=r.vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(r.vehicle_id::text, 0));
  if p_return_odometer is not null and r.release_odometer is not null and p_return_odometer < r.release_odometer then raise exception 'odometer_below_release'; end if;
  update rental_transactions set ended_at=timezone('utc', now()), returned_by=p_actor_id, return_odometer=p_return_odometer, return_fuel_level=p_return_fuel_level, return_condition_summary=trim(p_return_condition_summary), observed_damage_notes=nullif(trim(p_observed_damage_notes),''), return_remarks=nullif(trim(p_return_remarks),'') where id=r.id returning * into r;
  return r;
end; $$;
revoke all on function public.return_vehicle_close_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,text) from public,anon,authenticated;
