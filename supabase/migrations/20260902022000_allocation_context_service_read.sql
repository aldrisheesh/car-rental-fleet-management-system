-- VS024 trusted Owner/Admin context API needs server-side read access only.
-- Browser roles remain governed by the existing authenticated RLS policies.
grant select on table public.allocation_recommendations,
  public.allocation_recommendation_candidates to service_role;
