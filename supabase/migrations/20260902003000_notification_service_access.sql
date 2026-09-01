-- VS019 trusted API access. Browser roles retain select-only own-row RLS;
-- service_role is used by current-principal reads, mark-read, and test cleanup.
grant select, delete on public.notifications to service_role;
grant update (read_at) on public.notifications to service_role;
