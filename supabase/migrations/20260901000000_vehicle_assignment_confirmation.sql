-- VS009: Owner/Admin vehicle assignment and transactional booking confirmation.
alter table public.booking_requests drop constraint if exists booking_requests_booking_status_check;
alter table public.booking_requests add constraint booking_requests_booking_status_check
  check (booking_status in ('Submitted','Confirmed','Rejected','Cancelled'));

alter table public.booking_requests
  add column if not exists assigned_by uuid references public.profiles(id) on delete restrict,
  add column if not exists assigned_at timestamptz,
  add column if not exists assignment_note text,
  add column if not exists substitution_acknowledged boolean not null default false,
  add column if not exists cross_branch_acknowledged boolean not null default false,
  add column if not exists confirmed_by uuid references public.profiles(id) on delete restrict,
  add column if not exists confirmed_at timestamptz;

create or replace function public.assign_booking_vehicle(
  p_booking_id uuid, p_vehicle_id uuid, p_actor_id uuid,
  p_assignment_note text default null,
  p_substitution_acknowledged boolean default false,
  p_cross_branch_acknowledged boolean default false
) returns public.booking_requests
language plpgsql security definer set search_path=public as $$
declare b public.booking_requests; v public.vehicles; result public.booking_requests;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into b from booking_requests where id=p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  select * into v from vehicles where id=p_vehicle_id;
  if not found or not v.is_active then raise exception 'vehicle_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_vehicle_id::text, 0));
  if exists (select 1 from booking_requests x where x.id <> b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=p_vehicle_id and b.pickup_at < x.return_at and b.return_at > x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  if p_vehicle_id <> b.requested_vehicle_id and (not p_substitution_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'substitution_ack_required'; end if;
  if v.branch_id <> b.pickup_branch_id and (not p_cross_branch_acknowledged or nullif(trim(coalesce(p_assignment_note,'')),'') is null) then raise exception 'cross_branch_ack_required'; end if;
  update booking_requests set assigned_vehicle_id=p_vehicle_id, assigned_by=p_actor_id, assigned_at=timezone('utc',now()), assignment_note=nullif(trim(p_assignment_note),''), substitution_acknowledged=(p_vehicle_id=b.requested_vehicle_id or p_substitution_acknowledged), cross_branch_acknowledged=(v.branch_id=b.pickup_branch_id or p_cross_branch_acknowledged) where id=b.id returning * into result;
  return result;
end; $$;
revoke all on function public.assign_booking_vehicle(uuid,uuid,uuid,text,boolean,boolean) from public,anon,authenticated;

create or replace function public.confirm_booking_atomic(
  p_booking_id uuid, p_actor_id uuid, p_expected_vehicle_id uuid default null,
  p_expected_assigned_at timestamptz default null
) returns public.booking_requests
language plpgsql security definer set search_path=public as $$
declare b public.booking_requests; v public.vehicles; result public.booking_requests;
begin
  if not exists (select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into b from booking_requests where id=p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  if p_expected_vehicle_id is not null and b.assigned_vehicle_id is distinct from p_expected_vehicle_id then raise exception 'stale_assignment'; end if;
  if p_expected_assigned_at is not null and b.assigned_at is distinct from p_expected_assigned_at then raise exception 'stale_assignment'; end if;
  if b.assigned_vehicle_id is null then raise exception 'assignment_required'; end if;
  if not exists (select 1 from renter_requirement_sets where booking_id=b.id and status='Verified') then raise exception 'requirements_not_verified'; end if;
  if not exists (select 1 from payments where booking_id=b.id and status='Verified') then raise exception 'payment_not_verified'; end if;
  select * into v from vehicles where id=b.assigned_vehicle_id;
  if not found or not v.is_active then raise exception 'vehicle_unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(b.assigned_vehicle_id::text, 0));
  if exists (select 1 from booking_requests x where x.id <> b.id and x.booking_status='Confirmed' and x.assigned_vehicle_id=b.assigned_vehicle_id and b.pickup_at < x.return_at and b.return_at > x.pickup_at) then raise exception 'vehicle_conflict'; end if;
  if b.assigned_vehicle_id <> b.requested_vehicle_id and (not b.substitution_acknowledged or nullif(trim(coalesce(b.assignment_note,'')),'') is null) then raise exception 'substitution_ack_required'; end if;
  if v.branch_id <> b.pickup_branch_id and (not b.cross_branch_acknowledged or nullif(trim(coalesce(b.assignment_note,'')),'') is null) then raise exception 'cross_branch_ack_required'; end if;
  update booking_requests set booking_status='Confirmed', confirmed_by=p_actor_id, confirmed_at=timezone('utc',now()) where id=b.id returning * into result;
  return result;
end; $$;
revoke all on function public.confirm_booking_atomic(uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
