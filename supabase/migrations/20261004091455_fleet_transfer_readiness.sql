-- Keep movement guards consistent with DSS donor revalidation.
create or replace function public.reconcile_vehicle_location_atomic(
  p_vehicle_id uuid,
  p_actor_id uuid,
  p_branch_id uuid,
  p_acknowledge_impacts boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_vehicle public.vehicles;
  v_impact record;
  v_impact_count integer := 0;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and user_type = 'Owner/Admin' and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.branches where id = p_branch_id and is_active) then
    raise exception 'branch_not_found';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text, 0));
  select * into v_vehicle from public.vehicles where id = p_vehicle_id for update;
  if not found then raise exception 'vehicle_not_found'; end if;
  if v_vehicle.branch_id = p_branch_id then
    return jsonb_build_object('vehicle_id', v_vehicle.id, 'impacted_bookings', 0);
  end if;
  if exists (
    select 1 from public.rental_transactions
    where vehicle_id = p_vehicle_id and started_at is not null and ended_at is null
  ) then raise exception 'vehicle_on_rental'; end if;
  if not v_vehicle.is_active or v_vehicle.condition_blocks_rental_use
    or exists (select 1 from public.rental_transactions
      where vehicle_id = p_vehicle_id and ended_at is not null and inspection_status = 'Pending')
    or exists (select 1 from public.maintenance_records
      where vehicle_id = p_vehicle_id and
        (status = 'In Progress' or (status in ('Open','Scheduled','Overdue') and blocks_rental_use)))
    or exists (
      select 1 from (
        select distinct on (coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'))
          next_service_date, next_service_odometer
        from public.maintenance_records
        where vehicle_id = p_vehicle_id and status = 'Completed'
          and (next_service_date is not null or next_service_odometer is not null)
        order by coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'),
          completed_at desc, created_at desc
      ) targets where next_service_date <= (now() at time zone 'Asia/Manila')::date
        or (next_service_odometer is not null and
          (v_vehicle.current_odometer_km is null or next_service_odometer <= v_vehicle.current_odometer_km))
    ) then raise exception 'vehicle_not_ready'; end if;
  if exists (
    select 1 from public.booking_requests
    where assigned_vehicle_id = p_vehicle_id and booking_status = 'Confirmed'
      and not exists (select 1 from public.rental_transactions r
        where r.booking_id = booking_requests.id and r.ended_at is not null)
  ) then raise exception 'vehicle_reserved'; end if;
  for v_impact in
    select id from public.booking_requests
    where booking_status in ('Draft', 'Submitted')
      and (requested_vehicle_id = p_vehicle_id or assigned_vehicle_id = p_vehicle_id)
    for update
  loop
    v_impact_count := v_impact_count + 1;
  end loop;
  if v_impact_count > 0 and not p_acknowledge_impacts then
    raise exception 'pending_bookings_affected';
  end if;
  update public.vehicles set branch_id = p_branch_id where id = p_vehicle_id;
  for v_impact in
    select id from public.booking_requests
    where booking_status in ('Draft', 'Submitted')
      and (requested_vehicle_id = p_vehicle_id or assigned_vehicle_id = p_vehicle_id)
  loop
    perform public.append_user_audit_event(
      p_actor_id, 'booking.location_reconciled', 'booking', v_impact.id, v_impact.id,
      jsonb_build_object('vehicle_id', p_vehicle_id,
        'previous_branch_id', v_vehicle.branch_id, 'new_branch_id', p_branch_id)
    );
  end loop;
  return jsonb_build_object('vehicle_id', v_vehicle.id, 'impacted_bookings', v_impact_count);
end;
$$;

revoke all on function public.reconcile_vehicle_location_atomic(uuid,uuid,uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.reconcile_vehicle_location_atomic(uuid,uuid,uuid,boolean)
  to service_role;
