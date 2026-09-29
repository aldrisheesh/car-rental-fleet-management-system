-- Canonical vehicle media. The primary image remains on vehicles.image_url for
-- compatibility with existing booking and operational views.
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  is_cover boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (vehicle_id, sort_order)
);

create unique index vehicle_images_one_cover_per_vehicle_idx
  on public.vehicle_images (vehicle_id)
  where is_cover;
create index vehicle_images_vehicle_sort_idx
  on public.vehicle_images (vehicle_id, sort_order);

alter table public.vehicle_images enable row level security;
revoke all on public.vehicle_images from anon, authenticated;
grant select on public.vehicle_images to anon, authenticated;
grant select, insert, update, delete on public.vehicle_images to service_role;

create policy vehicle_images_public_read on public.vehicle_images
  for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Only the trusted owner-admin API uses the service role to mutate these
-- objects. Public reads are intentional because vehicle photos appear in the
-- public customer catalog.
create policy vehicle_images_public_storage_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vehicle-images');
