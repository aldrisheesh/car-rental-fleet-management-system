-- VS020: canonical in-app reminder notification types and trusted insertion.
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
    'rental_overdue'
  ));

alter table public.notifications
  drop constraint if exists notifications_related_entity_type_check;
alter table public.notifications
  add constraint notifications_related_entity_type_check
  check (related_entity_type in ('booking', 'requirements', 'payment', 'rental'));

grant insert (
  recipient_id,
  notification_type,
  title,
  message,
  related_entity_type,
  related_entity_id,
  event_key
) on public.notifications to service_role;
