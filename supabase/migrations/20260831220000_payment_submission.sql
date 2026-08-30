-- VS008: canonical initial down-payment submission and manual verification.
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  instructions text not null,
  is_demo boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.payment_methods (code,label,instructions,is_demo)
values ('demo-bank-transfer','Demo bank/e-wallet','Development/demo payment method. Replace with client-confirmed details (CQ-004).',true)
on conflict (code) do nothing;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.booking_requests(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  purpose text not null default 'initial_down_payment' check (purpose = 'initial_down_payment'),
  currency text not null default 'PHP' check (currency = 'PHP'),
  required_amount numeric(12,2),
  submitted_amount numeric(12,2) check (submitted_amount is null or submitted_amount > 0),
  payment_method_id uuid references public.payment_methods(id) on delete restrict,
  payment_method_label text,
  transaction_reference text,
  status text not null default 'Not Submitted' check (status in ('Not Submitted','Pending Verification','Needs Resubmission','Verified')),
  resubmission_reason text,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  reviewed_proof_version integer,
  reviewed_submitted_amount numeric(12,2),
  reviewed_transaction_reference text,
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists payments_status_idx on public.payments(status, updated_at desc);
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  booking_id uuid not null references public.booking_requests(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  version integer not null check (version > 0),
  is_current boolean not null default true,
  uploaded_at timestamptz not null default timezone('utc', now()),
  superseded_at timestamptz
);
create unique index if not exists payment_proofs_current_idx on public.payment_proofs(payment_id) where is_current;
create index if not exists payment_proofs_booking_idx on public.payment_proofs(booking_id, uploaded_at desc);

alter table public.payment_methods enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
revoke all on public.payment_methods, public.payments, public.payment_proofs from anon, authenticated;
grant select on public.payment_methods, public.payments, public.payment_proofs to authenticated;
create policy payment_methods_active_select on public.payment_methods for select to authenticated using (is_active);
create policy payments_customer_select on public.payments for select to authenticated using (customer_id = auth.uid());
create policy payments_owner_select on public.payments for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.user_type='Owner/Admin' and p.account_status='Active'));
create policy payment_proofs_customer_select on public.payment_proofs for select to authenticated using (customer_id = auth.uid());
create policy payment_proofs_owner_select on public.payment_proofs for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.user_type='Owner/Admin' and p.account_status='Active'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('payment-proofs','payment-proofs',false,10485760,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
create policy payment_proofs_customer_read on storage.objects for select to authenticated using (bucket_id='payment-proofs' and name like (auth.uid()::text || '/%'));
create policy payment_proofs_owner_read on storage.objects for select to authenticated using (bucket_id='payment-proofs' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.user_type='Owner/Admin' and p.account_status='Active'));
create policy payment_proofs_customer_insert on storage.objects for insert to authenticated with check (bucket_id='payment-proofs' and name like (auth.uid()::text || '/%'));
