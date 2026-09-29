-- Returned vehicles require an explicit operational inspection before reuse.
-- This extends the rental lifecycle instead of duplicating its history in a
-- second table: every inspection is tied to the completed rental that caused it.
alter table public.rental_transactions
  add column if not exists inspection_status text not null default 'Not required',
  add column if not exists inspection_remarks text,
  add column if not exists inspected_at timestamptz,
  add column if not exists inspected_by uuid references public.profiles(id) on delete restrict;

alter table public.rental_transactions
  drop constraint if exists rental_transactions_inspection_status_check;
alter table public.rental_transactions
  add constraint rental_transactions_inspection_status_check
  check (inspection_status in ('Not required', 'Pending', 'Cleared', 'Maintenance scheduled'));

-- Historic returns were completed before the inspection workflow existed.
update public.rental_transactions
set inspection_status = 'Cleared',
    inspected_at = coalesce(ended_at, timezone('utc', now()))
where ended_at is not null
  and inspection_status = 'Not required';

create index if not exists rental_transactions_vehicle_pending_inspection_idx
  on public.rental_transactions (vehicle_id, ended_at desc)
  where inspection_status = 'Pending';

create or replace function public.queue_returned_vehicle_for_inspection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.ended_at is null and new.ended_at is not null then
    new.inspection_status := 'Pending';
    new.inspection_remarks := null;
    new.inspected_at := null;
    new.inspected_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists rental_transactions_queue_inspection on public.rental_transactions;
create trigger rental_transactions_queue_inspection
before update of ended_at on public.rental_transactions
for each row execute function public.queue_returned_vehicle_for_inspection();

create or replace function public.resolve_return_inspection(
  p_rental_id uuid,
  p_outcome text,
  p_remarks text,
  p_actor_id uuid
)
returns public.rental_transactions
language plpgsql
security definer
set search_path = public
as $$
declare r public.rental_transactions;
begin
  if p_outcome not in ('Cleared', 'Maintenance scheduled') then
    raise exception 'invalid_inspection_outcome';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id
      and user_type = 'Owner/Admin'
      and account_status = 'Active'
  ) then
    raise exception 'forbidden';
  end if;

  select * into r from public.rental_transactions where id = p_rental_id for update;
  if not found then raise exception 'rental_not_found'; end if;
  if r.ended_at is null or r.inspection_status <> 'Pending' then
    raise exception 'inspection_not_pending';
  end if;
  if p_outcome = 'Maintenance scheduled'
    and nullif(trim(coalesce(p_remarks, '')), '') is null then
    raise exception 'inspection_remarks_required';
  end if;

  update public.rental_transactions
  set inspection_status = p_outcome,
      inspection_remarks = nullif(trim(coalesce(p_remarks, '')), ''),
      inspected_at = timezone('utc', now()),
      inspected_by = p_actor_id
  where id = r.id
  returning * into r;
  return r;
end;
$$;

revoke all on function public.queue_returned_vehicle_for_inspection(),
  public.resolve_return_inspection(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.resolve_return_inspection(uuid, text, text, uuid)
  to service_role;
