-- Require the same four documents in the customer flow and owner review.
alter table public.renter_requirement_documents
  drop constraint if exists renter_requirement_documents_requirement_type_check;
alter table public.renter_requirement_documents
  add constraint renter_requirement_documents_requirement_type_check
  check (requirement_type in ('Valid Government ID', 'Driver''s License', 'Proof of Billing', 'Selfie with ID'));

alter table public.renter_requirement_reviews
  add column if not exists proof_of_billing_document_id uuid references public.renter_requirement_documents(id) on delete restrict,
  add column if not exists proof_of_billing_version integer,
  add column if not exists proof_of_billing_outcome text check (proof_of_billing_outcome in ('Accepted','Needs Replacement')),
  add column if not exists proof_of_billing_reason text,
  add column if not exists selfie_with_id_document_id uuid references public.renter_requirement_documents(id) on delete restrict,
  add column if not exists selfie_with_id_version integer,
  add column if not exists selfie_with_id_outcome text check (selfie_with_id_outcome in ('Accepted','Needs Replacement')),
  add column if not exists selfie_with_id_reason text;

create or replace function public.submit_renter_requirements(p_requirement_set_id uuid, p_customer_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_set public.renter_requirement_sets; v_booking public.booking_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into v_set from public.renter_requirement_sets where id = p_requirement_set_id and customer_id = p_customer_id for update;
  if v_set.id is null or v_set.status <> 'Not Submitted' then raise exception 'not_submittable'; end if;
  select * into v_booking from public.booking_requests where id = v_set.booking_id and customer_id = p_customer_id for update;
  if v_booking.id is null or v_booking.booking_status not in ('Draft', 'Submitted') then raise exception 'booking_not_submittable'; end if;
  if (select count(distinct requirement_type) from public.renter_requirement_documents where requirement_set_id = v_set.id and is_current and requirement_type in ('Valid Government ID','Driver''s License','Proof of Billing','Selfie with ID')) <> 4 then
    raise exception 'documents_incomplete';
  end if;
  update public.renter_requirement_sets set status = 'Pending Review', submitted_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = v_set.id;
  update public.booking_requests set booking_status = 'Submitted' where id = v_booking.id;
  return true;
end;
$$;
revoke all on function public.submit_renter_requirements(uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_renter_requirements(uuid, uuid) to service_role;

create or replace function public.resubmit_renter_requirements(p_requirement_set_id uuid, p_customer_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_set public.renter_requirement_sets; v_review public.renter_requirement_reviews; v_booking public.booking_requests;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into v_set from public.renter_requirement_sets where id = p_requirement_set_id and customer_id = p_customer_id for update;
  if v_set.id is null or v_set.status <> 'Needs Resubmission' then raise exception 'not_resubmittable'; end if;
  select * into v_booking from public.booking_requests where id = v_set.booking_id and customer_id = p_customer_id for update;
  if v_booking.id is null or v_booking.booking_status not in ('Draft', 'Submitted') then raise exception 'booking_not_submittable'; end if;
  select * into v_review from public.renter_requirement_reviews where requirement_set_id = v_set.id order by reviewed_at desc limit 1;
  if v_review.id is null then raise exception 'not_resubmittable'; end if;
  if exists (
    select 1 from (values
      ('Valid Government ID', v_review.government_id_outcome, v_review.government_id_version),
      ('Driver''s License', v_review.drivers_license_outcome, v_review.drivers_license_version),
      ('Proof of Billing', v_review.proof_of_billing_outcome, v_review.proof_of_billing_version),
      ('Selfie with ID', v_review.selfie_with_id_outcome, v_review.selfie_with_id_version)
    ) as required_document(type, outcome, reviewed_version)
    left join public.renter_requirement_documents current_doc on current_doc.requirement_set_id = v_set.id and current_doc.requirement_type = required_document.type and current_doc.is_current
    where required_document.outcome = 'Needs Replacement' and (current_doc.id is null or current_doc.version <= required_document.reviewed_version)
  ) then raise exception 'replacement_required'; end if;
  update public.renter_requirement_sets set status = 'Pending Review', submitted_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = v_set.id;
  update public.booking_requests set booking_status = 'Submitted' where id = v_booking.id;
  return true;
end;
$$;
revoke all on function public.resubmit_renter_requirements(uuid, uuid) from public, anon, authenticated;
grant execute on function public.resubmit_renter_requirements(uuid, uuid) to service_role;

create or replace function public.record_renter_requirement_review(
  p_requirement_set_id uuid, p_reviewer_id uuid,
  p_government_id_document_id uuid, p_government_id_version integer, p_government_id_outcome text, p_government_id_reason text,
  p_drivers_license_document_id uuid, p_drivers_license_version integer, p_drivers_license_outcome text, p_drivers_license_reason text,
  p_proof_of_billing_document_id uuid, p_proof_of_billing_version integer, p_proof_of_billing_outcome text, p_proof_of_billing_reason text,
  p_selfie_with_id_document_id uuid, p_selfie_with_id_version integer, p_selfie_with_id_outcome text, p_selfie_with_id_reason text,
  p_identity_consistency text, p_lto_outcome text, p_resulting_status text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_set public.renter_requirement_sets; v_booking public.booking_requests; v_review_id uuid; v_checked_at timestamptz;
begin
  if not exists (select 1 from public.profiles where id = p_reviewer_id and user_type = 'Owner/Admin' and account_status = 'Active') then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into v_set from public.renter_requirement_sets where id = p_requirement_set_id for update;
  if v_set.id is null or v_set.status <> 'Pending Review' then raise exception 'not_reviewable'; end if;
  select * into v_booking from public.booking_requests where id = v_set.booking_id for update;
  if v_booking.id is null or v_booking.booking_status <> 'Submitted' then raise exception 'booking_not_submitted'; end if;
  if not exists (select 1 from public.renter_requirement_documents where id = p_government_id_document_id and requirement_set_id = v_set.id and requirement_type = 'Valid Government ID' and is_current and version = p_government_id_version)
    or not exists (select 1 from public.renter_requirement_documents where id = p_drivers_license_document_id and requirement_set_id = v_set.id and requirement_type = 'Driver''s License' and is_current and version = p_drivers_license_version)
    or not exists (select 1 from public.renter_requirement_documents where id = p_proof_of_billing_document_id and requirement_set_id = v_set.id and requirement_type = 'Proof of Billing' and is_current and version = p_proof_of_billing_version)
    or not exists (select 1 from public.renter_requirement_documents where id = p_selfie_with_id_document_id and requirement_set_id = v_set.id and requirement_type = 'Selfie with ID' and is_current and version = p_selfie_with_id_version) then raise exception 'stale_document'; end if;
  if p_government_id_outcome not in ('Accepted','Needs Replacement') or p_drivers_license_outcome not in ('Accepted','Needs Replacement') or p_proof_of_billing_outcome not in ('Accepted','Needs Replacement') or p_selfie_with_id_outcome not in ('Accepted','Needs Replacement') then raise exception 'invalid_outcome'; end if;
  if (p_government_id_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_government_id_reason,'')), '') is null)
    or (p_drivers_license_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_drivers_license_reason,'')), '') is null)
    or (p_proof_of_billing_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_proof_of_billing_reason,'')), '') is null)
    or (p_selfie_with_id_outcome = 'Needs Replacement' and nullif(trim(coalesce(p_selfie_with_id_reason,'')), '') is null) then raise exception 'missing_reason'; end if;
  if p_resulting_status = 'Verified' and (p_government_id_outcome <> 'Accepted' or p_drivers_license_outcome <> 'Accepted' or p_proof_of_billing_outcome <> 'Accepted' or p_selfie_with_id_outcome <> 'Accepted' or p_identity_consistency <> 'Consistent' or p_lto_outcome <> 'Clear') then raise exception 'invalid_verified_gate'; end if;
  if p_resulting_status = 'Needs Resubmission' and p_government_id_outcome = 'Accepted' and p_drivers_license_outcome = 'Accepted' and p_proof_of_billing_outcome = 'Accepted' and p_selfie_with_id_outcome = 'Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  v_checked_at := case when p_lto_outcome in ('Clear', 'Concern') then timezone('utc', now()) else null end;
  insert into public.renter_requirement_reviews(requirement_set_id, reviewer_id, government_id_document_id, government_id_version, government_id_outcome, government_id_reason, drivers_license_document_id, drivers_license_version, drivers_license_outcome, drivers_license_reason, proof_of_billing_document_id, proof_of_billing_version, proof_of_billing_outcome, proof_of_billing_reason, selfie_with_id_document_id, selfie_with_id_version, selfie_with_id_outcome, selfie_with_id_reason, identity_consistency, lto_outcome, lto_checked_at, resulting_status)
  values (v_set.id, p_reviewer_id, p_government_id_document_id, p_government_id_version, p_government_id_outcome, nullif(trim(p_government_id_reason),''), p_drivers_license_document_id, p_drivers_license_version, p_drivers_license_outcome, nullif(trim(p_drivers_license_reason),''), p_proof_of_billing_document_id, p_proof_of_billing_version, p_proof_of_billing_outcome, nullif(trim(p_proof_of_billing_reason),''), p_selfie_with_id_document_id, p_selfie_with_id_version, p_selfie_with_id_outcome, nullif(trim(p_selfie_with_id_reason),''), p_identity_consistency, p_lto_outcome, v_checked_at, p_resulting_status) returning id into v_review_id;
  update public.renter_requirement_sets set status = p_resulting_status, updated_at = timezone('utc', now()) where id = v_set.id;
  if p_resulting_status = 'Needs Resubmission' then
    update public.booking_requests set booking_status = 'Draft' where id = v_booking.id;
  end if;
  return v_review_id;
end;
$$;
revoke all on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,text,text,text) to service_role;
