CREATE OR REPLACE FUNCTION public.assign_booking_vehicle(p_booking_id uuid, p_vehicle_id uuid, p_actor_id uuid, p_assignment_note text DEFAULT NULL::text, p_substitution_acknowledged boolean DEFAULT false, p_cross_branch_acknowledged boolean DEFAULT false)
 RETURNS booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b public.booking_requests; v public.vehicles; result public.booking_requests;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into b from booking_requests where id=p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  select * into v from vehicles where id=p_vehicle_id;
  perform public.assert_vehicle_rental_ready(p_vehicle_id);
  perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text, 0));
  if exists (select 1 from booking_requests x where x.id <> b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=p_vehicle_id and b.pickup_at < x.return_at and b.return_at > x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  if p_vehicle_id <> b.requested_vehicle_id and (not p_substitution_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'substitution_ack_required'; end if;
  if v.branch_id <> b.pickup_branch_id and (not p_cross_branch_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'cross_branch_ack_required'; end if;
  update booking_requests set assigned_vehicle_id=p_vehicle_id, assigned_by=p_actor_id, assigned_at=timezone('utc',now()), assignment_note=nullif(trim(p_assignment_note),''), substitution_acknowledged=(p_vehicle_id=b.requested_vehicle_id or p_substitution_acknowledged), cross_branch_acknowledged=(v.branch_id=b.pickup_branch_id or p_cross_branch_acknowledged) where id=b.id returning * into result;
  return result;
end; $function$
