-- VS017: Finder evaluates canonical operational inputs only at the trusted
-- server boundary. Browser roles retain their existing restrictions.
grant select on table public.maintenance_records to service_role;
grant select on table public.booking_requests to service_role;
grant select on table public.rental_transactions to service_role;
