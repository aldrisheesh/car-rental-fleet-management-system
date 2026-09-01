-- VS019 NTF-101 covers the existing Finder-origin path through the same trusted
-- booking-create RPC; allow that RPC to persist its canonical context row.
grant select, insert, delete on public.booking_finder_context to service_role;
