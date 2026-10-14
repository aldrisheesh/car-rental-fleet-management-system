-- A vehicle-only accepted offer must not reissue an already-paid quote.
-- Preserve the original quote version when its dates do not change.
create or replace function briah_private.respond_booking_resolution_offer(p_offer_id uuid,p_actor_id uuid,p_action text)
returns public.booking_resolution_offers language plpgsql security definer set search_path='' as $$
declare r public.booking_resolution_offers; b public.booking_requests; q public.booking_payment_quotes; target uuid; assigned_time timestamptz;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) then raise exception 'forbidden'; end if;
 select booking_id into target from public.booking_resolution_offers where id=p_offer_id;
 if not found then raise exception 'offer_not_found'; end if;
 select * into b from public.booking_requests where id=target for update;
 select * into r from public.booking_resolution_offers where id=p_offer_id for update;
 if r.status<>'Pending' then raise exception 'offer_not_pending'; end if;
 if p_action='withdraw' then
  if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 elsif p_action in ('accept','decline') then
  if p_actor_id<>r.customer_id or not exists(select 1 from public.profiles where id=p_actor_id and user_type='Customer/Renter' and account_status='Active') then raise exception 'forbidden'; end if;
 else raise exception 'invalid_action'; end if;
 if p_action='accept' then
  if b.booking_status not in ('Submitted','Confirmed') or exists(select 1 from public.rental_transactions where booking_id=b.id) or not exists(select 1 from public.payments where booking_id=b.id and status='Verified') then raise exception 'offer_unavailable'; end if;
  if b.pickup_at is distinct from r.original_pickup_at or b.return_at is distinct from r.original_return_at or coalesce(b.assigned_vehicle_id,b.requested_vehicle_id)<>r.original_vehicle_id then raise exception 'booking_changed'; end if;
  if exists(select 1 from public.booking_cancellation_requests where booking_id=b.id and status='Pending') or exists(select 1 from public.booking_date_change_requests where booking_id=b.id and status='Pending') then raise exception 'pending_request_requires_review'; end if;
  select * into q from public.booking_payment_quotes where booking_id=b.id for update;
  if to_jsonb(q) is distinct from r.quote_snapshot then raise exception 'quote_changed'; end if;
  if r.proposed_pickup_at<=now() then raise exception 'invalid_dates'; end if;
  if not exists(select 1 from public.profiles where id=r.created_by and user_type='Owner/Admin' and account_status='Active') then raise exception 'offer_unavailable'; end if;
  perform public.assert_resolution_vehicle_available(b.id,r.proposed_vehicle_id,r.proposed_pickup_at,r.proposed_return_at);
  if not exists(select 1 from public.vehicles v join public.vehicles original on original.id=b.requested_vehicle_id where v.id=r.proposed_vehicle_id and v.is_active and v.branch_id=b.pickup_branch_id and v.category_id=original.category_id and v.seat_capacity>=original.seat_capacity) then raise exception 'incompatible_vehicle'; end if;
  assigned_time:=now();
  update public.booking_requests set assigned_vehicle_id=r.proposed_vehicle_id,assigned_by=r.created_by,assigned_at=assigned_time,
   assignment_note='Customer accepted saved-price alternative offer '||r.id::text,
   substitution_acknowledged=(r.proposed_vehicle_id<>requested_vehicle_id),cross_branch_acknowledged=false,
   pickup_at=r.proposed_pickup_at,return_at=r.proposed_return_at,
   confirmation_exception_code=null,confirmation_exception_message=null,confirmation_exception_at=null
  where id=b.id;
  update public.booking_payment_quotes set pickup_at=r.proposed_pickup_at,return_at=r.proposed_return_at,quote_version=quote_version+1 where id=q.id and (pickup_at,return_at) is distinct from (r.proposed_pickup_at,r.proposed_return_at);
  if b.booking_status='Submitted' then perform public.confirm_booking_atomic(b.id,r.created_by,r.proposed_vehicle_id,assigned_time); end if;
 end if;
 update public.booking_resolution_offers set status=case p_action when 'accept' then 'Accepted' when 'decline' then 'Declined' else 'Withdrawn' end,responded_by=p_actor_id,responded_at=now() where id=r.id returning * into r;
 perform public.append_user_audit_event(p_actor_id,'booking.resolution_responded','booking',b.id,b.id,jsonb_build_object('offer_id',r.id,'status',r.status,'quote_preserved',true));
 return r;
end $$;
