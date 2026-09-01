-- VS019 trusted transition/API dependencies. These grants apply only to the
-- server-held service role; anon/authenticated permissions and RLS are unchanged.
grant select, insert, update, delete on public.booking_requests to service_role;
grant select, insert, delete on public.booking_creation_idempotency to service_role;
grant select, insert, update, delete on public.renter_requirement_sets to service_role;
grant select, insert, update, delete on public.renter_requirement_documents to service_role;
grant select, delete on public.renter_requirement_reviews to service_role;
grant select on public.payment_methods to service_role;
grant select, delete on public.payments to service_role;
grant select, delete on public.payment_proofs to service_role;
