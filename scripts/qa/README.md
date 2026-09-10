# Controlled QA fixtures

This Lead-authorized engineering tool creates a bounded synthetic dataset for Briah's Car Rental UI/state validation. It is not an application feature, is never called by build/deploy/start, and is dry-run-only unless `--apply` is present.

> Every fixture is synthetic/demo data. It is not a real identity, identification document, driver's license, payment receipt, transaction, revenue record, rental, maintenance service, or historical business event. Seeded rows prove only that views can render those states; they do not prove that supported lifecycle transitions work.

## Prerequisites

- Node.js 22 and installed repository dependencies.
- `QA_FIXTURE_TARGET=local|staging|production` (required; there is no default).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Auth ownership inspection and private Storage placeholder management.
- `QA_FIXTURE_DATABASE_URL` for the same Supabase project. Use a trusted technical connection capable of transactions and temporarily disabling named user triggers. The URL is never printed.
- The two active canonical branches, the 12 unchanged `DEV-*` vehicles, and the active `demo-bank-transfer` method established by existing migrations.
- Optional `QA_FIXTURE_ANCHOR_DATE=YYYY-MM-DD` (or `--anchor-date=...`). The first created Auth fixtures retain this anchor in protected app metadata so reruns cannot silently shift the dataset.
- Optional `QA_FIXTURE_CUSTOMER_PASSWORD` if the ten synthetic customers must be login-capable. It is read only at Auth creation, is never printed, and must not be committed. Without it, Auth identities are non-login fixture principals. The synthetic operator never receives a password.

The tool verifies that the project references in the Supabase API and database URLs agree. Secrets must remain in the runtime environment; do not place them in a committed file or shell history.

## Dry-run (default)

```sh
QA_FIXTURE_TARGET=staging npm run qa:fixtures
```

Dry-run reads target metadata and prints `CREATE`, `SKIP`, `UPDATE`, or `REMOVE` actions. If Auth fixtures do not exist yet, it lists every Auth identity and the exact bounded entity counts, then stops before dependent collision checks because Supabase has not allocated their user IDs. It performs no writes.

The bounded historical Decision Support mode is explicit:

```sh
QA_FIXTURE_TARGET=staging npm run qa:fixtures -- --historical
```

It proposes only `QA-HIST-*` Auth/database identifiers under the separate
`briah-historical-decision-support-qa-v1` ownership namespace. The mode creates
ten complete Asia/Manila weeks of `Confirmed` booking demand, completed
`rental_transactions`, non-blocking maintenance history, and active operational
state events over the existing `DEV-*` fleet. It does not create vehicles,
payments, documents, forecast rows, supply evaluations, or allocation rows.
The report includes exact rows, date coverage, branch/category counts, expected
forecast-eligible pairs, and designed shortage/surplus/balanced/idle scenarios.

Historical mode refuses apply when `forecast_demand_coverage.tracking_started_at`
does not already establish trustworthy coverage on or before the proposed
history start. It never changes that canonical coverage row. This preserves the
forecasting boundary and prevents synthetic rows from being presented as
covered history without separate Lead authorization.

## Apply

Creating missing Auth fixtures requires its own acknowledgement:

```sh
QA_FIXTURE_TARGET=staging npm run qa:fixtures -- --apply --include-auth-users
```

Once Auth fixtures exist, later idempotent apply runs need only `--apply`. Login-capable customers require `QA_FIXTURE_CUSTOMER_PASSWORD` only on their first creation.

Production additionally requires the literal second flag below. Review the complete dry-run output first:

```sh
QA_FIXTURE_TARGET=production npm run qa:fixtures -- --apply --include-auth-users --confirm-production-fixtures
```

Do not run the production command casually. `QA_FIXTURE_TARGET` is mandatory; a production write without `--confirm-production-fixtures` is refused.

## Dataset

The default inventory reuses, but never modifies or owns, the two canonical branches and 12 `DEV-*` vehicles. It creates only:

- 10 `QA-CUST-*` synthetic customer Auth/profile identities and one non-login `QA-OPERATOR-001` fixture actor;
- 22 `QA-BOOK-*` bookings across `Submitted`, `Rejected`, `Cancelled`, and `Confirmed`;
- 10 `QA-REQ-*` sets across `Not Submitted`, `Pending Review`, `Needs Resubmission`, and `Verified`, with eight synthetic review rows;
- 18 generated PDF requirement placeholders whose only content says they are not real identification documents or driver's licenses;
- 7 `QA-PAY-*` rows across `Pending Verification`, `Needs Resubmission`, and `Verified`, plus seven generated proof PDFs and `NOT-A-TRANSACTION` references;
- five deterministic assignments/confirmed bookings, two `QA-RENT-*` active rentals, and three returned rentals;
- five `QA-MAINT-*` historical rows: four `Completed` and one `Cancelled`, all non-blocking.

Historical mode creates, relative to the selected anchor date:

- nine `QA-HIST-*` synthetic Auth/profile identities;
- 81 `QA-HIST-BOOK-*` booking requests, including 75 `Confirmed` demand observations and six non-qualifying request states;
- 75 `QA-HIST-RENT-*` completed rental/return rows;
- three `QA-HIST-MAINT-*` completed, non-blocking maintenance rows with no cost or service-target values;
- 12 `QA-HIST-STATE-*` active operational-state events for the existing 12 `DEV-*` vehicles.

The historical window is ten complete weeks (70 days), with demand patterns
that deliberately produce non-zero WMA inputs, a Taft Economy/Taft Sedan
shortage, Antipolo Sedan/Taft MPV/Antipolo Pickup surplus, balanced pairs, and
an Antipolo Sedan → Taft Sedan allocation opportunity after the canonical
workflow evaluates forecasts and supply. Three no-rental vehicles provide
idle-detection candidates; idle classification remains derived by the existing
14-day canonical boundary.

IDs and storage paths are deterministic. Free-text fields carry the selected fixture ownership marker. Auth users carry the same marker plus their exact fixture label/version in app metadata. Existing matching records are skipped; a known ID/email/path with a missing ownership fingerprint is a hard collision and aborts before writes.

Ordinary booking, review, rental, and maintenance inserts would create audit events and/or notifications. The database write therefore runs in one transaction, holds a fixture advisory lock, and temporarily disables only the five existing named side-effect triggers around inserts. They are re-enabled before commit (or restored by rollback). Constraints and foreign keys remain enabled. The tool does not seed audit events or notifications, and it makes no persistent schema, trigger, RLS, policy, or application-runtime change.

## Cleanup

Preview cleanup:

```sh
QA_FIXTURE_TARGET=staging npm run qa:fixtures -- --cleanup
```

Apply cleanup:

```sh
QA_FIXTURE_TARGET=staging npm run qa:fixtures -- --cleanup --apply
```

Production cleanup also requires `--confirm-production-fixtures`. Cleanup revalidates every owned row and artifact, removes dependencies in foreign-key order, removes exact fixture storage objects, and deletes only Auth users with matching protected ownership metadata. Missing owned items are skipped. Any identifier/content collision aborts. If append-only audit events reference fixture IDs, cleanup refuses and requires Lead review rather than modifying audit history.

Use the same `--historical` flag for historical cleanup. Its deterministic
operational-state events are included in the owned inventory and removed before
dependent historical rows. If later canonical Decision Support outputs or other
records reference the dedicated historical operator, cleanup refuses instead of
guessing ownership; derived outputs must be reviewed by the Lead.

Notifications, email outbox rows, finder context, or idempotency bindings created later by application jobs/interactions are removed only when positively linked to deterministic fixture entity IDs. The unexpected branch `VS003 Temp 1788110993` is report-only and is never changed or deleted.

## Known limitations

- The tool intentionally bypasses supported UI/API lifecycle paths; it does not resolve or validate [booking persistence/retrieval #3](https://github.com/aldrisheesh/car-rental-fleet-management-system/issues/3), [registration #4](https://github.com/aldrisheesh/car-rental-fleet-management-system/issues/4), or [maintenance creation #8](https://github.com/aldrisheesh/car-rental-fleet-management-system/issues/8).
- No `Open` maintenance row is seeded. That avoids choosing an answer to the unresolved [maintenance blocking-policy Finding #9](https://github.com/aldrisheesh/car-rental-fleet-management-system/issues/9). Completed/cancelled non-blocking history is the only unambiguous maintenance coverage in this version.
- The standard UI fixture mode leaves forecast, supply-evaluation, allocation-recommendation, organic demand history, notification, audit/security, backup, and recovery data out of scope. Historical mode supplies only canonical operational inputs; forecast, supply, and allocation outputs remain generated by the application workflow.
- The tool does not create or modify branches, vehicles, vehicle categories, payment methods, schema, RLS, Auth policies, or application behavior.

## Verification

```sh
npm run test:qa-fixtures
npm run lint
npm run build
```

For an integration dry-run, point all three target variables at the same local/disposable Supabase project after migrations are applied. Never use `--apply` merely to test parsing or dry-run behavior.
