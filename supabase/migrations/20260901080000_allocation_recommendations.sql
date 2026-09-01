-- VS016: immutable advisory branch-allocation recommendation snapshots.
create table public.allocation_recommendation_batches (
  id uuid primary key default gen_random_uuid(),
  generated_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz not null default timezone('utc', now()),
  idempotency_key text not null unique,
  generation_context_fingerprint text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.allocation_recommendations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.allocation_recommendation_batches(id) on delete restrict,
  source_supply_evaluation_id uuid not null references public.supply_evaluations(id) on delete restrict,
  destination_supply_evaluation_id uuid not null references public.supply_evaluations(id) on delete restrict,
  source_branch_id uuid not null references public.branches(id) on delete restrict,
  destination_branch_id uuid not null references public.branches(id) on delete restrict,
  vehicle_category_id uuid not null references public.vehicle_categories(id) on delete restrict,
  forecast_horizon smallint not null check (forecast_horizon between 1 and 3),
  target_week_start date not null,
  target_week_end date not null,
  source_required_units_snapshot integer not null check (source_required_units_snapshot >= 0),
  source_projected_supply_snapshot integer not null check (source_projected_supply_snapshot >= 0),
  source_surplus_snapshot integer not null check (source_surplus_snapshot > 0),
  destination_required_units_snapshot integer not null check (destination_required_units_snapshot >= 0),
  destination_projected_supply_snapshot integer not null check (destination_projected_supply_snapshot >= 0),
  destination_shortage_snapshot integer not null check (destination_shortage_snapshot > 0),
  recommended_transfer_units integer not null check (recommended_transfer_units > 0),
  decision_state text not null default 'Pending' check (decision_state in ('Pending','Approved','Rejected')),
  approved_transfer_units integer,
  decided_by uuid references public.profiles(id) on delete restrict,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique(batch_id, source_supply_evaluation_id, destination_supply_evaluation_id),
  check (source_branch_id <> destination_branch_id),
  check (target_week_end > target_week_start),
  check (recommended_transfer_units <= source_surplus_snapshot and recommended_transfer_units <= destination_shortage_snapshot),
  check (
    (decision_state = 'Pending' and approved_transfer_units is null and decided_by is null and decided_at is null) or
    (decision_state = 'Approved' and approved_transfer_units > 0 and approved_transfer_units <= recommended_transfer_units and decided_by is not null and decided_at is not null) or
    (decision_state = 'Rejected' and approved_transfer_units is null and decided_by is not null and decided_at is not null)
  )
);

create table public.allocation_recommendation_candidates (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.allocation_recommendations(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  vehicle_name_snapshot text not null,
  license_plate_snapshot text,
  candidate_rank integer not null check (candidate_rank > 0),
  idle_days_snapshot integer check (idle_days_snapshot is null or idle_days_snapshot >= 0),
  idle_reference_snapshot timestamptz,
  revalidation_state text not null check (revalidation_state = 'EligibleAtGeneration'),
  explanation_codes jsonb not null default '[]'::jsonb check (jsonb_typeof(explanation_codes) = 'array'),
  created_at timestamptz not null default timezone('utc', now()),
  unique(recommendation_id, vehicle_id),
  unique(recommendation_id, candidate_rank)
);

create index allocation_recommendations_batch_idx on public.allocation_recommendations(batch_id, created_at);
create index allocation_candidates_recommendation_idx on public.allocation_recommendation_candidates(recommendation_id, candidate_rank);

alter table public.allocation_recommendation_batches enable row level security;
alter table public.allocation_recommendations enable row level security;
alter table public.allocation_recommendation_candidates enable row level security;
revoke all on public.allocation_recommendation_batches, public.allocation_recommendations, public.allocation_recommendation_candidates from anon, authenticated;
grant select on public.allocation_recommendation_batches, public.allocation_recommendations, public.allocation_recommendation_candidates to authenticated;

create policy allocation_batches_internal_read on public.allocation_recommendation_batches for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));
create policy allocation_recommendations_internal_read on public.allocation_recommendations for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));
create policy allocation_candidates_internal_read on public.allocation_recommendation_candidates for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.user_type in ('Owner/Admin','Operations Staff') and p.account_status='Active'));

create function public.prevent_allocation_snapshot_mutation() returns trigger
language plpgsql set search_path=public as $$
begin
  if tg_op = 'DELETE' then raise exception 'allocation_snapshot_immutable'; end if;
  if tg_table_name <> 'allocation_recommendations' then raise exception 'allocation_snapshot_immutable'; end if;
  if (to_jsonb(new) - array['decision_state','approved_transfer_units','decided_by','decided_at'])
     is distinct from
     (to_jsonb(old) - array['decision_state','approved_transfer_units','decided_by','decided_at']) then
    raise exception 'allocation_snapshot_immutable';
  end if;
  return new;
end; $$;

create trigger allocation_batches_immutable before update or delete on public.allocation_recommendation_batches
for each row execute function public.prevent_allocation_snapshot_mutation();
create trigger allocation_recommendations_immutable before update or delete on public.allocation_recommendations
for each row execute function public.prevent_allocation_snapshot_mutation();
create trigger allocation_candidates_immutable before update or delete on public.allocation_recommendation_candidates
for each row execute function public.prevent_allocation_snapshot_mutation();

create function public.persist_allocation_recommendation_batch(
  p_generated_by uuid,
  p_idempotency_key text,
  p_context_fingerprint text,
  p_recommendations jsonb
) returns public.allocation_recommendation_batches
language plpgsql security definer set search_path=public as $$
declare b public.allocation_recommendation_batches; r public.allocation_recommendations; item jsonb; candidate jsonb;
begin
  if not exists(select 1 from profiles where id=p_generated_by and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is null or nullif(trim(coalesce(p_context_fingerprint,'')),'') is null then raise exception 'invalid_generation_request'; end if;
  if jsonb_typeof(coalesce(p_recommendations,'[]'::jsonb)) <> 'array' then raise exception 'invalid_recommendations'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 16016));
  select * into b from allocation_recommendation_batches where idempotency_key=p_idempotency_key;
  if found then
    if b.generation_context_fingerprint <> p_context_fingerprint then raise exception 'idempotency_key_context_mismatch'; end if;
    return b;
  end if;
  insert into allocation_recommendation_batches(generated_by,idempotency_key,generation_context_fingerprint)
  values(p_generated_by,p_idempotency_key,p_context_fingerprint) returning * into b;
  for item in select value from jsonb_array_elements(p_recommendations) loop
    insert into allocation_recommendations(
      batch_id,source_supply_evaluation_id,destination_supply_evaluation_id,source_branch_id,destination_branch_id,vehicle_category_id,forecast_horizon,target_week_start,target_week_end,
      source_required_units_snapshot,source_projected_supply_snapshot,source_surplus_snapshot,destination_required_units_snapshot,destination_projected_supply_snapshot,destination_shortage_snapshot,recommended_transfer_units
    ) values (
      b.id,(item->>'source_supply_evaluation_id')::uuid,(item->>'destination_supply_evaluation_id')::uuid,(item->>'source_branch_id')::uuid,(item->>'destination_branch_id')::uuid,(item->>'vehicle_category_id')::uuid,(item->>'forecast_horizon')::smallint,(item->>'target_week_start')::date,(item->>'target_week_end')::date,
      (item->>'source_required_units_snapshot')::integer,(item->>'source_projected_supply_snapshot')::integer,(item->>'source_surplus_snapshot')::integer,(item->>'destination_required_units_snapshot')::integer,(item->>'destination_projected_supply_snapshot')::integer,(item->>'destination_shortage_snapshot')::integer,(item->>'recommended_transfer_units')::integer
    ) returning * into r;
    for candidate in select value from jsonb_array_elements(coalesce(item->'candidates','[]'::jsonb)) loop
      insert into allocation_recommendation_candidates(recommendation_id,vehicle_id,vehicle_name_snapshot,license_plate_snapshot,candidate_rank,idle_days_snapshot,idle_reference_snapshot,revalidation_state,explanation_codes)
      values(r.id,(candidate->>'vehicle_id')::uuid,candidate->>'vehicle_name_snapshot',nullif(candidate->>'license_plate_snapshot',''),(candidate->>'candidate_rank')::integer,(candidate->>'idle_days_snapshot')::integer,(candidate->>'idle_reference_snapshot')::timestamptz,'EligibleAtGeneration',coalesce(candidate->'explanation_codes','[]'::jsonb));
    end loop;
  end loop;
  return b;
end; $$;

create function public.decide_allocation_recommendation(
  p_recommendation_id uuid,
  p_actor_id uuid,
  p_decision_state text,
  p_approved_transfer_units integer default null
) returns public.allocation_recommendations
language plpgsql security definer set search_path=public as $$
declare r public.allocation_recommendations;
begin
  if not exists(select 1 from profiles where id=p_actor_id and user_type='Owner/Admin' and account_status='Active') then raise exception 'forbidden'; end if;
  select * into r from allocation_recommendations where id=p_recommendation_id for update;
  if not found then raise exception 'recommendation_not_found'; end if;
  if r.decision_state <> 'Pending' then raise exception 'recommendation_already_decided'; end if;
  if p_decision_state = 'Approved' then
    if p_approved_transfer_units is null or p_approved_transfer_units <= 0 or p_approved_transfer_units > r.recommended_transfer_units then raise exception 'invalid_approved_quantity'; end if;
  elsif p_decision_state = 'Rejected' then
    p_approved_transfer_units := null;
  else raise exception 'invalid_decision_state';
  end if;
  update allocation_recommendations set decision_state=p_decision_state,approved_transfer_units=p_approved_transfer_units,decided_by=p_actor_id,decided_at=timezone('utc',now()) where id=r.id returning * into r;
  return r;
end; $$;

revoke all on function public.persist_allocation_recommendation_batch(uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.decide_allocation_recommendation(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.persist_allocation_recommendation_batch(uuid,text,text,jsonb) to service_role;
grant execute on function public.decide_allocation_recommendation(uuid,uuid,text,integer) to service_role;
