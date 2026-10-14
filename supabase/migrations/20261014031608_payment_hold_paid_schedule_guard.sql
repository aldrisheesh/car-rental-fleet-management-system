-- Preserve the protected inventory interval when paid requests change dates
-- before confirmation; do not obstruct assignment to the already-held vehicle.
create or replace function briah_private.booking_hold_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.booking_status='Confirmed' then
  perform briah_private.assert_no_payment_hold(new.id,new.assigned_vehicle_id,new.pickup_at,new.return_at);
  update public.booking_payment_holds set state='Completed',changed_at=clock_timestamp(),reason='Booking confirmed.' where booking_id=new.id;
 elsif new.booking_status in ('Cancelled','Rejected','Withdrawn') then
  update public.booking_payment_holds set state='Released',changed_at=clock_timestamp(),reason='Booking closed by the existing booking workflow.' where booking_id=new.id;
 elsif tg_op='UPDATE' and (new.pickup_at,new.return_at,new.requested_vehicle_id,new.assigned_vehicle_id) is distinct from (old.pickup_at,old.return_at,old.requested_vehicle_id,old.assigned_vehicle_id)
 and exists(select 1 from public.booking_payment_holds where booking_id=new.id and state='Verified') then
  perform public.assert_resolution_vehicle_available(new.id,coalesce(new.assigned_vehicle_id,new.requested_vehicle_id),new.pickup_at,new.return_at);
  update public.booking_payment_holds set vehicle_id=coalesce(new.assigned_vehicle_id,new.requested_vehicle_id),pickup_at=new.pickup_at,return_at=new.return_at,changed_at=clock_timestamp(),changed_by=null,reason='Paid booking schedule or assignment updated; availability rechecked.' where booking_id=new.id;
 elsif tg_op='UPDATE' and (new.pickup_at,new.return_at,new.requested_vehicle_id,new.assigned_vehicle_id) is distinct from (old.pickup_at,old.return_at,old.requested_vehicle_id,old.assigned_vehicle_id)
 and exists(select 1 from public.booking_payment_holds where booking_id=new.id and state in ('AwaitingPayment','Correction','Review') and ((new.pickup_at,new.return_at,new.requested_vehicle_id) is distinct from (old.pickup_at,old.return_at,old.requested_vehicle_id) or new.assigned_vehicle_id is distinct from vehicle_id)) then
  raise exception 'active_payment_hold_locks_booking';
 end if;return new;
end $$;
