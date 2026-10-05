begin;

-- Keep acknowledgement on the exact proof version; historical submissions stay unchanged.
alter table public.payment_proofs
  add column if not exists policy_version text,
  add column if not exists policy_acknowledged_at timestamptz,
  add column if not exists policy_snapshot jsonb;

alter table public.payment_proofs add constraint payment_proof_policy_acknowledgement_complete
check ((policy_version is null and policy_acknowledged_at is null and policy_snapshot is null)
  or (nullif(btrim(policy_version), '') is not null and policy_acknowledged_at is not null
    and policy_snapshot is not null and jsonb_typeof(policy_snapshot) = 'array'));

create function public.submit_payment_proof_with_policy_atomic(
  p_booking_id uuid, p_customer_id uuid, p_payment_method_id uuid,
  p_submitted_amount numeric, p_transaction_reference text, p_storage_path text,
  p_original_filename text, p_mime_type text, p_size_bytes bigint,
  p_policy_version text, p_policy_acknowledged boolean
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb; proof public.payment_proofs;
begin
  if p_policy_acknowledged is distinct from true or p_policy_version is distinct from '2026-10-05.v1'
  then raise exception 'payment_policy_acknowledgement_required'; end if;

  -- The existing transaction retains eligibility, quote, amount, ownership and duplicate guards.
  result := public.submit_payment_proof_atomic(p_booking_id, p_customer_id, p_payment_method_id,
    p_submitted_amount, p_transaction_reference, p_storage_path, p_original_filename, p_mime_type, p_size_bytes);
  update public.payment_proofs set policy_version = p_policy_version,
    policy_acknowledged_at = statement_timestamp(),
    policy_snapshot = jsonb_build_array(
      'Your 50% down payment is non-refundable if you cancel.',
      'The security deposit collected at handover is separate and refundable.',
      'Request new dates before handover, subject to availability and approval. Your original booking stays in place until approved.',
      'Online requests keep the same vehicle, rental duration and saved price. Contact the team for a revised quote if you need a different duration, vehicle or delivery service.')
  where id = (result->'proof'->>'id')::uuid and booking_id = p_booking_id and customer_id = p_customer_id
  returning * into proof;
  if not found then raise exception 'payment_policy_record_missing'; end if;
  return jsonb_set(result, '{proof}', to_jsonb(proof));
end;
$$;
revoke all on function public.submit_payment_proof_with_policy_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint,text,boolean) from public, anon, authenticated;
grant execute on function public.submit_payment_proof_with_policy_atomic(uuid,uuid,uuid,numeric,text,text,text,text,bigint,text,boolean) to service_role;

create function public.preserve_payment_policy_acknowledgement() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if old.policy_acknowledged_at is not null and (
    new.policy_version is distinct from old.policy_version or
    new.policy_acknowledged_at is distinct from old.policy_acknowledged_at or
    new.policy_snapshot is distinct from old.policy_snapshot)
  then raise exception 'payment_policy_acknowledgement_immutable'; end if;
  return new;
end; $$;
revoke all on function public.preserve_payment_policy_acknowledgement() from public, anon, authenticated;
create trigger payment_policy_acknowledgement_immutable before update on public.payment_proofs
for each row execute function public.preserve_payment_policy_acknowledgement();

commit;
