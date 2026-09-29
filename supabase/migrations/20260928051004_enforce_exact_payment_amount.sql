-- A payment request is for one recorded, booking-specific amount. The customer
-- can submit proof only for that exact amount; the server remains authoritative.
create or replace function public.submit_payment_proof_atomic(
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
  ) then raise exception 'forbidden'; end if;
  if not exists (
    select 1 from public.booking_requests booking
    where booking.id = p_booking_id and booking.customer_id = p_customer_id
  ) then raise exception 'booking_not_found'; end if;
  if not exists (
    select 1 from public.renter_requirement_sets requirement_set
    where requirement_set.booking_id = p_booking_id
      and requirement_set.customer_id = p_customer_id
      and requirement_set.status = 'Verified'
  ) then raise exception 'requirements_not_verified'; end if;
  if p_submitted_amount is null or p_submitted_amount <= 0
    or nullif(trim(coalesce(p_transaction_reference, '')), '') is null
  then raise exception 'invalid_submission'; end if;

  select * into v_method from public.payment_methods
  where id = p_payment_method_id and is_active;
  if not found then raise exception 'invalid_payment_method'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  select * into v_payment from public.payments where booking_id = p_booking_id for update;
  if not found then
    insert into public.payments (booking_id, customer_id, payment_method_label)
    values (p_booking_id, p_customer_id, '')
    returning * into v_payment;
  end if;
  if v_payment.customer_id <> p_customer_id then raise exception 'forbidden'; end if;
  if v_payment.status not in ('Not Submitted', 'Needs Resubmission') then
    raise exception 'not_submittable';
  end if;
  if v_payment.required_amount is null then
    raise exception 'payment_requirement_not_set';
  end if;
  if p_submitted_amount <> v_payment.required_amount then
    raise exception 'amount_must_match_required';
  end if;

  select coalesce(max(proof.version), 0) + 1 into v_version
  from public.payment_proofs proof where proof.payment_id = v_payment.id;
  update public.payment_proofs set is_current = false, superseded_at = timezone('utc', now())
  where payment_id = v_payment.id and is_current;
  insert into public.payment_proofs (
    payment_id, booking_id, customer_id, storage_path, original_filename,
    mime_type, size_bytes, version
  ) values (
    v_payment.id, p_booking_id, p_customer_id, p_storage_path, p_original_filename,
    p_mime_type, p_size_bytes, v_version
  ) returning * into v_proof;
  update public.payments set
    payment_method_id = v_method.id,
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
  where id = v_payment.id returning * into v_payment;
  return jsonb_build_object('payment', to_jsonb(v_payment), 'proof', to_jsonb(v_proof));
end;
$$;

revoke all on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint)
  from public, anon, authenticated;
grant execute on function public.submit_payment_proof_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint)
  to service_role;
