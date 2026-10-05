DO $$ declare c record; definition text; begin
for c in select conname,conrelid,pg_get_constraintdef(oid) def from pg_constraint where contype='c' and conrelid in ('public.notifications'::regclass,'public.email_deliveries'::regclass) and (pg_get_constraintdef(oid) like '%notification_type%' or pg_get_constraintdef(oid) like '%email_type%') loop
 definition:=replace(c.def,'''quote_issued''::text', '''quote_issued''::text, ''booking_cancelled''::text, ''booking_rejected''::text');
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

create function public.notify_booking_resolution() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.booking_status is distinct from old.booking_status and new.booking_status in ('Cancelled','Rejected') then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 values(new.customer_id,case when new.booking_status='Cancelled' then 'booking_cancelled' else 'booking_rejected' end,case when new.booking_status='Cancelled' then 'Booking cancelled' else 'Rental request could not proceed' end,coalesce(new.resolution_reason,'Open the booking to review the recorded decision.'),'booking',new.id,'booking-resolution:'||new.id::text||':'||new.booking_status) on conflict(event_key) do nothing;
 end if; return new;
end; $$;
create trigger booking_resolution_notification after update of booking_status on public.booking_requests for each row execute function public.notify_booking_resolution();
