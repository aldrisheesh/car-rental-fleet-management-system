-- Public-facing contact information is kept separately from operational fleet
-- branches. This prevents an internal allocation address from appearing as a
-- customer pickup address by accident.
create table public.public_contact_settings (
  id boolean primary key default true check (id),
  phone text not null check (length(trim(phone)) between 7 and 40),
  email text not null check (length(trim(email)) between 5 and 254),
  office_hours text not null check (length(trim(office_hours)) between 3 and 120),
  location_summary text not null check (length(trim(location_summary)) between 3 and 180),
  service_area text not null check (length(trim(service_area)) between 3 and 500),
  reply_commitment text not null check (length(trim(reply_commitment)) between 3 and 180),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.public_contact_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  address text not null check (length(trim(address)) between 4 and 300),
  note text null check (note is null or length(trim(note)) <= 300),
  sort_order smallint not null default 0 check (sort_order between 0 and 99),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (sort_order)
);

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  email text not null check (length(trim(email)) between 5 and 254),
  subject text not null check (length(trim(subject)) between 2 and 180),
  message text not null check (length(trim(message)) between 10 and 5000),
  status text not null default 'New' check (status in ('New', 'Read', 'Closed')),
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz null,
  read_by uuid references public.profiles(id) on delete set null
);

create index contact_inquiries_status_created_idx
  on public.contact_inquiries (status, created_at desc);
create index public_contact_locations_active_sort_idx
  on public.public_contact_locations (is_active, sort_order);

alter table public.public_contact_settings enable row level security;
alter table public.public_contact_locations enable row level security;
alter table public.contact_inquiries enable row level security;

revoke all on public.public_contact_settings from public, anon, authenticated;
revoke all on public.public_contact_locations from public, anon, authenticated;
revoke all on public.contact_inquiries from public, anon, authenticated;
grant select, insert, update, delete on public.public_contact_settings to service_role;
grant select, insert, update, delete on public.public_contact_locations to service_role;
grant select, insert, update, delete on public.contact_inquiries to service_role;

insert into public.public_contact_settings (
  id, phone, email, office_hours, location_summary, service_area, reply_commitment
) values (
  true,
  '+63 917 555 0142',
  'hello@briahsrental.ph',
  'Mon–Sun, 7:00 AM–9:00 PM',
  'Taft, Manila · Antipolo, Rizal',
  'We serve Luzon trips. Contact us in advance for special arrangements outside the regular service area.',
  'Messages are recorded for the rental team to review during office hours.'
)
on conflict (id) do nothing;

insert into public.public_contact_locations (name, address, note, sort_order)
values
  ('Taft, Manila', '2/F Briah Building, Taft Avenue, Manila 1004', 'Main pickup hub for Metro Manila rentals.', 0),
  ('Antipolo, Rizal', 'Sumulong Highway, Antipolo, Rizal 1870', 'Convenient for Rizal and eastern Luzon trips.', 1)
on conflict (sort_order) do nothing;
