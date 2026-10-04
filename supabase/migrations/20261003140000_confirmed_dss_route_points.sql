-- Private owner-confirmed reference points; no customer/public address exposure.
create table public.branch_route_points (
  branch_id uuid primary key references public.branches(id) on delete cascade,
  latitude double precision not null check (latitude between 4 and 22),
  longitude double precision not null check (longitude between 116 and 127),
  query text not null check (length(query) between 5 and 500),
  label text not null check (length(label) between 1 and 500),
  provider text not null,
  result_type text not null,
  kind text not null check (kind in ('area_reference', 'movement_point')),
  confirmed_at timestamptz not null,
  confirmed_by uuid not null references public.profiles(id)
);
alter table public.branch_route_points enable row level security;
revoke all on public.branch_route_points from public, anon, authenticated;
grant select, insert, update, delete on public.branch_route_points to service_role;
comment on table public.branch_route_points is 'Owner-confirmed DSS endpoints; area references are approximate, never live vehicle tracking or parking capacity.';
