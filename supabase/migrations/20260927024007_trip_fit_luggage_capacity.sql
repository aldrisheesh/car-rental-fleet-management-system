-- Customer trip-fit matching needs a fleet value the Owner/Admin can maintain.
alter table public.vehicles
  add column if not exists large_luggage_capacity integer;

alter table public.vehicles
  drop constraint if exists vehicles_large_luggage_capacity_check;

alter table public.vehicles
  add constraint vehicles_large_luggage_capacity_check
  check (large_luggage_capacity is null or large_luggage_capacity >= 0);

-- Reference values for the current demonstration fleet. They are editable in
-- Fleet Management and must be reviewed against the actual vehicle setup.
update public.vehicles
set large_luggage_capacity = case name
  when 'Toyota Wigo' then 1
  when 'Mitsubishi Mirage' then 1
  when 'Toyota Vios' then 2
  when 'Honda City' then 2
  when 'Toyota Avanza' then 3
  when 'Toyota Rush' then 3
  when 'Ford Everest' then 4
  when 'Toyota Innova' then 4
  when 'Ford Ranger' then 4
  when 'Toyota Hilux' then 4
  when 'Nissan Urvan' then 8
  when 'Toyota Hiace' then 10
  else large_luggage_capacity
end
where large_luggage_capacity is null;

alter table public.booking_finder_context
  add column if not exists large_bag_count integer;

alter table public.booking_finder_context
  drop constraint if exists booking_finder_context_large_bag_count_check;

alter table public.booking_finder_context
  add constraint booking_finder_context_large_bag_count_check
  check (large_bag_count is null or large_bag_count >= 0);

-- The finder context is immutable once saved. Replace the service-only booking
-- RPC so future Finder-origin requests persist the luggage requirement too.
drop function if exists public.create_booking_idempotent(
  uuid, uuid, text, uuid, uuid, uuid, timestamptz, timestamptz, text, text,
  text, text, text, integer, text, boolean, numeric, uuid, text, integer, text
);

create function public.create_booking_idempotent(
  p_customer_id uuid,
  p_idempotency_key uuid,
  p_request_fingerprint text,
  p_requested_vehicle_id uuid,
  p_pickup_branch_id uuid,
  p_return_branch_id uuid,
  p_pickup_at timestamptz,
  p_return_at timestamptz,
  p_destination text,
  p_purpose_of_use text,
  p_pickup_delivery_option text,
  p_pickup_location text,
  p_dropoff_location text,
  p_preferred_seat_count integer,
  p_customer_contact_number text,
  p_has_finder_context boolean,
  p_finder_maximum_budget numeric,
  p_finder_large_bag_count integer,
  p_finder_preferred_category_id uuid,
  p_finder_destination text,
  p_finder_recommendation_rank integer,
  p_finder_baseline text
)
returns public.booking_requests
language plpgsql
set search_path = public
as $$
declare
  v_booking public.booking_requests;
  v_booking_id uuid;
  v_fingerprint text;
begin
  if p_request_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_request_fingerprint';
  end if;
  if p_has_finder_context and (
    p_finder_maximum_budget is null or
    p_finder_large_bag_count is null or
    p_finder_large_bag_count < 0 or
    p_finder_recommendation_rank is null or
    p_finder_baseline is null or
    p_preferred_seat_count is null
  ) then
    raise exception 'finder_context_required';
  end if;
  if not p_has_finder_context and (
    p_finder_maximum_budget is not null or
    p_finder_large_bag_count is not null or
    p_finder_preferred_category_id is not null or
    p_finder_destination is not null or
    p_finder_recommendation_rank is not null or
    p_finder_baseline is not null
  ) then
    raise exception 'unexpected_finder_context';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_customer_id::text || ':' || p_idempotency_key::text, 0)
  );

  select binding.request_fingerprint, binding.booking_id
  into v_fingerprint, v_booking_id
  from public.booking_creation_idempotency binding
  where binding.customer_id = p_customer_id
    and binding.idempotency_key = p_idempotency_key;

  if found then
    if v_fingerprint is distinct from p_request_fingerprint then
      raise exception 'idempotency_request_mismatch';
    end if;
    select * into strict v_booking
    from public.booking_requests
    where id = v_booking_id;
    return v_booking;
  end if;

  insert into public.booking_requests (
    customer_id, requested_vehicle_id, pickup_branch_id, return_branch_id,
    pickup_at, return_at, destination, purpose_of_use, pickup_delivery_option,
    pickup_location, dropoff_location, preferred_seat_count, customer_contact_number
  ) values (
    p_customer_id, p_requested_vehicle_id, p_pickup_branch_id, p_return_branch_id,
    p_pickup_at, p_return_at, p_destination, p_purpose_of_use, p_pickup_delivery_option,
    p_pickup_location, p_dropoff_location, p_preferred_seat_count, p_customer_contact_number
  ) returning * into v_booking;

  if p_has_finder_context then
    insert into public.booking_finder_context (
      booking_id, selected_vehicle_id, requested_start, requested_end,
      passenger_count, maximum_budget, large_bag_count, preferred_category_id,
      destination, recommendation_rank, finder_baseline
    ) values (
      v_booking.id, p_requested_vehicle_id, p_pickup_at, p_return_at,
      p_preferred_seat_count, p_finder_maximum_budget, p_finder_large_bag_count,
      p_finder_preferred_category_id, p_finder_destination,
      p_finder_recommendation_rank, p_finder_baseline
    );
  end if;

  insert into public.booking_creation_idempotency (
    customer_id, idempotency_key, request_fingerprint, booking_id
  ) values (
    p_customer_id, p_idempotency_key, p_request_fingerprint, v_booking.id
  );

  return v_booking;
end;
$$;

revoke all on function public.create_booking_idempotent(
  uuid, uuid, text, uuid, uuid, uuid, timestamptz, timestamptz, text, text,
  text, text, text, integer, text, boolean, numeric, integer, uuid, text,
  integer, text
) from public, anon, authenticated;

grant execute on function public.create_booking_idempotent(
  uuid, uuid, text, uuid, uuid, uuid, timestamptz, timestamptz, text, text,
  text, text, text, integer, text, boolean, numeric, integer, uuid, text,
  integer, text
) to service_role;
