-- Privileged mutations live outside Data API schemas. Public entry points are
-- invoker wrappers restricted to the trusted server role; customer/owner checks
-- also run inside each mutation. Existing audit/quote write grants stay closed.
create schema if not exists briah_private;
revoke all on schema briah_private from public,anon,authenticated;
grant usage on schema briah_private to service_role;
-- An offer does not alter the booking until its customer explicitly accepts it.
create table public.booking_resolution_offers (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id),
 customer_id uuid not null references public.profiles(id), proposed_vehicle_id uuid not null references public.vehicles(id),
 original_vehicle_id uuid not null references public.vehicles(id), original_pickup_at timestamptz not null, original_return_at timestamptz not null,
 proposed_pickup_at timestamptz not null, proposed_return_at timestamptz not null,
 quote_snapshot jsonb not null, note text not null check(length(note) between 1 and 500),
 status text not null default 'Pending' check(status in ('Pending','Accepted','Declined','Withdrawn')),
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), responded_by uuid references public.profiles(id), responded_at timestamptz,
 check(proposed_return_at>proposed_pickup_at),check(proposed_return_at-proposed_pickup_at=original_return_at-original_pickup_at),
 check((status='Pending' and responded_at is null and responded_by is null) or (status<>'Pending' and responded_at is not null and responded_by is not null))
);
create unique index booking_resolution_one_pending on public.booking_resolution_offers(booking_id) where status='Pending';
create index booking_resolution_customer on public.booking_resolution_offers(customer_id,created_at desc);
create index booking_resolution_proposed_vehicle_id on public.booking_resolution_offers(proposed_vehicle_id);
create index booking_resolution_original_vehicle_id on public.booking_resolution_offers(original_vehicle_id);
create index booking_resolution_created_by on public.booking_resolution_offers(created_by);
create index booking_resolution_responded_by on public.booking_resolution_offers(responded_by);
alter table public.booking_resolution_offers enable row level security;
revoke all on public.booking_resolution_offers from public,anon,authenticated;
grant select on public.booking_resolution_offers to authenticated;
grant select,insert,update on public.booking_resolution_offers to service_role;
create policy booking_resolution_read on public.booking_resolution_offers for select to authenticated using(customer_id=(select auth.uid()) or exists(select 1 from public.profiles where id=(select auth.uid()) and user_type='Owner/Admin' and account_status='Active'));

create function public.assert_resolution_vehicle_available(p_booking_id uuid,p_vehicle_id uuid,p_pickup_at timestamptz,p_return_at timestamptz)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text,0));
 perform 1 from public.vehicles where id=p_vehicle_id for update;
 perform public.assert_vehicle_rental_ready(p_vehicle_id);
 if exists(select 1 from public.rental_transactions where vehicle_id=p_vehicle_id and ended_at is null) then raise exception 'vehicle_already_rented'; end if;
 if exists(select 1 from public.booking_requests where id<>p_booking_id and booking_status='Confirmed' and assigned_vehicle_id=p_vehicle_id and p_pickup_at<return_at and p_return_at>pickup_at) then raise exception 'vehicle_conflict'; end if;
 if exists(select 1 from (select distinct on(coalesce(nullif(trim(maintenance_type),''),'__uncategorized__')) next_service_date from public.maintenance_records where vehicle_id=p_vehicle_id and status='Completed' and next_service_date is not null order by coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'),completed_at desc,created_at desc) due where due.next_service_date<=((p_return_at-interval '1 microsecond') at time zone 'Asia/Manila')::date) then raise exception 'vehicle_maintenance_unready'; end if;
end $$;
revoke all on function public.assert_resolution_vehicle_available(uuid,uuid,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.assert_resolution_vehicle_available(uuid,uuid,timestamptz,timestamptz) from service_role;

create function briah_private.create_booking_resolution_offer(p_booking_id uuid,p_actor_id uuid,p_vehicle_id uuid,p_pickup_at timestamptz,p_note text)
returns public.booking_resolution_offers language plpgsql security definer set search_path='' as $$
declare b public.booking_requests; v public.vehicles; original public.vehicles; q public.booking_payment_quotes; r public.booking_resolution_offers; proposed_end timestamptz;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) then raise exception 'forbidden'; end if;
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into b from public.booking_requests where id=p_booking_id for update;
 if not found then raise exception 'booking_not_found'; end if;
 if b.booking_status not in ('Submitted','Confirmed') or exists(select 1 from public.rental_transactions where booking_id=b.id) or not exists(select 1 from public.payments where booking_id=b.id and status='Verified') then raise exception 'offer_unavailable'; end if;
 if exists(select 1 from public.booking_cancellation_requests where booking_id=b.id and status='Pending') or exists(select 1 from public.booking_date_change_requests where booking_id=b.id and status='Pending') then raise exception 'pending_request_requires_review'; end if;
 select * into q from public.booking_payment_quotes where booking_id=b.id;
 if not found then raise exception 'quote_required'; end if;
 select * into v from public.vehicles where id=p_vehicle_id;
 select * into original from public.vehicles where id=b.requested_vehicle_id;
 if not v.is_active or v.branch_id is distinct from b.pickup_branch_id or v.category_id is distinct from original.category_id or v.seat_capacity is null or original.seat_capacity is null or v.seat_capacity<original.seat_capacity then raise exception 'incompatible_vehicle'; end if;
 proposed_end:=p_pickup_at+(b.return_at-b.pickup_at);
 if p_pickup_at is null or p_pickup_at<=now() or proposed_end<=p_pickup_at then raise exception 'invalid_dates'; end if;
 if p_pickup_at is distinct from b.pickup_at and (p_pickup_at at time zone 'Asia/Manila')::date<=(now() at time zone 'Asia/Manila')::date then raise exception 'invalid_dates'; end if;
 if extract(minute from p_pickup_at at time zone 'Asia/Manila')<>0 or extract(second from p_pickup_at)<>0 or extract(hour from p_pickup_at at time zone 'Asia/Manila') not between 8 and 18 or extract(minute from proposed_end at time zone 'Asia/Manila')<>0 or extract(second from proposed_end)<>0 or extract(hour from proposed_end at time zone 'Asia/Manila') not between 8 and 18 then raise exception 'invalid_dates'; end if;
 if nullif(trim(p_note),'') is null or length(p_note)>500 then raise exception 'note_required'; end if;
 if p_vehicle_id=coalesce(b.assigned_vehicle_id,b.requested_vehicle_id) and p_pickup_at=b.pickup_at then raise exception 'offer_unchanged'; end if;
 perform public.assert_resolution_vehicle_available(b.id,v.id,p_pickup_at,proposed_end);
 insert into public.booking_resolution_offers(booking_id,customer_id,proposed_vehicle_id,original_vehicle_id,original_pickup_at,original_return_at,proposed_pickup_at,proposed_return_at,quote_snapshot,note,created_by)
 values(b.id,b.customer_id,v.id,coalesce(b.assigned_vehicle_id,b.requested_vehicle_id),b.pickup_at,b.return_at,p_pickup_at,proposed_end,to_jsonb(q),trim(p_note),p_actor_id) returning * into r;
 perform public.append_user_audit_event(p_actor_id,'booking.resolution_offered','booking',b.id,b.id,jsonb_build_object('offer_id',r.id,'vehicle_id',v.id,'original_quote_preserved',true));
 return r;
end $$;
revoke all on function briah_private.create_booking_resolution_offer(uuid,uuid,uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function briah_private.create_booking_resolution_offer(uuid,uuid,uuid,timestamptz,text) to service_role;
create function public.create_booking_resolution_offer(p_booking_id uuid,p_actor_id uuid,p_vehicle_id uuid,p_pickup_at timestamptz,p_note text) returns public.booking_resolution_offers
language sql security invoker set search_path='' as $$
 select * from briah_private.create_booking_resolution_offer(p_booking_id,p_actor_id,p_vehicle_id,p_pickup_at,p_note);
$$;
revoke all on function public.create_booking_resolution_offer(uuid,uuid,uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.create_booking_resolution_offer(uuid,uuid,uuid,timestamptz,text) to service_role;

create function briah_private.respond_booking_resolution_offer(p_offer_id uuid,p_actor_id uuid,p_action text)
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
  update public.booking_payment_quotes set pickup_at=r.proposed_pickup_at,return_at=r.proposed_return_at,quote_version=quote_version+1 where id=q.id;
  if b.booking_status='Submitted' then perform public.confirm_booking_atomic(b.id,r.created_by,r.proposed_vehicle_id,assigned_time); end if;
 end if;
 update public.booking_resolution_offers set status=case p_action when 'accept' then 'Accepted' when 'decline' then 'Declined' else 'Withdrawn' end,responded_by=p_actor_id,responded_at=now() where id=r.id returning * into r;
 perform public.append_user_audit_event(p_actor_id,'booking.resolution_responded','booking',b.id,b.id,jsonb_build_object('offer_id',r.id,'status',r.status,'quote_preserved',true));
 return r;
end $$;
revoke all on function briah_private.respond_booking_resolution_offer(uuid,uuid,text) from public,anon,authenticated;
grant execute on function briah_private.respond_booking_resolution_offer(uuid,uuid,text) to service_role;
create function public.respond_booking_resolution_offer(p_offer_id uuid,p_actor_id uuid,p_action text) returns public.booking_resolution_offers
language sql security invoker set search_path='' as $$
 select * from briah_private.respond_booking_resolution_offer(p_offer_id,p_actor_id,p_action);
$$;
revoke all on function public.respond_booking_resolution_offer(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.respond_booking_resolution_offer(uuid,uuid,text) to service_role;

-- Retain the existing action allowlist and add only these two booking events.
do $$ declare c record; definition text;
begin
 for c in select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.audit_events'::regclass and contype='c' and pg_get_constraintdef(oid) like '%booking.withdrawn%' loop
  definition:=replace(c.def,'''booking.withdrawn''::text','''booking.withdrawn''::text, ''booking.resolution_offered''::text, ''booking.resolution_responded''::text');
  if definition=c.def then raise exception 'audit_constraint_precondition_failed'; end if;
  execute format('alter table public.audit_events drop constraint %I',c.conname);execute format('alter table public.audit_events add constraint %I %s',c.conname,definition);
 end loop;
 for c in select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.notifications'::regclass and contype='c' and pg_get_constraintdef(oid) like '%date_change_requested%' loop
  definition:=replace(c.def,'''date_change_requested''::text','''date_change_requested''::text, ''resolution_offered''::text, ''resolution_responded''::text');
  if definition=c.def then raise exception 'notification_constraint_precondition_failed'; end if;
  execute format('alter table public.notifications drop constraint %I',c.conname);execute format('alter table public.notifications add constraint %I %s',c.conname,definition);
 end loop;
end $$;

create function public.notify_booking_resolution_offer() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
  insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
  values(new.customer_id,'resolution_offered','Review an alternative for your booking','The owner proposed an alternative vehicle or date at your saved rental price. Review it in your booking before accepting.','booking',new.booking_id,'resolution:'||new.id::text||':offered') on conflict(recipient_id,event_key) do nothing;
 elsif new.status<>old.status then
  if new.status='Withdrawn' then
   insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
   values(new.customer_id,'resolution_responded','An alternative offer was withdrawn','This offer is no longer available. Open your booking for its current status and available options.','booking',new.booking_id,'resolution:'||new.id::text||':withdrawn') on conflict(recipient_id,event_key) do nothing;
  else
   insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
   select id,'resolution_responded','Alternative offer '||lower(new.status),'A customer responded to the alternative offer. Open the booking to review its current state.','booking',new.booking_id,'resolution:'||new.id::text||':'||new.status from public.profiles where user_type='Owner/Admin' and account_status='Active' on conflict(recipient_id,event_key) do nothing;
  end if;
 end if;
 return new;
end $$;
revoke all on function public.notify_booking_resolution_offer() from public,anon,authenticated;
create trigger booking_resolution_notify after insert or update on public.booking_resolution_offers for each row execute function public.notify_booking_resolution_offer();

create function public.close_booking_resolution_offers() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.booking_status in ('Cancelled','Rejected') and new.resolved_by is not null then
  update public.booking_resolution_offers set status='Withdrawn',responded_by=new.resolved_by,responded_at=now() where booking_id=new.id and status='Pending';
 end if;
 return new;
end $$;
revoke all on function public.close_booking_resolution_offers() from public,anon,authenticated;
create trigger booking_close_resolution_offers after update of booking_status on public.booking_requests for each row when(old.booking_status is distinct from new.booking_status) execute function public.close_booking_resolution_offers();
