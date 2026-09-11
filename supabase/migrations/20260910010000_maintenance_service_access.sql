-- Issue #8: maintenance writes run through the trusted server client.
-- Browser roles remain unable to execute these security-definer functions.
grant execute on function public.create_maintenance_atomic(
  uuid, text, text, boolean, timestamptz, numeric, numeric, date, numeric, text, uuid
) to service_role;

grant execute on function public.update_maintenance_atomic(
  uuid, text, numeric, numeric, date, numeric, text, uuid
) to service_role;
