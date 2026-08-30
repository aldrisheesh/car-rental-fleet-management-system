-- VS005 correction: booking creation is restricted to the trusted server boundary.
revoke insert on public.booking_requests from authenticated;
drop policy if exists booking_requests_customer_insert on public.booking_requests;
