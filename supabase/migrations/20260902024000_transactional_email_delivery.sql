-- VS029: durable, provider-neutral application transactional email outbox.
alter table public.notification_preferences
  add column email_notifications_enabled boolean not null default true;

grant insert (
  recipient_id,
  maintenance_attention_enabled,
  low_availability_enabled,
  email_notifications_enabled
) on public.notification_preferences to authenticated;
grant update (
  maintenance_attention_enabled,
  low_availability_enabled,
  email_notifications_enabled
) on public.notification_preferences to authenticated;
grant select, insert, update on public.notification_preferences to service_role;

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles (id) on delete restrict,
  notification_id uuid not null references public.notifications (id) on delete restrict,
  delivery_key text not null unique check (nullif(trim(delivery_key), '') is not null),
  email_type text not null check (email_type in (
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'upcoming_pickup',
    'upcoming_return',
    'rental_overdue'
  )),
  status text not null default 'Pending' check (status in (
    'Pending', 'Processing', 'Sent', 'Failed', 'Skipped'
  )),
  attempt_count integer not null default 0 check (attempt_count between 0 and 4),
  provider_message_id text,
  last_error_code text check (last_error_code in (
    'ConfigurationError',
    'RecipientUnavailable',
    'RecipientInvalid',
    'PreferenceDisabled',
    'RateLimited',
    'ProviderUnavailable',
    'ProviderRejected',
    'NetworkError',
    'UnknownProviderError'
  )),
  next_attempt_at timestamptz default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  unique (notification_id)
);

create index email_deliveries_pending_idx
  on public.email_deliveries (next_attempt_at, created_at)
  where status in ('Pending', 'Failed', 'Processing') and attempt_count < 4;

alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from public, anon, authenticated;
grant select, insert, update on public.email_deliveries to service_role;

create function public.enqueue_transactional_email_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.notification_type not in (
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
$$;

create trigger notifications_enqueue_transactional_email
after insert on public.notifications
for each row execute function public.enqueue_transactional_email_delivery();

revoke all on function public.enqueue_transactional_email_delivery()
from public, anon, authenticated;

create function public.claim_email_deliveries(
  p_limit integer,
  p_now timestamptz
)
returns table (
  id uuid,
  recipient_user_id uuid,
  notification_id uuid,
  email_type text,
  attempt_count integer,
  recipient_email text,
  recipient_name text,
  email_notifications_enabled boolean,
  related_entity_type text,
  related_entity_id uuid,
  scheduled_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select delivery.id
    from public.email_deliveries delivery
    where delivery.attempt_count < 4
      and (
        (
          delivery.status in ('Pending', 'Failed')
          and delivery.next_attempt_at <= p_now
        )
        or (
          delivery.status = 'Processing'
          and delivery.last_attempt_at <= p_now - interval '15 minutes'
        )
      )
    order by delivery.created_at, delivery.id
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ), claimed as (
    update public.email_deliveries delivery
    set status = 'Processing',
        attempt_count = delivery.attempt_count + 1,
        last_attempt_at = p_now,
        next_attempt_at = null,
        last_error_code = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select
    claimed.id,
    claimed.recipient_user_id,
    claimed.notification_id,
    claimed.email_type,
    claimed.attempt_count,
    profile.email,
    profile.full_name,
    coalesce(preference.email_notifications_enabled, true),
    notification.related_entity_type,
    notification.related_entity_id,
    case
      when claimed.email_type in ('booking_confirmed', 'upcoming_pickup')
        then booking.pickup_at
      when claimed.email_type in ('upcoming_return', 'rental_overdue')
        then rental.scheduled_return_at
      else null
    end
  from claimed
  join public.profiles profile on profile.id = claimed.recipient_user_id
  join public.notifications notification on notification.id = claimed.notification_id
  left join public.notification_preferences preference
    on preference.recipient_id = claimed.recipient_user_id
  left join public.booking_requests booking
    on notification.related_entity_type = 'booking'
    and booking.id = notification.related_entity_id
  left join public.rental_transactions rental
    on notification.related_entity_type = 'rental'
    and rental.id = notification.related_entity_id;
$$;

revoke all on function public.claim_email_deliveries(integer, timestamptz)
from public, anon, authenticated;
grant execute on function public.claim_email_deliveries(integer, timestamptz)
to service_role;
