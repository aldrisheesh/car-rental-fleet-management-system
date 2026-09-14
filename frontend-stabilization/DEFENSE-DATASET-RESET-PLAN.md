# Defense Dataset Reset Plan

## Goal

Retire the accumulated local QA, fixture, historical, VS, and controlled-E2E
runtime data, then establish a small and intentional defense baseline for the
Car Rental Fleet Management System.

The desired post-reset baseline contains only:

- the schema and migrations in this repository;
- migration-established canonical master/reference data;
- deliberately bootstrapped Owner/Admin and Staff accounts plus a small set of
  synthetic Customers;
- current transactional records created through supported application
  workflows;
- a modest, explicitly documented historical dataset for Reports and Decision
  Support;
- derived forecasts, supply evaluations, and allocation recommendations
  generated through the application/domain services.

This session is inventory and planning only. No database reset, row deletion,
fixture cleanup, fixture apply, Auth deletion, Storage deletion, migration
change, source change, deployment, merge, or production/staging operation was
performed.

The GitHub evidence documents remain valid evidence of the previously
validated lifecycle. Resetting runtime data does not invalidate or remove
those documents.

## Current local environment

Pre-flight results:

- Branch: stabilization/frontend-rebuild.
- Starting HEAD: 9a8c98a16f56e06d982825a6ac7cd783b9d88021.
- The starting HEAD is the lead-designated controlled-E2E evidence commit.
- Working tree was clean before this plan was created.
- origin/stabilization/frontend-rebuild matched the starting HEAD before this
  plan.
- origin/main was fetched at faed190d9b78bb845e2c89e7160eda90106f741f and was
  not modified by this session.
- The required controlled-E2E, whole-system rereview, and QA README were read
  in full.

The repository configuration describes the intended fixture target as local:

- QA_FIXTURE_TARGET=local;
- the local database convention is port 54322;
- supabase/config.toml has project ID
  car-rental-fleet-management-system.

The configured runtime does not currently prove that it is local. The ignored
.env.local has local target labels but its Supabase API and database
connection point to a hosted Supabase project/pooler. The linked-project
metadata points to that same hosted project. The database identity query
reported a hosted PostgreSQL connection on port 5432, not 127.0.0.1:54322.
npx supabase status could not inspect a local stack because Docker/Podman is
not available in the current environment.

Therefore, the currently reachable database is treated as a configured QA
database with an unresolved local/remote target mismatch, not as a proven
local database safe to reset. No destructive command was run against it.

The repository contains 52 migration files. The currently reachable
configured database reported 51 applied migrations, with the final repository
migration still unapplied there. This is migration drift and is an additional
reason not to use the hosted connection for this work. A future local reset
must be performed from the checked-out repository and must apply the complete
current migration set to a verified local stack.

Environment files and secrets are ordinary host files. A local database reset
does not rewrite them, but retaining a file whose target labels and actual
hosts disagree is unsafe. Before a future reset, the local environment must be
corrected or replaced with an explicitly verified local-only environment.

## Supported reset mechanism

The repository does not define a custom reset/bootstrap script. Its supported
local workflow is the Supabase CLI workflow:

    npx supabase start
    npx supabase db reset --local

The CLI help and repository configuration show that db reset resets the local
database to the migrations. Supabase documents that a local reset recreates
the local database, applies migrations, and then runs configured seed files.
The relevant references are:

- [Supabase CLI reference: db reset](https://supabase.com/docs/reference/cli/su);
- [Supabase local CLI workflows](https://supabase.com/docs/guides/local-development/cli-workflows);
- [Supabase database seeding](https://supabase.com/docs/guides/local-development/seeding-your-database).

For this repository, supabase/config.toml enables seeding with the default
path ./seed.sql, but supabase/seed.sql is not present in the checkout. The
later execution should therefore use the explicit command below unless a
separate lead-approved seed decision is made:

    npx supabase db reset --local --no-seed

This command was inspected but not executed in this session. --local is
mandatory for the future operation. --linked, --db-url, and any hosted
database URL are outside this authorization boundary and must not be used.

Expected reset effects, subject to verification on the installed CLI/local
stack:

| Area | Expected result of a true local reset | Required verification |
| --- | --- | --- |
| PostgreSQL schema/data | Local database data is destroyed and recreated from the repository migrations. | Confirm local host/port/project identity, then confirm all 52 migrations and expected tables. |
| Migrations | All current repository migrations rerun in order. | Confirm migration history and canonical rows. |
| Seed data | Configured seed would run after migrations, but no seed file is present. | Use --no-seed and record that canonical data came from migrations only. |
| Auth users | Auth users are database-backed and are not created by these migrations; a clean database rebuild should leave no users. | Query the local Auth admin surface and profiles after reset; stop if any unexpected user remains. |
| Storage buckets/metadata | Bucket and object metadata are database-backed and migration-created buckets are recreated. | Confirm the two canonical private buckets and zero objects. |
| Storage blobs | The CLI/database reset does not provide sufficient repository evidence that every blob in a local Storage volume is removed. | List through the local Storage API after reset; if objects remain, use only a verified local Storage API/volume cleanup path. Never delete storage.objects rows directly. |
| Local Supabase stack | Project configuration and configured ports are expected to remain the local stack identity; the local Postgres data/container may be recreated. | Start/status the stack and confirm project ID, API host, DB host/port, and health before any destructive command. |
| Environment files | Host environment files are not changed by db reset. | Re-read target and host values without printing secrets. |
| External email or other side effects | Existing external deliveries cannot be recalled by a database reset. | Use synthetic local addresses/documents only in the new baseline. |

This plan deliberately distinguishes database-backed Auth/Storage metadata
from actual Storage blobs. Supabase also documents that Auth user deletion
and Storage ownership have separate considerations; the [Auth user-management
documentation](https://supabase.com/docs/guides/auth/managing-user-data)
should govern any later explicit local-only cleanup. A Supabase CLI issue also
documents the risk of Storage metadata and underlying objects becoming
inconsistent during destructive linked operations:
[CLI issue 3252](https://github.com/supabase/cli/issues/3252). That is another
reason to keep the future operation local and to verify Storage through its
API rather than issuing SQL deletes.

## Migration-established canonical data

The following data is recreated by migrations on a clean database:

| Data | Source | Classification | Reset result |
| --- | --- | --- | --- |
| Branches Taft, Manila and Antipolo, Rizal | 20260830000000_initial_foundation.sql | Canonical master data | Recreated automatically |
| Vehicle categories Economy, Sedan, SUV, MPV, Van, Pickup | 20260830000000_initial_foundation.sql | Canonical master data | Recreated automatically |
| Twelve DEV-* vehicles | 20260831100000_seed_vehicle_reference_data.sql | Canonical development reference fleet; explicitly documented as not verified operational records | Recreated automatically |
| Payment method demo-bank-transfer / Demo bank/e-wallet | 20260831220000_payment_submission.sql | Canonical demo/reference payment method | Recreated automatically |
| Private renter-requirements bucket | 20260831190000_renter_requirements.sql | Canonical application bucket | Bucket metadata recreated automatically |
| Private payment-proofs bucket | 20260831220000_payment_submission.sql | Canonical application bucket | Bucket metadata recreated automatically |
| Vehicle initial operational-state events | 20260901050000_vehicle_operational_state_history.sql | Canonical initial state history | One initial event per migration-created vehicle |
| forecast_demand_coverage singleton row | 20260901061000_forecasting_integrity.sql | Canonical Decision Support configuration state | Recreated with reset-time coverage |
| Tables, constraints, RLS, functions, triggers, status checks, and indexes | All migrations | Canonical schema/domain policy | Recreated automatically |

The profile role values Owner/Admin, Operations Staff, and Customer/Renter are
check-constrained domain values, not rows in a migration-seeded role lookup
table. Role-bearing profiles are therefore manual Auth/bootstrap data and are
not part of the canonical reference rows recreated by migration.

The DEV-* prefix does not make the vehicles disposable QA rows. The
vehicle-reference migration inserts them by license plate, joins them to the
canonical categories and branches, and describes them as deterministic
development reference data. Current inventory confirms that all twelve
current vehicles exactly match that migration. They should be retained as the
canonical defense reference fleet unless a later product decision replaces
the migration itself.

The migrations do not create Auth users, application profiles, customer
bookings, requirement submissions, payment submissions, rental transactions,
maintenance history, notifications, audit events, forecast runs, supply
evaluations, or allocation recommendations. Those are runtime or deliberately
generated data.

Classification summary:

- **Canonical — recreated by migrations:** schema, policy, status model,
  branches, categories, twelve development reference vehicles, payment
  method, Storage buckets, initial vehicle state events, and forecast
  coverage singleton.
- **Canonical but manual:** defense Auth accounts, role assignment, live
  workflow history, and any intentionally controlled historical coverage.
- **QA/demo reference:** the twelve DEV-* vehicles are development reference
  data, but they are migration-established and therefore not arbitrary QA
  residue.
- **Runtime transactional data:** bookings, requirements, documents, reviews,
  payments, proofs, rentals, maintenance, notifications, email outbox rows,
  audit events, finder/idempotency context, forecast inputs/results, supply
  evaluations, and allocation recommendations.

## Branch inventory

The current configured QA database has three active branches:

| Branch | Current vehicles | Classification | Reset result |
| --- | ---: | --- | --- |
| Taft, Manila | 7 | Canonical migration-established | Recreated |
| Antipolo, Rizal | 5 | Canonical migration-established | Recreated |
| VS003 Temp 1788110993 | 0 | VS/legacy test residue | Not recreated; removed by a true rebuild |

The two canonical branches are the only branches inserted by the foundation
migration. VS003 Temp 1788110993 is not created by a migration, is not
required by the application’s canonical master data, and is not changed by
the fixture tool’s report-only inventory. It should be retired by the whole
local reset rather than by attempting row-by-row cleanup now.

## Vehicle inventory

There are 12 current vehicles. Their license plates are:

DEV-WIGO-001, DEV-MIRA-001, DEV-VIOS-001, DEV-CITY-001,
DEV-RUSH-001, DEV-EVST-001, DEV-AVAN-001, DEV-INNO-001,
DEV-URVN-001, DEV-HIAC-001, DEV-RANG-001, and DEV-HILX-001.

All 12 are active and match the vehicle-reference migration’s names,
categories, branches, and rates. There are no current vehicle rows owned by
the standard fixture namespace, the historical fixture namespace, or a VS
namespace. The current fleet is therefore a coherent migration-established
reference fleet, not accumulated vehicle residue.

On a true local reset, these 12 vehicles and their migration-created initial
state events are recreated. The later defense dataset should use this fleet
and should not add arbitrary test vehicles. If historical analytics require
earlier state coverage, that should be a separately marked controlled
historical input for the existing vehicles, not a replacement fleet.

## Auth inventory

Read-only classification found 33 active Auth identities, with a matching
profile for each identity and no profile-only or Auth-only identity.

No email addresses, passwords, Auth UUIDs, tokens, or protected metadata
values are recorded in this plan.

| Classification | Count | Notes |
| --- | ---: | --- |
| Standard QA-CUST-* fixture identities | 10 | Customer/Renter fixture accounts |
| Standard QA-OPERATOR-* fixture identity | 1 | Owner/Admin fixture operator |
| Historical QA-HIST-* Customer identities | 8 | Historical Decision Support fixture accounts |
| Historical fixture operator | 1 | Owner/Admin historical fixture operator |
| Lead-designated controlled-E2E Customer | 1 | One of the otherwise unmarked identities; identified only through protected local configuration/evidence |
| Lead-designated controlled-E2E Owner/Admin | 1 | One of the otherwise unmarked identities; identified only through protected local configuration/evidence |
| Other unmarked/ambiguous Customer/Renter identities | 9 | No safe ownership marker; do not infer legitimacy |
| Other unmarked/ambiguous Operations Staff identity | 1 | Not validated as the E2E Staff account |
| Other unmarked/ambiguous Owner/Admin identity | 1 | No safe ownership marker |
| Other controlled marker | 0 | No additional recognized marker |
| **Total** | **33** | All active |

The controlled-E2E evidence explicitly validated the designated Customer and
Owner/Admin identities, but it did not validate a Staff lifecycle. The
remaining unmarked identities must not be carried forward merely because they
look legitimate. A clean local rebuild should begin with zero Auth users, then
create only the approved defense accounts.

Auth role implications:

- Normal public registration creates a Customer/Renter profile through the
  Auth trigger.
- Registration cannot safely create the first Owner/Admin.
- The first Owner/Admin therefore needs a separately authorized, local-only
  trusted bootstrap using the Auth admin surface and service-role profile role
  update, or an equivalent local admin workflow.
- Once Owner/Admin exists, the Staff identity should be registered and promoted
  through the supported admin-user workflow.
- Customer identities should be created through normal registration.

No accounts are created or deleted by this plan.

## Storage inventory

The current configured QA database reports two private buckets and 34 objects:

| Bucket | Objects | Safe classification |
| --- | ---: | --- |
| renter-requirements | 26 | 18 standard fixture objects, 2 controlled-E2E objects, 6 unmarked/ambiguous requirement objects |
| payment-proofs | 8 | 7 standard fixture objects, 1 controlled-E2E object |
| **Total** | **34** | No signed URLs or private contents exposed |

Every current object matched a corresponding requirement-document or
payment-proof row in read-only checks; no orphan or missing object binding was
found. The object names and private contents are intentionally not reproduced
here.

The 25 standard fixture objects, three controlled-E2E objects, and six
unmarked requirement objects are all disposable for the proposed clean
baseline. A true local database rebuild recreates the two bucket definitions,
but actual blob cleanup must be verified separately through the local Storage
API/volume. If any object remains after the reset, the minimum explicit
cleanup step is an exact, local-target-proven Storage API removal of those
remaining objects, followed by a zero-object verification. Do not delete
Storage metadata with SQL, and do not use a hosted Storage URL.

The new defense baseline should use small synthetic PDFs/proofs created for the
approved workflows. They must be clearly synthetic, local-only, and excluded
from committed source.

## Transactional data classification

The current connected QA database contains 111 bookings, 19 requirement sets,
26 requirement documents, 11 reviews, 8 payments, 8 payment proofs, 81
rental transactions, 8 maintenance records, 61 notifications, 9
email-delivery outbox rows, 51 audit events, 2 booking-finder contexts, and 8
booking-idempotency bindings.

These counts describe the currently reachable configured QA project. They are
not evidence that the target is a local database.

### Standard fixtures

The standard fixture namespace contains:

- 22 bookings: 15 Submitted, 1 Rejected, 1 Cancelled, and 5 Confirmed;
- 11 requirement sets: 1 Needs Resubmission, 2 Not Submitted, 1 Pending
  Review, and 7 Verified;
- 18 requirement documents and 8 reviews;
- 7 payments: 1 Pending Verification, 1 Needs Resubmission, and 5 Verified;
- 7 payment proofs;
- 5 rentals: 2 Active and 3 Returned;
- 5 maintenance records: 4 Completed and 1 Cancelled.

The current count of standard requirement sets is 11 even though the
documented default fixture expectation is 10. This discrepancy reinforces
that row ownership must be determined from deterministic fixture metadata, not
from approximate counts.

### Historical fixtures

The historical namespace contains:

- 81 bookings: 75 Confirmed and 6 non-qualifying Submitted/Rejected/Cancelled
  records;
- 75 Returned rentals;
- 3 Completed maintenance records;
- 12 historical vehicle state events;
- historical forecast-coverage manipulation and related Decision Support
  inputs/derived outputs.

The historical dataset is useful as evidence of the old Decision Support test
path, but its volume, namespace, dates, and synthetic coverage are not
appropriate as the new defense baseline.

### Controlled E2E

The lead-designated controlled E2E lifecycle currently contributes:

- one booking that reached Confirmed;
- one requirement set reaching Verified, with two documents and one verified
  review;
- one payment reaching Verified, with one proof;
- one rental reaching Returned;
- the nine expected lifecycle audit actions recorded in the evidence;
- related notifications, finder context, idempotency context, and email
  outbox side effects.

The evidence document describes the expected lifecycle notification set. The
current database contains 15 notification rows associated with the
controlled-E2E booking lineage, so the database should not be treated as a
clean copy of the evidence’s expected notification count.

The prior E2E database records should be retired by the reset. The
GitHub-tracked evidence document
frontend-stabilization/CONTROLLED-E2E-EXECUTION-LEAD-DESIGNATED.md must
remain.

### VS and legacy test residue

VS003 Temp 1788110993 is a branch-level VS residue. No current vehicle row
is owned by a VS namespace.

The current connected database also contains unmarked bookings and side
effects. Seven bookings are unmarked and all are Submitted, with dates in the
current local test window. They cannot be safely called VS records solely from
appearance. Because they have no documented defense purpose or trusted
ownership marker, they should be retired by the whole reset unless a later
lead-approved inventory explicitly assigns them a defense purpose.

### Unmarked local data

The unmarked rows include:

- 7 Submitted bookings;
- 7 requirement sets covering Needs Resubmission, Not Submitted, Pending
  Review, and Verified;
- 6 requirement documents and 2 reviews;
- 38 notifications;
- 2 email-delivery rows;
- 12 audit events;
- 1 finder context and 7 idempotency bindings;
- the remaining unmarked Auth identities described above;
- Decision Support output rows generated by unmarked actors.

No unmarked row has been promoted to defense data by assumption. The default
retirement decision is to rebuild from zero and recreate only records with a
written defense purpose and provenance.

### Decision Support and derived rows currently present

The current database reports:

- 1 forecast coverage singleton;
- 2 forecast runs;
- 162 forecast-input rows;
- 54 forecast rows;
- 3 supply evaluations and 1 supply-evaluation vehicle snapshot;
- 5 allocation recommendation batches;
- 0 allocation recommendations and 0 allocation candidates.

These are outputs of the old mixed test state, not a clean defense baseline.
They should be removed by the rebuild and regenerated only after the new
historical inputs exist. No current allocation recommendation needs to be
preserved.

## Audit / notification implications

The fixture cleanup path explicitly refuses cleanup when append-only audit
events reference fixture IDs. The current database has fixture-referenced
audit events, including the standard and historical fixture lineage. This
refusal is a safety invariant, not an obstacle to bypass.

A true disposable local reset is materially different from row-by-row cleanup:

- the local database is rebuilt from migrations;
- audit tables, append-only triggers, and audit rows are recreated together;
- all current audit references disappear with the rebuilt database;
- notification and email-outbox rows disappear with their tables/data;
- booking finder and idempotency context rows disappear;
- no current append-only dependency remains to block deletion of individual
  fixture rows;
- the migrations and recreated triggers preserve the audit invariants for all
  new defense workflows.

The reset does not retract external messages that may already have been sent.
The new defense workflow must use local synthetic identities and documents and
must verify notification/audit side effects after each deliberate lifecycle.

## Decision Support history requirements

The minimum useful history is three complete weekly actual-demand
observations. The forecast service uses the latest three actual weeks and
produces three forecast horizons for every active canonical
branch/category pair, including zero-demand pairs. A clean defense history
should therefore cover three complete weeks without carrying forward the old
ten-week QA-HIST-* dataset.

Proposed controlled historical input:

- 12 Confirmed historical bookings, each ending as a Returned rental;
- three complete prior weeks;
- demand distributed across a small set of canonical pairs, for example:
  Antipolo/Sedan counts of 2, 3, and 2; Taft/Economy counts of 1, 1, and 1;
  and Antipolo/SUV counts of 1, 0, and 1;
- zero-demand canonical pairs retained by the forecast service rather than
  fabricated bookings;
- historical dates and coverage recorded in a versioned local provenance
  manifest;
- one completed maintenance-history record only if needed by the report
  narrative;
- historical vehicle-state coverage for all 12 canonical vehicles at the
  historical start so Vehicle Analytics does not silently report missing
  coverage.

The proposed counts are intentionally modest. They create a believable
business story while giving the WMA service at least three actual weeks.
After the application’s forecast endpoint runs, the expected shape is 36
forecast rows and 108 forecast-input rows for 12 canonical branch/category
pairs across three horizons. The exact values must be verified from the
application output, not hand-inserted.

The resulting Decision Support demonstration should show:

- at least one shortage signal, using a demand-heavy Antipolo/Sedan history
  against the available reference fleet;
- at least one balanced pair;
- at least one surplus/zero-demand source such as Taft/Sedan;
- a small number of supply evaluations with their explanatory snapshots;
- one Pending allocation recommendation from a surplus source to a shortage
  destination where the canonical service identifies a valid match.

Forecasts and supply evaluations must be generated through their supported
Owner/Admin application services. Allocation recommendations must be
generated through the canonical recommendation service and remain in a
supported state such as Pending; no direct inserts or unsupported
Ready/Completed/Settled states should be invented.

The forecast coverage singleton is reset to the reset-time value by migration.
If three prior weeks are needed, backdating that coverage and the controlled
historical dates is a deliberate local-only operation requiring separate
authorization and an explicit provenance record. The old synthetic coverage
must not be silently reused.

## Proposed defense accounts

Target five accounts:

- 1 Owner/Admin;
- 1 Operations Staff;
- 3 Customer/Renter accounts.

This is within the requested range and supports role comparison without
creating an arbitrary account population.

Creation plan:

1. Bootstrap the first Owner/Admin through a separately approved,
   local-only trusted Auth/admin path. Do not commit credentials or use
   production/staging service keys.
2. Register the Staff account through the normal Auth workflow, then assign
   Operations Staff through the Owner/Admin admin-user workflow.
3. Register three synthetic Customers through the normal application
   registration workflow.
4. Verify each profile’s role, active state, and RLS behavior before creating
   transactions.

Credentials remain local secrets and are never written to this plan,
migrations, fixtures committed to the repository, or evidence documents.

## Proposed defense transactional dataset

The current-state dataset should be small but demonstrate the principal
supported paths:

| Domain | Proposed coverage | Preferred creation |
| --- | --- | --- |
| Customers | Three synthetic profiles with distinct, believable local-only identities | Normal registration |
| Bookings | Seven current bookings: three Submitted intake examples, one Confirmed future booking, one Rejected booking, one Active rental, and one Returned rental | Application workflow |
| Requirements | Not Submitted, Pending Review, Needs Resubmission, and Verified; use Verified requirements for the future, active, and returned confirmed lifecycles | Application workflow |
| Payments | Pending Verification, Needs Resubmission, and Verified; use Verified payments for the confirmed/active/returned lifecycles | Application workflow |
| Rentals | One Active and one Returned current rental, plus the 12 controlled historical Returned rentals | Application workflow for current; controlled history for historical |
| Maintenance | One Completed history record, created by opening then completing it through the supported workflow | Application workflow |
| Notifications/audit | Only side effects naturally produced by the above workflows | Application-generated |
| Reports | Current future/active/returned operations plus the documented historical returns and maintenance record | Derived from canonical rows |
| Decision Support | Three-week history, forecasts, supply evaluations, and one explanatory Pending recommendation | Controlled history followed by application services |

For the requirements and payment examples, synthetic documents and proofs
should be uploaded only through the application’s supported Storage workflow.
The exact number of documents should follow the application’s required
document types; no private test files should be committed.

The rejected booking should not be advanced through payment, assignment, or
rental states. The future, active, and returned lifecycles should remain
canonically Confirmed at booking level; the rental state demonstrates
progression. A returned rental is not a fabricated booking status such as
Completed or Settled.

The proposed dataset deliberately does not add an active maintenance blocker
unless the lead later decides that the policy is ready to demonstrate one.
The existing QA README identifies the maintenance-blocking policy as an
unresolved observation. A Completed maintenance history record is enough for
Reports without introducing an ambiguous operational constraint.

## Data creation method matrix

| Data category | Method | Decision |
| --- | --- | --- |
| Schema, RLS, functions, triggers, status constraints | A. Migration / canonical seed | Recreated by all current migrations |
| Branches, categories, twelve DEV-* vehicles, payment method, Storage buckets, forecast singleton, initial vehicle state events | A. Migration / canonical seed | Keep as migration-established reference data |
| First Owner/Admin | B. Auth bootstrap | Required separately because public registration creates Customer/Renter |
| Staff and Customers | C. Application workflow | Registration and supported admin role assignment |
| Current bookings, requirements, reviews, payments, proofs, assignment, confirmation, rental release/return, maintenance | C. Application workflow | Prefer natural validation, notifications, and audit side effects |
| Three-week returned history and historical vehicle-state coverage | D. Controlled historical generation | Use only for modest past inputs that would be unreasonable to recreate one UI lifecycle at a time; mark provenance and local-only scope |
| Forecasts, supply evaluations, allocation recommendation | C. Application/domain workflow after D | Derived outputs must come from canonical services, not direct inserts |
| Old QA-CUST, QA-HIST, VS rows, arbitrary vehicles, fixture audit/notifications, old derived outputs | E. Not needed | Retire through the whole reset |
| Manually fabricated audit, notification, email-delivery, or Settled rows | E. Not needed | Do not create |

Method D is the only deliberate exception to application workflow. It is
limited to historical inputs, must be versioned/provenanced, must target a
verified local database, and must not be used to manufacture current-state
workflow side effects. All current defense state should be created through
supported application workflows.

## Proposed retirement list

After lead authorization and only on a proven local non-production target,
retire through the whole reset:

- all QA-CUST-* Auth identities and their profiles;
- the QA-OPERATOR-* Auth identity and profile;
- all QA-BOOK-*, QA-REQ-*, QA-PAY-*, QA-RENT-*, and QA-MAINT-* runtime rows
  and their documents/proofs;
- all QA-HIST-* Auth identities, profiles, bookings, rentals, maintenance,
  state events, synthetic coverage, and derived Decision Support state;
- the previous controlled-E2E booking, requirements, payments, rental,
  documents/proof, notifications, audit, finder, idempotency, and outbox
  records;
- VS003 Temp 1788110993;
- all other clearly identified VS/legacy test operational rows;
- all unmarked/ambiguous current Auth users, bookings, requirements,
  documents, reviews, notifications, audit side effects, finder/idempotency
  context, and derived outputs unless a separate lead-approved inventory
  assigns a defense purpose;
- all 34 current Storage objects, subject to local-target and Storage API
  verification;
- all current forecast runs/inputs/results, supply evaluations/snapshots,
  allocation batches, and any other generated Decision Support output.

The retirement list refers to future local reset scope only. Nothing in this
list was deleted during this session.

The following must not be retired:

- the GitHub evidence documents;
- repository migrations, source, QA documentation, and configuration;
- the controlled-E2E evidence commit and its history.

## Proposed keep/recreate list

Keep in the repository and recreate from migrations:

- the schema, RLS policies, triggers, functions, and constraints;
- the two canonical branches;
- the six canonical categories;
- the twelve migration-established DEV-* reference vehicles;
- the canonical demo payment method;
- the two canonical private Storage buckets;
- the forecast coverage singleton at its clean reset value;
- the migration-created initial state event for each canonical vehicle;
- all source, migration, test, and QA documentation;
- all GitHub evidence documents.

Recreate intentionally after reset:

- the five defense accounts;
- the seven current defense bookings and associated current workflows;
- the small completed maintenance history;
- the 12-booking three-week historical dataset and state coverage;
- application-generated notifications and audit events;
- application-generated forecasts, supply evaluations, and allocation
  recommendation;
- local synthetic Storage documents/proofs.

Do not treat existing hosted connection values, Auth users, Storage objects,
or current runtime rows as things that should survive. Host environment files
may remain on disk, but their target values must be revalidated and must not
be allowed to point a destructive command at a hosted project.

## Reset risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Target label says local while API/DB hosts are remote | Require QA_FIXTURE_TARGET=local, local API host, local DB host/port, local Supabase status, and a database identity check. Any hosted host, linked target, or staging/production identifier is a hard stop. |
| Docker/Podman is unavailable | Install/start the approved local runtime before authorization; do not substitute the currently reachable hosted project. |
| Repository has 52 migrations while the configured hosted DB has 51 | Reset only a local stack from the checked-out repository; never use this plan to push/reset the hosted database. Verify all 52 migrations after reset. |
| Seed configuration is enabled but supabase/seed.sql is absent | Use --no-seed for the first approved reset and document that migration data is the complete canonical seed. Add a seed only through a separate code/documentation decision. |
| Auth does not have a safe first-admin path | Pre-authorize and rehearse a local-only Auth admin bootstrap; verify zero users before bootstrap and role/profile consistency afterward. |
| Storage blobs outlive database metadata | Verify buckets and object counts through the local Storage API. If needed, remove exact remaining objects only through a verified local API/volume path; never issue SQL deletes against Storage metadata. |
| Append-only audit rows block fixture cleanup | Do not bypass the cleanup guard. Use the whole local rebuild, which recreates the audit tables and invariants together. |
| Old synthetic forecast coverage is carried forward | Reset coverage, create three new complete weeks with explicit provenance, and invoke the forecast service after history is verified. |
| Historical state coverage is incomplete | Create controlled state events for all 12 canonical vehicles at the documented historical start, then verify Vehicle Analytics coverage. |
| Current workflows create duplicate or unintended side effects | Create one lifecycle at a time through the application, record expected audit/notification changes, and verify counts before proceeding. |
| Unsupported status values are introduced for chart coverage | Use only statuses and transitions defined by migrations and application services. |
| Maintenance policy is misrepresented | Use Completed history only unless the lead explicitly authorizes an Open operational blocker. |
| Auth, Storage, email, and database have different reset boundaries | Treat each as a separate verification gate; a successful db reset is not proof that Auth/Storage blobs or external messages are clean. |
| Local CLI/storage initialization race or version behavior changes | Record CLI version, start/status health, migration output, Auth/Storage health, and object counts before proceeding. Stop on any race or identity mismatch. |
| Local secrets are exposed or committed | Never print or commit credentials, protected metadata, Auth UUIDs, tokens, signed URLs, or private document contents. |

## Proposed reset execution procedure

The following is a future execution design only. It is not authorized by this
session.

1. Capture final read-only counts, migration status, branch/vehicle
   fingerprints, Auth counts by safe classification, Storage bucket/object
   counts, and the Git commit containing this plan.
2. Confirm that the GitHub controlled-E2E evidence documents remain tracked and
   are not part of any data cleanup target.
3. Prove the destructive target is local: QA_FIXTURE_TARGET=local, local
   API host, local database host 127.0.0.1 and port 54322, Supabase local
   status showing project ID car-rental-fleet-management-system, and a
   read-only database identity query matching the local stack. A hosted URL,
   --linked, --db-url, staging reference, or production reference is an
   immediate hard stop.
4. Start the local Supabase stack and record its CLI version and health.
5. Run only the approved local reset command:

       npx supabase db reset --local --no-seed

   Do not run it until the lead has separately authorized the local target.
6. Verify the complete migration history and canonical data: two branches,
   six categories, twelve DEV-* vehicles, one payment method, two private
   buckets, the forecast singleton, and twelve migration-created initial
   vehicle state events. Verify that VS003 Temp 1788110993 is absent.
7. Verify zero Auth users/profiles beyond the expected clean state. Verify
   zero Storage objects while retaining exactly the two canonical buckets. If
   either check fails, stop and resolve it through a separately approved
   local-only Auth/Storage path.
8. Bootstrap the single Owner/Admin using the approved local trusted path.
   Verify profile role and RLS behavior without recording secrets.
9. Register and promote the one Staff account through the supported workflow.
   Register the three Customer accounts normally.
10. Create the current seven-booking defense dataset through application
    workflows. Verify requirements, document reviews, payment proofs,
    assignment, confirmation, release, return, and maintenance transitions.
    Record the naturally generated audit and notification side effects.
11. Generate the small three-week historical dataset through the separately
    approved controlled historical method. Record dates, demand counts,
    state-event coverage, and provenance. Do not use the old QA-HIST-*
    namespace or copy its rows.
12. With Owner/Admin access, run the application forecast endpoint and verify
    forecast inputs/results. Run supply evaluation and verify explanatory
    snapshots. Generate one valid Pending allocation recommendation through
    the application service.
13. Run repository tests, build/lint checks, and the relevant role-based
    regression checks. Inspect Reports and Decision Support for truthful
    counts and complete/partial coverage messages.
14. Capture a defense-baseline manifest containing safe counts, statuses,
    provenance, migration version, local target proof, and acceptance
    results. Do not include secrets, private URLs, Auth UUIDs, signed URLs, or
    private file contents.

## Defense baseline acceptance criteria

The baseline is accepted only when all of the following are true:

- no QA-* runtime fixture rows remain;
- no QA-HIST-* runtime rows or Auth identities remain;
- no VS or legacy test residue remains, including VS003;
- no stale fixture Storage objects remain;
- exactly the approved defense accounts exist;
- canonical branches, categories, vehicles, payment method, buckets, and
  required singleton/configuration rows exist;
- every current transactional row has an explainable defense purpose;
- historical rows have documented provenance, dates, and generation method;
- current workflows generated their own notifications and audit events;
- no audit or notification rows were fabricated merely to populate charts;
- only canonical status names and transitions are present;
- Reports reflect actual bookings, rentals, maintenance, and fleet state;
- Decision Support reflects actual controlled history and application-generated
  forecasts/evaluations/recommendations;
- vehicle analytics has documented state-event coverage;
- application tests, build/lint checks, and relevant regression checks pass;
- no production or staging data, Auth identity, Storage object, or external
  service was touched;
- the local target proof and final safe inventory are retained with the
  defense evidence.

## Authorization boundary

This document authorizes no reset and no cleanup. It records the inventory,
risks, and future procedure only.

Any later destructive execution requires a separate lead authorization that
names LOCAL NON-PRODUCTION QA as the sole target. Immediately before the
command, execution must prove:

- QA_FIXTURE_TARGET=local;
- the API and database hosts are local, with the expected local database port;
- the Supabase local project identity matches
  car-rental-fleet-management-system;
- the database identity query matches the local stack;
- no linked/hosted/staging/production target is selected.

If any target is remote, ambiguous, hosted, staging, production, or otherwise
not proven local, the operation stops. No destructive remote command is
permitted.

## Readiness

READY WITH PRECONDITIONS
