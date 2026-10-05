begin;
create table public.booking_payment_policy_acceptances (
  booking_id uuid not null references public.booking_requests(id),
  customer_id uuid not null references public.profiles(id),
  policy_version text not null check (btrim(policy_version) <> ''),
  acknowledged_at timestamptz not null default statement_timestamp(),
  policy_snapshot jsonb not null check (jsonb_typeof(policy_snapshot) = 'array'),
  primary key (booking_id, customer_id, policy_version)
);
alter table public.booking_payment_policy_acceptances enable row level security;
-- All writes pass through the authenticated application server. No browser role
-- can forge acknowledgements or read another customer's policy history.
revoke all on public.booking_payment_policy_acceptances from public, anon, authenticated;
grant select, insert on public.booking_payment_policy_acceptances to service_role;

create function public.acknowledge_booking_payment_policy(p_booking_id uuid, p_customer_id uuid, p_policy_version text)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare stamp timestamptz;
begin
  if p_policy_version is distinct from '2026-10-05.v1' then raise exception 'payment_policy_acknowledgement_required'; end if;
  if not exists(select 1 from public.profiles where id=p_customer_id and user_type='Customer/Renter' and account_status='Active') then raise exception 'forbidden'; end if;
  if not exists(select 1 from public.booking_requests where id=p_booking_id and customer_id=p_customer_id) then raise exception 'booking_not_found'; end if;
  if not exists(select 1 from public.renter_requirement_sets where booking_id=p_booking_id and customer_id=p_customer_id and status='Verified') then raise exception 'requirements_not_verified'; end if;
  insert into public.booking_payment_policy_acceptances (booking_id,customer_id,policy_version,policy_snapshot)
  values(p_booking_id,p_customer_id,p_policy_version,jsonb_build_array(
    'Your 50% down payment is non-refundable if you cancel.',
    'The security deposit collected at handover is separate and refundable.',
    'Request new dates before handover, subject to availability and approval. Your original booking stays in place until approved.',
    'Online requests keep the same vehicle, rental duration and saved price. Contact the team for a revised quote if you need a different duration, vehicle or delivery service.'))
  on conflict (booking_id,customer_id,policy_version) do nothing;
  select acknowledged_at into stamp from public.booking_payment_policy_acceptances
  where booking_id=p_booking_id and customer_id=p_customer_id and policy_version=p_policy_version;
  return stamp;
end; $$;
revoke all on function public.acknowledge_booking_payment_policy(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.acknowledge_booking_payment_policy(uuid,uuid,text) to service_role;

create or replace function public.submit_payment_proof_with_policy_atomic(
  p_booking_id uuid, p_customer_id uuid, p_payment_method_id uuid,
  p_submitted_amount numeric, p_transaction_reference text, p_storage_path text,
  p_original_filename text, p_mime_type text, p_size_bytes bigint,
  p_policy_version text, p_policy_acknowledged boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb; proof public.payment_proofs; acceptance public.booking_payment_policy_acceptances;
begin
  if p_policy_acknowledged is distinct from true or p_policy_version is distinct from '2026-10-05.v1'
  then raise exception 'payment_policy_acknowledgement_required'; end if;
  select * into acceptance from public.booking_payment_policy_acceptances
  where booking_id=p_booking_id and customer_id=p_customer_id and policy_version=p_policy_version;
  if not found then raise exception 'payment_policy_acknowledgement_required'; end if;
  result := public.submit_payment_proof_atomic(p_booking_id,p_customer_id,p_payment_method_id,
    p_submitted_amount,p_transaction_reference,p_storage_path,p_original_filename,p_mime_type,p_size_bytes);
  update public.payment_proofs set policy_version=acceptance.policy_version,
    policy_acknowledged_at=acceptance.acknowledged_at, policy_snapshot=acceptance.policy_snapshot
  where id=(result->'proof'->>'id')::uuid and booking_id=p_booking_id and customer_id=p_customer_id
  returning * into proof;
  if not found then raise exception 'payment_policy_record_missing'; end if;
  return jsonb_set(result,'{proof}',to_jsonb(proof));
end; $$;
commit;
