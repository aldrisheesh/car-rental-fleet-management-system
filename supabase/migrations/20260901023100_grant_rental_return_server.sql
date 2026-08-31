-- VS011: trusted server execution for the return RPC.
grant execute on function public.return_vehicle_close_rental(uuid,uuid,uuid,timestamptz,numeric,text,text,text,text) to service_role;
