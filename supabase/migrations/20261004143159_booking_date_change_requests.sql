-- A requested date shift never releases the original reservation before approval.
create table public.booking_date_change_requests (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id),
 customer_id uuid not null references public.profiles(id), original_pickup_at timestamptz not null,
 original_return_at timestamptz not null, requested_pickup_at timestamptz not null, requested_return_at timestamptz not null,
 reason text not null, reason_code text not null references public.booking_categories(code),
 status text not null default 'Pending' check(status in ('Pending','Approved','Rejected')),
 reviewed_by uuid references public.profiles(id), review_reason text, reviewed_at timestamptz,
 quote_before jsonb, created_at timestamptz not null default now(),
 check(requested_return_at>requested_pickup_at),
 check(requested_return_at-requested_pickup_at=original_return_at-original_pickup_at)
);
create unique index booking_date_change_one_pending on public.booking_date_change_requests(booking_id) where status='Pending';
create index booking_date_change_customer on public.booking_date_change_requests(customer_id,created_at desc);
alter table public.booking_date_change_requests enable row level security;
revoke all on public.booking_date_change_requests from public,anon,authenticated;
grant select on public.booking_date_change_requests to authenticated;
grant select,insert,update on public.booking_date_change_requests to service_role;
create policy date_change_read on public.booking_date_change_requests for select to authenticated using(customer_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.user_type='Owner/Admin' and p.account_status='Active'));

create function public.request_booking_date_change(p_booking_id uuid,p_actor_id uuid,p_pickup_at timestamptz,p_reason text)
returns public.booking_date_change_requests language plpgsql security definer set search_path='' as $$
declare b public.booking_requests; result public.booking_date_change_requests; code text;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Customer/Renter' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into b from public.booking_requests where id=p_booking_id and customer_id=p_actor_id for update;
 if not found then raise exception 'booking_not_found'; end if;
 if b.booking_status not in ('Submitted','Confirmed') or b.pickup_at<=now() or exists(select 1 from public.rental_transactions where booking_id=b.id) then raise exception 'date_change_unavailable'; end if;
 if p_pickup_at is null or (p_pickup_at at time zone 'Asia/Manila')::date<=(now() at time zone 'Asia/Manila')::date or p_pickup_at=b.pickup_at then raise exception 'invalid_dates'; end if;
 code:=public.booking_category_code('rescheduling',trim(p_reason));
 if code is null or length(p_reason)>500 or (code='reschedule.other' and length(trim(p_reason))<=length('Other date change reason — ')) then raise exception 'reason_required'; end if;
 insert into public.booking_date_change_requests(booking_id,customer_id,original_pickup_at,original_return_at,requested_pickup_at,requested_return_at,reason,reason_code)
 values(b.id,p_actor_id,b.pickup_at,b.return_at,p_pickup_at,p_pickup_at+(b.return_at-b.pickup_at),trim(p_reason),code) returning * into result;
 return result;
end; $$;
revoke all on function public.request_booking_date_change(uuid,uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.request_booking_date_change(uuid,uuid,timestamptz,text) to service_role;

create function public.review_booking_date_change(p_request_id uuid,p_actor_id uuid,p_action text,p_reason text)
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
  if exists(select 1 from (select distinct on (coalesce(nullif(trim(maintenance_type),''),'__uncategorized__')) next_service_date from public.maintenance_records where vehicle_id=v_id and status='Completed' and next_service_date is not null order by coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'),completed_at desc,created_at desc) due where due.next_service_date <= ((r.requested_return_at-interval '1 microsecond') at time zone 'Asia/Manila')::date) then raise exception 'vehicle_maintenance_unready'; end if;

  if exists(select 1 from public.booking_requests x where x.id<>b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=v_id and r.requested_pickup_at<x.return_at and r.requested_return_at>x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  -- Lock and preserve the saved financial quote before changing only its dates.
  perform 1 from public.booking_payment_quotes where booking_id=b.id for update;
  update public.booking_date_change_requests set quote_before=(select to_jsonb(q) from public.booking_payment_quotes q where q.booking_id=b.id) where id=r.id;
  update public.booking_requests set pickup_at=r.requested_pickup_at,return_at=r.requested_return_at,updated_at=now() where id=b.id;
  update public.booking_payment_quotes set pickup_at=r.requested_pickup_at,return_at=r.requested_return_at,quote_version=quote_version+1,updated_at=now() where booking_id=b.id;
 end if;
 update public.booking_date_change_requests set status=case when p_action='approve' then 'Approved' else 'Rejected' end,reviewed_by=p_actor_id,review_reason=case when p_action='approve' then 'Same vehicle, duration and saved price; availability checked.' else trim(p_reason) end,reviewed_at=now() where id=r.id returning * into result;
 return result;
end; $$;
revoke all on function public.review_booking_date_change(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_booking_date_change(uuid,uuid,text,text) to service_role;

DO $$ declare c record; definition text; begin
for c in select conname,conrelid,pg_get_constraintdef(oid) def from pg_constraint where contype='c' and conrelid in ('public.notifications'::regclass,'public.email_deliveries'::regclass) and pg_get_constraintdef(oid) like '%notification_type%' or (contype='c' and conrelid='public.email_deliveries'::regclass and pg_get_constraintdef(oid) like '%email_type%') loop
 definition:=replace(c.def,'''quote_issued''::text', '''quote_issued''::text, ''date_change_requested''::text, ''date_change_approved''::text, ''date_change_rejected''::text');
 execute format('alter table %s drop constraint %I',c.conrelid::regclass,c.conname);
 execute format('alter table %s add constraint %I %s',c.conrelid::regclass,c.conname,definition);
end loop; end $$;
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.notification_type not in (
    'quote_issued',
    'date_change_approved',
    'date_change_rejected',
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'upcoming_pickup',
    'upcoming_return',
    'rental_overdue'
  ) then
    return new;
  end if;

  -- Email is secondary. Any outbox-only defect must not invalidate the
  -- canonical notification or the business transaction that created it.
  begin
    insert into public.email_deliveries (
      recipient_user_id,
      notification_id,
      delivery_key,
      email_type
    )
    select
      new.recipient_id,
      new.id,
      'email:notification:' || new.id::text || ':recipient:' || new.recipient_id::text,
      new.notification_type
    from public.profiles profile
    left join public.notification_preferences preference
      on preference.recipient_id = profile.id
    where profile.id = new.recipient_id
      and profile.user_type = 'Customer/Renter'
      and profile.account_status = 'Active'
      and coalesce(preference.email_notifications_enabled, true)
    on conflict (delivery_key) do nothing;
  exception when others then
    null;
  end;

  return new;
end;
$function$;

create function public.notify_booking_date_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
if tg_op='INSERT' then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 select p.id,'date_change_requested','Date change requested','A customer has requested different dates. Review availability before approving.','booking',new.booking_id,'date-change:'||new.id::text||':requested'
 from public.profiles p where p.user_type='Owner/Admin' and p.account_status='Active' on conflict(recipient_id,event_key) do nothing;
elsif new.status<>old.status and new.status in ('Approved','Rejected') then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 values(new.customer_id,case when new.status='Approved' then 'date_change_approved' else 'date_change_rejected' end,
 case when new.status='Approved' then 'Your date change is approved' else 'Your original booking dates remain in place' end,
 coalesce(new.review_reason,'Open your booking for details.'),'booking',new.booking_id,'date-change:'||new.id::text||':'||new.status)
 on conflict(recipient_id,event_key) do nothing;
end if;
return new; end $$;
revoke all on function public.notify_booking_date_change() from public,anon,authenticated;
create trigger booking_date_change_notify after insert or update on public.booking_date_change_requests for each row execute function public.notify_booking_date_change();

create or replace function public.notify_booking_quote_issued() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if new is not distinct from old then return new; end if;
  if (new.pickup_at,new.return_at) is distinct from (old.pickup_at,old.return_at)
   and (new.daily_rate,new.billable_days,new.rental_subtotal,new.delivery_fee,new.total_amount,new.down_payment_amount)
   is not distinct from (old.daily_rate,old.billable_days,old.rental_subtotal,old.delivery_fee,old.total_amount,old.down_payment_amount) then return new; end if;
 end if;
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 select customer_id,'quote_issued','Your rental quote is ready','Review your rental price and pickup or delivery arrangements before submitting payment.','booking',id,'quote-issued:'||new.booking_id::text||':'||new.updated_at::text from public.booking_requests where id=new.booking_id on conflict(recipient_id,event_key) do nothing;
 return new; end $$;
