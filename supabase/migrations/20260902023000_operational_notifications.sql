-- VS028: durable, preference-aware maintenance and low-availability alerts.
alter table public.notifications
  drop constraint if exists notifications_notification_type_check;
alter table public.notifications
  add constraint notifications_notification_type_check check (notification_type in (
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'new_booking_request',
    'requirements_submitted',
    'payment_proof_submitted',
    'upcoming_pickup',
    'upcoming_return',
    'rental_overdue',
    'maintenance_attention',
    'low_availability'
  ));

alter table public.notifications
  drop constraint if exists notifications_related_entity_type_check;
alter table public.notifications
  add constraint notifications_related_entity_type_check
  check (related_entity_type in (
    'booking', 'requirements', 'payment', 'rental', 'vehicle', 'branch'
  ));

create table public.notification_preferences (
  recipient_id uuid primary key references public.profiles (id) on delete cascade,
  maintenance_attention_enabled boolean not null default true,
  low_availability_enabled boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;
grant insert (
  recipient_id,
  maintenance_attention_enabled,
  low_availability_enabled
) on public.notification_preferences to authenticated;
grant update (
  maintenance_attention_enabled,
  low_availability_enabled
) on public.notification_preferences to authenticated;

create policy notification_preferences_own_select
on public.notification_preferences for select to authenticated
using (recipient_id = auth.uid());
create policy notification_preferences_own_insert
on public.notification_preferences for insert to authenticated
with check (recipient_id = auth.uid());
create policy notification_preferences_own_update
on public.notification_preferences for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create table public.operational_notification_conditions (
  condition_type text not null check (
    condition_type in ('maintenance_attention', 'low_availability')
  ),
  related_entity_type text not null check (
    related_entity_type in ('vehicle', 'branch')
  ),
  related_entity_id uuid not null,
  is_active boolean not null default false,
  occurrence_count bigint not null default 0 check (occurrence_count >= 0),
  title text not null check (nullif(trim(title), '') is not null),
  message text not null check (nullif(trim(message), '') is not null),
  activated_at timestamptz,
  resolved_at timestamptz,
  last_evaluated_at timestamptz not null default timezone('utc', now()),
  primary key (condition_type, related_entity_id),
  check (
    (condition_type = 'maintenance_attention' and related_entity_type = 'vehicle')
    or (condition_type = 'low_availability' and related_entity_type = 'branch')
  )
);

alter table public.operational_notification_conditions enable row level security;
revoke all on public.operational_notification_conditions from anon, authenticated;
grant select on public.notification_preferences to service_role;
grant select on public.operational_notification_conditions to service_role;

create function public.reconcile_operational_notification_conditions(
  p_conditions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_condition_type text;
  v_entity_type text;
  v_entity_id uuid;
  v_title text;
  v_message text;
  v_was_active boolean;
  v_occurrence bigint;
  v_activated_count integer := 0;
  v_resolved_count integer := 0;
  v_unchanged_count integer := 0;
  v_notification_count integer := 0;
  v_inserted integer := 0;
begin
  if p_conditions is null or jsonb_typeof(p_conditions) <> 'array' then
    raise exception 'invalid_operational_conditions';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_conditions) item
    where item->>'conditionType' not in (
      'maintenance_attention', 'low_availability'
    )
      or item->>'relatedEntityType' not in ('vehicle', 'branch')
      or nullif(trim(item->>'relatedEntityId'), '') is null
      or nullif(trim(item->>'title'), '') is null
      or nullif(trim(item->>'message'), '') is null
      or jsonb_typeof(item->'recipientIds') <> 'array'
      or (
        item->>'conditionType' = 'maintenance_attention'
        and item->>'relatedEntityType' <> 'vehicle'
      )
      or (
        item->>'conditionType' = 'low_availability'
        and item->>'relatedEntityType' <> 'branch'
      )
  ) then
    raise exception 'invalid_operational_condition';
  end if;

  if (
    select count(*) from jsonb_array_elements(p_conditions)
  ) <> (
    select count(*) from (
      select distinct item->>'conditionType', item->>'relatedEntityId'
      from jsonb_array_elements(p_conditions) item
    ) unique_conditions
  ) then
    raise exception 'duplicate_operational_condition';
  end if;

  -- One transaction owns the complete false/true transition set. The table key
  -- and notifications recipient/event key remain independent uniqueness guards.
  perform pg_advisory_xact_lock(
    hashtextextended('operational-notification-conditions', 0)
  );

  update public.operational_notification_conditions state
  set is_active = false,
      resolved_at = timezone('utc', now()),
      last_evaluated_at = timezone('utc', now())
  where state.is_active
    and not exists (
      select 1
      from jsonb_array_elements(p_conditions) item
      where item->>'conditionType' = state.condition_type
        and (item->>'relatedEntityId')::uuid = state.related_entity_id
    );
  get diagnostics v_resolved_count = row_count;

  for v_item in select value from jsonb_array_elements(p_conditions)
  loop
    v_condition_type := v_item->>'conditionType';
    v_entity_type := v_item->>'relatedEntityType';
    v_entity_id := (v_item->>'relatedEntityId')::uuid;
    v_title := trim(v_item->>'title');
    v_message := trim(v_item->>'message');

    select state.is_active, state.occurrence_count
    into v_was_active, v_occurrence
    from public.operational_notification_conditions state
    where state.condition_type = v_condition_type
      and state.related_entity_id = v_entity_id
    for update;

    if not found then
      v_was_active := false;
      v_occurrence := 1;
      insert into public.operational_notification_conditions (
        condition_type,
        related_entity_type,
        related_entity_id,
        is_active,
        occurrence_count,
        title,
        message,
        activated_at,
        resolved_at,
        last_evaluated_at
      ) values (
        v_condition_type,
        v_entity_type,
        v_entity_id,
        true,
        v_occurrence,
        v_title,
        v_message,
        timezone('utc', now()),
        null,
        timezone('utc', now())
      );
    elsif v_was_active then
      update public.operational_notification_conditions
      set title = v_title,
          message = v_message,
          last_evaluated_at = timezone('utc', now())
      where condition_type = v_condition_type
        and related_entity_id = v_entity_id;
      v_unchanged_count := v_unchanged_count + 1;
      continue;
    else
      v_occurrence := v_occurrence + 1;
      update public.operational_notification_conditions
      set related_entity_type = v_entity_type,
          is_active = true,
          occurrence_count = v_occurrence,
          title = v_title,
          message = v_message,
          activated_at = timezone('utc', now()),
          resolved_at = null,
          last_evaluated_at = timezone('utc', now())
      where condition_type = v_condition_type
        and related_entity_id = v_entity_id;
    end if;

    v_activated_count := v_activated_count + 1;
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
      v_condition_type,
      v_title,
      v_message,
      v_entity_type,
      v_entity_id,
      'operational:' || v_condition_type || ':' || v_entity_id::text || ':' || v_occurrence::text
    from public.profiles profile
    left join public.notification_preferences preference
      on preference.recipient_id = profile.id
    where profile.id in (
        select recipient_id.value::uuid
        from jsonb_array_elements_text(v_item->'recipientIds') recipient_id(value)
      )
      and profile.account_status = 'Active'
      and (
        (
          v_condition_type = 'maintenance_attention'
          and profile.user_type = 'Owner/Admin'
          and coalesce(preference.maintenance_attention_enabled, true)
        )
        or (
          v_condition_type = 'low_availability'
          and profile.user_type in ('Owner/Admin', 'Operations Staff')
          and coalesce(preference.low_availability_enabled, true)
        )
      )
    on conflict (recipient_id, event_key) do nothing;
    get diagnostics v_inserted = row_count;
    v_notification_count := v_notification_count + v_inserted;
  end loop;

  return jsonb_build_object(
    'activeConditionCount', jsonb_array_length(p_conditions),
    'activatedCount', v_activated_count,
    'resolvedCount', v_resolved_count,
    'unchangedCount', v_unchanged_count,
    'createdNotificationCount', v_notification_count
  );
end;
$$;

revoke all on function public.reconcile_operational_notification_conditions(jsonb)
from public, anon, authenticated;
grant execute on function public.reconcile_operational_notification_conditions(jsonb)
to service_role;
