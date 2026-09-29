-- Store one staff-managed payment QR image for each payment method.
alter table public.payment_methods
  add column if not exists qr_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-method-qr',
  'payment-method-qr',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on table public.payment_methods to service_role;
