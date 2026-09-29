-- Server-side payment reads use the service role and must be able to enrich
-- payment records with the matching system-generated quote.
grant select on table public.booking_payment_quotes to service_role;
