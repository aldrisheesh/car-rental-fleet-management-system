-- Keep the categorized customer cancellation cause on the booking.
-- The owner decision explanation stays separately in the review/audit record.
create or replace function briah_private.review_booking_cancellation_atomic(p_request_id uuid,p_actor_id uuid,p_action text,p_reason text)
returns public.booking_cancellation_requests language plpgsql security definer set search_path='' as $$
declare r public.booking_cancellation_requests; b public.booking_requests; booking_id uuid;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if p_action not in ('approve','reject') or nullif(trim(p_reason),'') is null or length(p_reason)>500 then raise exception 'reason_required'; end if;
  select c.booking_id into booking_id from public.booking_cancellation_requests c where c.id=p_request_id;
  if not found then raise exception 'request_not_found'; end if;
  -- Every path locks the booking before its request, including direct cancellation.
  select * into b from public.booking_requests where id=booking_id for update;
  select * into r from public.booking_cancellation_requests where id=p_request_id for update;
  if r.status<>'Pending' then raise exception 'request_already_reviewed'; end if;
  if p_action='approve' and (b.booking_status not in ('Submitted','Confirmed') or exists(select 1 from public.rental_transactions where rental_transactions.booking_id=b.id)) then raise exception 'cancellation_unavailable'; end if;
  if p_action='approve' and (b.pickup_at is distinct from r.original_pickup_at or b.return_at is distinct from r.original_return_at) then raise exception 'booking_changed'; end if;
  if p_action='approve' then
    if b.booking_status='Confirmed' then
      perform public.cancel_confirmed_booking_atomic(b.id,p_actor_id,b.confirmed_at,r.reason);
    else
      update public.booking_requests set booking_status='Cancelled',resolution_reason=r.reason,resolved_by=p_actor_id,resolved_at=now() where id=b.id;
      perform public.append_user_audit_event(p_actor_id,'booking.cancelled','booking',b.id,b.id,jsonb_build_object('request_id',r.id,'customer_initiated',true,'reason',r.reason));
    end if;
    update public.booking_date_change_requests set status='Rejected',reviewed_by=p_actor_id,reviewed_at=now(),review_reason='Booking cancelled after customer request.' where booking_date_change_requests.booking_id=b.id and status='Pending';
  end if;
  update public.booking_cancellation_requests set status=case when p_action='approve' then 'Approved' else 'Rejected' end,reviewed_by=p_actor_id,reviewed_at=now(),review_reason=trim(p_reason) where id=r.id returning * into r;
  perform public.append_user_audit_event(p_actor_id,'booking.cancellation_reviewed','booking',b.id,b.id,jsonb_build_object('request_id',r.id,'status',r.status,'reason',r.review_reason));
  return r;
end; $$;
