-- VS007 additive requirement review history and transactional gates.
create table if not exists public.renter_requirement_reviews (
  id uuid primary key default gen_random_uuid(),
  requirement_set_id uuid not null references public.renter_requirement_sets(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  government_id_document_id uuid not null references public.renter_requirement_documents(id) on delete restrict,
  government_id_version integer not null,
  government_id_outcome text not null check (government_id_outcome in ('Accepted','Needs Replacement')),
  government_id_reason text,
  drivers_license_document_id uuid not null references public.renter_requirement_documents(id) on delete restrict,
  drivers_license_version integer not null,
  drivers_license_outcome text not null check (drivers_license_outcome in ('Accepted','Needs Replacement')),
  drivers_license_reason text,
  identity_consistency text not null check (identity_consistency in ('Consistent','Concern')),
  lto_outcome text not null check (lto_outcome in ('Not Checked','Clear','Concern','Unavailable')),
  lto_checked_at timestamptz,
  resulting_status text not null check (resulting_status in ('Pending Review','Needs Resubmission','Verified')),
  reviewed_at timestamptz not null default timezone('utc', now()),
  constraint replacement_reasons_required check (
    (government_id_outcome = 'Accepted' or nullif(trim(government_id_reason),'') is not null) and
    (drivers_license_outcome = 'Accepted' or nullif(trim(drivers_license_reason),'') is not null)
  )
);
create index if not exists renter_requirement_reviews_set_idx on public.renter_requirement_reviews(requirement_set_id, reviewed_at desc);
alter table public.renter_requirement_reviews enable row level security;
revoke all on public.renter_requirement_reviews from anon, authenticated;
grant select on public.renter_requirement_reviews to authenticated;
create policy renter_requirement_reviews_customer_select on public.renter_requirement_reviews for select to authenticated
  using (exists (select 1 from public.renter_requirement_sets s where s.id = requirement_set_id and s.customer_id = auth.uid()));
create policy renter_requirement_reviews_owner_select on public.renter_requirement_reviews for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.user_type = 'Owner/Admin' and p.account_status = 'Active'));

create or replace function public.record_renter_requirement_review(
  p_requirement_set_id uuid, p_reviewer_id uuid, p_government_id_document_id uuid,
  p_government_id_version integer, p_government_id_outcome text, p_government_id_reason text,
  p_drivers_license_document_id uuid, p_drivers_license_version integer,
  p_drivers_license_outcome text, p_drivers_license_reason text,
  p_identity_consistency text, p_lto_outcome text, p_resulting_status text
) returns uuid language plpgsql security definer set search_path = public as $$
declare s public.renter_requirement_sets; g public.renter_requirement_documents; d public.renter_requirement_documents; rid uuid; checked timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text, 0));
  select * into s from public.renter_requirement_sets where id=p_requirement_set_id for update;
  if s.id is null or s.status <> 'Pending Review' then raise exception 'not_reviewable'; end if;
  select * into g from public.renter_requirement_documents where id=p_government_id_document_id and requirement_set_id=s.id and requirement_type='Valid Government ID' and is_current for update;
  select * into d from public.renter_requirement_documents where id=p_drivers_license_document_id and requirement_set_id=s.id and requirement_type='Driver''s License' and is_current for update;
  if g.id is null or d.id is null or g.version<>p_government_id_version or d.version<>p_drivers_license_version then raise exception 'stale_document'; end if;
  if p_resulting_status='Verified' and (p_government_id_outcome<>'Accepted' or p_drivers_license_outcome<>'Accepted' or p_identity_consistency<>'Consistent' or p_lto_outcome<>'Clear') then raise exception 'invalid_verified_gate'; end if;
  if p_resulting_status='Needs Resubmission' and p_government_id_outcome='Accepted' and p_drivers_license_outcome='Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  if p_resulting_status='Needs Resubmission' and p_lto_outcome='Unavailable' and p_government_id_outcome='Accepted' and p_drivers_license_outcome='Accepted' then raise exception 'invalid_resubmission_gate'; end if;
  if p_government_id_outcome='Needs Replacement' and nullif(trim(coalesce(p_government_id_reason,'')),'') is null then raise exception 'missing_reason'; end if;
  if p_drivers_license_outcome='Needs Replacement' and nullif(trim(coalesce(p_drivers_license_reason,'')),'') is null then raise exception 'missing_reason'; end if;
  checked := case when p_lto_outcome in ('Clear','Concern') then timezone('utc',now()) else null end;
  insert into public.renter_requirement_reviews(requirement_set_id,reviewer_id,government_id_document_id,government_id_version,government_id_outcome,government_id_reason,drivers_license_document_id,drivers_license_version,drivers_license_outcome,drivers_license_reason,identity_consistency,lto_outcome,lto_checked_at,resulting_status)
  values (s.id,p_reviewer_id,g.id,g.version,p_government_id_outcome,nullif(trim(p_government_id_reason),''),d.id,d.version,p_drivers_license_outcome,nullif(trim(p_drivers_license_reason),''),p_identity_consistency,p_lto_outcome,checked,p_resulting_status) returning id into rid;
  update public.renter_requirement_sets set status=p_resulting_status, updated_at=timezone('utc',now()) where id=s.id;
  return rid;
end; $$;
revoke all on function public.record_renter_requirement_review(uuid,uuid,uuid,integer,text,text,uuid,integer,text,text,text,text,text) from public,anon,authenticated;

create or replace function public.resubmit_renter_requirements(p_requirement_set_id uuid, p_customer_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare s public.renter_requirement_sets; r public.renter_requirement_reviews; g public.renter_requirement_documents; d public.renter_requirement_documents;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_requirement_set_id::text,0));
 select * into s from public.renter_requirement_sets where id=p_requirement_set_id and customer_id=p_customer_id for update;
 if s.id is null or s.status<>'Needs Resubmission' then raise exception 'not_resubmittable'; end if;
 select * into r from public.renter_requirement_reviews where requirement_set_id=s.id order by reviewed_at desc limit 1;
 select * into g from public.renter_requirement_documents where id=r.government_id_document_id and is_current;
 select * into d from public.renter_requirement_documents where id=r.drivers_license_document_id and is_current;
 if r.government_id_outcome='Needs Replacement' and (g.id is null or g.version<=r.government_id_version) then raise exception 'replacement_required'; end if;
 if r.drivers_license_outcome='Needs Replacement' and (d.id is null or d.version<=r.drivers_license_version) then raise exception 'replacement_required'; end if;
 update public.renter_requirement_sets set status='Pending Review', submitted_at=timezone('utc',now()), updated_at=timezone('utc',now()) where id=s.id;
 return true;
end; $$;
revoke all on function public.resubmit_renter_requirements(uuid,uuid) from public,anon,authenticated;
