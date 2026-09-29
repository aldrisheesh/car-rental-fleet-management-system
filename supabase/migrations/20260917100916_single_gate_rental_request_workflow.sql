-- A rental stays a customer draft until its complete requirement set is submitted.
-- Owner/Admin review then controls the next gate: payment only after verification.

alter table public.booking_requests
  drop constraint if exists booking_requests_booking_status_check;

alter table public.booking_requests
  add constraint booking_requests_booking_status_check
  check (booking_status in ('Draft', 'Submitted', 'Confirmed', 'Rejected', 'Cancelled'));

alter table public.booking_requests
  alter column booking_status set default 'Draft';

create or replace function public.submit_renter_requirements(
  p_requirement_set_id uuid,
  p_customer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.renter_requirement_sets;
  v_booking public.booking_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));

  select * into v_set
  from public.renter_requirement_sets
  where id = p_requirement_set_id
    and customer_id = p_customer_id
  for update;

  if v_set.id is null or v_set.status <> 'Not Submitted' then
    raise exception 'not_submittable';
  end if;

  select * into v_booking
  from public.booking_requests
  where id = v_set.booking_id
    and customer_id = p_customer_id
  for update;

  if v_booking.id is null or v_booking.booking_status not in ('Draft', 'Submitted') then
    raise exception 'booking_not_submittable';
  end if;

  if not exists (
    select 1
    from public.renter_requirement_documents
    where requirement_set_id = v_set.id
      and requirement_type = 'Valid Government ID'
      and is_current
  ) or not exists (
    select 1
    from public.renter_requirement_documents
    where requirement_set_id = v_set.id
      and requirement_type = 'Driver''s License'
      and is_current
  ) then
    raise exception 'documents_incomplete';
  end if;

  update public.renter_requirement_sets
  set status = 'Pending Review',
      submitted_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = v_set.id;

  update public.booking_requests
  set booking_status = 'Submitted'
  where id = v_booking.id;

  return true;
end;
$$;

revoke all on function public.submit_renter_requirements(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_renter_requirements(uuid, uuid)
  to service_role;

create or replace function public.resubmit_renter_requirements(
  p_requirement_set_id uuid,
  p_customer_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.renter_requirement_sets;
  v_review public.renter_requirement_reviews;
  v_government_id public.renter_requirement_documents;
  v_drivers_license public.renter_requirement_documents;
  v_booking public.booking_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into v_set from public.renter_requirement_sets
  where id = p_requirement_set_id and customer_id = p_customer_id for update;
  if v_set.id is null or v_set.status <> 'Needs Resubmission' then raise exception 'not_resubmittable'; end if;

  select * into v_booking from public.booking_requests
  where id = v_set.booking_id and customer_id = p_customer_id for update;
  if v_booking.id is null or v_booking.booking_status not in ('Draft', 'Submitted') then raise exception 'booking_not_submittable'; end if;

  select * into v_review from public.renter_requirement_reviews
  where requirement_set_id = v_set.id order by reviewed_at desc limit 1;
  select * into v_government_id from public.renter_requirement_documents
  where id = v_review.government_id_document_id and is_current;
  select * into v_drivers_license from public.renter_requirement_documents
  where id = v_review.drivers_license_document_id and is_current;
  if v_review.government_id_outcome = 'Needs Replacement' and (v_government_id.id is null or v_government_id.version <= v_review.government_id_version) then raise exception 'replacement_required'; end if;
  if v_review.drivers_license_outcome = 'Needs Replacement' and (v_drivers_license.id is null or v_drivers_license.version <= v_review.drivers_license_version) then raise exception 'replacement_required'; end if;

  update public.renter_requirement_sets
  set status = 'Pending Review', submitted_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where id = v_set.id;
  update public.booking_requests set booking_status = 'Submitted' where id = v_booking.id;
  return true;
end;
$$;

create or replace function public.record_renter_requirement_review(
  p_requirement_set_id uuid, p_reviewer_id uuid, p_government_id_document_id uuid,
  p_government_id_version integer, p_government_id_outcome text, p_government_id_reason text,
  p_drivers_license_document_id uuid, p_drivers_license_version integer,
  p_drivers_license_outcome text, p_drivers_license_reason text,
  p_identity_consistency text, p_lto_outcome text, p_resulting_status text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_set public.renter_requirement_sets; v_booking public.booking_requests; v_government_id public.renter_requirement_documents; v_drivers_license public.renter_requirement_documents; v_review_id uuid; v_checked_at timestamptz;
begin
  if not exists (select 1 from public.profiles where id = p_reviewer_id and user_type = 'Owner/Admin' and account_status = 'Active') then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into v_set from public.renter_requirement_sets where id = p_requirement_set_id for update;
  if v_set.id is null or v_set.status <> 'Pending Review' then raise exception 'not_reviewable'; end if;
  select * into v_booking from public.booking_requests where id = v_set.booking_id for update;
  if v_booking.id is null or v_booking.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  select * into v_government_id from public.renter_requirement_documents where id = p_government_id_document_id and requirement_set_id = v_set.id and requirement_type = 'Valid Government ID' and is_current for update;
  select * into v_drivers_license from public.renter_requirement_documents where id = p_drivers_license_document_id and requirement_set_id = v_set.id and requirement_type = 'Driver''s License' and is_current for update;
  if v_government_id.id is null or v_drivers_license.id is null or v_government_id.version <> p_government_id_version or v_drivers_license.version <> p_drivers_license_version then raise exception 'stale_document'; end if;
  if p_resulting_status = 'Verified' and (p_government_id_outcome <> 'Accepted' or p_drivers_license_outcome <> 'Accepted' or p_identity_consistency <> 'Consistent' or p_lto_outcome <> 'Clear') then raise exception 'invalid_verified_gate'; end if;
  if p_resulting_status = 'Needs Resubmission' and p_government_id_outcome = 'Accepted' and p_drivers_license_outcome = 'Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  if p_resulting_status = 'Needs Resubmission' and p_lto_outcome = 'Unavailable' and p_government_id_outcome = 'Accepted' and p_drivers_license_outcome = 'Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  if p_government_id_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_government_id_reason, '')), '') is null then raise exception 'missing_reason'; end if;
  if p_drivers_license_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_drivers_license_reason, '')), '') is null then raise exception 'missing_reason'; end if;
  v_checked_at := case when p_lto_outcome in ('Clear', 'Concern') then timezone('utc', now()) else null end;
  insert into public.renter_requirement_reviews(requirement_set_id, reviewer_id, government_id_document_id, government_id_version, government_id_outcome, government_id_reason, drivers_license_document_id, drivers_license_version, drivers_license_outcome, drivers_license_reason, identity_consistency, lto_outcome, lto_checked_at, resulting_status)
  values (v_set.id, p_reviewer_id, v_government_id.id, v_government_id.version, p_government_id_outcome, nullif(trim(p_government_id_reason), ''), v_drivers_license.id, v_drivers_license.version, p_drivers_license_outcome, nullif(trim(p_drivers_license_reason), ''), p_identity_consistency, p_lto_outcome, v_checked_at, p_resulting_status)
  returning id into v_review_id;
  update public.renter_requirement_sets set status = p_resulting_status, updated_at = timezone('utc', now()) where id = v_set.id;
  if p_resulting_status = 'Needs Resubmission' then
    update public.booking_requests set booking_status = 'Draft' where id = v_booking.id;
  end if;
  return v_review_id;
end;
$$;
