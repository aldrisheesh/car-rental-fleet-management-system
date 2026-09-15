# Defense Dataset Verifier Review

## PR identity

- PR: #64 — `feat: add defense dataset verifier`
- Repository: `aldrisheesh/car-rental-fleet-management-system`
- Base: `stabilization/frontend-rebuild`
- Head: `stabilization/defense-dataset-verifier`
- Reviewed head SHA: `5c5277470216b7761c12576f69389087655d38ac`
- PR state: open
- Base contains defense execution commit: `60ddeb7ded6381b53e201150f4312d2e1c4d9c42`

PR identity and refs were verified after `git fetch origin --prune`. The
pre-review worktree was not clean: pre-existing untracked `.agents/` and
`skills-lock.json` were preserved and not staged.

The review stopped at the first confirmed blocking defect, as required. No
implementation file was changed and no production verification was run after
the defect was confirmed.

## Scope

The effective three-dot diff contains five files and 3,507 added lines:

- `scripts/defense/verifier.ts`
- `scripts/defense/verifier.test.ts`
- `scripts/defense/manifest.json`
- `frontend-stabilization/DEFENSE-DATASET-VERIFY-TOOL.md`
- `package.json`

The package change adds only the `defense:verify` and `test:defense` scripts.
No application behavior, API behavior, schema, migration, business-rule,
lifecycle, Auth, Storage, restore, deployment/configuration, or unrelated
refactor change was present in the effective diff.

## Read-only guarantee

PASS by static inspection of the reachable production path. The verifier uses
only fixed-table `select` calls, `auth.admin.listUsers`, and Storage `list`.
There is no reachable `insert`, `update`, `upsert`, `delete`, RPC, SQL
execution, Auth mutation, password mutation, Storage upload/remove/move, or
notification/audit mutation path.

## Project guard

PASS by static inspection and focused tests. Missing URL/key configuration is
blocked; malformed URLs, non-HTTPS URLs, custom domains, and wrong Supabase
project refs are rejected. The exact-ref assertion occurs before
`createClient` and before any production read.

## Manifest integrity

PASS for the checked-in manifest. The manifest contains safe UUIDs and Storage
path hashes only; no credentials, passwords, access tokens, database URLs,
private paths, signed URLs, document contents, or proof contents were found.
The Markdown digest currently matches:

`92961b202331bf046f319a734bbf2c88d1b206885b4ecdd04ee2e21825393877`

The current manifest loads and its expected counts reconcile. Duplicate
baseline IDs are rejected by the implementation. Broader adversarial manifest
testing was not completed after the blocking defect was confirmed.

## Baseline drift detection

FAIL — confirmed blocking defect.

The approved booking scenarios make pickup and return timing meaningful: C01 is
a future booking, while C08 and C09 represent active and returned scenarios.
The booking schema stores `pickup_at` and `return_at` as required fields, and
the approved specification states that the schedule protects the forecast
window.

However, the verifier:

- does not select `pickup_at` or `return_at` in `TABLE_SELECTS.bookings`;
- does not include them in `BookingSnapshotRow` or snapshot mapping; and
- does not compare them in the booking field list.

Evidence: `scripts/defense/verifier.ts` lines 166–174, 388–392, 576–584,
and 1680–1694; `supabase/migrations/20260831150000_booking_requests.sql`
lines 9–10; and `frontend-stabilization/DEFENSE-DATASET-SPECIFICATION.md`
lines 136–147.

An isolated in-memory reproduction changed booking schedule values while
leaving all selected fields intact. `verifyDefenseSnapshot` returned:

`DEFENSE BASELINE VERIFIED`

with zero issues and a passing bookings check. The same mutation in production
would not reach the verifier because those columns are never read. This is a
false-negative baseline mutation and blocks safe merge.

## UAT differentiation

The focused tests pass for extra Auth/profile and booking data, and for
append-only extra notifications/audit rows. Extra baseline-owned records are
still checked by ID and protected fields. Review of the complete UAT matrix was
stopped after the blocking defect.

## Registered-only accounts

PASS by static inspection for the requested child types. The verifier marks
C15–C18 through `noChildWorkflow` and checks bookings, requirement sets,
documents, payments, proofs, and rentals for those account IDs.

## Storage

PASS by static inspection; no live Storage read was run after the blocker was
confirmed. The implementation recursively lists both approved buckets,
handles 1,000-item pagination, distinguishes file entries from folders using
the Storage entry ID, bounds recursion depth, hashes paths in memory, keeps
bucket identity in comparisons, and reports only safe object IDs on drift.

## Auth pagination

PASS by static inspection; no live Auth read was run after the blocker was
confirmed. `listAuthUsers` requests pages of 1,000 users, continues through a
full page, and fails closed on malformed/error responses.

## Notification / Audit evidence

The current focused tests pass for minimum-count evidence, exact recipient and
entity matching, and append-only additions. The verifier checks exact action,
actor, entity, and booking bindings for required audit events. A complete
adversarial review of duplicate evidence predicates and all evidence edge cases
was not completed after the blocking defect.

## Decision Support future-proofing

PASS by static inspection of the design. Decision Support tables are enumerated
through the manifest-driven `DECISION_TABLES` mapping and compared generically;
the verifier does not hard-code the current zero-row state. Future manifest
records can represent the listed forecast, supply, allocation, recommendation,
and candidate classes without a new verifier branch.

## Secret safety

PASS by static inspection and the focused output test. The verifier does not
download private objects or print paths, messages, transaction references,
emails, passwords, service-role keys, signed URLs, document contents, or raw
Auth metadata. Drift output is limited to safe area/kind/UUID diagnostics.

## Tests

`npm run test:defense` passed all 9 focused tests before the blocker was
confirmed. They cover project acceptance/refusal, baseline pass, missing and
modified booking state, extra UAT account/booking classification, append-only
notification/audit tolerance, manifest project mismatch, and secret-safe
output.

Important missing coverage includes booking schedule mutation, the complete
baseline field matrix, >1,000 Auth users, Storage pagination/nesting/depth,
malformed and invalid-reference manifests, duplicate evidence predicates, and
registered-only mutation cases for every child table.

## Production verification

NOT RUN. The review stopped immediately after the first confirmed blocking
false negative, before `npm run defense:verify` could access the configured
production project. The guide's historical claim of a prior production pass
was not treated as this review's dry-verify result.

## Regression

Not run after the blocking defect was confirmed: `npm run test:supabase`,
`npm run test:audit`, `npm run test:backup`, `npm run build`, scoped ESLint,
scoped Prettier, and `git diff --check`.

## Findings / observations

### A. CONFIRMED DEFECT — BLOCKING

Booking schedule fields `pickup_at` and `return_at` are not read or compared.
A meaningful schedule mutation therefore produces `DEFENSE BASELINE VERIFIED`.
This violates the required baseline drift guarantee. PR #64 must not merge.

### D. NON-BLOCKING OBSERVATION

The initial worktree cleanliness pre-flight failed because of pre-existing
untracked `.agents/` and `skills-lock.json`. They were outside the PR diff and
were preserved.

## Merge recommendation

PR #64 NEEDS FIXES
