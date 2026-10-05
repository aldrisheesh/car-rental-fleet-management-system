create or replace function public.prevent_allocation_snapshot_mutation() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' or tg_table_name <> 'allocation_recommendations' then raise exception 'allocation_snapshot_immutable'; end if;
 if (to_jsonb(new)-array['decision_state','approved_transfer_units','decided_by','decided_at','decision_reason','decision_reason_code']) is distinct from (to_jsonb(old)-array['decision_state','approved_transfer_units','decided_by','decided_at','decision_reason','decision_reason_code']) then raise exception 'allocation_snapshot_immutable'; end if;
 if old.decision_state<>'Pending' and (new.decision_reason is distinct from old.decision_reason or new.decision_reason_code is distinct from old.decision_reason_code) then raise exception 'allocation_decision_reason_immutable'; end if;
 return new;
end; $$;
create or replace function public.decide_allocation_recommendation_with_reason(
 p_recommendation_id uuid,p_actor_id uuid,p_decision_state text,p_approved_transfer_units integer,p_reason text
) returns public.allocation_recommendations
language plpgsql security definer set search_path='' as $$
declare r public.allocation_recommendations; c text;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
 select * into r from public.allocation_recommendations where id=p_recommendation_id for update;
 if not found then raise exception 'recommendation_not_found'; end if;
 if r.decision_state<>'Pending' then raise exception 'recommendation_already_decided'; end if;
 c:=public.booking_category_code('allocation_review',p_reason);
 if c is null or length(p_reason)>500 or (c='allocation.other' and p_reason='Other allocation decision') then raise exception 'decision_reason_required'; end if;
 if p_decision_state='Approved' then
 if p_approved_transfer_units is null or p_approved_transfer_units<=0 or p_approved_transfer_units>r.recommended_transfer_units then raise exception 'invalid_approved_quantity'; end if;
 elsif p_decision_state='Rejected' then p_approved_transfer_units:=null;
 else raise exception 'invalid_decision_state'; end if;
 update public.allocation_recommendations set decision_state=p_decision_state,approved_transfer_units=p_approved_transfer_units,decided_by=p_actor_id,decided_at=timezone('utc',now()),decision_reason=p_reason,decision_reason_code=c where id=r.id returning * into r;
 return r;
end; $$;
