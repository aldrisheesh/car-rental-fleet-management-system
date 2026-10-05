-- The policy RPC is SECURITY INVOKER. The trusted server previously had only
-- SELECT/DELETE on proofs, so its acknowledgement UPDATE rolled back submission.
-- Limit the new write permission to policy fields; client roles and RLS stay intact.
grant update (policy_version, policy_acknowledged_at, policy_snapshot)
  on public.payment_proofs to service_role;
