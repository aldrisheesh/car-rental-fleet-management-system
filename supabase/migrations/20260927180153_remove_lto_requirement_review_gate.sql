-- LTO is not part of requirements verification. Keep legacy audit columns and the
-- RPC argument for compatibility, but record new reviews as not checked.
create or replace function public.record_renter_requirement_review(
  p_requirement_set_id uuid, p_reviewer_id uuid,
  p_government_id_document_id uuid, p_government_id_version integer, p_government_id_outcome text, p_government_id_reason text,
  p_drivers_license_document_id uuid, p_drivers_license_version integer, p_drivers_license_outcome text, p_drivers_license_reason text,
  p_proof_of_billing_document_id uuid, p_proof_of_billing_version integer, p_proof_of_billing_outcome text, p_proof_of_billing_reason text,
  p_selfie_with_id_document_id uuid, p_selfie_with_id_version integer, p_selfie_with_id_outcome text, p_selfie_with_id_reason text,
  p_identity_consistency text, p_lto_outcome text, p_resulting_status text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_set public.renter_requirement_sets; v_booking public.booking_requests; v_review_id uuid;
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
  if p_resulting_status = 'Verified' and (p_government_id_outcome <> 'Accepted' or p_drivers_license_outcome <> 'Accepted' or p_proof_of_billing_outcome <> 'Accepted' or p_selfie_with_id_outcome <> 'Accepted' or p_identity_consistency <> 'Consistent') then raise exception 'invalid_verified_gate'; end if;
  if p_resulting_status = 'Needs Resubmission' and p_government_id_outcome = 'Accepted' and p_drivers_license_outcome = 'Accepted' and p_proof_of_billing_outcome = 'Accepted' and p_selfie_with_id_outcome = 'Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  insert into public.renter_requirement_reviews(requirement_set_id, reviewer_id, government_id_document_id, government_id_version, government_id_outcome, government_id_reason, drivers_license_document_id, drivers_license_version, drivers_license_outcome, drivers_license_reason, proof_of_billing_document_id, proof_of_billing_version, proof_of_billing_outcome, proof_of_billing_reason, selfie_with_id_document_id, selfie_with_id_version, selfie_with_id_outcome, selfie_with_id_reason, identity_consistency, lto_outcome, lto_checked_at, resulting_status)
  values (v_set.id, p_reviewer_id, p_government_id_document_id, p_government_id_version, p_government_id_outcome, nullif(trim(p_government_id_reason),''), p_drivers_license_document_id, p_drivers_license_version, p_drivers_license_outcome, nullif(trim(p_drivers_license_reason),''), p_proof_of_billing_document_id, p_proof_of_billing_version, p_proof_of_billing_outcome, nullif(trim(p_proof_of_billing_reason),''), p_selfie_with_id_document_id, p_selfie_with_id_version, p_selfie_with_id_outcome, nullif(trim(p_selfie_with_id_reason),''), p_identity_consistency, 'Not Checked', null, p_resulting_status) returning id into v_review_id;
  update public.renter_requirement_sets set status = p_resulting_status, updated_at = timezone('utc', now()) where id = v_set.id;
  if p_resulting_status = 'Needs Resubmission' then
    update public.booking_requests set booking_status = 'Draft' where id = v_booking.id;
  end if;
  return v_review_id;
end;
$$;
revoke all on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,uuid,integer,text,text,text,text,text) to service_role;
