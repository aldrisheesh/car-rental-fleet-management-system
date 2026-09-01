-- VS019 trusted transition calls. Existing RPCs revoke PUBLIC execution, so
-- explicitly allow only the server-held role used by their authenticated routes.
grant execute on function public.replace_renter_requirement_document(uuid,uuid,uuid,text,text,text,text,bigint,integer) to service_role;
grant execute on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,text,text,text) to service_role;
grant execute on function public.resubmit_renter_requirements(uuid,uuid) to service_role;
grant execute on function public.review_payment_atomic(uuid,uuid,text,integer,numeric,text,text) to service_role;
grant execute on function public.assign_booking_vehicle(uuid,uuid,uuid,text,boolean,boolean) to service_role;
grant execute on function public.confirm_booking_atomic(uuid,uuid,uuid,timestamptz) to service_role;
