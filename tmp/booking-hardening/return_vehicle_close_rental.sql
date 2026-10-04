CREATE OR REPLACE FUNCTION public.return_vehicle_close_rental(p_rental_id uuid, p_actor_id uuid, p_expected_booking_id uuid, p_expected_vehicle_id uuid, p_expected_started_at timestamp with time zone, p_return_odometer numeric DEFAULT NULL::numeric, p_return_fuel_level text DEFAULT 'Other/Unknown'::text, p_return_condition_summary text DEFAULT NULL::text, p_observed_damage_notes text DEFAULT NULL::text, p_return_remarks text DEFAULT NULL::text)
 RETURNS rental_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.rental_transactions; b public.booking_requests; v public.vehicles;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if p_return_odometer is not null and (p_return_odometer < 0 or p_return_odometer = 'NaN'::numeric) then raise exception 'invalid_odometer'; end if;
  if p_return_fuel_level not in ('Empty','1/4','1/2','3/4','Full','Other/Unknown') then raise exception 'invalid_fuel_level'; end if;
  if nullif(trim(coalesce(p_return_condition_summary,'')),'') is null then raise exception 'condition_required'; end if;
  select * into r from rental_transactions where id=p_rental_id for update;
  if not found then raise exception 'rental_not_found'; end if;
  if r.booking_id is distinct from p_expected_booking_id or r.vehicle_id is distinct from p_expected_vehicle_id or r.started_at is distinct from p_expected_started_at then raise exception 'stale_rental'; end if;
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
end; $function$
