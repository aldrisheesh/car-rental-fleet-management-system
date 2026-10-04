-- Fix the observed payment/assignment ordering without relaxing confirmation checks.
CREATE OR REPLACE FUNCTION public.review_payment_atomic(p_payment_id uuid, p_reviewer_id uuid, p_action text, p_proof_version integer, p_submitted_amount numeric, p_transaction_reference text, p_reason text DEFAULT NULL::text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  p public.payments;
  proof public.payment_proofs;
  result public.payments;
  booking public.booking_requests;
  confirmation_error text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_reviewer_id
      and user_type = 'Owner/Admin'
      and account_status = 'Active'
  ) then raise exception 'forbidden'; end if;
  if p_action not in ('verify', 'resubmit', 'pending') then raise exception 'invalid_action'; end if;

  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.status <> 'Pending Verification' then raise exception 'not_pending'; end if;
  select * into proof from public.payment_proofs
  where payment_id = p.id and is_current for update;
  if not found or proof.version <> p_proof_version then raise exception 'stale_proof'; end if;
  if p.submitted_amount is distinct from p_submitted_amount
    or p.transaction_reference is distinct from nullif(trim(p_transaction_reference), '') then
    raise exception 'stale_snapshot';
  end if;
  if p_action = 'resubmit'
    and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'missing_reason';
  end if;
  if p_action = 'verify'
    and p.required_amount is not null
    and p.submitted_amount < p.required_amount then
    raise exception 'insufficient_amount';
  end if;

  update public.payments
  set status = case p_action
        when 'verify' then 'Verified'
        when 'resubmit' then 'Needs Resubmission'
        else 'Pending Verification'
      end,
      resubmission_reason = case when p_action = 'resubmit' then trim(p_reason) else null end,
      reviewed_by = p_reviewer_id,
      reviewed_at = timezone('utc', now()),
      reviewed_proof_version = proof.version,
      reviewed_submitted_amount = p.submitted_amount,
      reviewed_transaction_reference = p.transaction_reference
  where id = p.id
  returning * into result;

  if p_action = 'verify' then
    select * into booking
    from public.booking_requests
    where id = result.booking_id;

    if found and booking.booking_status = 'Submitted' then
      begin
        if booking.assigned_vehicle_id is null then
          booking := public.assign_booking_vehicle(
            booking.id, booking.requested_vehicle_id, p_reviewer_id
          );
        end if;
        perform public.confirm_booking_atomic(
          booking.id,
          p_reviewer_id,
          booking.assigned_vehicle_id,
          booking.assigned_at
        );
      exception when others then
        get stacked diagnostics confirmation_error = message_text;
        if confirmation_error = any (array[
          'pickup_arrangement_required',
          'assignment_required',
          'vehicle_unavailable',
          'vehicle_maintenance_unready',
          'vehicle_conflict',
          'stale_assignment',
          'assignment_expectation_required',
          'pickup_window_elapsed',
          'substitution_ack_required',
          'cross_branch_ack_required',
          'booking_not_submitted'
        ]) then
          update public.booking_requests
          set confirmation_exception_code = confirmation_error,
              confirmation_exception_message = case confirmation_error
                when 'pickup_arrangement_required' then 'Save the agreed pickup and return meeting points and instructions before confirming this rental.'
                when 'assignment_required' then 'Assign an available vehicle before confirming this rental.'
                when 'vehicle_unavailable' then 'The assigned vehicle is unavailable. Assign another vehicle before confirming.'
                when 'vehicle_maintenance_unready' then 'The assigned vehicle is blocked by maintenance or a due service requirement.'
                when 'vehicle_conflict' then 'The assigned vehicle has a conflicting confirmed booking.'
                when 'stale_assignment' then 'The vehicle assignment changed while this payment was being approved. Refresh the assignment before confirming this rental.'
                when 'assignment_expectation_required' then 'Refresh the vehicle assignment before confirming this rental.'
                when 'pickup_window_elapsed' then 'The pickup time has passed. Review the schedule with the customer.'
                when 'substitution_ack_required' then 'The replacement vehicle needs a documented substitution acknowledgement.'
                when 'cross_branch_ack_required' then 'The cross-branch assignment needs a documented acknowledgement.'
                else 'This booking is no longer ready for automatic confirmation.'
              end,
              confirmation_exception_at = timezone('utc', now())
          where id = booking.id;
        else
          raise;
        end if;
      end;
    end if;
  end if;

  return result;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_requirement_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      else 'Your requirements were verified. The team will share your rental quote and handover arrangements before payment.'
    end,
    'requirements',
    v_set.id,
    'requirements-review:' || new.id::text
  )
  on conflict (recipient_id, event_key) do nothing;
  return new;
end;
$function$
;

-- Quote issuance is a customer-visible transition, with a durable deduplication key.
alter table public.notifications drop constraint notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (notification_type in (
 'requirements_needs_resubmission','requirements_verified','payment_needs_resubmission','payment_verified',
 'booking_confirmed','new_booking_request','requirements_submitted','payment_proof_submitted','upcoming_pickup',
 'upcoming_return','rental_overdue','maintenance_attention','low_availability','backup_attention','quote_issued'
));
create function public.notify_booking_quote_issued() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if tg_op = 'UPDATE' then
    if new is not distinct from old then return new; end if;
  end if;
  insert into public.notifications(recipient_id,notification_type,title,message,related_entity_type,related_entity_id,event_key)
  select customer_id,'quote_issued','Your rental quote is ready',
    'Review your rental price and pickup or delivery arrangements before submitting payment.',
    'booking',id,'quote-issued:'||new.booking_id::text||':'||new.updated_at::text
  from public.booking_requests where id=new.booking_id
  on conflict(recipient_id,event_key) do nothing;
  return new;
end; $$;
revoke all on function public.notify_booking_quote_issued() from public,anon,authenticated;
create trigger booking_quotes_notify_issued after insert or update on public.booking_payment_quotes
for each row execute function public.notify_booking_quote_issued();

-- Existing historical rentals stay unknown; never manufacture receipts for them.
create table public.rental_financial_records (
 booking_id uuid primary key references public.booking_requests(id) on delete restrict,
 rental_id uuid not null unique references public.rental_transactions(id) on delete restrict,
 balance_collected numeric(12,2) not null check(balance_collected between 0 and 99999999.99),
 deposit_collected numeric(12,2) not null check(deposit_collected between 0 and 99999999.99),
 collection_method text not null check(collection_method in ('Cash','GCash','Bank transfer')),
 collection_reference text,
 collected_at timestamptz not null default now(),
 collected_by uuid not null references public.profiles(id),
 deposit_deduction numeric(12,2),
 deduction_reason text,
 deposit_refunded numeric(12,2),
 refund_method text check(refund_method in ('Cash','GCash','Bank transfer')),
 refund_reference text,
 settled_at timestamptz,
 settled_by uuid references public.profiles(id),
 check ((settled_at is null and deposit_deduction is null and deposit_refunded is null and settled_by is null)
   or (settled_at is not null and settled_by is not null and refund_method is not null
      and deposit_deduction between 0 and deposit_collected
      and deposit_refunded=deposit_collected-deposit_deduction
      and (deposit_deduction=0 or nullif(trim(deduction_reason),'') is not null))),
 check(collection_method='Cash' or nullif(trim(collection_reference),'') is not null)
);
alter table public.rental_financial_records enable row level security;
revoke all on public.rental_financial_records from public,anon,authenticated;
grant all on public.rental_financial_records to service_role;
-- Access goes through the authenticated, ownership-filtered booking endpoint.

create function public.release_rental_with_collection(p_booking_id uuid,p_actor_id uuid,p_payload jsonb)
returns public.rental_transactions language plpgsql security invoker set search_path=public as $$
declare b public.booking_requests; q public.booking_payment_quotes; p public.payments; r public.rental_transactions;
 balance numeric; deposit numeric; method text; reference text;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into b from public.booking_requests where id=p_booking_id for update;
 if not found then raise exception 'booking_not_found'; end if;
 if (now() at time zone 'Asia/Manila')::date < (b.pickup_at at time zone 'Asia/Manila')::date then raise exception 'release_day_not_reached'; end if;
 if b.return_at <= now() then raise exception 'rental_window_elapsed'; end if;
 select * into q from public.booking_payment_quotes where booking_id=b.id;
 if not found then raise exception 'quote_required_for_release'; end if;
 select * into p from public.payments where booking_id=b.id and status='Verified';
 if not found then raise exception 'payment_not_verified'; end if;
 balance := greatest(q.total_amount-p.submitted_amount,0);
 deposit := q.security_deposit_amount;
 method := p_payload->>'collectionMethod'; reference := nullif(trim(p_payload->>'collectionReference'),'');
 if (p_payload->>'collectionAcknowledged')::boolean is distinct from true
   or (p_payload->>'balanceReceived')::numeric is distinct from balance
   or (p_payload->>'depositReceived')::numeric is distinct from deposit then raise exception 'handover_collection_required'; end if;
 if method is null or method not in ('Cash','GCash','Bank transfer') or (method <> 'Cash' and reference is null) then raise exception 'collection_details_required'; end if;
 if (p_payload->>'agreementAcknowledged')::boolean is distinct from true
 or (p_payload->>'conditionAcknowledged')::boolean is distinct from true
 or (p_payload->>'returnScheduleAcknowledged')::boolean is distinct from true then raise exception 'release_acknowledgements_required'; end if;
 if nullif(p_payload->>'releaseOdometer','') is null or not ((p_payload->>'releaseOdometer')::numeric between 0 and 999999999) then raise exception 'invalid_odometer'; end if;
 r := public.release_vehicle_start_rental(b.id,p_actor_id,(p_payload->>'expectedAssignedVehicleId')::uuid,
 (p_payload->>'expectedConfirmedAt')::timestamptz,(p_payload->>'releaseOdometer')::numeric,
 p_payload->>'releaseFuelLevel',p_payload->>'releaseConditionSummary',p_payload->>'existingDamageNotes',true,true,true);
 insert into public.rental_financial_records(booking_id,rental_id,balance_collected,deposit_collected,collection_method,collection_reference,collected_by)
 values(b.id,r.id,balance,deposit,method,reference,p_actor_id);
 return r;
end; $$;
revoke all on function public.release_rental_with_collection(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.release_rental_with_collection(uuid,uuid,jsonb) to service_role;

create function public.close_rental_with_settlement(p_booking_id uuid,p_actor_id uuid,p_payload jsonb)
returns public.rental_transactions language plpgsql security invoker set search_path=public as $$
declare f public.rental_financial_records; r public.rental_transactions; deduction numeric; refund numeric; method text; reference text; reason text;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into r from public.rental_transactions where id=(p_payload->>'rentalId')::uuid for update;
 if not found or r.booking_id is distinct from p_booking_id then raise exception 'stale_rental'; end if;
 select * into f from public.rental_financial_records where rental_id=r.id for update;
 if found then
   deduction := (p_payload->>'depositDeduction')::numeric;
   refund := (p_payload->>'depositRefunded')::numeric;
   reason := nullif(trim(p_payload->>'deductionReason'),'');
   method := p_payload->>'refundMethod'; reference := nullif(trim(p_payload->>'refundReference'),'');
   if deduction is null or not(deduction between 0 and f.deposit_collected)
     or refund is distinct from f.deposit_collected-deduction
     or (deduction>0 and reason is null) then raise exception 'invalid_deposit_settlement'; end if;
   if (p_payload->>'refundAcknowledged')::boolean is distinct from true then raise exception 'refund_acknowledgement_required'; end if;
   if method is null or method not in ('Cash','GCash','Bank transfer') or (method<>'Cash' and reference is null) then raise exception 'refund_details_required'; end if;
 end if;
 if nullif(p_payload->>'returnOdometer','') is null or not ((p_payload->>'returnOdometer')::numeric between 0 and 999999999) then raise exception 'invalid_odometer'; end if;
 r := public.return_vehicle_close_rental(r.id,p_actor_id,(p_payload->>'expectedBookingId')::uuid,
   (p_payload->>'expectedVehicleId')::uuid,(p_payload->>'expectedStartedAt')::timestamptz,
   (p_payload->>'returnOdometer')::numeric,p_payload->>'returnFuelLevel',p_payload->>'returnConditionSummary',
   p_payload->>'observedDamageNotes',p_payload->>'returnRemarks');
 if f.rental_id is not null then
   update public.rental_financial_records set deposit_deduction=deduction,deduction_reason=reason,
    deposit_refunded=refund,refund_method=method,refund_reference=reference,settled_at=now(),settled_by=p_actor_id
   where rental_id=r.id;
 end if;
 return r;
end; $$;
revoke all on function public.close_rental_with_settlement(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.close_rental_with_settlement(uuid,uuid,jsonb) to service_role;
