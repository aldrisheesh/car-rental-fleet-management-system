CREATE OR REPLACE FUNCTION public.release_vehicle_start_rental(p_booking_id uuid, p_actor_id uuid, p_expected_vehicle_id uuid, p_expected_confirmed_at timestamp with time zone, p_release_odometer numeric DEFAULT NULL::numeric, p_release_fuel_level text DEFAULT 'Other/Unknown'::text, p_release_condition_summary text DEFAULT 'Condition recorded at release.'::text, p_existing_damage_notes text DEFAULT NULL::text, p_agreement_acknowledged boolean DEFAULT false, p_condition_acknowledged boolean DEFAULT false, p_return_schedule_acknowledged boolean DEFAULT false)
 RETURNS rental_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
