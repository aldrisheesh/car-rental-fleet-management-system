# Hosted QA Reset Preflight

Read-only preflight for the proposed hosted Supabase QA reset of Briah's Car Rental.

This document records verification performed on 2026-09-15. No hosted database reset, schema drop, table truncation, Auth deletion, Storage cleanup, fixture cleanup/apply, migration change, source change, deployment, merge, or production action was performed.

Repository state at the start of verification:

- Branch: `stabilization/frontend-rebuild`
- Starting HEAD: `11a5f199dc2fd46480abd69907c5e3360ff30487` (`docs: plan clean defense dataset baseline`)
- Working tree: clean
- `origin/stabilization/frontend-rebuild`: same starting HEAD
- `origin/main`: `faed190d9b78bb845e2c89e7160eda90106f741f`, unchanged during verification
- Installed local CLI: `supabase` `2.116.0`, invoked as `npx --no-install supabase`

The Lead-supplied plan hash `11a5f19dc2fd46480abd69907c5e3360ff30487` did not resolve verbatim. The current branch tip has the plan commit subject and differs by one character in the full hash (`11a5f199...`). This apparent hash transcription issue must be confirmed before any later destructive authorization.

## Lead decision

The Lead decision for this effort is:

- use the existing hosted Supabase QA project for the defense environment;
- do not establish a local Docker Supabase stack;
- rebuild the same hosted non-production QA project from repository migrations later;
- create a clean intentional defense dataset after the reset;
- do not reset during this pre-destructive verification session.

The repository plan and controlled-E2E documents were read in full, together with `scripts/qa/README.md`, `supabase/config.toml`, the migration directory, and `package.json`. The plan's earlier local-only posture is superseded by the current Lead decision for this session; its safety and dataset requirements remain relevant.

## Linked project identity

The currently linked project is positively identified as follows:

| Safe identifier | Verified value |
| --- | --- |
| Project ref | `cpkyxnxpzufigcmaptpg` |
| Project name | `car-rental-fleet-management-system` |
| Region | `ap-northeast-1` |
| Project status | `ACTIVE_HEALTHY` |
| CLI linked status | `true` |
| Database version | PostgreSQL 17.6.1.166 |
| Read-only server port | `5432` through the hosted pooler |

The ref was verified from the Supabase CLI linked-project metadata, `supabase/.temp/project-ref`, the safe linked-project metadata file, and the accessible project list. The API URL ref, the configured `SUPABASE_URL` ref, and the project ref derived from `QA_FIXTURE_DATABASE_URL` all resolve to `cpkyxnxpzufigcmaptpg`. No URL, password, token, service-role key, or connection string was recorded here.

The application target is therefore aligned by project ref, but the environment label is not: `.env.local` currently says `QA_FIXTURE_TARGET=local` while the configured API/database endpoints and linked project are hosted. That label is stale or misleading and is not used as evidence of reset safety. `supabase/config.toml` identifies the local project name and local ports; it does not replace the linked hosted project identity.

No local Docker or Podman stack was started. The local Supabase status command could not inspect a local stack because Docker/Podman is unavailable, consistent with the Lead decision not to establish one.

## Environment classification

**A. HOSTED NON-PRODUCTION QA — SAFE TO CONSIDER RESET**

Evidence supporting classification A:

- the Lead explicitly selected the existing hosted Supabase QA project;
- the linked project is the repository-named project and is the only accessible linked project returned by the CLI;
- all three configured application/database identities resolve to the same project ref;
- the repository describes the shared development/validation Supabase data as disposable non-production data;
- the current rows are canonical synthetic reference data, marked QA fixtures, marked historical QA fixtures, controlled E2E lineage, or unmarked test residue;
- the current inventory contains the expected DEV vehicle identifiers and synthetic QA markers, not an identified production dataset.

This classification means safe to consider a reset, not authorized to reset. Supabase project metadata does not carry an independent `QA` label, and unmarked data remains present. Final authorization must name the exact ref and attest that no client, operational, production, or shared-staging data in this project must be retained.

## Production exclusion

The repository identifies `briahscarrental.site` as the production web host, but that host is not the Supabase project identity. The linked database ref is independently established as `cpkyxnxpzufigcmaptpg`; the production web host must not be used to infer the database target.

The read-only inspection did not return or record customer names, email addresses, phone numbers, document contents, payment details, Storage paths, or other customer PII. Safe classification was based on counts, statuses, synthetic markers, repository lineage, project metadata, and exact ref matching. It was not based on the stale `QA_FIXTURE_TARGET=local` label.

No evidence was found that the linked project is the production database. However, project metadata alone cannot prove whether an organization uses the project as shared staging or retains legitimate business data. The 11 unmarked/ambiguous Auth users and the unmarked application rows listed below require a Lead attestation that they are disposable QA residue. If that attestation cannot be made, classification must change to **C. ENVIRONMENT IDENTITY AMBIGUOUS — STOP** and reset is forbidden.

## Current data inventory

All counts below were obtained read-only. Classification labels are safe lineage classes; no PII or file contents are included.

### Reference and account data

| Object | Total | Classification |
| --- | ---: | --- |
| Branches | 3 | 2 canonical (`Taft, Manila`, `Antipolo, Rizal`); 1 VS/test residue (`VS003`-style branch) |
| Vehicle categories | 6 | All six canonical migration categories: Economy, Sedan, SUV, MPV, Van, Pickup |
| Vehicles | 12 | All canonical active `DEV-*` vehicles; no VS/test vehicle rows |
| Auth users | 33 | 11 standard QA fixture, 9 historical QA fixture, 2 controlled E2E, 11 unmarked/ambiguous |
| Profiles | 33 | One profile per Auth user; same account classification as Auth users |
| Active demo payment methods | 1 | Canonical `demo-bank-transfer` method |

All 33 profiles are active. Role counts are 28 `Customer/Renter`, 1 `Operations Staff`, and 4 `Owner/Admin`.

### Application and workflow data

| Object | Total | Classification |
| --- | ---: | --- |
| Booking requests | 111 | 22 standard QA, 81 historical QA, 1 controlled E2E, 7 unmarked |
| Renter requirement sets | 19 | 11 standard QA, 1 controlled E2E, 7 unmarked |
| Requirement documents | 26 | 18 standard QA, 2 controlled E2E, 6 unmarked |
| Requirement reviews | 11 | 8 standard QA, 1 controlled E2E, 2 unmarked |
| Payments | 8 | 7 standard QA, 1 controlled E2E |
| Payment proofs | 8 | 7 standard QA, 1 controlled E2E |
| Rental transactions | 81 | 5 standard QA, 75 historical QA, 1 controlled E2E |
| Maintenance records | 8 | 5 standard QA, 3 historical QA |
| Notifications | 61 | 8 standard QA, 15 controlled E2E, 38 unmarked |
| Audit events | 51 | 30 standard QA, 9 controlled E2E, 12 unmarked |
| Transactional email outbox rows (`email_deliveries`) | 9 | 4 standard QA, 3 controlled E2E, 2 unmarked |
| Booking finder context | 2 | 1 controlled E2E, 1 unmarked |
| Booking creation idempotency rows | 8 | 1 controlled E2E, 7 unmarked |

Workflow status counts:

- Bookings: 24 Submitted, 81 Confirmed, 3 Rejected, 3 Cancelled.
- Requirement sets: 6 Not Submitted, 2 Pending Review, 2 Needs Resubmission, 9 Verified.
- Payments: 1 Pending Verification, 1 Needs Resubmission, 6 Verified.
- Rentals: 2 Active, 79 Returned/ended.
- Maintenance: 7 Completed, 1 Cancelled.

### Decision Support data

| Object | Total | Classification |
| --- | ---: | --- |
| Vehicle operational state events | 24 | 12 canonical migration-established initial events; 12 historical QA events |
| Forecast-demand coverage singleton | 1 | Unmarked/legacy synthetic coverage state; must be freshly established by migration |
| Forecast runs | 2 | Unmarked/legacy generated output |
| Forecast inputs | 162 | Unmarked/legacy generated output |
| Forecast rows | 54 | Unmarked/legacy generated output |
| Supply evaluations | 3 | Unmarked/legacy generated output |
| Supply-evaluation vehicle rows | 1 | Unmarked/legacy generated output |
| Allocation recommendation batches | 5 | Unmarked/legacy generated output |
| Allocation recommendations | 0 | None |
| Allocation recommendation candidates | 0 | None |

Decision Support output rows are not treated as canonical or defense data. They are derived residue and must be regenerated through application services after the intentional historical inputs exist.

### Storage data

| Object | Total | Classification |
| --- | ---: | --- |
| Storage buckets | 2 | Canonical private buckets: `payment-proofs` and `renter-requirements` |
| Storage objects | 34 | 25 standard QA, 3 controlled E2E, 6 unmarked; no historical objects |

Read-only Storage API listing matched all 34 current metadata rows: 8 payment-proof objects and 26 renter-requirement objects. This establishes that the current objects are physical/API-visible objects, not metadata-only rows. Every current object had a corresponding current document or proof binding; no orphan/missing binding was found. No object path or content was recorded.

The current inventory is therefore accumulated QA, fixture, historical, controlled-E2E, VS/test, and unmarked residue. No unmarked row is promoted into the future defense dataset by assumption.

The current schema also reports 33 public tables with RLS enabled, 8 of 8 inspected Storage tables with RLS enabled, 45 public functions, 40 public triggers, and 6 current Storage policies. These are reset/recreation verification points, not data-retention exceptions.

## Migration-history comparison

Read-only `npx --no-install supabase migration list --linked --output-format json` comparison:

| Migration history | Count |
| --- | ---: |
| Local migration files | 52 |
| Linked remote migration entries | 51 |
| Local-only migration entries | 1 |
| Remote-only migration entries | 0 |

The previously observed 51-versus-52 discrepancy still exists. The exact local-only migration is:

`20260910010000_maintenance_service_access.sql`

It grants `service_role` execute access to the existing maintenance atomic functions; it does not add a table. The complete local migration set is sufficient to recreate the current required application schema, with the pending privilege migration applied during a future reset. No migration history repair, push, or reset was performed.

The future reset must verify that all 52 local migrations are recorded remotely after replay. The history discrepancy is understood but remains a required post-reset check; it is not permission to repair the remote history now.

## Remote reset semantics

The installed CLI is `2.116.0`. Its help identifies `--linked` as “Resets the linked project with local migrations.” The current installed remote path is the destructive legacy reset path: after interactive confirmation, it drops user-created application objects, applies the local migrations, and optionally applies seed SQL. The intended command uses `--no-seed` because seed mode is enabled in `supabase/config.toml` but `supabase/seed.sql` is absent.

The exact later command is:

```sh
npx --no-install supabase db reset --linked --no-seed
```

This command was not run. It is destructive and must not be run until the exact ref and every hard safety condition below are approved.

The installed behavior was checked against the CLI source at the installed tag, in addition to the CLI help. The relevant implementation is [the v2.116.0 remote schema-drop routine](https://github.com/supabase/cli/blob/v2.116.0/apps/cli/src/legacy/commands/db/shared/legacy-drop-schemas.ts). Supabase describes linked remote reset as a destructive development/staging workflow in its [CLI workflow guidance](https://supabase.com/docs/guides/local-development/cli-workflows) and [CLI reference](https://supabase.com/docs/reference/cli/supabase-db-reset).

Effect in this project:

- **Public/application schema:** user-created public tables, views, materialized views, sequences, types, functions, and related application objects are dropped and recreated by local migrations. Runtime rows in public application tables are lost.
- **Migration history:** migration-history tables are cleared as part of the reset path and rebuilt from the 52 local migration files. The expected post-reset history is 52 local entries.
- **Auth schema/users:** Auth tables are retained as managed schema objects but user rows are truncated, except for the Auth migration-history allowance. All 33 current hosted Auth users are expected to be removed. Recreated public triggers/functions do not recreate users.
- **Profiles:** `public.profiles` is an application table and is recreated empty. No profiles survive the reset.
- **Audit events:** `public.audit_events` is recreated empty. Current 51 audit rows do not survive.
- **Notifications:** `public.notifications` is recreated empty. Current 61 notification rows do not survive.
- **Outbox rows:** `public.email_deliveries`, the transactional email outbox, is recreated empty. Current 9 rows do not survive.
- **Functions, triggers, RLS, and policies:** existing user-defined application functions/triggers and policies are removed by the drop routine and recreated only when present in the local migrations. Post-reset checks must verify the complete migration-defined set.
- **Extensions:** the installed drop routine preserves its managed/allowlisted extensions and drops non-allowlisted extensions unless migrations recreate them. Required extensions must be verified after replay.
- **Custom PostgreSQL roles:** the routine does not drop cluster-level roles. Object grants and policy state still require post-reset verification; local migrations re-establish the intended application grants.
- **Migration-established reference data:** migrations recreate the two canonical branches, six categories, 12 `DEV-*` vehicles, active demo payment method, 12 initial vehicle-state events, and one fresh forecast-demand coverage singleton. Bucket migrations use upsert behavior for the two canonical bucket definitions.

The reset command is not equivalent to a complete hosted project purge: it does not perform Storage API cleanup, Auth bootstrap, or application dataset creation.

## Auth impact

The current CLI reset path truncates hosted Auth user tables. Auth users therefore do not survive this reset. The post-reset consequence is a zero-user/zero-profile bootstrap state; the first Owner/Admin must be established before the Admin workflow can promote staff.

The supported post-reset path is:

1. Create exactly one initial Owner/Admin through a one-time trusted Supabase Auth-admin/service-role bootstrap, allowing the normal Auth profile trigger to create the profile and then assigning `Owner/Admin` through the audited trusted admin path. Do not use a production credential, and do not run the QA fixture script during this preflight.
2. Register one staff account through the normal application registration flow, then promote it from the current default `Customer/Renter` role to `Operations Staff` through the current Owner/Admin `/admin/users` workflow and its `PATCH /api/admin-users` path.
3. Register three synthetic customer accounts through the normal `/api/auth/sign-up` flow. The profile trigger creates each profile with the application default role.
4. Verify exactly five active profiles and Auth users: 1 Owner/Admin, 1 Operations Staff, and 3 Customer/Renter accounts.

The application does not provide a normal public path for creating the first Owner/Admin, so the one minimal trusted bootstrap is the exception. No account was created or deleted during this preflight.

## Storage impact

For the installed CLI behavior, the reset routine does not target the `storage` schema. Therefore:

- **Storage metadata rows:** survive; the two bucket rows and current object metadata are not removed by `db reset --linked`.
- **Physical Storage objects:** survive; the current Storage API listing confirmed that all 34 current objects are physically/API-visible.
- **Classification:** this is **C. neither metadata nor physical objects are deleted**, with a separate supported API cleanup required if the objects are confirmed disposable. It is also the practical **D. behavior requiring separate API cleanup** case.

The official Storage guidance says to delete objects through the Storage API rather than SQL because SQL deletion can leave the physical object orphaned. See [Storage object deletion](https://supabase.com/docs/guides/storage/management/delete-objects), [`emptyBucket`](https://supabase.com/docs/reference/javascript/file-buckets-emptybucket), [`remove`](https://supabase.com/docs/reference/javascript/file-buckets-remove), and [`deleteBucket`](https://supabase.com/docs/reference/javascript/file-buckets-deletebucket). The historical CLI issue documenting this class of reset behavior is [supabase/cli#3252](https://github.com/supabase/cli/issues/3252); the installed source inspection is the controlling evidence for this version.

The later cleanup mechanism, only after final disposable-data approval, is:

- retain the two canonical buckets;
- use the authenticated Supabase Storage API with the service-role server client to call `storage.emptyBucket('renter-requirements')` and `storage.emptyBucket('payment-proofs')`, or remove exact listed paths with `storage.from(bucket).remove(paths)` in batches of at most 1,000;
- never delete `storage.objects` through SQL;
- verify both the Storage API listing and `storage.objects` metadata count are zero after cleanup;
- stop if the API and metadata disagree, if any object is not confirmed disposable, or if bucket policy recreation is incomplete.

No Storage cleanup was performed.

## Canonical post-reset baseline

Immediately after the future command, migration replay, and before account/dataset bootstrap, the intended baseline is:

- 52 migration entries applied, including `20260910010000_maintenance_service_access.sql`;
- exactly two canonical branches: Taft, Manila and Antipolo, Rizal;
- exactly six canonical vehicle categories;
- exactly 12 active `DEV-*` canonical vehicles;
- exactly one active `demo-bank-transfer` payment method;
- exactly 12 migration-established initial vehicle-state events, one per canonical vehicle;
- exactly one newly established forecast-demand coverage singleton with a reset-time tracking start;
- zero Auth users and zero public profiles;
- zero booking, requirement, document, review, payment, proof, rental, maintenance, notification, audit, email-outbox, finder-context, and booking-idempotency runtime rows;
- zero Decision Support runs, inputs, forecasts, supply evaluations, snapshots, allocation batches, recommendations, and candidates;
- two canonical private Storage buckets, with current pre-reset objects still present until the separately authorized Storage API cleanup;
- after that API cleanup, the same two empty canonical buckets and zero Storage objects;
- migration-established functions, triggers, RLS, policies, grants, and required extensions restored and verified.

No runtime QA/test rows should remain in the baseline unless a migration intentionally creates them. Forecast and allocation outputs are derived post-bootstrap data, not migration baseline data.

## Defense account bootstrap

Target account state after reset:

- 1 Owner/Admin;
- 1 Operations Staff;
- 3 Customers.

Creation sequence:

1. Use the minimal audited trusted bootstrap for the first Owner/Admin because normal public signup cannot create that role.
2. Use normal application registration for the staff account and promote it through the current Admin workflow.
3. Use normal application registration for the three synthetic customers.
4. Confirm role constraints, active status, login, and the Owner/Admin/Operations Staff access boundaries before building data.

No credentials, email addresses, Auth IDs, or account secrets belong in this document or in source control.

## Defense dataset target

After the five accounts exist, build the intentional defense dataset through supported application workflows. The target is:

### Current live scenarios

Seven meaningful current booking scenarios:

1. Submitted with requirements not submitted and payment pending.
2. Submitted with requirements pending review and payment pending or in the corresponding supported review state.
3. Submitted with requirements needing resubmission and payment needing resubmission.
4. Confirmed future booking with verified requirements and verified payment.
5. Rejected terminal booking; use Cancelled instead only if that is the more meaningful supported terminal workflow for the defense script.
6. Active rental with verified requirements and verified payment.
7. Returned rental with verified requirements and verified payment.

The exact workflow transitions, requirement documents, payment proofs, rental start/return actions, and Storage uploads must be generated through the application or its supported services. Notifications and audit events must be naturally generated by those workflows; do not fabricate rows.

Create one completed maintenance example through the supported open-to-complete maintenance workflow. Do not create extra maintenance blockers merely to increase row counts.

### Historical Decision Support inputs

- exactly 12 returned historical bookings;
- three complete historical weeks;
- explicit documented provenance/version for the historical input set;
- sufficient vehicle-state inputs for all 12 canonical vehicles at each historical start;
- no reuse of the current historical QA residue or old Decision Support outputs as defense data.

After historical inputs exist, generate derived Decision Support outputs through application services. Expected forecast coverage is 12 branch/category pairs across three horizons, with the returned row/input counts verified from the actual service response rather than inserted directly. Generate supply and allocation outputs through their application services, including balanced/shortage/surplus coverage and one valid pending allocation recommendation where the supported workflow requires it.

## Proposed remote reset procedure

This is a later, authorized procedure only. Step 5 must not be run in this session.

1. Obtain written Lead approval naming the exact hosted ref `cpkyxnxpzufigcmaptpg` and confirming classification A.
2. Re-run the safe linked-project identity check and confirm all configured endpoints still resolve to that ref. Resolve the stale `QA_FIXTURE_TARGET=local` label before treating the environment as authorized.
3. Record final safe counts and lineage classification. Confirm the worktree is clean, the branch is `stabilization/frontend-rebuild`, the migration files are unchanged, the GitHub evidence is preserved, and `origin/main` is unchanged.
4. Re-run the read-only migration comparison: local 52, remote 51, no remote-only entries, with the one known local-only service-access migration. Do not repair history first.
5. After the explicit destructive authorization, run exactly:

   ```sh
   npx --no-install supabase db reset --linked --no-seed
   ```

   Review the CLI's interactive remote-reset confirmation against the approved ref before confirming. Do not substitute a database URL, production target, fixture cleanup command, fixture apply command, `--yes`, or an unreviewed CLI version.

6. Verify all 52 migrations, the canonical baseline, zero Auth users/profiles/runtime rows, the fresh singleton coverage row, functions/triggers/RLS/policies, and the two canonical bucket definitions.
7. With separate explicit approval, remove residual disposable Storage objects only through the supported Storage API and verify both API and metadata counts.
8. Bootstrap the five defense accounts and verify role access.
9. Build the seven current workflows and the controlled 12-booking/three-week historical input set with provenance.
10. Generate Forecast, Supply Evaluation, and Allocation Recommendation outputs through application services. Run the relevant application tests/build/lint and role/regression checks.
11. Produce a final safe manifest of counts, lineage, Storage state, Auth/profile state, migration history, and derived output provenance. Stop if any count, identity, role, policy, or Storage check is unexpected.

## Hard safety conditions

All of the following must be true simultaneously before any future destructive authorization:

- the Lead explicitly approves linked project ref `cpkyxnxpzufigcmaptpg`;
- the project remains classified **A. HOSTED NON-PRODUCTION QA — SAFE TO CONSIDER RESET**;
- the Lead confirms that the project is not production, client operational infrastructure, or shared staging containing data that must survive;
- the Lead confirms that the 11 unmarked/ambiguous users and all unmarked application/Storage/Decision Support residue are disposable;
- the one-character discrepancy between the Lead-supplied plan hash and the current plan commit hash is resolved;
- local migration history is sufficient and the 52-versus-51 difference is understood, with no unapproved history repair;
- the exact CLI version and exact reset command have been reviewed;
- Auth deletion behavior and the first-Owner/Admin bootstrap consequence are understood;
- Storage metadata/physical-object survival and the supported API cleanup mechanism are understood;
- the final Storage cleanup scope is approved separately and contains only disposable objects;
- GitHub evidence and this preflight document are preserved on the authorized branch;
- all application/database URLs and the linked project continue to resolve to the same approved ref;
- no production deployment, merge, source edit, migration edit, fixture cleanup, fixture apply, or local Docker stack is introduced.

If any condition fails, do not reset.

## Authorization required

This document is a verification record, not destructive authorization. Before a later reset, the Lead must explicitly approve:

1. the exact project ref `cpkyxnxpzufigcmaptpg`;
2. the classification as hosted, non-production, disposable QA;
3. the retention decision for all current unmarked/ambiguous records and Storage objects;
4. the exact command `npx --no-install supabase db reset --linked --no-seed`;
5. the separate Storage API cleanup plan, if residual objects remain;
6. the one-time first Owner/Admin bootstrap path;
7. the post-reset defense account and dataset plan.

No reset is authorized by this preflight or by the readiness label below.

## Readiness

The linked target is sufficiently identified and the reset effects are understood, but final exact-ref approval, the production/shared-data retention attestation, the plan-hash confirmation, and the separate Storage cleanup gate remain outstanding.

READY WITH PRECONDITIONS
