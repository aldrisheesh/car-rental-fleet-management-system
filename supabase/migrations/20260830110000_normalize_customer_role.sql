-- The initial foundation migration is already applied. Normalize its legacy
-- customer label without rewriting migration history.
alter table public.profiles
  alter column user_type set default 'Customer/Renter';

update public.profiles
set user_type = 'Customer/Renter'
where user_type = 'Customers / Renters';
