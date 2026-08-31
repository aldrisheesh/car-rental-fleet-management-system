-- VS014 correction: explicit prospective coverage and atomic persistence.
create table if not exists public.forecast_demand_coverage (
  id smallint primary key check (id = 1),
  tracking_started_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);
insert into public.forecast_demand_coverage (id, tracking_started_at)
values (1, timezone('utc', now())) on conflict (id) do nothing;
alter table public.forecast_demand_coverage enable row level security;
revoke all on public.forecast_demand_coverage from anon, authenticated;
grant select on public.forecast_demand_coverage to authenticated;
drop policy if exists forecast_coverage_internal_read on public.forecast_demand_coverage;
create policy forecast_coverage_internal_read on public.forecast_demand_coverage for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));

create or replace function public.persist_forecast_run(p_generated_by uuid, p_method text, p_idempotency_key text, p_coverage_start date, p_records jsonb, p_inputs jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare run_row forecast_runs; rec jsonb; input jsonb; record_id uuid; result jsonb;
begin
  if p_method <> 'WMA' then raise exception 'invalid_method'; end if;
  insert into forecast_runs(generated_by, method, idempotency_key, coverage_start) values (p_generated_by, p_method, p_idempotency_key, p_coverage_start) returning * into run_row;
  for rec in select * from jsonb_array_elements(coalesce(p_records, '[]'::jsonb)) loop
    insert into forecasts(run_id, branch_id, vehicle_category_id, horizon, target_week_start, target_week_end, forecasted_demand, required_vehicle_units)
    values (run_row.id, (rec->>'branch_id')::uuid, (rec->>'vehicle_category_id')::uuid, (rec->>'horizon')::smallint, (rec->>'target_week_start')::date, (rec->>'target_week_end')::date, (rec->>'forecasted_demand')::numeric, (rec->>'required_vehicle_units')::integer) returning id into record_id;
    for input in select value from jsonb_array_elements(coalesce(p_inputs, '[]'::jsonb)) as items(value) where value->>'forecast_id' = rec->>'client_record_id' loop
      insert into forecast_inputs(forecast_id, source_type, source_week_start, source_value, input_order, weight, weighted_contribution) values (record_id, input->>'source_type', (input->>'source_week_start')::date, (input->>'source_value')::numeric, (input->>'input_order')::smallint, (input->>'weight')::numeric, (input->>'weighted_contribution')::numeric);
    end loop;
  end loop;
  select jsonb_build_object('run', to_jsonb(run_row)) into result; return result;
end; $$;
revoke all on function public.persist_forecast_run(uuid,text,text,date,jsonb,jsonb) from public, anon, authenticated;

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
