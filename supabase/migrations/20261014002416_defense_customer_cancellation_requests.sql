-- Privileged mutations live outside Data API schemas. Public entry points are
-- invoker wrappers restricted to the trusted server role; customer/owner checks
-- also run inside each mutation. Existing audit/quote write grants stay closed.
create schema if not exists briah_private;
revoke all on schema briah_private from public,anon,authenticated;
grant usage on schema briah_private to service_role;
-- Customer intent is recorded independently of the final reservation outcome.
do $$ declare c record; definition text;
begin
  for c in select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.audit_events'::regclass and contype='c' and pg_get_constraintdef(oid) like '%booking.withdrawn%' loop
    definition:=replace(c.def,'''booking.withdrawn''::text','''booking.withdrawn''::text, ''booking.cancellation_requested''::text, ''booking.cancellation_reviewed''::text');
    if definition=c.def then raise exception 'audit_constraint_precondition_failed'; end if;
    execute format('alter table public.audit_events drop constraint %I',c.conname);
    execute format('alter table public.audit_events add constraint %I %s',c.conname,definition);
  end loop;
end $$;
create table public.booking_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests(id),
  customer_id uuid not null references public.profiles(id),
  reason text not null check (length(reason) between 1 and 500),
  reason_code text not null references public.booking_categories(code),
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  original_pickup_at timestamptz not null,
  original_return_at timestamptz not null,
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_reason text,
  check ((status='Pending' and reviewed_at is null and reviewed_by is null) or
    (status<>'Pending' and reviewed_at is not null and reviewed_by is not null))
);
create unique index booking_cancellation_one_pending on public.booking_cancellation_requests(booking_id) where status='Pending';
create index booking_cancellation_customer on public.booking_cancellation_requests(customer_id,created_at desc);
create index booking_cancellation_reviewer on public.booking_cancellation_requests(reviewed_by);
create index booking_cancellation_reason on public.booking_cancellation_requests(reason_code);
alter table public.booking_cancellation_requests enable row level security;
revoke all on public.booking_cancellation_requests from public,anon,authenticated;
grant select on public.booking_cancellation_requests to authenticated;
grant select,insert,update on public.booking_cancellation_requests to service_role;
create policy booking_cancellation_read on public.booking_cancellation_requests for select to authenticated
using(customer_id=(select auth.uid()) or exists(select 1 from public.profiles where id=(select auth.uid()) and user_type='Owner/Admin' and account_status='Active'));

create function briah_private.request_booking_cancellation_atomic(p_booking_id uuid,p_actor_id uuid,p_reason text)
returns public.booking_cancellation_requests language plpgsql security definer set search_path='' as $$
declare b public.booking_requests; r public.booking_cancellation_requests; code text;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Customer/Renter' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into b from public.booking_requests where id=p_booking_id and customer_id=p_actor_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status not in ('Submitted','Confirmed') or exists(select 1 from public.rental_transactions where booking_id=b.id) then raise exception 'cancellation_unavailable'; end if;
  code:=public.booking_category_code('cancellation',trim(p_reason));
  if code is null or length(p_reason)>500 or (code='cancellation.other' and length(trim(p_reason))<=length('Other cancellation reason — ')) then raise exception 'reason_required'; end if;
  select * into r from public.booking_cancellation_requests where booking_id=b.id and status='Pending';
  if found then return r; end if;
  insert into public.booking_cancellation_requests(booking_id,customer_id,reason,reason_code,original_pickup_at,original_return_at)
  values(b.id,p_actor_id,trim(p_reason),code,b.pickup_at,b.return_at) returning * into r;
  perform public.append_user_audit_event(p_actor_id,'booking.cancellation_requested','booking',b.id,b.id,jsonb_build_object('request_id',r.id,'reason',r.reason));
  return r;
end; $$;
revoke all on function briah_private.request_booking_cancellation_atomic(uuid,uuid,text) from public,anon,authenticated;
grant execute on function briah_private.request_booking_cancellation_atomic(uuid,uuid,text) to service_role;
create function public.request_booking_cancellation_atomic(p_booking_id uuid,p_actor_id uuid,p_reason text) returns public.booking_cancellation_requests
language sql security invoker set search_path='' as $$ select * from briah_private.request_booking_cancellation_atomic(p_booking_id,p_actor_id,p_reason); $$;
revoke all on function public.request_booking_cancellation_atomic(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.request_booking_cancellation_atomic(uuid,uuid,text) to service_role;

create function briah_private.review_booking_cancellation_atomic(p_request_id uuid,p_actor_id uuid,p_action text,p_reason text)
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
      perform public.cancel_confirmed_booking_atomic(b.id,p_actor_id,b.confirmed_at,trim(p_reason));
    else
      update public.booking_requests set booking_status='Cancelled',resolution_reason=trim(p_reason),resolved_by=p_actor_id,resolved_at=now() where id=b.id;
      perform public.append_user_audit_event(p_actor_id,'booking.cancelled','booking',b.id,b.id,jsonb_build_object('request_id',r.id,'customer_initiated',true,'reason',trim(p_reason)));
    end if;
    update public.booking_date_change_requests set status='Rejected',reviewed_by=p_actor_id,reviewed_at=now(),review_reason='Booking cancelled after customer request.' where booking_date_change_requests.booking_id=b.id and status='Pending';
  end if;
  update public.booking_cancellation_requests set status=case when p_action='approve' then 'Approved' else 'Rejected' end,reviewed_by=p_actor_id,reviewed_at=now(),review_reason=trim(p_reason) where id=r.id returning * into r;
  perform public.append_user_audit_event(p_actor_id,'booking.cancellation_reviewed','booking',b.id,b.id,jsonb_build_object('request_id',r.id,'status',r.status,'reason',r.review_reason));
  return r;
end; $$;
revoke all on function briah_private.review_booking_cancellation_atomic(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function briah_private.review_booking_cancellation_atomic(uuid,uuid,text,text) to service_role;
create function public.review_booking_cancellation_atomic(p_request_id uuid,p_actor_id uuid,p_action text,p_reason text) returns public.booking_cancellation_requests
language sql security invoker set search_path='' as $$ select * from briah_private.review_booking_cancellation_atomic(p_request_id,p_actor_id,p_action,p_reason); $$;
revoke all on function public.review_booking_cancellation_atomic(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_booking_cancellation_atomic(uuid,uuid,text,text) to service_role;

do $$ declare c record; definition text;
begin
  for c in select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.notifications'::regclass and contype='c' and pg_get_constraintdef(oid) like '%date_change_requested%' loop
    definition:=replace(c.def,'''date_change_requested''::text','''date_change_requested''::text, ''cancellation_requested''::text, ''cancellation_approved''::text, ''cancellation_rejected''::text');
    if definition=c.def then raise exception 'notification_constraint_precondition_failed'; end if;
    execute format('alter table public.notifications drop constraint %I',c.conname);
    execute format('alter table public.notifications add constraint %I %s',c.conname,definition);
  end loop;
end $$;

create function public.notify_booking_cancellation_request() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='INSERT' then
    insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
    select id,'cancellation_requested','Cancellation requested','A customer requested cancellation. Review the booking and payment record before deciding.','booking',new.booking_id,'cancellation:'||new.id::text||':requested'
    from public.profiles where user_type='Owner/Admin' and account_status='Active' on conflict(recipient_id,event_key) do nothing;
  elsif new.status<>old.status and new.status in ('Approved','Rejected') then
    insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
    values(new.customer_id,case when new.status='Approved' then 'cancellation_approved' else 'cancellation_rejected' end,
      case when new.status='Approved' then 'Your cancellation is approved' else 'Your cancellation request was declined' end,
      coalesce(new.review_reason,'Open your booking for details.'),'booking',new.booking_id,'cancellation:'||new.id::text||':'||new.status)
    on conflict(recipient_id,event_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.notify_booking_cancellation_request() from public,anon,authenticated;
create trigger booking_cancellation_notify after insert or update on public.booking_cancellation_requests for each row execute function public.notify_booking_cancellation_request();

create function public.close_booking_cancellation_request() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.booking_status in ('Cancelled','Rejected') and new.resolved_by is not null then
    update public.booking_cancellation_requests set status=case when new.booking_status='Cancelled' then 'Approved' else 'Rejected' end,
      reviewed_by=new.resolved_by,reviewed_at=now(),review_reason=coalesce(new.resolution_reason,'The booking is closed.')
    where booking_id=new.id and status='Pending';
  end if;
  return new;
end $$;
revoke all on function public.close_booking_cancellation_request() from public,anon,authenticated;
create trigger booking_close_cancellation after update of booking_status on public.booking_requests for each row when(old.booking_status is distinct from new.booking_status) execute function public.close_booking_cancellation_request();

-- A cancelled booking must not be described as still reserved.
create or replace function public.notify_booking_date_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
if tg_op='INSERT' then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 select p.id,'date_change_requested','Date change requested','A customer has requested different dates. Review availability before approving.','booking',new.booking_id,'date-change:'||new.id::text||':requested'
 from public.profiles p where p.user_type='Owner/Admin' and p.account_status='Active' on conflict(recipient_id,event_key) do nothing;
elsif new.status<>old.status and new.status in ('Approved','Rejected') then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 values(new.customer_id,case when new.status='Approved' then 'date_change_approved' else 'date_change_rejected' end,
 case when new.status='Approved' then 'Your date change is approved' else 'Your date change was declined' end,
 coalesce(new.review_reason,'Open your booking for details.'),'booking',new.booking_id,'date-change:'||new.id::text||':'||new.status)
 on conflict(recipient_id,event_key) do nothing;
end if;
return new; end $$;
revoke all on function public.notify_booking_date_change() from public,anon,authenticated;

-- Review a pending cancellation before handing over the vehicle.
create function public.guard_rental_pending_cancellation() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.booking_requests where id=new.booking_id for update;
 if exists(select 1 from public.booking_cancellation_requests where booking_id=new.booking_id and status='Pending') then raise exception 'pending_cancellation_requires_review'; end if;
 return new;
end $$;
revoke all on function public.guard_rental_pending_cancellation() from public,anon,authenticated;
create trigger rental_pending_cancellation before insert on public.rental_transactions for each row execute function public.guard_rental_pending_cancellation();
