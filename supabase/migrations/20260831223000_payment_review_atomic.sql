-- VS008 correction: atomic, version-safe Owner/Admin review transition.
create or replace function public.review_payment_atomic(
  p_payment_id uuid,
  p_reviewer_id uuid,
  p_action text,
  p_proof_version integer,
  p_submitted_amount numeric,
  p_transaction_reference text,
  p_reason text default null
) returns public.payments
language plpgsql security definer set search_path=public
as $$
declare p public.payments; proof public.payment_proofs; result public.payments;
begin
  if not exists (select 1 from profiles where id=p_reviewer_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if p_action not in ('verify','resubmit','pending') then raise exception 'invalid_action'; end if;
  select * into p from payments where id=p_payment_id for update;
  if not found or p.status <> 'Pending Verification' then raise exception 'not_pending'; end if;
  select * into proof from payment_proofs where payment_id=p.id and is_current for update;
  if not found or proof.version <> p_proof_version then raise exception 'stale_proof'; end if;
  if p.submitted_amount is distinct from p_submitted_amount or p.transaction_reference is distinct from nullif(trim(p_transaction_reference),'') then raise exception 'stale_snapshot'; end if;
  if p_action='resubmit' and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'missing_reason'; end if;
  if p_action='verify' and p.required_amount is not null and p.submitted_amount < p.required_amount then raise exception 'insufficient_amount'; end if;
  update payments set status=case p_action when 'verify' then 'Verified' when 'resubmit' then 'Needs Resubmission' else 'Pending Verification' end,
    resubmission_reason=case when p_action='resubmit' then trim(p_reason) else null end,
    reviewed_by=p_reviewer_id, reviewed_at=timezone('utc',now()), reviewed_proof_version=proof.version,
    reviewed_submitted_amount=p.submitted_amount, reviewed_transaction_reference=p.transaction_reference
    where id=p.id returning * into result;
  return result;
end; $$;
revoke all on function public.review_payment_atomic(uuid,uuid,text,integer,numeric,text,text) from public,anon,authenticated;
