CREATE OR REPLACE FUNCTION public.notify_requirement_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_set public.renter_requirement_sets;
begin
  if new.resulting_status not in ('Needs Resubmission', 'Verified') then
    return new;
  end if;

  select * into strict v_set
  from public.renter_requirement_sets
  where id = new.requirement_set_id;

  insert into public.notifications (
    recipient_id,
    notification_type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    event_key
  ) values (
    v_set.customer_id,
    case new.resulting_status
      when 'Needs Resubmission' then 'requirements_needs_resubmission'
      else 'requirements_verified'
    end,
    case new.resulting_status
      when 'Needs Resubmission' then 'Requirements need an update'
      else 'Requirements verified'
    end,
    case new.resulting_status
      when 'Needs Resubmission' then 'Review the requested requirement corrections and resubmit the required documents.'
      else 'Your requirements were verified. You can proceed to the payment step.'
    end,
    'requirements',
    v_set.id,
    'requirements-review:' || new.id::text
  )
  on conflict (recipient_id, event_key) do nothing;
  return new;
end;
$function$
