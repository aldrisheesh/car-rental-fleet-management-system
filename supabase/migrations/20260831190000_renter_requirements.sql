-- Vertical Slice 006: booking-linked renter requirements and private storage.
create table if not exists public.renter_requirement_sets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.booking_requests(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'Not Submitted' check (status in ('Not Submitted','Pending Review','Needs Resubmission','Verified')),
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.renter_requirement_documents (
  id uuid primary key default gen_random_uuid(),
  requirement_set_id uuid not null references public.renter_requirement_sets(id) on delete restrict,
  booking_id uuid not null references public.booking_requests(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  requirement_type text not null check (requirement_type in ('Valid Government ID','Driver''s License')),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  version integer not null check (version > 0),
  is_current boolean not null default true,
  uploaded_at timestamptz not null default timezone('utc', now()),
  superseded_at timestamptz
);
create unique index if not exists renter_requirement_documents_current_idx
  on public.renter_requirement_documents(requirement_set_id, requirement_type) where is_current;
create index if not exists renter_requirement_documents_booking_idx on public.renter_requirement_documents(booking_id, requirement_type);
drop trigger if exists renter_requirement_sets_set_updated_at on public.renter_requirement_sets;
create trigger renter_requirement_sets_set_updated_at before update on public.renter_requirement_sets
for each row execute function public.set_updated_at();

alter table public.renter_requirement_sets enable row level security;
alter table public.renter_requirement_documents enable row level security;
revoke all on public.renter_requirement_sets, public.renter_requirement_documents from anon, authenticated;
grant select on public.renter_requirement_sets, public.renter_requirement_documents to authenticated;
create policy renter_requirement_sets_customer_select on public.renter_requirement_sets for select to authenticated
  using (customer_id = auth.uid());
create policy renter_requirement_sets_owner_select on public.renter_requirement_sets for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Owner/Admin' and p.account_status = 'Active'));
create policy renter_requirement_documents_customer_select on public.renter_requirement_documents for select to authenticated
  using (customer_id = auth.uid());
create policy renter_requirement_documents_owner_select on public.renter_requirement_documents for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Owner/Admin' and p.account_status = 'Active'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('renter-requirements', 'renter-requirements', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists renter_requirements_customer_read on storage.objects;
create policy renter_requirements_customer_read on storage.objects for select to authenticated
  using (bucket_id = 'renter-requirements' and (name like (auth.uid()::text || '/%')));
drop policy if exists renter_requirements_owner_read on storage.objects;
create policy renter_requirements_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'renter-requirements' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Owner/Admin' and p.account_status = 'Active'));
drop policy if exists renter_requirements_customer_insert on storage.objects;
create policy renter_requirements_customer_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'renter-requirements' and name like (auth.uid()::text || '/%'));
