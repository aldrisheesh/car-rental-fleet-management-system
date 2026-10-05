create or replace function public.review_booking_date_change(p_request_id uuid,p_actor_id uuid,p_action text,p_reason text)
returns public.booking_date_change_requests language plpgsql security definer set search_path='' as $$
declare r public.booking_date_change_requests; b public.booking_requests; v_id uuid; result public.booking_date_change_requests;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select booking_id into v_id from public.booking_date_change_requests where id=p_request_id;
 select * into b from public.booking_requests where id=v_id for update;
 select * into r from public.booking_date_change_requests where id=p_request_id for update;
 if not found or r.status<>'Pending' then raise exception 'request_not_pending'; end if;
 if p_action not in ('approve','reject') then raise exception 'invalid_action'; end if;
 if p_action='reject' and public.booking_category_code('booking_rejection',trim(p_reason)) is null then raise exception 'reason_required'; end if;
 if p_action='approve' then
  if b.booking_status not in ('Submitted','Confirmed') or b.pickup_at<=now() or r.requested_pickup_at<=now() or exists(select 1 from public.rental_transactions where booking_id=b.id) then raise exception 'date_change_unavailable'; end if;
  if b.pickup_at<>r.original_pickup_at or b.return_at<>r.original_return_at then raise exception 'stale_dates'; end if;
  v_id:=coalesce(b.assigned_vehicle_id,b.requested_vehicle_id);
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  perform 1 from public.vehicles where id=v_id for update;
  perform public.assert_vehicle_rental_ready(v_id);
  if exists(select 1 from public.rental_transactions where vehicle_id=v_id and started_at is not null and ended_at is null) then raise exception 'vehicle_already_rented'; end if;
  if exists(select 1 from (select distinct on (coalesce(nullif(trim(maintenance_type),''),'__uncategorized__')) next_service_date from public.maintenance_records where vehicle_id=v_id and status='Completed' and next_service_date is not null order by coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'),completed_at desc,created_at desc) due where due.next_service_date <= ((r.requested_return_at-interval '1 microsecond') at time zone 'Asia/Manila')::date) then raise exception 'vehicle_maintenance_unready'; end if;

  if exists(select 1 from public.booking_requests x where x.id<>b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=v_id and r.requested_pickup_at<x.return_at and r.requested_return_at>x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  -- Lock and preserve the saved financial quote before changing only its dates.
  perform 1 from public.booking_payment_quotes where booking_id=b.id for update;
  update public.booking_date_change_requests set quote_before=(select to_jsonb(q) from public.booking_payment_quotes q where q.booking_id=b.id) where id=r.id;
  update public.booking_requests set pickup_at=r.requested_pickup_at,return_at=r.requested_return_at,updated_at=now() where id=b.id;
  -- The ordinary draft-edit trigger cleared the arrangement. Restore it within
  -- this same approval transaction after the owner confirms handover details.
  update public.booking_requests set pickup_meeting_address=b.pickup_meeting_address,pickup_meeting_instructions=b.pickup_meeting_instructions,return_meeting_address=b.return_meeting_address,return_meeting_instructions=b.return_meeting_instructions where id=b.id;

  update public.booking_payment_quotes set pickup_at=r.requested_pickup_at,return_at=r.requested_return_at,quote_version=quote_version+1,updated_at=now() where booking_id=b.id;
 end if;
 update public.booking_date_change_requests set status=case when p_action='approve' then 'Approved' else 'Rejected' end,reviewed_by=p_actor_id,review_reason=case when p_action='approve' then 'Same vehicle, duration and saved price; availability checked.' else trim(p_reason) end,reviewed_at=now() where id=r.id returning * into result;
 return result;
end; $$;
