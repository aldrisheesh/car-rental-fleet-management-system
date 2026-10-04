-- Server-only lifecycle wrappers need the same controlled table access as the existing rental RPCs.
-- Existing revoked client grants are preserved; actor role and stale-state checks remain mandatory.
alter function public.release_rental_with_collection(uuid,uuid,jsonb) security definer;
CREATE OR REPLACE FUNCTION public.close_rental_with_settlement(p_booking_id uuid, p_actor_id uuid, p_payload jsonb)
 RETURNS rental_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     or deduction <> round(deduction,2)
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
end; $function$

