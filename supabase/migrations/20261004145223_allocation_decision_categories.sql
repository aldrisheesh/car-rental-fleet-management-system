alter table public.allocation_recommendations
 add column decision_reason text,
 add column decision_reason_code text references public.booking_categories(code);
create function public.decide_allocation_recommendation_with_reason(
 p_recommendation_id uuid,p_actor_id uuid,p_decision_state text,p_approved_transfer_units integer,p_reason text
) returns public.allocation_recommendations
language plpgsql security definer set search_path='' as $$
declare r public.allocation_recommendations; c text;
begin
 c:=public.booking_category_code('allocation_review',p_reason);
 if c is null or length(p_reason)>500 or (c='allocation.other' and p_reason='Other allocation decision') then raise exception 'decision_reason_required'; end if;
 r:=public.decide_allocation_recommendation(p_recommendation_id,p_actor_id,p_decision_state,p_approved_transfer_units);
 update public.allocation_recommendations set decision_reason=p_reason,decision_reason_code=c where id=r.id returning * into r;
 return r;
end; $$;
revoke all on function public.decide_allocation_recommendation_with_reason(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.decide_allocation_recommendation_with_reason(uuid,uuid,text,integer,text) to service_role;
