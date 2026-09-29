-- Controlled, clearly labelled historical fixtures for the mock-defense
-- decision-support demonstration. These rows never overwrite existing data.
-- They establish six complete Manila reporting months with varied demand,
-- completed rentals, and operational-state coverage.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where user_type = 'Customer/Renter' and account_status = 'Active'
  ) then
    raise exception 'demo_fixture_customer_missing';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_type = 'Owner/Admin' and account_status = 'Active'
  ) then
    raise exception 'demo_fixture_admin_missing';
  end if;
end;
$$;

update public.forecast_demand_coverage
set tracking_started_at = least(
  tracking_started_at,
  '2026-03-16 00:00:00+08'::timestamptz
)
where id = 1;

insert into public.vehicle_operational_state_events (
  vehicle_id,
  is_active,
  effective_at,
  source
)
select
  vehicle.id,
  vehicle.is_active,
  '2026-03-16 00:00:00+08'::timestamptz,
  'demo_decision_support_history'
from public.vehicles vehicle
where not exists (
  select 1
  from public.vehicle_operational_state_events event
  where event.vehicle_id = vehicle.id
    and event.source = 'demo_decision_support_history'
);

-- Historical records predate the one-day live-booking policy. Disabling
-- triggers only within this transaction prevents the current-time policy from
-- rejecting legitimate backfilled history; all fixture values still satisfy
-- the table constraints and foreign keys.
set local session_replication_role = replica;

with
fixture_context as (
  select
    (
      select id
      from public.profiles
      where user_type = 'Customer/Renter' and account_status = 'Active'
      order by id
      limit 1
    ) as customer_id,
    (
      select id
      from public.profiles
      where user_type = 'Owner/Admin' and account_status = 'Active'
      order by id
      limit 1
    ) as admin_id
),
category_vehicles as (
  select
    vehicle.category_id,
    array_agg(vehicle.id order by vehicle.id) as vehicle_ids
  from public.vehicles vehicle
  where vehicle.is_active
  group by vehicle.category_id
),
patterns (
  branch_name,
  category_name,
  base_demand,
  peak_every_weeks,
  peak_phase
) as (
  values
    ('Antipolo, Rizal', 'Sedan',   1, 0, 0),
    ('Taft, Manila',   'Sedan',   2, 3, 0),
    ('Taft, Manila',   'Economy', 1, 0, 0),
    ('Antipolo, Rizal', 'Economy', 2, 4, 1),
    ('Antipolo, Rizal', 'SUV',     1, 5, 2),
    ('Taft, Manila',   'Van',     1, 4, 0),
    ('Antipolo, Rizal', 'MPV',     1, 3, 1),
    ('Taft, Manila',   'MPV',     1, 5, 3)
),
weekly_demand as (
  select
    branch.id as branch_id,
    category.id as category_id,
    series.week_index,
    (
      date '2026-03-16' + ((series.week_index - 1) * 7)
    ) as week_start,
    patterns.base_demand
      + case
          when patterns.peak_every_weeks > 0
            and (series.week_index + patterns.peak_phase)
              % patterns.peak_every_weeks = 0
          then 1
          else 0
        end as demand,
    category_vehicles.vehicle_ids
  from patterns
  join public.branches branch on branch.name = patterns.branch_name
  join public.vehicle_categories category on category.name = patterns.category_name
  join category_vehicles on category_vehicles.category_id = category.id
  cross join generate_series(1, 26) as series(week_index)
),
fixture_bookings as (
  select
    context.customer_id,
    context.admin_id,
    demand.branch_id,
    demand.category_id,
    demand.week_index,
    demand.week_start,
    slot.number as slot_number,
    demand.vehicle_ids[
      ((slot.number + demand.week_index - 2)
        % cardinality(demand.vehicle_ids)) + 1
    ] as vehicle_id
  from weekly_demand demand
  cross join fixture_context context
  cross join lateral generate_series(1, demand.demand) as slot(number)
)
insert into public.booking_requests (
  id,
  customer_id,
  requested_vehicle_id,
  assigned_vehicle_id,
  pickup_branch_id,
  return_branch_id,
  pickup_at,
  return_at,
  destination,
  purpose_of_use,
  pickup_delivery_option,
  pickup_location,
  dropoff_location,
  customer_contact_number,
  booking_status,
  created_at,
  updated_at,
  assigned_by,
  assigned_at,
  assignment_note,
  substitution_acknowledged,
  cross_branch_acknowledged,
  confirmed_by,
  confirmed_at
)
select
  gen_random_uuid(),
  booking.customer_id,
  booking.vehicle_id,
  booking.vehicle_id,
  booking.branch_id,
  booking.branch_id,
  (
    (booking.week_start + ((booking.slot_number - 1) * 2))::timestamp
    + time '09:00'
  ) at time zone 'Asia/Manila',
  (
    (booking.week_start + ((booking.slot_number - 1) * 2))::timestamp
    + interval '1 day 6 hours'
    + time '09:00'
  ) at time zone 'Asia/Manila',
  'Controlled demo route',
  'Demo decision-support fixture',
  'delivery',
  'Controlled demo delivery address',
  'Controlled demo return address',
  '00000000000',
  'Confirmed',
  (
    (booking.week_start - 7)::timestamp + time '10:00'
  ) at time zone 'Asia/Manila',
  (
    (booking.week_start - 6)::timestamp + time '10:00'
  ) at time zone 'Asia/Manila',
  booking.admin_id,
  (
    (booking.week_start - 5)::timestamp + time '10:00'
  ) at time zone 'Asia/Manila',
  'Controlled fixture confirmation for decision-support testing',
  false,
  (
    select vehicle.branch_id <> booking.branch_id
    from public.vehicles vehicle
    where vehicle.id = booking.vehicle_id
  ),
  booking.admin_id,
  (
    (booking.week_start - 4)::timestamp + time '10:00'
  ) at time zone 'Asia/Manila'
from fixture_bookings booking
where not exists (
  select 1
  from public.booking_requests existing
  where existing.purpose_of_use = 'Demo decision-support fixture'
    and existing.pickup_branch_id = booking.branch_id
    and existing.requested_vehicle_id = booking.vehicle_id
    and existing.pickup_at = (
      (
        (booking.week_start + ((booking.slot_number - 1) * 2))::timestamp
        + time '09:00'
      ) at time zone 'Asia/Manila'
    )
);

with
fixture_context as (
  select id as admin_id
  from public.profiles
  where user_type = 'Owner/Admin' and account_status = 'Active'
  order by id
  limit 1
),
fixture_rentals as (
  select
    booking.*,
    row_number() over (order by booking.pickup_at, booking.id) as fixture_rank,
    (select admin_id from fixture_context) as admin_id
  from public.booking_requests booking
  where booking.purpose_of_use = 'Demo decision-support fixture'
)
insert into public.rental_transactions (
  id,
  booking_id,
  customer_id,
  vehicle_id,
  scheduled_pickup_at,
  scheduled_return_at,
  started_at,
  ended_at,
  released_by,
  release_odometer,
  release_fuel_level,
  release_condition_summary,
  existing_damage_notes,
  agreement_acknowledged,
  condition_acknowledged,
  return_schedule_acknowledged,
  created_at,
  updated_at,
  returned_by,
  return_odometer,
  return_fuel_level,
  return_condition_summary,
  return_remarks
)
select
  gen_random_uuid(),
  booking.id,
  booking.customer_id,
  booking.assigned_vehicle_id,
  booking.pickup_at,
  booking.return_at,
  booking.pickup_at,
  booking.return_at,
  booking.admin_id,
  10000 + (booking.fixture_rank * 37),
  'Full',
  'Controlled fixture release in good condition',
  null,
  true,
  true,
  true,
  booking.pickup_at,
  booking.return_at,
  booking.admin_id,
  10025 + (booking.fixture_rank * 37),
  '3/4',
  'Controlled fixture return in good condition',
  'Completed demo rental'
from fixture_rentals booking
where not exists (
  select 1
  from public.rental_transactions rental
  where rental.booking_id = booking.id
);
