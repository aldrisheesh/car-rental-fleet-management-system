-- Owner approved 2026-10-14. Existing quotes are grandfathered; no retroactive deadline.
-- Keep quote issuance unchanged until the matching production UI and scheduler
-- have deployed. Activation is a separate verified rollout step.
create table briah_private.payment_hold_configuration (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false
);
alter table briah_private.payment_hold_configuration enable row level security;
insert into briah_private.payment_hold_configuration(singleton,enabled) values(true,false);
revoke all on briah_private.payment_hold_configuration from public,anon,authenticated,service_role;
create table public.booking_payment_holds (
 booking_id uuid primary key references public.booking_requests(id),
 vehicle_id uuid not null references public.vehicles(id), customer_id uuid not null references public.profiles(id),
 pickup_at timestamptz not null, return_at timestamptz not null check(return_at>pickup_at),
 state text not null check(state in ('AwaitingPayment','Review','Correction','Verified','Expired','Completed','Released')),
 opened_at timestamptz not null, deadline_at timestamptz not null, review_due_at timestamptz,
 generation integer not null default 1 check(generation>0), correction_count integer not null default 0 check(correction_count>=0),
 changed_at timestamptz not null default now(), changed_by uuid references public.profiles(id), reason text,
 check(deadline_at>opened_at)
);
create index payment_holds_vehicle_window on public.booking_payment_holds(vehicle_id,pickup_at,return_at);
create index payment_holds_customer on public.booking_payment_holds(customer_id);
create index payment_holds_actor on public.booking_payment_holds(changed_by);
create table public.booking_payment_hold_events (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.booking_requests(id),
 actor_id uuid references public.profiles(id), occurred_at timestamptz not null default now(), snapshot jsonb not null
);
create index payment_hold_events_booking on public.booking_payment_hold_events(booking_id,occurred_at);
create index payment_hold_events_actor on public.booking_payment_hold_events(actor_id);
alter table public.booking_payment_holds enable row level security;
alter table public.booking_payment_hold_events enable row level security;
revoke all on public.booking_payment_holds,public.booking_payment_hold_events from public,anon,authenticated,service_role;
grant select on public.booking_payment_holds,public.booking_payment_hold_events to service_role;

create function briah_private.hold_business_deadline(p_start timestamptz,p_hours integer)
returns timestamptz language plpgsql immutable set search_path='' as $$
declare local_time timestamp := p_start at time zone 'Asia/Manila'; remaining interval := make_interval(hours=>p_hours); available interval;
begin
 if p_hours<1 or p_hours>100 then raise exception 'invalid_business_hours'; end if;
 loop
  if local_time::time<time '08:00' then local_time:=date_trunc('day',local_time)+interval '8 hours'; end if;
  if local_time::time>=time '18:00' then local_time:=date_trunc('day',local_time)+interval '1 day 8 hours'; end if;
  available:=date_trunc('day',local_time)+interval '18 hours'-local_time;
  if remaining<=available then return (local_time+remaining) at time zone 'Asia/Manila'; end if;
  remaining:=remaining-available;local_time:=date_trunc('day',local_time)+interval '1 day 8 hours';
 end loop;
end $$;

create function briah_private.assert_no_payment_hold(p_booking_id uuid,p_vehicle_id uuid,p_start timestamptz,p_end timestamptz)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text,0));
 if exists(select 1 from public.booking_payment_holds h join public.booking_requests b on b.id=h.booking_id
 where h.booking_id<>p_booking_id and h.vehicle_id=p_vehicle_id and b.booking_status='Submitted'
 and (h.state in ('Review','Verified') or (h.state in ('AwaitingPayment','Correction') and h.deadline_at>clock_timestamp()))
 and p_start<h.return_at and p_end>h.pickup_at) then raise exception 'vehicle_conflict'; end if;
end $$;

create function briah_private.record_payment_hold_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.booking_payment_hold_events(booking_id,actor_id,snapshot) values(new.booking_id,new.changed_by,to_jsonb(new));return new;
end $$;
create trigger payment_hold_history after insert or update on public.booking_payment_holds for each row execute function briah_private.record_payment_hold_event();

create function briah_private.open_quote_hold() returns trigger language plpgsql security definer set search_path='' as $$
declare b public.booking_requests; due timestamptz; existing public.booking_payment_holds;
begin
 if not exists(select 1 from briah_private.payment_hold_configuration where enabled) then return new; end if;
 -- Paid quotes may be updated by the approved same-price date-change flow.
 if exists(select 1 from public.payments where booking_id=new.booking_id and status='Verified') then return new; end if;
 if tg_op='UPDATE' and new.issued_at=old.issued_at then return new; end if;
 select * into b from public.booking_requests where id=new.booking_id for update;
 if b.booking_status<>'Submitted' then raise exception 'booking_not_submitted'; end if;
 if b.assigned_vehicle_id is not null and b.assigned_vehicle_id<>new.vehicle_id then raise exception 'quote_vehicle_mismatch'; end if;
 due:=nullif(current_setting('briah.payment_deadline',true),'')::timestamptz;
 if due is null then
  if b.pickup_at<=clock_timestamp()+interval '24 hours' then raise exception 'urgent_payment_deadline_required'; end if;
  due:=clock_timestamp()+interval '24 hours';
 end if;
 if due<=clock_timestamp() or due>=b.pickup_at then raise exception 'invalid_payment_deadline'; end if;
 perform public.assert_resolution_vehicle_available(b.id,new.vehicle_id,new.pickup_at,new.return_at);
 perform briah_private.assert_no_payment_hold(b.id,new.vehicle_id,new.pickup_at,new.return_at);
 insert into public.booking_payment_holds(booking_id,vehicle_id,customer_id,pickup_at,return_at,state,opened_at,deadline_at,changed_by,reason)
 values(b.id,new.vehicle_id,b.customer_id,new.pickup_at,new.return_at,'AwaitingPayment',clock_timestamp(),due,new.issued_by,'Final quote issued; availability checked.')
 on conflict(booking_id) do update set vehicle_id=excluded.vehicle_id,pickup_at=excluded.pickup_at,return_at=excluded.return_at,state=excluded.state,
 opened_at=excluded.opened_at,deadline_at=excluded.deadline_at,review_due_at=null,generation=public.booking_payment_holds.generation+1,
 correction_count=0,changed_at=clock_timestamp(),changed_by=excluded.changed_by,reason=excluded.reason;
 return new;
end $$;
create trigger quote_open_payment_hold after insert or update on public.booking_payment_quotes for each row execute function briah_private.open_quote_hold();

create function briah_private.issue_quote_with_hold(p_booking_id uuid,p_delivery_fee numeric,p_actor_id uuid,p_deadline timestamptz)
returns public.booking_payment_quotes language plpgsql security definer set search_path='' as $$
declare q public.booking_payment_quotes;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) then raise exception 'forbidden'; end if;
 if p_deadline is not null and exists(select 1 from public.booking_requests where id=p_booking_id and pickup_at>clock_timestamp()+interval '24 hours') then raise exception 'custom_deadline_only_for_urgent_booking'; end if;
 perform set_config('briah.payment_deadline',coalesce(p_deadline::text,''),true);
 q:=public.issue_booking_payment_quote(p_booking_id,p_delivery_fee,p_actor_id);
 perform set_config('briah.payment_deadline','',true);
 return q;
end $$;
create function public.issue_booking_payment_quote_with_hold(p_booking_id uuid,p_delivery_fee numeric,p_actor_id uuid,p_deadline timestamptz default null)
returns public.booking_payment_quotes language sql security invoker set search_path='' as $$ select briah_private.issue_quote_with_hold(p_booking_id,p_delivery_fee,p_actor_id,p_deadline) $$;

create function briah_private.payment_hold_transition() returns trigger language plpgsql security definer set search_path='' as $$
declare h public.booking_payment_holds; due timestamptz;
begin
 if new.status is not distinct from old.status then return new; end if;
 select * into h from public.booking_payment_holds where booking_id=new.booking_id for update;
 if not found then return new; end if; -- pre-policy quote, explicitly grandfathered
 if new.status='Pending Verification' then
  if h.state not in ('AwaitingPayment','Correction') or h.deadline_at<=clock_timestamp() then raise exception 'payment_hold_expired'; end if;
  if not exists(select 1 from public.booking_requests where id=new.booking_id and booking_status='Submitted') then raise exception 'booking_not_submitted'; end if;
  update public.booking_payment_holds set state='Review',review_due_at=briah_private.hold_business_deadline(clock_timestamp(),10),changed_at=clock_timestamp(),changed_by=new.customer_id,reason='Proof submitted before the payment deadline.' where booking_id=new.booking_id;
 elsif new.status='Needs Resubmission' then
  due:=briah_private.hold_business_deadline(clock_timestamp(),6);
  update public.booking_payment_holds set state=case when correction_count=0 then 'Correction' else 'Expired' end,
   opened_at=clock_timestamp(),deadline_at=due,review_due_at=null,correction_count=correction_count+1,
   generation=generation+1,changed_at=clock_timestamp(),changed_by=new.reviewed_by,
   reason=case when correction_count=0 then 'One six-business-hour correction window.' else 'Further correction requires owner extension and availability check.' end
  where booking_id=new.booking_id;
 elsif new.status='Verified' then
  update public.booking_payment_holds set state='Verified',review_due_at=null,changed_at=clock_timestamp(),changed_by=new.reviewed_by,reason='Payment verified; held until confirmation or owner resolution.' where booking_id=new.booking_id;
 end if;return new;
end $$;
create trigger payment_hold_transition before update of status on public.payments for each row execute function briah_private.payment_hold_transition();

create function briah_private.booking_hold_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.booking_status='Confirmed' then
  perform briah_private.assert_no_payment_hold(new.id,new.assigned_vehicle_id,new.pickup_at,new.return_at);
  update public.booking_payment_holds set state='Completed',changed_at=clock_timestamp(),reason='Booking confirmed.' where booking_id=new.id;
 elsif new.booking_status in ('Cancelled','Rejected','Withdrawn') then
  update public.booking_payment_holds set state='Released',changed_at=clock_timestamp(),reason='Booking closed by the existing booking workflow.' where booking_id=new.id;
 elsif tg_op='UPDATE' and (new.pickup_at,new.return_at,new.requested_vehicle_id,new.assigned_vehicle_id) is distinct from (old.pickup_at,old.return_at,old.requested_vehicle_id,old.assigned_vehicle_id)
 and exists(select 1 from public.booking_payment_holds where booking_id=new.id and state in ('AwaitingPayment','Correction','Review')) then
  raise exception 'active_payment_hold_locks_booking';
 end if;return new;
end $$;
create trigger booking_payment_hold_guard before insert or update on public.booking_requests for each row execute function briah_private.booking_hold_guard();

create function briah_private.extend_payment_hold(p_booking_id uuid,p_actor_id uuid,p_deadline timestamptz,p_reason text)
returns public.booking_payment_holds language plpgsql security definer set search_path='' as $$
declare b public.booking_requests; h public.booking_payment_holds;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' or (auth.uid() is not null and auth.uid()<>p_actor_id) or not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into b from public.booking_requests where id=p_booking_id for update;
 select * into h from public.booking_payment_holds where booking_id=p_booking_id for update;
 if not found or b.booking_status<>'Submitted' or h.state in ('Review','Verified','Completed','Released') then raise exception 'hold_not_extendable'; end if;
 if p_deadline is null or p_deadline<=greatest(clock_timestamp(),case when h.state<>'Expired' then h.deadline_at else clock_timestamp() end) or p_deadline>=b.pickup_at then raise exception 'invalid_payment_deadline'; end if;
 if length(trim(coalesce(p_reason,''))) not between 1 and 500 then raise exception 'reason_required'; end if;
 -- Recheck every extension, including expired holds. No price/payment mutation.
 perform public.assert_resolution_vehicle_available(b.id,h.vehicle_id,b.pickup_at,b.return_at);
 perform briah_private.assert_no_payment_hold(b.id,h.vehicle_id,b.pickup_at,b.return_at);
 update public.booking_payment_holds set state=case when exists(select 1 from public.payments where booking_id=b.id and status='Needs Resubmission') then 'Correction' else 'AwaitingPayment' end,
 opened_at=clock_timestamp(),deadline_at=p_deadline,generation=generation+1,changed_at=clock_timestamp(),changed_by=p_actor_id,reason=trim(p_reason) where booking_id=b.id returning * into h;
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 values(b.customer_id,'payment_hold_updated','Payment deadline updated','The owner updated your payment deadline. Open your booking for the exact deadline.','booking',b.id,'hold-updated:'||b.id||':'||h.generation) on conflict(recipient_id,event_key) do nothing;
 return h;
end $$;
create function public.extend_booking_payment_hold(p_booking_id uuid,p_actor_id uuid,p_deadline timestamptz,p_reason text)
returns public.booking_payment_holds language sql security invoker set search_path='' as $$ select briah_private.extend_payment_hold(p_booking_id,p_actor_id,p_deadline,p_reason) $$;

-- Extend only existing allowlists; preserve the other notification types.
do $$ declare c record; definition text; begin
 for c in select conname,conrelid,pg_get_constraintdef(oid) def from pg_constraint where contype='c' and conrelid in ('public.notifications'::regclass,'public.email_deliveries'::regclass) and (pg_get_constraintdef(oid) like '%notification_type%' or pg_get_constraintdef(oid) like '%email_type%') loop
  definition:=replace(c.def,'''quote_issued''::text','''quote_issued''::text, ''payment_due_reminder''::text, ''payment_hold_expired''::text, ''payment_hold_updated''::text, ''payment_review_overdue''::text');
  execute format('alter table %s drop constraint %I',c.conrelid::regclass,c.conname);
  execute format('alter table %s add constraint %I %s',c.conrelid::regclass,c.conname,definition);
 end loop;
end $$;

create function briah_private.process_payment_holds() returns integer language plpgsql security definer set search_path='' as $$
declare h public.booking_payment_holds; phase text; added integer:=0; affected integer;
begin
 if coalesce(auth.role(),current_setting('role',true),'')<>'service_role' then raise exception 'forbidden'; end if;
 for h in select x.* from public.booking_payment_holds x join public.booking_requests b on b.id=x.booking_id where b.booking_status='Submitted' and x.state in ('AwaitingPayment','Correction','Review') for update of x skip locked loop
  phase:=null;
  if h.state='Review' then
   if h.review_due_at<=clock_timestamp() then
    insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
    select id,'payment_review_overdue','Payment review overdue','Review the submitted payment proof. The vehicle remains held; do not release it because review is delayed.','booking',h.booking_id,'hold-review-overdue:'||h.booking_id||':'||h.generation from public.profiles where user_type='Owner/Admin' and account_status='Active' on conflict(recipient_id,event_key) do nothing;
    get diagnostics affected=row_count;added:=added+affected;
   end if;
  elsif h.deadline_at<=clock_timestamp() then
   update public.booking_payment_holds set state='Expired',changed_at=clock_timestamp(),changed_by=null,reason='Payment window expired; booking and payment history retained.' where booking_id=h.booking_id;
   phase:='expired';
  elsif h.deadline_at-clock_timestamp()<=interval '2 hours' then phase:='2h';
  elsif clock_timestamp()>=h.opened_at+(h.deadline_at-h.opened_at)/2 then phase:='half';
  end if;
  if phase is not null then
   insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
   values(h.customer_id,case when phase='expired' then 'payment_hold_expired' else 'payment_due_reminder' end,
   case when phase='expired' then 'Payment window ended' else 'Payment deadline approaching' end,
   case when phase='expired' then 'Your temporary vehicle hold ended. Your request remains saved. Contact the team to recheck availability before paying.' else 'Open your booking to check the exact payment deadline. Submit payment proof before that deadline to keep the vehicle held during review.' end,
   'booking',h.booking_id,'hold:'||h.booking_id||':'||h.generation||':'||phase) on conflict(recipient_id,event_key) do nothing;
   get diagnostics affected=row_count;added:=added+affected;
  end if;
 end loop;return added;
end $$;
create function public.process_booking_payment_holds() returns integer language sql security invoker set search_path='' as $$ select briah_private.process_payment_holds() $$;

-- No browser role can invoke hold mutations or privileged trigger helpers.
revoke all on function briah_private.hold_business_deadline(timestamptz,integer) from public,anon,authenticated,service_role;
revoke all on function briah_private.assert_no_payment_hold(uuid,uuid,timestamptz,timestamptz) from public,anon,authenticated,service_role;
revoke all on function briah_private.record_payment_hold_event() from public,anon,authenticated,service_role;
revoke all on function briah_private.open_quote_hold() from public,anon,authenticated,service_role;
revoke all on function briah_private.payment_hold_transition() from public,anon,authenticated,service_role;
revoke all on function briah_private.booking_hold_guard() from public,anon,authenticated,service_role;
revoke all on function briah_private.issue_quote_with_hold(uuid,numeric,uuid,timestamptz) from public,anon,authenticated,service_role;
revoke all on function briah_private.extend_payment_hold(uuid,uuid,timestamptz,text) from public,anon,authenticated,service_role;
revoke all on function briah_private.process_payment_holds() from public,anon,authenticated,service_role;
grant execute on function briah_private.issue_quote_with_hold(uuid,numeric,uuid,timestamptz) to service_role;
grant execute on function briah_private.extend_payment_hold(uuid,uuid,timestamptz,text) to service_role;
grant execute on function briah_private.process_payment_holds() to service_role;
revoke all on function public.issue_booking_payment_quote_with_hold(uuid,numeric,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.issue_booking_payment_quote_with_hold(uuid,numeric,uuid,timestamptz) to service_role;
revoke all on function public.extend_booking_payment_hold(uuid,uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.extend_booking_payment_hold(uuid,uuid,timestamptz,text) to service_role;
revoke all on function public.process_booking_payment_holds() from public,anon,authenticated;
grant execute on function public.process_booking_payment_holds() to service_role;
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
  perform briah_private.assert_no_payment_hold(b.id,p_vehicle_id,b.pickup_at,b.return_at);
  if exists (select 1 from booking_requests x where x.id <> b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=p_vehicle_id and b.pickup_at < x.return_at and b.return_at > x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  if p_vehicle_id <> b.requested_vehicle_id and (not p_substitution_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'substitution_ack_required'; end if;
  if v.branch_id <> b.pickup_branch_id and (not p_cross_branch_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'cross_branch_ack_required'; end if;
  update booking_requests set assigned_vehicle_id=p_vehicle_id, assigned_by=p_actor_id, assigned_at=timezone('utc',now()), assignment_note=nullif(trim(p_assignment_note),''), substitution_acknowledged=(p_vehicle_id=b.requested_vehicle_id or p_substitution_acknowledged), cross_branch_acknowledged=(v.branch_id=b.pickup_branch_id or p_cross_branch_acknowledged) where id=b.id returning * into result;
  return result;
end; $function$
;
CREATE OR REPLACE FUNCTION public.confirm_booking_atomic(p_booking_id uuid, p_actor_id uuid, p_expected_vehicle_id uuid DEFAULT NULL::uuid, p_expected_assigned_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  b public.booking_requests;
  v public.vehicles;
  result public.booking_requests;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and user_type = 'Owner/Admin'
      and account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;
  select * into b from public.booking_requests where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  if b.pickup_delivery_option = 'pickup' and (nullif(trim(b.pickup_meeting_address), '') is null or nullif(trim(b.return_meeting_address), '') is null or nullif(trim(b.pickup_meeting_instructions), '') is null or nullif(trim(b.return_meeting_instructions), '') is null) then raise exception 'pickup_arrangement_required'; end if;
  if b.pickup_at <= timezone('utc', now()) then raise exception 'pickup_window_elapsed'; end if;
  if b.assigned_vehicle_id is null then raise exception 'assignment_required'; end if;
  if p_expected_vehicle_id is null or p_expected_assigned_at is null then
    raise exception 'assignment_expectation_required';
  end if;
  if b.assigned_vehicle_id is distinct from p_expected_vehicle_id
    or b.assigned_at is distinct from p_expected_assigned_at then
    raise exception 'stale_assignment';
  end if;
  if not exists (
    select 1 from public.renter_requirement_sets
    where booking_id = b.id and status = 'Verified'
  ) then raise exception 'requirements_not_verified'; end if;
  if not exists (
    select 1 from public.payments
    where booking_id = b.id and status = 'Verified'
  ) then raise exception 'payment_not_verified'; end if;

  select * into v from public.vehicles where id = b.assigned_vehicle_id;
  perform public.assert_vehicle_rental_ready(b.assigned_vehicle_id);
  perform pg_advisory_xact_lock(hashtextextended(b.assigned_vehicle_id::text, 0));
  perform briah_private.assert_no_payment_hold(b.id,b.assigned_vehicle_id,b.pickup_at,b.return_at);
  if exists (
    select 1 from public.booking_requests x
    where x.id <> b.id
      and x.booking_status = 'Confirmed'
      and x.assigned_vehicle_id = b.assigned_vehicle_id
      and b.pickup_at < x.return_at
      and b.return_at > x.pickup_at
  ) then raise exception 'vehicle_conflict'; end if;
  if b.assigned_vehicle_id <> b.requested_vehicle_id
    and (not b.substitution_acknowledged
      or nullif(trim(coalesce(b.assignment_note, '')), '') is null) then
    raise exception 'substitution_ack_required';
  end if;
  if v.branch_id <> b.pickup_branch_id
    and (not b.cross_branch_acknowledged
      or nullif(trim(coalesce(b.assignment_note, '')), '') is null) then
    raise exception 'cross_branch_ack_required';
  end if;

  update public.booking_requests
  set booking_status = 'Confirmed',
      confirmed_by = p_actor_id,
      confirmed_at = timezone('utc', now()),
      confirmation_exception_code = null,
      confirmation_exception_message = null,
      confirmation_exception_at = null
  where id = b.id
  returning * into result;
  return result;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.assert_resolution_vehicle_available(p_booking_id uuid, p_vehicle_id uuid, p_pickup_at timestamp with time zone, p_return_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text,0));
 perform 1 from public.vehicles where id=p_vehicle_id for update;
 perform public.assert_vehicle_rental_ready(p_vehicle_id);
 perform briah_private.assert_no_payment_hold(p_booking_id,p_vehicle_id,p_pickup_at,p_return_at);
 if exists(select 1 from public.rental_transactions where vehicle_id=p_vehicle_id and ended_at is null) then raise exception 'vehicle_already_rented'; end if;
 if exists(select 1 from public.booking_requests where id<>p_booking_id and booking_status='Confirmed' and assigned_vehicle_id=p_vehicle_id and p_pickup_at<return_at and p_return_at>pickup_at) then raise exception 'vehicle_conflict'; end if;
 if exists(select 1 from (select distinct on(coalesce(nullif(trim(maintenance_type),''),'__uncategorized__')) next_service_date from public.maintenance_records where vehicle_id=p_vehicle_id and status='Completed' and next_service_date is not null order by coalesce(nullif(trim(maintenance_type),''),'__uncategorized__'),completed_at desc,created_at desc) due where due.next_service_date<=((p_return_at-interval '1 microsecond') at time zone 'Asia/Manila')::date) then raise exception 'vehicle_maintenance_unready'; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.review_booking_date_change(p_request_id uuid, p_actor_id uuid, p_action text, p_reason text)
 RETURNS booking_date_change_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.booking_date_change_requests; b public.booking_requests; v_id uuid; result public.booking_date_change_requests;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select booking_id into v_id from public.booking_date_change_requests where id=p_request_id;
 select * into b from public.booking_requests where id=v_id for update;
 select * into r from public.booking_date_change_requests where id=p_request_id for update;
 if not found or r.status<>'Pending' then raise exception 'request_not_pending'; end if;
 if p_action not in ('approve','reject') then raise exception 'invalid_action'; end if;
 if p_action='reject' then
       if public.booking_category_code('reschedule_decline',trim(p_reason)) is null
          or length(p_reason)>500
          or (public.booking_category_code('reschedule_decline',trim(p_reason))='reschedule_decline.other'
              and length(trim(substring(trim(p_reason) from length('Other reschedule decline reason')+4)))=0)
       then raise exception 'reason_required'; end if;
     end if;
 if p_action='approve' then
  if b.booking_status not in ('Submitted','Confirmed') or b.pickup_at<=now() or r.requested_pickup_at<=now() or exists(select 1 from public.rental_transactions where booking_id=b.id) then raise exception 'date_change_unavailable'; end if;
  if b.pickup_at<>r.original_pickup_at or b.return_at<>r.original_return_at then raise exception 'stale_dates'; end if;
  v_id:=coalesce(b.assigned_vehicle_id,b.requested_vehicle_id);
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  perform 1 from public.vehicles where id=v_id for update;
  perform public.assert_vehicle_rental_ready(v_id);
  perform briah_private.assert_no_payment_hold(b.id,v_id,r.requested_pickup_at,r.requested_return_at);
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
end; $function$
;
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.notification_type not in (
    'quote_issued', 'payment_due_reminder', 'payment_hold_expired', 'payment_hold_updated', 'payment_review_overdue',
    'booking_cancelled',
    'booking_rejected',
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
      and (profile.user_type = 'Customer/Renter' or (new.notification_type='payment_review_overdue' and profile.user_type='Owner/Admin'))
      and profile.account_status = 'Active'
      and coalesce(preference.email_notifications_enabled, true)
    on conflict (delivery_key) do nothing;
  exception when others then
    null;
  end;

  return new;
end;
$function$;


CREATE OR REPLACE FUNCTION public.reconcile_vehicle_location_atomic(p_vehicle_id uuid, p_actor_id uuid, p_branch_id uuid, p_acknowledge_impacts boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  perform briah_private.assert_no_payment_hold('00000000-0000-0000-0000-000000000000'::uuid,p_vehicle_id,'-infinity'::timestamptz,'infinity'::timestamptz);
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
$function$
;
