-- VS015 correction: an idempotency key is bound to its original forecast.
create or replace function public.persist_supply_evaluation(p_forecast_id uuid,p_evaluated_by uuid,p_idempotency_key text,p_required_units integer,p_projected_supply integer,p_shortage_units integer,p_surplus_units integer,p_items jsonb)
returns public.supply_evaluations language plpgsql security definer set search_path=public as $$
declare e public.supply_evaluations; item jsonb;
begin
  if not exists(select 1 from profiles where id=p_evaluated_by and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into e from supply_evaluations where idempotency_key=p_idempotency_key;
  if found then
    if e.forecast_id <> p_forecast_id then raise exception 'idempotency_key_forecast_mismatch'; end if;
    return e;
  end if;
  insert into supply_evaluations(forecast_id,evaluated_by,idempotency_key,required_units_snapshot,projected_supply,shortage_units,surplus_units) values(p_forecast_id,p_evaluated_by,p_idempotency_key,p_required_units,p_projected_supply,p_shortage_units,p_surplus_units) returning * into e;
  for item in select value from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
    insert into supply_evaluation_vehicles(evaluation_id,vehicle_id,eligible,booking_conflict,rental_conflict,future_maintenance_conflict,exclusion_reasons) values(e.id,(item->>'vehicle_id')::uuid,(item->>'eligible')::boolean,coalesce((item->>'booking_conflict')::boolean,false),coalesce((item->>'rental_conflict')::boolean,false),coalesce((item->>'future_maintenance_conflict')::boolean,false),coalesce(item->'exclusion_reasons','[]'::jsonb));
  end loop; return e;
end; $$;
revoke all on function public.persist_supply_evaluation(uuid,uuid,text,integer,integer,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.persist_supply_evaluation(uuid,uuid,text,integer,integer,integer,integer,jsonb) to service_role;
