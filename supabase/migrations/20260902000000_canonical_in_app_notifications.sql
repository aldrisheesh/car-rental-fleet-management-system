-- VS019: recipient-specific, event-driven in-app notifications.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete restrict,
  notification_type text not null check (notification_type in (
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'new_booking_request',
    'requirements_submitted',
    'payment_proof_submitted'
  )),
  title text not null check (nullif(trim(title), '') is not null),
  message text not null check (nullif(trim(message), '') is not null),
  related_entity_type text not null check (related_entity_type in ('booking', 'requirements', 'payment')),
  related_entity_id uuid not null,
  event_key text not null check (nullif(trim(event_key), '') is not null),
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz,
  unique (recipient_id, event_key)
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc, id desc);
create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create policy notifications_own_select on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create function public.protect_notification_content()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.recipient_id is distinct from old.recipient_id
    or new.notification_type is distinct from old.notification_type
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.related_entity_type is distinct from old.related_entity_type
    or new.related_entity_id is distinct from old.related_entity_id
    or new.event_key is distinct from old.event_key
    or new.created_at is distinct from old.created_at
  then
    raise exception 'notification_content_immutable';
  end if;
  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'notification_already_read';
  end if;
  return new;
end;
$$;

create trigger notifications_protect_content
before update on public.notifications
for each row execute function public.protect_notification_content();

create function public.notify_active_owner_admins(
  p_notification_type text,
  p_title text,
  p_message text,
  p_related_entity_type text,
  p_related_entity_id uuid,
  p_event_key text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (
    recipient_id,
    notification_type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    event_key
  )
  select
    profile.id,
    p_notification_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_event_key
  from public.profiles profile
  where profile.user_type = 'Owner/Admin'
    and profile.account_status = 'Active'
  on conflict (recipient_id, event_key) do nothing;
$$;

create function public.notify_new_booking_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_active_owner_admins(
    'new_booking_request',
    'New booking request',
    'A new booking request is ready for review.',
    'booking',
    new.id,
    'booking-created:' || new.id::text
  );
  return new;
end;
$$;

create trigger booking_requests_notify_created
after insert on public.booking_requests
for each row execute function public.notify_new_booking_request();

create function public.notify_requirement_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Pending Review'
    and old.status in ('Not Submitted', 'Needs Resubmission')
    and new.submitted_at is not null
  then
    perform public.notify_active_owner_admins(
      'requirements_submitted',
      'Requirements ready for review',
      'Customer requirements were submitted and are ready for review.',
      'requirements',
      new.id,
      'requirements-submitted:' || new.id::text || ':' || new.submitted_at::text
    );
  end if;
  return new;
end;
$$;

create trigger renter_requirement_sets_notify_submitted
after update on public.renter_requirement_sets
for each row execute function public.notify_requirement_transition();

create function public.notify_requirement_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.renter_requirement_sets;
begin
  if new.resulting_status not in ('Needs Resubmission', 'Verified') then
    return new;
  end if;

  select * into strict v_set
  from public.renter_requirement_sets
  where id = new.requirement_set_id;

  insert into public.notifications (
    recipient_id,
    notification_type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    event_key
  ) values (
    v_set.customer_id,
    case new.resulting_status
      when 'Needs Resubmission' then 'requirements_needs_resubmission'
      else 'requirements_verified'
    end,
    case new.resulting_status
      when 'Needs Resubmission' then 'Requirements need an update'
      else 'Requirements verified'
    end,
    case new.resulting_status
      when 'Needs Resubmission' then 'Review the requested requirement corrections and resubmit the required documents.'
      else 'Your requirements were verified. You can proceed to the payment step.'
    end,
    'requirements',
    v_set.id,
    'requirements-review:' || new.id::text
  )
  on conflict (recipient_id, event_key) do nothing;
  return new;
end;
$$;

create trigger renter_requirement_reviews_notify_result
after insert on public.renter_requirement_reviews
for each row execute function public.notify_requirement_review();

create function public.notify_payment_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proof_id uuid;
begin
  if new.status = 'Pending Verification'
    and old.status in ('Not Submitted', 'Needs Resubmission')
    and new.submitted_at is not null
  then
    select proof.id into strict v_proof_id
    from public.payment_proofs proof
    where proof.payment_id = new.id and proof.is_current;

    perform public.notify_active_owner_admins(
      'payment_proof_submitted',
      'Payment proof ready for verification',
      'A customer payment proof was submitted and is ready for verification.',
      'payment',
      new.id,
      'payment-proof-submitted:' || v_proof_id::text
    );
  elsif old.status = 'Pending Verification'
    and new.status in ('Needs Resubmission', 'Verified')
  then
    select proof.id into strict v_proof_id
    from public.payment_proofs proof
    where proof.payment_id = new.id and proof.is_current;

    insert into public.notifications (
      recipient_id,
      notification_type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      event_key
    ) values (
      new.customer_id,
      case new.status
        when 'Needs Resubmission' then 'payment_needs_resubmission'
        else 'payment_verified'
      end,
      case new.status
        when 'Needs Resubmission' then 'Payment proof needs an update'
        else 'Payment verified'
      end,
      case new.status
        when 'Needs Resubmission' then 'Review the payment correction information and submit a new proof.'
        else 'Your payment was verified. Booking confirmation is a separate step.'
      end,
      'payment',
      new.id,
      'payment-review:' || v_proof_id::text || ':' || new.status
    )
    on conflict (recipient_id, event_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger payments_notify_transition
after update on public.payments
for each row execute function public.notify_payment_transition();

create function public.submit_payment_proof_atomic(
  p_booking_id uuid,
  p_customer_id uuid,
  p_payment_method_id uuid,
  p_submitted_amount numeric,
  p_transaction_reference text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_proof public.payment_proofs;
  v_method public.payment_methods;
  v_version integer;
begin
  if not exists (
    select 1 from public.profiles profile
    where profile.id = p_customer_id
      and profile.user_type = 'Customer/Renter'
      and profile.account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;
  if not exists (
    select 1 from public.booking_requests booking
    where booking.id = p_booking_id and booking.customer_id = p_customer_id
  ) then
    raise exception 'booking_not_found';
  end if;
  if not exists (
    select 1 from public.renter_requirement_sets requirement_set
    where requirement_set.booking_id = p_booking_id
      and requirement_set.customer_id = p_customer_id
      and requirement_set.status = 'Verified'
  ) then
    raise exception 'requirements_not_verified';
  end if;
  if p_submitted_amount is null or p_submitted_amount <= 0
    or nullif(trim(coalesce(p_transaction_reference, '')), '') is null
  then
    raise exception 'invalid_submission';
  end if;

  select * into v_method
  from public.payment_methods
  where id = p_payment_method_id and is_active;
  if not found then raise exception 'invalid_payment_method'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_payment
  from public.payments
  where booking_id = p_booking_id
  for update;

  if not found then
    insert into public.payments (booking_id, customer_id, payment_method_label)
    values (p_booking_id, p_customer_id, '')
    returning * into v_payment;
  end if;
  if v_payment.customer_id <> p_customer_id then raise exception 'forbidden'; end if;
  if v_payment.status not in ('Not Submitted', 'Needs Resubmission') then
    raise exception 'not_submittable';
  end if;

  select coalesce(max(proof.version), 0) + 1 into v_version
  from public.payment_proofs proof
  where proof.payment_id = v_payment.id;

  update public.payment_proofs
  set is_current = false, superseded_at = timezone('utc', now())
  where payment_id = v_payment.id and is_current;

  insert into public.payment_proofs (
    payment_id,
    booking_id,
    customer_id,
    storage_path,
    original_filename,
    mime_type,
    size_bytes,
    version
  ) values (
    v_payment.id,
    p_booking_id,
    p_customer_id,
    p_storage_path,
    p_original_filename,
    p_mime_type,
    p_size_bytes,
    v_version
  )
  returning * into v_proof;

  update public.payments
  set payment_method_id = v_method.id,
      payment_method_label = v_method.label,
      submitted_amount = p_submitted_amount,
      transaction_reference = trim(p_transaction_reference),
      status = 'Pending Verification',
      submitted_at = timezone('utc', now()),
      resubmission_reason = null,
      reviewed_by = null,
      reviewed_at = null,
      reviewed_proof_version = null,
      reviewed_submitted_amount = null,
      reviewed_transaction_reference = null
  where id = v_payment.id
  returning * into v_payment;

  return jsonb_build_object('payment', to_jsonb(v_payment), 'proof', to_jsonb(v_proof));
end;
$$;

create function public.notify_booking_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.booking_status = 'Submitted' and new.booking_status = 'Confirmed' then
    insert into public.notifications (
      recipient_id,
      notification_type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      event_key
    ) values (
      new.customer_id,
      'booking_confirmed',
      'Booking confirmed',
      'Your booking was confirmed. Review your booking details for the next steps.',
      'booking',
      new.id,
      'booking-confirmed:' || new.id::text
    )
    on conflict (recipient_id, event_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger booking_requests_notify_confirmed
after update on public.booking_requests
for each row execute function public.notify_booking_confirmation();

revoke all on function public.protect_notification_content() from public, anon, authenticated;
revoke all on function public.notify_active_owner_admins(text,text,text,text,uuid,text) from public, anon, authenticated;
revoke all on function public.notify_new_booking_request() from public, anon, authenticated;
revoke all on function public.notify_requirement_transition() from public, anon, authenticated;
revoke all on function public.notify_requirement_review() from public, anon, authenticated;
revoke all on function public.notify_payment_transition() from public, anon, authenticated;
revoke all on function public.notify_booking_confirmation() from public, anon, authenticated;
revoke all on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint) from public, anon, authenticated;
grant execute on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint) to service_role;
