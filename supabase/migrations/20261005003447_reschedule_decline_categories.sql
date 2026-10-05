-- Reschedule decisions have their own reporting categories. Historical booking
-- rejection reasons remain unchanged.
insert into public.booking_categories (code, domain, label) values
('reschedule_decline.unavailable', 'reschedule_decline', 'Vehicle unavailable for the new dates'),
('reschedule_decline.maintenance', 'reschedule_decline', 'Vehicle needs maintenance or inspection during the new dates'),
('reschedule_decline.delivery', 'reschedule_decline', 'Delivery or collection unavailable for the new dates'),
('reschedule_decline.handover', 'reschedule_decline', 'Requested handover time cannot be accommodated'),
('reschedule_decline.revised_quote', 'reschedule_decline', 'Change requires a revised booking or quote'),
('reschedule_decline.unagreed', 'reschedule_decline', 'New dates could not be agreed with the customer'),
('reschedule_decline.other', 'reschedule_decline', 'Other reschedule decline reason');

-- Preserve the existing actor checks, locks, approval guards and function ACL.
-- Only replace the decline category validation; fail closed on unexpected drift.
do $$
declare definition text;
        previous_guard text := 'if p_action=''reject'' and public.booking_category_code(''booking_rejection'',trim(p_reason)) is null then raise exception ''reason_required''; end if;';
begin
  select pg_get_functiondef('public.review_booking_date_change(uuid,uuid,text,text)'::regprocedure) into definition;
  if strpos(definition, previous_guard) = 0 then
    raise exception 'Unexpected reschedule review validation; inspect before migrating';
  end if;
  definition := replace(definition, previous_guard,
    'if p_action=''reject'' then
       if public.booking_category_code(''reschedule_decline'',trim(p_reason)) is null
          or length(p_reason)>500
          or (public.booking_category_code(''reschedule_decline'',trim(p_reason))=''reschedule_decline.other''
              and length(trim(substring(trim(p_reason) from length(''Other reschedule decline reason'')+4)))=0)
       then raise exception ''reason_required''; end if;
     end if;');
  execute definition;
end;
$$;
