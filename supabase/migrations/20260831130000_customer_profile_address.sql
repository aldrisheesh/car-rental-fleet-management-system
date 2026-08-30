-- Vertical Slice 004: canonical customer contact/address persistence.
alter table public.profiles
  add column if not exists street_address text,
  add column if not exists barangay text,
  add column if not exists city_municipality text,
  add column if not exists province text,
  add column if not exists postal_code text;

grant update (full_name, phone_number, street_address, barangay, city_municipality, province, postal_code)
  on public.profiles to authenticated;
