create or replace function public.resubmit_renter_requirements(p_requirement_set_id uuid, p_customer_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare s public.renter_requirement_sets; r public.renter_requirement_reviews; current_doc public.renter_requirement_documents;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text,0));
 select * into s from public.renter_requirement_sets where id=p_requirement_set_id and customer_id=p_customer_id for update;
 if s.id is null or s.status<>'Needs Resubmission' then raise exception 'not_resubmittable'; end if;
 select * into r from public.renter_requirement_reviews where requirement_set_id=s.id order by reviewed_at desc limit 1;
 if r.id is null then raise exception 'not_resubmittable'; end if;
 if r.government_id_outcome='Needs Replacement' then
   select * into current_doc from public.renter_requirement_documents where requirement_set_id=s.id and requirement_type='Valid Government ID' and is_current;
   if current_doc.id is null or current_doc.version<=r.government_id_version then raise exception 'replacement_required'; end if;
 end if;
 if r.drivers_license_outcome='Needs Replacement' then
   select * into current_doc from public.renter_requirement_documents where requirement_set_id=s.id and requirement_type='Driver''s License' and is_current;
   if current_doc.id is null or current_doc.version<=r.drivers_license_version then raise exception 'replacement_required'; end if;
 end if;
 update public.renter_requirement_sets set status='Pending Review', submitted_at=timezone('utc',now()), updated_at=timezone('utc',now()) where id=s.id and status='Needs Resubmission';
 return true;
end; $$;
