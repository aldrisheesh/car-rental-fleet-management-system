-- Vertical Slice 018: immutable Finder provenance attached atomically to booking creation.
create table public.booking_finder_context (
  booking_id uuid primary key references public.booking_requests (id) on delete restrict,
  selected_vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  requested_start timestamptz not null,
  requested_end timestamptz not null,
  passenger_count integer not null check (passenger_count > 0),
  maximum_budget numeric not null check (maximum_budget > 0),
  preferred_category_id uuid references public.vehicle_categories (id) on delete restrict,
  destination text check (destination is null or char_length(destination) <= 200),
  recommendation_rank integer not null check (recommendation_rank > 0),
  finder_baseline text not null,
  created_at timestamptz not null default timezone('utc', now()),
  check (requested_end > requested_start)
);

alter table public.booking_finder_context enable row level security;
revoke all on public.booking_finder_context from anon, authenticated;
grant select on public.booking_finder_context to authenticated;

create policy booking_finder_context_customer_select
  on public.booking_finder_context
  for select to authenticated
  using (
    exists (
      select 1
      from public.booking_requests booking
      where booking.id = booking_finder_context.booking_id
        and booking.customer_id = auth.uid()
    )
  );

create policy booking_finder_context_internal_select
  on public.booking_finder_context
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and profile.user_type in ('Owner/Admin', 'Operations Staff')
        and profile.account_status = 'Active'
    )
  );

create function public.prevent_booking_finder_context_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'booking_finder_context_immutable';
end;
$$;

create trigger booking_finder_context_immutable
before update or delete on public.booking_finder_context
for each row execute function public.prevent_booking_finder_context_mutation();

create function public.create_booking_with_finder_context(
  p_customer_id uuid,
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
  p_finder_maximum_budget numeric,
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
begin
  insert into public.booking_requests (
    customer_id,
    requested_vehicle_id,
    pickup_branch_id,
    return_branch_id,
    pickup_at,
    return_at,
    destination,
    purpose_of_use,
    pickup_delivery_option,
    pickup_location,
    dropoff_location,
    preferred_seat_count,
    customer_contact_number
  ) values (
    p_customer_id,
    p_requested_vehicle_id,
    p_pickup_branch_id,
    p_return_branch_id,
    p_pickup_at,
    p_return_at,
    p_destination,
    p_purpose_of_use,
    p_pickup_delivery_option,
    p_pickup_location,
    p_dropoff_location,
    p_preferred_seat_count,
    p_customer_contact_number
  )
  returning * into v_booking;

  insert into public.booking_finder_context (
    booking_id,
    selected_vehicle_id,
    requested_start,
    requested_end,
    passenger_count,
    maximum_budget,
    preferred_category_id,
    destination,
    recommendation_rank,
    finder_baseline
  ) values (
    v_booking.id,
    p_requested_vehicle_id,
    p_pickup_at,
    p_return_at,
    p_preferred_seat_count,
    p_finder_maximum_budget,
    p_finder_preferred_category_id,
    p_finder_destination,
    p_finder_recommendation_rank,
    p_finder_baseline
  );

  return v_booking;
end;
$$;

revoke all on function public.create_booking_with_finder_context(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text, text, text,
  text, integer, text, numeric, uuid, text, integer, text
) from public, anon, authenticated;
grant execute on function public.create_booking_with_finder_context(
  uuid, uuid, uuid, uuid, timestamptz, timestamptz, text, text, text, text,
  text, integer, text, numeric, uuid, text, integer, text
) to service_role;
