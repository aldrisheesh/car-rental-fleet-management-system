-- Run against the synthetic defense dataset. Every mutation is rolled back.
begin;
do $$
declare v_booking uuid; v_payment uuid; v_delivery uuid; v_unquoted uuid; v_unquoted_payment uuid;
begin
  select b.id,p.id into strict v_booking,v_payment from public.booking_requests b
    join public.payments p on p.booking_id=b.id
    join public.booking_payment_quotes q on q.booking_id=b.id
    where b.pickup_delivery_option='pickup' limit 1;
  update public.booking_requests set pickup_meeting_address=null,pickup_meeting_instructions=null,
    return_meeting_address=null,return_meeting_instructions=null where id=v_booking;
  begin
    update public.booking_payment_quotes set delivery_fee=delivery_fee where booking_id=v_booking;
    raise exception 'Missing arrangements allowed quote issuance';
  exception when others then if sqlerrm <> 'pickup_arrangement_required' then raise; end if; end;
  begin
    update public.payments set status='Pending Verification',submitted_at=clock_timestamp() where id=v_payment;
    raise exception 'Missing arrangements allowed payment submission';
  exception when others then if sqlerrm <> 'pickup_arrangement_required' then raise; end if; end;
  update public.booking_requests set pickup_meeting_address='Demo pickup',pickup_meeting_instructions='Main entrance',
    return_meeting_address='Demo return',return_meeting_instructions='Call before arriving' where id=v_booking;
  update public.booking_payment_quotes set delivery_fee=delivery_fee where booking_id=v_booking;
  update public.payments set status='Pending Verification',submitted_at=clock_timestamp() where id=v_payment;
  update public.payments set status='Verified' where id=v_payment;
  v_unquoted := v_booking;
  v_unquoted_payment := v_payment;
  delete from public.booking_payment_quotes where booking_id=v_unquoted;
  begin
    update public.payments set status='Pending Verification',submitted_at=clock_timestamp() where id=v_unquoted_payment;
    raise exception 'Payment allowed without issued pickup quote';
  exception when others then if sqlerrm <> 'payment_quote_required' then raise; end if; end;
  select q.booking_id into strict v_delivery from public.booking_payment_quotes q
    join public.booking_requests b on b.id=q.booking_id where b.pickup_delivery_option='delivery' limit 1;
  update public.booking_payment_quotes set delivery_fee=delivery_fee where booking_id=v_delivery;
end;
$$;
rollback;
