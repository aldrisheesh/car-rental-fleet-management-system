-- The hosted project does not guarantee table grants for newly-created tables.
-- Keep RLS as the policy boundary while granting the roles used by VS001.
grant all on table public.profiles, public.branches, public.vehicle_categories, public.vehicles
  to service_role;

grant select on table public.profiles to authenticated;
grant select on table public.branches, public.vehicle_categories, public.vehicles
  to authenticated;
grant update (full_name, phone_number) on table public.profiles to authenticated;
