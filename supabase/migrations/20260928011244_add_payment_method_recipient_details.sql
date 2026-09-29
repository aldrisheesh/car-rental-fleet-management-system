-- Optional customer-facing recipient details shown beside a payment method's QR image.
alter table public.payment_methods
  add column if not exists recipient_name text,
  add column if not exists account_number text;
