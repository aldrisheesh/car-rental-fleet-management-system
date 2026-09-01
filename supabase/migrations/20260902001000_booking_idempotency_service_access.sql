-- VS019 runtime correction: the trusted booking RPC executes as service_role
-- and requires access to its private idempotency binding table.
grant select, insert on public.booking_creation_idempotency to service_role;
