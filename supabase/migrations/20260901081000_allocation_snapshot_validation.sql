-- VS016 correction: validate immutable recommendation snapshots against VS015
-- evaluations and prevent candidate identity reuse within one generated batch.
create or replace function public.persist_allocation_recommendation_batch(
  p_generated_by uuid,
  p_idempotency_key text,
  p_context_fingerprint text,
  p_recommendations jsonb
) returns public.allocation_recommendation_batches
language plpgsql security definer set search_path=public as $$
declare
  b public.allocation_recommendation_batches;
  r public.allocation_recommendations;
  item jsonb;
  candidate jsonb;
  source_eval public.supply_evaluations;
  destination_eval public.supply_evaluations;
  source_forecast public.forecasts;
  destination_forecast public.forecasts;
begin
  if not exists(select 1 from profiles where id=p_generated_by and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null or nullif(trim(coalesce(p_context_fingerprint,'')),'') is null then raise exception 'invalid_generation_request'; end if;
  if jsonb_typeof(coalesce(p_recommendations,'[]'::jsonb)) <> 'array' then raise exception 'invalid_recommendations'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 16016));
  select * into b from allocation_recommendation_batches where idempotency_key=p_idempotency_key;
  if found then
    if b.generation_context_fingerprint <> p_context_fingerprint then raise exception 'idempotency_key_context_mismatch'; end if;
    return b;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_recommendations) rec
    cross join lateral jsonb_array_elements(coalesce(rec->'candidates','[]'::jsonb)) c
    group by c->>'vehicle_id'
    having count(*) > 1
  ) then raise exception 'canonical_snapshot_mismatch'; end if;

  insert into allocation_recommendation_batches(generated_by,idempotency_key,generation_context_fingerprint)
  values(p_generated_by,p_idempotency_key,p_context_fingerprint) returning * into b;

  for item in select value from jsonb_array_elements(p_recommendations) loop
    select * into source_eval from supply_evaluations where id=(item->>'source_supply_evaluation_id')::uuid for share;
    select * into destination_eval from supply_evaluations where id=(item->>'destination_supply_evaluation_id')::uuid for share;
    if not found then raise exception 'canonical_snapshot_mismatch'; end if;
    if source_eval.id is null or destination_eval.id is null then raise exception 'canonical_snapshot_mismatch'; end if;
    select * into source_forecast from forecasts where id=source_eval.forecast_id for share;
    if not found then raise exception 'canonical_snapshot_mismatch'; end if;
    select * into destination_forecast from forecasts where id=destination_eval.forecast_id for share;
    if not found then raise exception 'canonical_snapshot_mismatch'; end if;

    if source_eval.surplus_units <= 0 or destination_eval.shortage_units <= 0
      or source_eval.required_units_snapshot <> (item->>'source_required_units_snapshot')::integer
      or source_eval.projected_supply <> (item->>'source_projected_supply_snapshot')::integer
      or source_eval.surplus_units <> (item->>'source_surplus_snapshot')::integer
      or destination_eval.required_units_snapshot <> (item->>'destination_required_units_snapshot')::integer
      or destination_eval.projected_supply <> (item->>'destination_projected_supply_snapshot')::integer
      or destination_eval.shortage_units <> (item->>'destination_shortage_snapshot')::integer
      or (item->>'recommended_transfer_units')::integer <= 0
      or (item->>'recommended_transfer_units')::integer > source_eval.surplus_units
      or (item->>'recommended_transfer_units')::integer > destination_eval.shortage_units
      or source_forecast.branch_id = destination_forecast.branch_id
      or source_forecast.vehicle_category_id <> destination_forecast.vehicle_category_id
      or source_forecast.target_week_start <> destination_forecast.target_week_start
      or source_forecast.target_week_end <> destination_forecast.target_week_end
      or source_forecast.horizon <> destination_forecast.horizon
      or (item->>'source_branch_id')::uuid is distinct from source_forecast.branch_id
      or (item->>'destination_branch_id')::uuid is distinct from destination_forecast.branch_id
      or (item->>'vehicle_category_id')::uuid is distinct from source_forecast.vehicle_category_id
      or (item->>'forecast_horizon')::smallint is distinct from source_forecast.horizon
      or (item->>'target_week_start')::date is distinct from source_forecast.target_week_start
      or (item->>'target_week_end')::date is distinct from source_forecast.target_week_end
    then raise exception 'canonical_snapshot_mismatch'; end if;

    insert into allocation_recommendations(
      batch_id,source_supply_evaluation_id,destination_supply_evaluation_id,source_branch_id,destination_branch_id,vehicle_category_id,forecast_horizon,target_week_start,target_week_end,
      source_required_units_snapshot,source_projected_supply_snapshot,source_surplus_snapshot,destination_required_units_snapshot,destination_projected_supply_snapshot,destination_shortage_snapshot,recommended_transfer_units
    ) values (
      b.id,source_eval.id,destination_eval.id,(item->>'source_branch_id')::uuid,(item->>'destination_branch_id')::uuid,(item->>'vehicle_category_id')::uuid,(item->>'forecast_horizon')::smallint,(item->>'target_week_start')::date,(item->>'target_week_end')::date,
      (item->>'source_required_units_snapshot')::integer,(item->>'source_projected_supply_snapshot')::integer,(item->>'source_surplus_snapshot')::integer,(item->>'destination_required_units_snapshot')::integer,(item->>'destination_projected_supply_snapshot')::integer,(item->>'destination_shortage_snapshot')::integer,(item->>'recommended_transfer_units')::integer
    ) returning * into r;
    for candidate in select value from jsonb_array_elements(coalesce(item->'candidates','[]'::jsonb)) loop
      insert into allocation_recommendation_candidates(recommendation_id,vehicle_id,vehicle_name_snapshot,license_plate_snapshot,candidate_rank,idle_days_snapshot,idle_reference_snapshot,revalidation_state,explanation_codes)
      values(r.id,(candidate->>'vehicle_id')::uuid,candidate->>'vehicle_name_snapshot',nullif(candidate->>'license_plate_snapshot',''),(candidate->>'candidate_rank')::integer,(candidate->>'idle_days_snapshot')::integer,(candidate->>'idle_reference_snapshot')::timestamptz,'EligibleAtGeneration',coalesce(candidate->'explanation_codes','[]'::jsonb));
    end loop;
  end loop;
  return b;
end; $$;

revoke all on function public.persist_allocation_recommendation_batch(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.persist_allocation_recommendation_batch(uuid,text,text,jsonb) to service_role;
