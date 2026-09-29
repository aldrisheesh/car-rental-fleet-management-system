-- Admin-only server handlers use the service-role client after application authorization.
-- It needs write access to maintain customer-facing payment methods.
grant select, insert, update on table public.payment_methods to service_role;
