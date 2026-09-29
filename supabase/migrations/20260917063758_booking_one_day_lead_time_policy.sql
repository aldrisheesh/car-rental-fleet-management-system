-- Mock-defense policy: requests must start on a later Asia/Manila calendar day.
-- Existing bookings remain untouched; only a new or re-dated request is evaluated.
create or replace function public.enforce_booking_one_day_lead_time()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.pickup_at at time zone 'Asia/Manila')::date
    <= timezone('Asia/Manila', now())::date then
    raise exception 'booking_lead_time_required';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_booking_one_day_lead_time()
  from public, anon, authenticated;

drop trigger if exists booking_requests_enforce_one_day_lead_time
  on public.booking_requests;

create trigger booking_requests_enforce_one_day_lead_time
before insert or update of pickup_at on public.booking_requests
for each row execute function public.enforce_booking_one_day_lead_time();
