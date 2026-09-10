-- Issue #49: trusted Decision Support handlers read these canonical tables and
-- invoke the forecast persistence/finalization functions with service_role.
-- Browser roles remain governed by the existing RLS policies.
grant select on table
  public.forecast_runs,
  public.forecasts,
  public.forecast_inputs,
  public.forecast_demand_coverage,
  public.vehicle_operational_state_events,
  public.supply_evaluations,
  public.supply_evaluation_vehicles,
  public.allocation_recommendation_batches
to service_role;

grant execute on function public.persist_forecast_run(
  uuid, text, text, date, jsonb, jsonb
) to service_role;

grant execute on function public.finalize_forecasts(jsonb)
to service_role;
