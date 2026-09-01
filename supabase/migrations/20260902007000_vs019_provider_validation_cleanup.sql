-- Remove disposable VS019 provider-validation records left by interrupted runs.
do $$
begin
  delete from public.notifications notification
  where notification.recipient_id in (
    select profile.id from public.profiles profile where profile.email like 'vs019-%@example.test'
  )
  or notification.related_entity_id in (
    select booking.id from public.booking_requests booking
    join public.profiles profile on profile.id = booking.customer_id
    where profile.email like 'vs019-%@example.test'
  )
  or notification.related_entity_id in (
    select requirement_set.id from public.renter_requirement_sets requirement_set
    join public.profiles profile on profile.id = requirement_set.customer_id
    where profile.email like 'vs019-%@example.test'
  )
  or notification.related_entity_id in (
    select payment.id from public.payments payment
    join public.profiles profile on profile.id = payment.customer_id
    where profile.email like 'vs019-%@example.test'
  );

  delete from public.renter_requirement_reviews review
  using public.renter_requirement_sets requirement_set, public.profiles profile
  where review.requirement_set_id = requirement_set.id
    and requirement_set.customer_id = profile.id
    and profile.email like 'vs019-%@example.test';
  delete from public.renter_requirement_documents document
  using public.profiles profile
  where document.customer_id = profile.id and profile.email like 'vs019-%@example.test';
  delete from public.renter_requirement_sets requirement_set
  using public.profiles profile
  where requirement_set.customer_id = profile.id and profile.email like 'vs019-%@example.test';

  delete from public.payment_proofs proof
  using public.profiles profile
  where proof.customer_id = profile.id and profile.email like 'vs019-%@example.test';
  delete from public.payments payment
  using public.profiles profile
  where payment.customer_id = profile.id and profile.email like 'vs019-%@example.test';

  delete from public.booking_creation_idempotency binding
  using public.profiles profile
  where binding.customer_id = profile.id and profile.email like 'vs019-%@example.test';

  alter table public.booking_finder_context disable trigger user;
  delete from public.booking_finder_context finder_context
  using public.booking_requests booking, public.profiles profile
  where finder_context.booking_id = booking.id
    and booking.customer_id = profile.id
    and profile.email like 'vs019-%@example.test';
  alter table public.booking_finder_context enable trigger user;

  delete from public.booking_requests booking
  using public.profiles profile
  where booking.customer_id = profile.id and profile.email like 'vs019-%@example.test';

  delete from auth.users auth_user
  using public.profiles profile
  where auth_user.id = profile.id and profile.email like 'vs019-%@example.test';
end;
$$;
