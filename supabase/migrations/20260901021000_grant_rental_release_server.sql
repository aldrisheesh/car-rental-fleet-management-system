-- VS010 additive privilege correction: server-side service role may invoke release RPC;
-- browser roles remain denied.
grant execute on function public.release_vehicle_start_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,boolean,boolean,boolean) to service_role;
