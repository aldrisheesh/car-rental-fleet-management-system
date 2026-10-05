create or replace function public.notify_booking_resolution() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.booking_status is distinct from old.booking_status and new.booking_status in ('Cancelled','Rejected') then
 insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
 values(new.customer_id,case when new.booking_status='Cancelled' then 'booking_cancelled' else 'booking_rejected' end,case when new.booking_status='Cancelled' then 'Booking cancelled' else 'Rental request could not proceed' end,coalesce(new.resolution_reason,'Open the booking to review the recorded decision.'),'booking',new.id,'booking-resolution:'||new.id::text||':'||new.booking_status) on conflict do nothing;
 end if; return new;
end; $$;
