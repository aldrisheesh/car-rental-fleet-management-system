-- VS019 runtime correction: allow the trusted booking-create RPC to persist
-- and return its canonical booking while browser roles remain unchanged.
grant select, insert on public.booking_requests to service_role;
