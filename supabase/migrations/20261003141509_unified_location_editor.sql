-- Private points remain server-only. A location and its confirmed point commit together.
create function public.invalidate_changed_location_point() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.address is distinct from old.address then
    delete from public.branch_route_points where branch_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.invalidate_changed_location_point() from public, anon, authenticated;
grant execute on function public.invalidate_changed_location_point() to service_role;
create trigger branches_invalidate_changed_point after update of address on public.branches
for each row execute function public.invalidate_changed_location_point();

create function public.save_operational_location(
  p_id uuid, p_create boolean, p_name text, p_address text,
  p_active boolean, p_point jsonb, p_actor uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_branch public.branches%rowtype; v_saved public.branch_route_points%rowtype;
begin
  if length(trim(p_name)) not between 1 and 120 or length(coalesce(p_address,'')) > 500 then
    raise exception 'Invalid location details';
  end if;
  if p_create then
    insert into public.branches(id,name,address,is_active)
    values(p_id,trim(p_name),nullif(trim(p_address),''),p_active) returning * into v_branch;
  else
    select * into v_branch from public.branches where id=p_id for update;
    if not found then raise exception 'Location no longer exists'; end if;
    update public.branches set name=trim(p_name),address=nullif(trim(p_address),''),is_active=p_active
    where id=p_id returning * into v_branch;
  end if;
  if p_point is not null then
    if p_point->>'query' is distinct from v_branch.address then raise exception 'Map address does not match location address'; end if;
    insert into public.branch_route_points(branch_id,latitude,longitude,query,label,provider,result_type,kind,confirmed_at,confirmed_by)
    values(p_id,(p_point->>'latitude')::double precision,(p_point->>'longitude')::double precision,
      p_point->>'query',p_point->>'label',p_point->>'provider',p_point->>'resultType',p_point->>'kind',now(),p_actor)
    on conflict(branch_id) do update set latitude=excluded.latitude,longitude=excluded.longitude,query=excluded.query,
      label=excluded.label,provider=excluded.provider,result_type=excluded.result_type,kind=excluded.kind,
      confirmed_at=excluded.confirmed_at,confirmed_by=excluded.confirmed_by;
  end if;
  select * into v_saved from public.branch_route_points where branch_id=p_id;
  if p_active and v_saved.branch_id is null then raise exception 'Confirm the map point before saving an active location'; end if;
  return jsonb_build_object('branch',to_jsonb(v_branch),'point',case when v_saved.branch_id is null then null else to_jsonb(v_saved) end);
end;
$$;
revoke all on function public.save_operational_location(uuid,boolean,text,text,boolean,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.save_operational_location(uuid,boolean,text,text,boolean,jsonb,uuid) to service_role;
