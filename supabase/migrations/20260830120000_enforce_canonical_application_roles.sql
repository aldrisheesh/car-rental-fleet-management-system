alter table public.profiles
  add constraint profiles_user_type_canonical_check
  check (user_type in ('Owner/Admin', 'Operations Staff', 'Customer/Renter'));
