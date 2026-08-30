-- VS006 correction: atomically switch current document metadata during replacement.
create or replace function public.replace_renter_requirement_document(
  p_requirement_set_id uuid,
  p_booking_id uuid,
  p_customer_id uuid,
  p_requirement_type text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint,
  p_version integer
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text || ':' || p_requirement_type, 0));
  update public.renter_requirement_documents
    set is_current = false, superseded_at = timezone('utc', now())
    where requirement_set_id = p_requirement_set_id and requirement_type = p_requirement_type and is_current;
  insert into public.renter_requirement_documents
    (requirement_set_id, booking_id, customer_id, requirement_type, storage_path, original_filename, mime_type, size_bytes, version, is_current)
  values (p_requirement_set_id, p_booking_id, p_customer_id, p_requirement_type, p_storage_path, p_original_filename, p_mime_type, p_size_bytes, p_version, true)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.replace_renter_requirement_document(uuid,uuid,uuid,text,text,text,text,bigint,integer) from public, anon, authenticated;
