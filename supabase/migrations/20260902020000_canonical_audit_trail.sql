-- VS021: append-only semantic audit trail for canonical lifecycle mutations.
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('User', 'System')),
  actor_user_id uuid references public.profiles(id) on delete restrict,
  action text not null check (action in (
    'booking.created',
    'booking.vehicle_assigned',
    'booking.confirmed',
    'requirements.submitted',
    'requirements.resubmitted',
    'requirements.needs_resubmission',
    'requirements.verified',
    'payment.submitted',
    'payment.resubmitted',
    'payment.needs_resubmission',
    'payment.verified',
    'rental.released',
    'rental.returned',
    'maintenance.created',
    'maintenance.completed',
    'maintenance.cancelled'
  )),
  entity_type text not null check (entity_type in (
    'booking', 'requirements', 'payment', 'rental', 'maintenance'
  )),
  entity_id uuid not null,
  booking_id uuid references public.booking_requests(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default timezone('utc', now()),
  constraint audit_events_actor_integrity check (
    (actor_type = 'User' and actor_user_id is not null)
    or (actor_type = 'System' and actor_user_id is null)
  )
);

create index audit_events_occurred_at_idx
  on public.audit_events (occurred_at desc, id desc);
create index audit_events_entity_idx
  on public.audit_events (entity_type, occurred_at desc);
create index audit_events_actor_idx
  on public.audit_events (actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index audit_events_booking_idx
  on public.audit_events (booking_id, occurred_at desc)
  where booking_id is not null;

alter table public.audit_events enable row level security;
revoke all on public.audit_events from public, anon, authenticated;
revoke insert, update, delete on public.audit_events from service_role;
grant select on public.audit_events to authenticated;
grant select on public.audit_events to service_role;

create policy audit_events_owner_admin_read
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  )
);

create function public.reject_audit_event_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'audit_events_append_only';
end;
$$;

create trigger audit_events_append_only_guard
before update or delete on public.audit_events
for each row execute function public.reject_audit_event_mutation();

create function public.append_user_audit_event(
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_booking_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_actor_user_id and profile.account_status = 'Active'
  ) then
    raise exception 'invalid_audit_actor';
  end if;
  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_audit_metadata';
  end if;

  insert into public.audit_events (
    actor_type, actor_user_id, action, entity_type, entity_id, booking_id, metadata
  ) values (
    'User', p_actor_user_id, p_action, p_entity_type, p_entity_id,
    p_booking_id, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.reject_audit_event_mutation() from public, anon, authenticated, service_role;
revoke all on function public.append_user_audit_event(uuid,text,text,uuid,uuid,jsonb) from public, anon, authenticated, service_role;

create function public.audit_booking_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.append_user_audit_event(
      new.customer_id, 'booking.created', 'booking', new.id, new.id, '{}'::jsonb
    );
    return new;
  end if;

  if new.assigned_at is distinct from old.assigned_at
    and new.assigned_vehicle_id is not null
  then
    perform public.append_user_audit_event(
      new.assigned_by,
      'booking.vehicle_assigned',
      'booking',
      new.id,
      new.id,
      jsonb_build_object(
        'previous_assigned_vehicle_id', old.assigned_vehicle_id,
        'assigned_vehicle_id', new.assigned_vehicle_id,
        'requested_vehicle_id', new.requested_vehicle_id
      )
    );
  end if;

  if old.booking_status = 'Submitted' and new.booking_status = 'Confirmed' then
    perform public.append_user_audit_event(
      new.confirmed_by,
      'booking.confirmed',
      'booking',
      new.id,
      new.id,
      jsonb_build_object(
        'previous_status', old.booking_status,
        'new_status', new.booking_status
      )
    );
  end if;

  return new;
end;
$$;

create trigger booking_requests_audit_lifecycle
after insert or update on public.booking_requests
for each row execute function public.audit_booking_lifecycle();

create function public.audit_requirement_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_id uuid;
begin
  if old.status = 'Not Submitted' and new.status = 'Pending Review' then
    perform public.append_user_audit_event(
      new.customer_id,
      'requirements.submitted',
      'requirements',
      new.id,
      new.booking_id,
      jsonb_build_object('previous_status', old.status, 'new_status', new.status)
    );
  elsif old.status = 'Needs Resubmission' and new.status = 'Pending Review' then
    perform public.append_user_audit_event(
      new.customer_id,
      'requirements.resubmitted',
      'requirements',
      new.id,
      new.booking_id,
      jsonb_build_object('previous_status', old.status, 'new_status', new.status)
    );
  elsif old.status = 'Pending Review'
    and new.status in ('Needs Resubmission', 'Verified')
  then
    select review.reviewer_id into v_reviewer_id
    from public.renter_requirement_reviews review
    where review.requirement_set_id = new.id
      and review.resulting_status = new.status
    order by review.reviewed_at desc, review.id desc
    limit 1;

    if v_reviewer_id is null then raise exception 'missing_requirement_reviewer'; end if;
    perform public.append_user_audit_event(
      v_reviewer_id,
      case new.status
        when 'Needs Resubmission' then 'requirements.needs_resubmission'
        else 'requirements.verified'
      end,
      'requirements',
      new.id,
      new.booking_id,
      jsonb_build_object(
        'previous_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

create trigger renter_requirement_sets_audit_lifecycle
after update on public.renter_requirement_sets
for each row execute function public.audit_requirement_lifecycle();

create function public.audit_payment_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('Not Submitted', 'Needs Resubmission')
    and new.status = 'Pending Verification'
  then
    perform public.append_user_audit_event(
      new.customer_id,
      case old.status
        when 'Not Submitted' then 'payment.submitted'
        else 'payment.resubmitted'
      end,
      'payment',
      new.id,
      new.booking_id,
      jsonb_build_object('previous_status', old.status, 'new_status', new.status)
    );
  elsif old.status = 'Pending Verification'
    and new.status in ('Needs Resubmission', 'Verified')
  then
    perform public.append_user_audit_event(
      new.reviewed_by,
      case new.status
        when 'Needs Resubmission' then 'payment.needs_resubmission'
        else 'payment.verified'
      end,
      'payment',
      new.id,
      new.booking_id,
      jsonb_build_object('previous_status', old.status, 'new_status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger payments_audit_lifecycle
after update on public.payments
for each row execute function public.audit_payment_lifecycle();

create function public.audit_rental_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.append_user_audit_event(
      new.released_by,
      'rental.released',
      'rental',
      new.id,
      new.booking_id,
      jsonb_strip_nulls(jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'scheduled_return_at', new.scheduled_return_at,
        'release_odometer', new.release_odometer
      ))
    );
  elsif old.ended_at is null and new.ended_at is not null then
    perform public.append_user_audit_event(
      new.returned_by,
      'rental.returned',
      'rental',
      new.id,
      new.booking_id,
      jsonb_strip_nulls(jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'return_odometer', new.return_odometer,
        'returned_at', new.ended_at
      ))
    );
  end if;
  return new;
end;
$$;

create trigger rental_transactions_audit_lifecycle
after insert or update on public.rental_transactions
for each row execute function public.audit_rental_lifecycle();

create function public.audit_maintenance_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.append_user_audit_event(
      new.created_by,
      'maintenance.created',
      'maintenance',
      new.id,
      null,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'maintenance_type', new.maintenance_type,
        'status', new.status
      )
    );
  elsif old.status = 'Open' and new.status in ('Completed', 'Cancelled') then
    perform public.append_user_audit_event(
      new.updated_by,
      case new.status
        when 'Completed' then 'maintenance.completed'
        else 'maintenance.cancelled'
      end,
      'maintenance',
      new.id,
      null,
      jsonb_build_object(
        'vehicle_id', new.vehicle_id,
        'maintenance_type', new.maintenance_type,
        'previous_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

create trigger maintenance_records_audit_lifecycle
after insert or update on public.maintenance_records
for each row execute function public.audit_maintenance_lifecycle();

revoke all on function public.audit_booking_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.audit_requirement_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.audit_payment_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.audit_rental_lifecycle() from public, anon, authenticated, service_role;
revoke all on function public.audit_maintenance_lifecycle() from public, anon, authenticated, service_role;
