-- Adviser consultation: stable reporting categories and timely customer email.
create table public.booking_categories (code text primary key, domain text not null, label text not null, unique(domain,label));
alter table public.booking_categories enable row level security;
revoke all on public.booking_categories from public, anon, authenticated;
grant select on public.booking_categories to anon, authenticated, service_role;
create policy booking_categories_read on public.booking_categories for select to anon,authenticated using (true);
insert into public.booking_categories(code,domain,label) values
('purpose.family','purpose','Family trip'),
('purpose.leisure','purpose','Leisure / holiday'),
('purpose.business','purpose','Business / work'),
('purpose.airport','purpose','Airport transfer'),
('purpose.event','purpose','Wedding / special event'),
('purpose.replacement','purpose','Temporary replacement vehicle'),
('purpose.other','purpose','Other purpose'),
('destination.ncr','destination','Metro Manila'),
('destination.rizal','destination','Rizal'),
('destination.cavite','destination','Cavite'),
('destination.laguna','destination','Laguna'),
('destination.batangas','destination','Batangas'),
('destination.quezon','destination','Quezon'),
('destination.bulacan','destination','Bulacan'),
('destination.pampanga','destination','Pampanga'),
('destination.bataan','destination','Bataan'),
('destination.zambales','destination','Zambales'),
('destination.tarlac','destination','Tarlac'),
('destination.nueva_ecija','destination','Nueva Ecija'),
('destination.pangasinan','destination','Pangasinan'),
('destination.benguet','destination','Benguet / Baguio'),
('destination.other','destination','Other destination'),
('rejection.unavailable','booking_rejection','Vehicle unavailable for requested dates'),
('rejection.delivery','booking_rejection','Delivery location cannot be accommodated'),
('rejection.eligibility','booking_rejection','Driver does not meet rental requirements'),
('rejection.inconsistent','booking_rejection','Request information could not be verified'),
('rejection.terms','booking_rejection','Rental terms could not be agreed'),
('rejection.other','booking_rejection','Other rejection reason'),
('cancellation.customer','cancellation','Customer requested cancellation'),
('cancellation.vehicle','cancellation','Vehicle cannot be supplied'),
('cancellation.weather','cancellation','Weather / safety disruption'),
('cancellation.terms','cancellation','Rental terms could not be fulfilled'),
('cancellation.other','cancellation','Other cancellation reason'),
('document.unreadable','document_review','Document is unclear or unreadable'),
('document.expired','document_review','Document has expired'),
('document.incomplete','document_review','Document is incomplete'),
('document.wrong','document_review','Incorrect document submitted'),
('document.mismatch','document_review','Details do not match'),
('document.unverifiable','document_review','Document could not be verified'),
('document.other','document_review','Other document correction'),
('payment.amount','payment_review','Amount does not match the payment request'),
('payment.reference','payment_review','Transaction reference does not match'),
('payment.unreadable','payment_review','Payment proof is unclear or unreadable'),
('payment.unreceived','payment_review','Payment could not be confirmed as received'),
('payment.wrong','payment_review','Incorrect payment proof submitted'),
('payment.other','payment_review','Other payment correction'),
('reschedule.plans','rescheduling','Travel plans changed'),
('reschedule.flight','rescheduling','Flight / transport schedule changed'),
('reschedule.emergency','rescheduling','Personal emergency'),
('reschedule.weather','rescheduling','Weather / safety concern'),
('reschedule.other','rescheduling','Other date change reason'),
('allocation.readiness','allocation_review','Vehicle readiness reviewed'),
('allocation.route','allocation_review','Route / weather reviewed'),
('allocation.customer','allocation_review','Customer commitments considered'),
('allocation.unsuitable','allocation_review','Transfer is unsuitable'),
('allocation.other','allocation_review','Other allocation decision');
create function public.booking_category_code(p_domain text,p_value text) returns text language sql stable set search_path='' as $$
select code from public.booking_categories where domain=p_domain and (p_value=label or left(p_value,length(label)+3)=label||' — ') limit 1;
$$;
revoke all on function public.booking_category_code(text,text) from public,anon,authenticated;
alter table public.booking_requests add column category_codes jsonb not null default '{}'::jsonb;
create index booking_requests_category_codes_idx on public.booking_requests using gin(category_codes);
alter table public.payments add column category_codes jsonb not null default '{}'::jsonb;
create index payments_category_codes_idx on public.payments using gin(category_codes);
alter table public.renter_requirement_reviews add column category_codes jsonb not null default '{}'::jsonb;
create index renter_requirement_reviews_category_codes_idx on public.renter_requirement_reviews using gin(category_codes);
create function public.record_booking_category_codes() returns trigger language plpgsql security definer set search_path='' as $$
begin
if tg_table_name='booking_requests' then
new.category_codes := jsonb_strip_nulls(jsonb_build_object('purpose',public.booking_category_code('purpose',new.purpose_of_use),'destination',public.booking_category_code('destination',new.destination),'resolution',public.booking_category_code(case when new.booking_status='Cancelled' then 'cancellation' else 'booking_rejection' end,new.resolution_reason)));
elsif tg_table_name='payments' then
new.category_codes:=jsonb_strip_nulls(jsonb_build_object('resubmission',public.booking_category_code('payment_review',new.resubmission_reason)));
else
new.category_codes:=jsonb_strip_nulls(jsonb_build_object('government_id',public.booking_category_code('document_review',new.government_id_reason),'drivers_license',public.booking_category_code('document_review',new.drivers_license_reason),'proof_of_billing',public.booking_category_code('document_review',new.proof_of_billing_reason),'selfie_with_id',public.booking_category_code('document_review',new.selfie_with_id_reason)));
end if;
return new; end; $$;
revoke all on function public.record_booking_category_codes() from public,anon,authenticated;
create trigger booking_requests_record_categories before insert or update on public.booking_requests for each row execute function public.record_booking_category_codes();
create trigger payments_record_categories before insert or update on public.payments for each row execute function public.record_booking_category_codes();
create trigger renter_requirement_reviews_record_categories before insert or update on public.renter_requirement_reviews for each row execute function public.record_booking_category_codes();
CREATE OR REPLACE FUNCTION public.claim_booking_email_deliveries(p_booking_id uuid, p_limit integer, p_now timestamp with time zone)
 RETURNS TABLE(id uuid, recipient_user_id uuid, notification_id uuid, email_type text, attempt_count integer, recipient_email text, recipient_name text, email_notifications_enabled boolean, related_entity_type text, related_entity_id uuid, scheduled_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with candidates as (
    select delivery.id
    from public.email_deliveries delivery
    where exists (
select 1 from public.notifications n
left join public.payments p on n.related_entity_type='payment' and p.id=n.related_entity_id
left join public.renter_requirement_sets r on n.related_entity_type='requirements' and r.id=n.related_entity_id
left join public.rental_transactions t on n.related_entity_type='rental' and t.id=n.related_entity_id
where n.id=delivery.notification_id and coalesce(case when n.related_entity_type='booking' then n.related_entity_id end,p.booking_id,r.booking_id,t.booking_id)=p_booking_id
) and delivery.attempt_count < 4
      and (
        (
          delivery.status in ('Pending', 'Failed')
          and delivery.next_attempt_at <= p_now
        )
        or (
          delivery.status = 'Processing'
          and delivery.last_attempt_at <= p_now - interval '15 minutes'
        )
      )
    order by delivery.created_at, delivery.id
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ), claimed as (
    update public.email_deliveries delivery
    set status = 'Processing',
        attempt_count = delivery.attempt_count + 1,
        last_attempt_at = p_now,
        next_attempt_at = null,
        last_error_code = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select
    claimed.id,
    claimed.recipient_user_id,
    claimed.notification_id,
    claimed.email_type,
    claimed.attempt_count,
    profile.email,
    profile.full_name,
    coalesce(preference.email_notifications_enabled, true),
    notification.related_entity_type,
    notification.related_entity_id,
    case
      when claimed.email_type in ('booking_confirmed', 'upcoming_pickup')
        then booking.pickup_at
      when claimed.email_type in ('upcoming_return', 'rental_overdue')
        then rental.scheduled_return_at
      else null
    end
  from claimed
  join public.profiles profile on profile.id = claimed.recipient_user_id
  join public.notifications notification on notification.id = claimed.notification_id
  left join public.notification_preferences preference
    on preference.recipient_id = claimed.recipient_user_id
  left join public.booking_requests booking
    on notification.related_entity_type = 'booking'
    and booking.id = notification.related_entity_id
  left join public.rental_transactions rental
    on notification.related_entity_type = 'rental'
    and rental.id = notification.related_entity_id;
$function$;

revoke all on function public.claim_booking_email_deliveries(uuid,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_booking_email_deliveries(uuid,integer,timestamptz) to service_role;
alter table public.email_deliveries drop constraint email_deliveries_email_type_check;
alter table public.email_deliveries add constraint email_deliveries_email_type_check check(email_type in ('quote_issued','requirements_needs_resubmission','requirements_verified','payment_needs_resubmission','payment_verified','booking_confirmed','upcoming_pickup','upcoming_return','rental_overdue'));
CREATE OR REPLACE FUNCTION public.enqueue_transactional_email_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.notification_type not in (
    'quote_issued',
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'upcoming_pickup',
    'upcoming_return',
    'rental_overdue'
  ) then
    return new;
  end if;

  -- Email is secondary. Any outbox-only defect must not invalidate the
  -- canonical notification or the business transaction that created it.
  begin
    insert into public.email_deliveries (
      recipient_user_id,
      notification_id,
      delivery_key,
      email_type
    )
    select
      new.recipient_id,
      new.id,
      'email:notification:' || new.id::text || ':recipient:' || new.recipient_id::text,
      new.notification_type
    from public.profiles profile
    left join public.notification_preferences preference
      on preference.recipient_id = profile.id
    where profile.id = new.recipient_id
      and profile.user_type = 'Customer/Renter'
      and profile.account_status = 'Active'
      and coalesce(preference.email_notifications_enabled, true)
    on conflict (delivery_key) do nothing;
  exception when others then
    null;
  end;

  return new;
end;
$function$;
