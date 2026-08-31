-- VS010 correction: rental reads stay behind trusted server endpoints.
revoke select on public.rental_transactions from authenticated;
drop policy if exists rental_transactions_read_own on public.rental_transactions;

create unique index if not exists rental_transactions_one_active_vehicle_idx
  on public.rental_transactions(vehicle_id)
  where started_at is not null and ended_at is null;
