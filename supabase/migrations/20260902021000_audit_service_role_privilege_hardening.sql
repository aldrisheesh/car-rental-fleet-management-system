-- VS021 provider correction: default table privileges included TRUNCATE.
-- The server service role needs read access only; lifecycle triggers insert as
-- their security-definer owner.
revoke all on public.audit_events from service_role;
grant select on public.audit_events to service_role;
