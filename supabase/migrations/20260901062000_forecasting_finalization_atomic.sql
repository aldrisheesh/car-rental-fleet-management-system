create or replace function public.finalize_forecasts(p_updates jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare u jsonb;
begin
  for u in select value from jsonb_array_elements(coalesce(p_updates,'[]'::jsonb)) loop
    update forecasts set actual_demand=(u->>'actual_demand')::numeric, ape=case when (u->>'actual_demand')::numeric > 0 then (u->>'ape')::numeric else null end where id=(u->>'forecast_id')::uuid and actual_demand is null;
    if not found then raise exception 'forecast_finalization_conflict'; end if;
  end loop;
end; $$;
revoke all on function public.finalize_forecasts(jsonb) from public, anon, authenticated;
