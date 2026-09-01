begin;

do $$
declare
  v_owner uuid := gen_random_uuid();
  v_customer uuid := gen_random_uuid();
  v_staff uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values
    (v_owner, 'vs021-owner-' || v_owner::text || '@validation.invalid', jsonb_build_object('full_name', 'VS021 Owner')),
    (v_customer, 'vs021-customer-' || v_customer::text || '@validation.invalid', jsonb_build_object('full_name', 'VS021 Customer')),
    (v_staff, 'vs021-staff-' || v_staff::text || '@validation.invalid', jsonb_build_object('full_name', 'VS021 Staff'));
  update public.profiles set user_type = 'Owner/Admin' where id = v_owner;
  update public.profiles set user_type = 'Customer/Renter' where id = v_customer;
  update public.profiles set user_type = 'Operations Staff' where id = v_staff;

  perform set_config(
    'vs021.owner_id',
    v_owner::text,
    true
  );
  perform set_config(
    'vs021.customer_id',
    v_customer::text,
    true
  );
  perform set_config(
    'vs021.staff_id',
    v_staff::text,
    true
  );
end;
$$;

do $$
declare
  v_owner uuid := nullif(current_setting('vs021.owner_id', true), '')::uuid;
  v_customer uuid := nullif(current_setting('vs021.customer_id', true), '')::uuid;
  v_staff uuid := nullif(current_setting('vs021.staff_id', true), '')::uuid;
  v_vehicle public.vehicles;
  v_method public.payment_methods;
  v_booking public.booking_requests;
  v_finder_booking public.booking_requests;
  v_requirement_set public.renter_requirement_sets;
  v_gov public.renter_requirement_documents;
  v_license public.renter_requirement_documents;
  v_review_id uuid;
  v_submission jsonb;
  v_payment public.payments;
  v_rental public.rental_transactions;
  v_maintenance public.maintenance_records;
  v_cancelled_maintenance public.maintenance_records;
  v_before_failed bigint;
  v_after_failed bigint;
  v_odometer numeric;
  v_expected jsonb := jsonb_build_object(
    'booking.created', 2,
    'booking.vehicle_assigned', 1,
    'booking.confirmed', 1,
    'requirements.submitted', 1,
    'requirements.resubmitted', 1,
    'requirements.needs_resubmission', 1,
    'requirements.verified', 1,
    'payment.submitted', 1,
    'payment.resubmitted', 1,
    'payment.needs_resubmission', 1,
    'payment.verified', 1,
    'rental.released', 1,
    'rental.returned', 1,
    'maintenance.created', 2,
    'maintenance.completed', 1,
    'maintenance.cancelled', 1
  );
  v_action text;
  v_count bigint;
begin
  if v_owner is null or v_customer is null or v_staff is null then
    raise exception 'VS021 provider validation requires one active profile for each canonical role';
  end if;

  select vehicle.* into v_vehicle
  from public.vehicles vehicle
  where vehicle.is_active
    and not exists (
      select 1 from public.rental_transactions rental
      where rental.vehicle_id = vehicle.id and rental.started_at is not null and rental.ended_at is null
    )
  order by vehicle.created_at
  limit 1;
  select method.* into v_method
  from public.payment_methods method
  where method.is_active
  order by method.created_at
  limit 1;
  if v_vehicle.id is null or v_method.id is null then
    raise exception 'VS021 provider validation requires an active vehicle and payment method';
  end if;
  v_odometer := coalesce(v_vehicle.current_odometer_km, 0) + 10;

  select * into v_booking from public.create_booking_idempotent(
    v_customer, gen_random_uuid(), repeat('a', 64), v_vehicle.id, v_vehicle.branch_id,
    v_vehicle.branch_id, '2098-01-10 01:00:00+00', '2098-01-11 01:00:00+00',
    'Provider validation', 'Validation', 'pickup', null, null, 1, null,
    false, null, null, null, null, null
  );

  -- The canonical retry returns the same booking and must not insert/audit again.
  perform public.create_booking_idempotent(
    v_customer,
    (select idempotency_key from public.booking_creation_idempotency where booking_id = v_booking.id),
    repeat('a', 64), v_vehicle.id, v_vehicle.branch_id, v_vehicle.branch_id,
    '2098-01-10 01:00:00+00', '2098-01-11 01:00:00+00', 'Provider validation',
    'Validation', 'pickup', null, null, 1, null, false, null, null, null, null, null
  );

  select * into v_finder_booking from public.create_booking_idempotent(
    v_customer, gen_random_uuid(), repeat('b', 64), v_vehicle.id, v_vehicle.branch_id,
    v_vehicle.branch_id, '2098-02-10 01:00:00+00', '2098-02-11 01:00:00+00',
    'Provider validation', 'Validation', 'pickup', null, null, 1, null,
    true, 5000, v_vehicle.category_id, 'Provider validation', 1, 'vs021-provider-validation'
  );
  if not exists (select 1 from public.booking_finder_context where booking_id = v_finder_booking.id) then
    raise exception 'Finder booking context was not created';
  end if;

  insert into public.renter_requirement_sets (booking_id, customer_id)
  values (v_booking.id, v_customer)
  returning * into v_requirement_set;
  insert into public.renter_requirement_documents (
    requirement_set_id, booking_id, customer_id, requirement_type, storage_path,
    original_filename, mime_type, size_bytes, version
  ) values (
    v_requirement_set.id, v_booking.id, v_customer, 'Valid Government ID',
    'vs021/provider-validation/gov-v1', 'gov-v1.pdf', 'application/pdf', 1, 1
  ) returning * into v_gov;
  insert into public.renter_requirement_documents (
    requirement_set_id, booking_id, customer_id, requirement_type, storage_path,
    original_filename, mime_type, size_bytes, version
  ) values (
    v_requirement_set.id, v_booking.id, v_customer, 'Driver''s License',
    'vs021/provider-validation/license-v1', 'license-v1.pdf', 'application/pdf', 1, 1
  ) returning * into v_license;
  update public.renter_requirement_sets
  set status = 'Pending Review', submitted_at = timezone('utc', now())
  where id = v_requirement_set.id;

  v_review_id := public.record_renter_requirement_review(
    v_requirement_set.id, v_owner,
    v_gov.id, v_gov.version, 'Needs Replacement', 'Replace the test document.',
    v_license.id, v_license.version, 'Accepted', '',
    'Consistent', 'Clear', 'Needs Resubmission'
  );
  if v_review_id is null then raise exception 'Requirement review did not return an ID'; end if;

  update public.renter_requirement_documents
  set is_current = false, superseded_at = timezone('utc', now())
  where id = v_gov.id;
  insert into public.renter_requirement_documents (
    requirement_set_id, booking_id, customer_id, requirement_type, storage_path,
    original_filename, mime_type, size_bytes, version
  ) values (
    v_requirement_set.id, v_booking.id, v_customer, 'Valid Government ID',
    'vs021/provider-validation/gov-v2', 'gov-v2.pdf', 'application/pdf', 1, 2
  ) returning * into v_gov;
  perform public.resubmit_renter_requirements(v_requirement_set.id, v_customer);
  perform public.record_renter_requirement_review(
    v_requirement_set.id, v_owner,
    v_gov.id, v_gov.version, 'Accepted', '',
    v_license.id, v_license.version, 'Accepted', '',
    'Consistent', 'Clear', 'Verified'
  );

  v_submission := public.submit_payment_proof_atomic(
    v_booking.id, v_customer, v_method.id, 1000, 'VS021-PRIVATE-REFERENCE-1',
    'vs021/provider-validation/payment-v1', 'payment-v1.pdf', 'application/pdf', 1
  );
  select * into v_payment from public.payments where id = (v_submission -> 'payment' ->> 'id')::uuid;
  select * into v_payment from public.review_payment_atomic(
    v_payment.id, v_owner, 'resubmit', 1, 1000, 'VS021-PRIVATE-REFERENCE-1', 'Replace test proof.'
  );
  v_submission := public.submit_payment_proof_atomic(
    v_booking.id, v_customer, v_method.id, 1000, 'VS021-PRIVATE-REFERENCE-2',
    'vs021/provider-validation/payment-v2', 'payment-v2.pdf', 'application/pdf', 1
  );
  select * into v_payment from public.payments where id = (v_submission -> 'payment' ->> 'id')::uuid;
  select * into v_payment from public.review_payment_atomic(
    v_payment.id, v_owner, 'verify', 2, 1000, 'VS021-PRIVATE-REFERENCE-2', ''
  );

  select * into v_booking from public.assign_booking_vehicle(
    v_booking.id, v_vehicle.id, v_owner, null, false, false
  );
  select * into v_booking from public.confirm_booking_atomic(
    v_booking.id, v_owner, v_booking.assigned_vehicle_id, v_booking.assigned_at
  );
  select * into v_rental from public.release_vehicle_start_rental(
    v_booking.id, v_owner, v_booking.assigned_vehicle_id, v_booking.confirmed_at,
    v_odometer, 'Full', 'Provider validation condition.', null, true, true, true
  );
  select * into v_rental from public.return_vehicle_close_rental(
    v_rental.id, v_owner, v_rental.booking_id, v_rental.vehicle_id, v_rental.started_at,
    v_odometer + 10, 'Full', 'Provider validation return.', null, null
  );

  select * into v_maintenance from public.create_maintenance_atomic(
    v_vehicle.id, 'VS021 validation service', 'Provider validation only.', false,
    timezone('utc', now()), v_odometer + 10, null, null, null, null, v_owner
  );
  perform public.update_maintenance_atomic(
    v_maintenance.id, 'Completed', v_odometer + 10, null, null, null, null, v_owner
  );
  select * into v_cancelled_maintenance from public.create_maintenance_atomic(
    v_vehicle.id, 'VS021 validation cancellation', 'Provider validation only.', false,
    timezone('utc', now()), v_odometer + 10, null, null, null, null, v_owner
  );
  perform public.update_maintenance_atomic(
    v_cancelled_maintenance.id, 'Cancelled', v_odometer + 10, null, null, null, null, v_owner
  );

  for v_action, v_count in select key, value::text::bigint from jsonb_each(v_expected)
  loop
    if (select count(*) from public.audit_events event where event.action = v_action
      and (event.booking_id in (v_booking.id, v_finder_booking.id)
        or event.entity_id in (v_maintenance.id, v_cancelled_maintenance.id))) <> v_count
    then
      raise exception 'Unexpected audit count for %', v_action;
    end if;
  end loop;

  if exists (
    select 1 from public.audit_events event
    where (event.booking_id in (v_booking.id, v_finder_booking.id)
      or event.entity_id in (v_maintenance.id, v_cancelled_maintenance.id))
      and event.metadata ?| array[
        'proof_path', 'storage_path', 'license_number', 'id_number',
        'reference_number', 'account_number', 'reviewer_notes'
      ]
  ) then
    raise exception 'Sensitive audit metadata key detected';
  end if;
  if exists (
    select 1 from public.audit_events event
    where event.metadata::text like '%VS021-PRIVATE-REFERENCE%'
      or event.metadata::text like '%provider-validation/payment%'
      or event.metadata::text like '%provider-validation/gov%'
  ) then
    raise exception 'Sensitive audit metadata value detected';
  end if;

  select count(*) into v_before_failed from public.audit_events;
  begin
    perform public.confirm_booking_atomic(
      v_booking.id, v_owner, v_booking.assigned_vehicle_id, v_booking.assigned_at
    );
    raise exception 'Repeated confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'Repeated confirmation unexpectedly succeeded' then raise; end if;
  end;
  select count(*) into v_after_failed from public.audit_events;
  if v_after_failed <> v_before_failed then raise exception 'Failed transition created an audit event'; end if;
end;
$$;

-- Owner/Admin sees audit history.
select set_config('request.jwt.claim.sub', current_setting('vs021.owner_id'), true);
set local role authenticated;
do $$
begin
  if (select count(*) from public.audit_events) < 18 then
    raise exception 'Owner/Admin could not read the validation audit events';
  end if;
end;
$$;
reset role;

-- Customer/Renter sees no audit history and cannot write it or invoke the writer.
select set_config('request.jwt.claim.sub', current_setting('vs021.customer_id'), true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.audit_events) then raise exception 'Customer read audit events'; end if;
  begin
    insert into public.audit_events(actor_type,actor_user_id,action,entity_type,entity_id)
    values ('User', auth.uid(), 'booking.created', 'booking', gen_random_uuid());
    raise exception 'Customer inserted an audit event';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.audit_events set metadata = '{}'::jsonb;
    raise exception 'Customer updated an audit event';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.audit_events;
    raise exception 'Customer deleted an audit event';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.append_user_audit_event(auth.uid(), 'booking.created', 'booking', gen_random_uuid());
    raise exception 'Customer invoked the audit writer';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Operations Staff sees no audit history.
select set_config('request.jwt.claim.sub', current_setting('vs021.staff_id'), true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.audit_events) then raise exception 'Operations Staff read audit events'; end if;
end;
$$;
reset role;

-- The trusted service role can read for the Owner/Admin server endpoint but cannot mutate history.
set local role service_role;
do $$
begin
  if (select count(*) from public.audit_events) < 18 then raise exception 'Service read boundary failed'; end if;
  begin
    update public.audit_events set metadata = '{}'::jsonb;
    raise exception 'Service role updated an audit event';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.audit_events;
    raise exception 'Service role deleted an audit event';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;

select 'PASS' as vs021_provider_validation;
