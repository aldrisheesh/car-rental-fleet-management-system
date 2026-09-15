# Defense Dataset Execution

## Lead authorization

Execution was authorized by the Lead for the approved defense specification:

- Branch: `stabilization/frontend-rebuild`
- Production Supabase project: `vkfacfjkwomhfvrieaza`
- Approved specification commit: `9519b62655df4d2212adbeb4a495a43511c7fced`
- Baseline verification commit: `886a64d15e352a167783779cb413528a208a5bd3`
- Source HEAD used for execution: `9519b62655df4d2212adbeb4a495a43511c7fced`

The authorization covered the 21 accounts, current workflow scenarios,
approved maintenance scenarios, controlled historical data subject to the
forecast time gate, canonical notifications/audit generation, verification,
and creation of the manifest and execution evidence. No deployment, merge,
old-project access, QA fixture, schema change, migration edit, or application
source change was authorized or performed.

## Project identity

Project identity passed before and during creation. The active Supabase URL
resolved to `vkfacfjkwomhfvrieaza`; the retired ref
`cpkyxnxpzufigcmaptpg` was not targeted. The repository remained on
`stabilization/frontend-rebuild`. `origin/main` remained at
`faed190d9b78bb845e2c89e7160eda90106f741f`.

The repository contains 52 migration files. The remote migration ledger was
rechecked at 52 entries after creation, and the baseline had already verified
the canonical migration set, including
`20260910010000_maintenance_service_access.sql`.

Canonical reference data remained unchanged:

- 2 active branches: Taft, Manila and Antipolo, Rizal;
- 6 active vehicle categories;
- 12 active canonical `DEV-*` vehicles;
- 1 active migration-established demo payment method;
- 12 migration-established initial vehicle operational-state events.

## Forecast time gate

The canonical coverage row reported:

- `tracking_started_at`: `2026-09-14T20:17:49.748203Z`;
- first trustworthy complete Manila-local week: `2026-09-21`;
- complete trusted Manila weeks currently available: `0`;
- classification: **C — fewer than three complete trusted weeks available**.

The tracking timestamp was not changed or backdated. No historical demand
inputs, historical booking/rental pairs, forecasts, supply evaluations, or
allocation recommendations were created. The current C09 workflow row has a
recent returned-rental scenario, but the forecasting service excludes its
pre-coverage pickup week; it was not used as fabricated forecast history.

## Account creation

Exactly 21 Auth users and 21 profiles were created and verified Active:

| Role             |  Count |
| ---------------- | -----: |
| Owner/Admin      |      1 |
| Operations Staff |      2 |
| Customer/Renter  |     18 |
| **Total**        | **21** |

The approved C01–C18 mapping is recorded in
`DEFENSE-DATASET-MANIFEST.md`. C15–C18 were verified to have zero bookings,
requirement sets/documents, payments/proofs, and rentals. Customer access was
verified against the Admin Dashboard boundary with HTTP 403. Operations Staff
accessed Dashboard and Reports with HTTP 200 and received HTTP 403 from the
Owner/Admin-only Maintenance read endpoint.

The public signup probe was not usable for this execution: the synthetic
`.test` form was rejected by Auth validation and a valid reserved synthetic
domain was rate-limited by the Auth email provider. The authorized privileged
provisioning path was therefore used for the complete synthetic account set.
No credentials were printed or committed; passwords remain outside this
evidence and require secure Lead-managed handoff/reset for later user testing.

## Customer distribution

The current gate-C snapshot contains one current booking for each of C01–C09
and zero current bookings for C10–C18. C10–C14 are reserved for the approved
historical allocation once trusted weeks exist. C15–C18 are intentional
registered-only accounts.

| Measure                            | Observed now | Approved full-history target |
| ---------------------------------- | -----------: | ---------------------------: |
| Customers                          |           18 |                           18 |
| Current bookings                   |            9 |                            9 |
| Historical returned bookings       |            0 |                     up to 36 |
| Total bookings                     |            9 |                     up to 45 |
| Mean bookings per Customer         |          0.5 |                          2.5 |
| Median bookings per Customer       |            0 |                            2 |
| Customers with zero bookings       |            9 |                4 after H1–H6 |
| Customers with exactly one booking |            9 |                3 after H1–H6 |
| Repeat renters                     |            0 |               11 after H1–H6 |

The full approved uneven distribution was not silently approximated. It remains
the post-gate H1–H6 target in the approved specification.

## Current booking scenarios

Nine current bookings were created through the canonical booking workflow. The
final states are:

| Label | Booking ID                             | State and related evidence                                              |
| ----- | -------------------------------------- | ----------------------------------------------------------------------- |
| C01   | `ac1df55a-6342-43df-a5f9-18d0c6a2dbc7` | Confirmed future; Verified requirements; Verified payment; no rental    |
| C02   | `ad4caf7e-f25c-467f-81a6-73ae7fbc4401` | Submitted; no requirement set                                           |
| C03   | `8dcb959f-7f42-456c-974b-9ba56227c288` | Submitted; Requirements Pending Review                                  |
| C04   | `4d7fc0b1-5cda-47fb-981a-5859f2e27212` | Submitted; Requirements Needs Resubmission                              |
| C05   | `4f5ee393-aef2-4012-85d0-0cdb3d25d3ea` | Submitted; Requirements Verified after one correction cycle; no payment |
| C06   | `d6cdd04a-608d-4bce-9d22-eb34cfc1c9d6` | Submitted; Requirements Verified; Payment Pending Verification          |
| C07   | `651cdf46-4982-4b1b-bcbe-cc8ddebb6a8a` | Submitted; Requirements Verified; Payment Needs Resubmission            |
| C08   | `b99d85f2-0063-433f-b329-6786b8b50972` | Confirmed; active rental                                                |
| C09   | `d0fcd76c-0572-4a6b-a5c7-d3d10fc8086c` | Confirmed; returned rental                                              |

No unsupported booking status was inserted. No Rejected or Cancelled booking
path was fabricated.

## Historical analytical data

Historical creation was correctly skipped under classification C. There are no
historical returned booking/rental pairs, no H1–H6 rows, and no controlled
historical generator helper was added to the repository. The approved target
remains 36 pairs across six complete trusted Manila weeks, to be considered
only after the coverage gate reaches A or B and a separately authorized
bounded generator is available.

No C10–C14 account was used for current or historical rows. No C15–C18 account
was used for any child workflow row.

## Requirements

Eight canonical requirement sets were created using only `Valid Government ID`
and `Driver's License` document types:

- Verified: C01, C05, C06, C07, C08, C09 — 6 sets;
- Pending Review: C03 — 1 set;
- Needs Resubmission: C04 — 1 set;
- document rows: 17 total, 16 current;
- review rows: 8 total;
- C05: one replacement-document correction cycle followed by Verified;
- all stored artifacts: synthetic placeholder PDFs only.

## Payments

Five payments were submitted through the canonical payment flow using the one
active demo payment method:

- Verified: C01, C08, C09 — 3;
- Pending Verification: C06 — 1;
- Needs Resubmission: C07 — 1;
- payment proof objects: 5;
- required amounts: null for all five rows, preserved truthfully;
- C05: no payment row, remaining payment-actionable.

All proof artifacts are synthetic placeholders. No real payment information
was used.

## Rentals

The authorized assignment → confirmation → release → return workflow produced:

- C08: active rental `d992a451-08e7-4f8f-bbc5-a6085a5a3cc7` on `DEV-RUSH-001`;
- C09: returned rental `d4669028-e574-4b0f-9367-a94bbbd5bba7` on
  `DEV-INNO-001`;
- C01: confirmed future booking with no rental row.

No unsupported rental state was used. C09's return was performed through the
canonical return service, not by direct status editing.

## Maintenance

Three maintenance scenarios were created with canonical services:

| ID                                     | Vehicle        | Status    | Blocking |
| -------------------------------------- | -------------- | --------- | -------- |
| `974bf9c6-7c5f-4fdd-b788-f8abef089637` | `DEV-HIAC-001` | Completed | No       |
| `5722c058-3880-4cdc-bbec-afe4ac7ba547` | `DEV-RANG-001` | Cancelled | No       |
| `1ed9a28e-1093-4e55-907e-998c73cda6ff` | `DEV-URVN-001` | Open      | Yes      |

The open blocking record does not overlap the C08 active rental. The Completed
and Cancelled statuses were reached by canonical Open → terminal transitions
during this session. Their timestamps are current-session timestamps; no
unsupported backdating was used.

## Notifications

Notifications were generated by booking, requirements, payment, confirmation,
maintenance, and the scheduled notification processor. The final database
contains 39 notification rows, including one active maintenance-attention
condition for the Open Nissan Urvan service. The processor returned HTTP 200
and reported one operational condition activation with no failures. It was
rerun only through the canonical internal processor path; notification rows
were not hand-inserted.

The same processor handled 15 synthetic-domain transactional email deliveries.
Those recipients are reserved synthetic accounts; no real recipient address
was used. Email delivery counts are operational evidence, not a fixed dataset
target.

## Audit

The append-only audit table contains 50 rows generated by canonical workflows,
including booking creation, requirement/payment transitions, assignment,
confirmation, rental release/return, and maintenance transitions. No audit row
was manually inserted or deleted.

The audit action summary includes 3 `rental.released` events and 1
`rental.returned` event. One release event is the truthful trace of the
bounded C01 execution correction described below; the final baseline has two
rental rows (C08 active and C09 returned). This is disclosed rather than
silently normalized.

## Reports

The live Owner/Admin Reports endpoint was verified for `2026-09-14` through
`2026-09-30`:

| Report result                 | Observed |
| ----------------------------- | -------: |
| Booking requests              |        9 |
| Booking status: Confirmed     |        3 |
| Booking status: Submitted     |        6 |
| Rentals started               |        2 |
| Rentals completed             |        1 |
| Active at period end          |        1 |
| Fleet count                   |       12 |
| Maintenance started           |        3 |
| Maintenance completed         |        1 |
| Maintenance cancelled         |        1 |
| Blocking maintenance workload |        1 |
| Branch performance groups     |        2 |
| Category performance groups   |        6 |

The six-week historical Reports range is not yet available and is truthfully
time-gated.

## Decision Support

No Decision Support generation was attempted because the trusted-history gate
is C. The read-only application surfaces report:

- forecast runs: 0;
- forecast inputs: 0;
- forecast rows: 0;
- supply evaluations: 0;
- allocation recommendation batches: 0;
- allocation recommendations/candidates: 0.

This is the expected truthful insufficient-history baseline. Forecasts,
supply evaluations, allocation recommendations, and MAPE must be generated by
their canonical services only after sufficient trusted coverage exists.

## Manifest

`frontend-stabilization/DEFENSE-DATASET-MANIFEST.md` was created after
verification. It records the safe account, workflow, maintenance, Storage,
historical, and derived-output identifiers and provenance classes. It contains
no credentials or private artifact contents.

## User-testing / restore considerations

The current rows and IDs in the manifest are the Defense Baseline. They must be
treated as immutable after Lead-approved freeze. Future post-freeze UAT data
must be tracked separately and must not mutate baseline rows or be silently
counted as baseline history.

No restore script, hidden UI route, secret keyboard shortcut, or destructive
reset was implemented. A future explicit `npm run defense:verify` and, if
authorized, `npm run defense:restore` must bind to the exact project ref,
require confirmation, protect credentials, use a safe manifest allowlist,
account for Auth/Storage/Audit/Notifications/Reports/Decision Support, and
fail closed when UAT data cannot be separated safely.

## Final counts

| Dataset component                 |                                                   Observed |
| --------------------------------- | ---------------------------------------------------------: |
| Auth users                        |                                                         21 |
| Profiles                          |                                                         21 |
| Owner/Admin                       |                                                          1 |
| Operations Staff                  |                                                          2 |
| Customers                         |                                                         18 |
| Zero-booking Customers            | 9 in the gate-C snapshot; C15–C18 verified registered-only |
| Current bookings                  |                                                          9 |
| Historical returned bookings      |                                                          0 |
| Total bookings                    |                                                          9 |
| Requirement sets                  |                                                          8 |
| Payments                          |                                                          5 |
| Active rentals                    |                                                          1 |
| Returned rentals                  |                                                          1 |
| Maintenance records               |                                                          3 |
| Notifications                     |                                                         39 |
| Audit events                      |                                                         50 |
| Forecast inputs / forecasts       |                                                      0 / 0 |
| Supply evaluations                |                                                          0 |
| Allocation recommendation batches |                                                          0 |
| Storage objects                   |     17 renter-requirement objects; 5 payment-proof objects |

## Provenance

Canonical migration reference data remains distinct from current defense
workflow data. No controlled historical data was created because of the time
gate. Notifications and audit rows were generated by canonical workflows and
the trusted processor. Derived outputs remain empty and were not hand-authored.
The manifest is the safe cross-reference for every created baseline-owned
record.

## Safety review

- Production project identity: PASS; old project targeted: NO.
- Source files modified: none.
- Migration files modified: none.
- QA fixtures applied: none.
- QA/VS runtime residue: not detected.
- `.env.local`: ignored and not committed.
- Secrets/passwords/tokens: not printed, documented, or tracked.
- Synthetic document/proof contents: not committed.
- Branch: `stabilization/frontend-rebuild`.
- `origin/main`: unchanged.
- No deployment, merge, or push to another branch.

## Findings / observations

1. The forecast coverage gate is C. This is the reason the dataset is
   partially ready rather than a claim of full 45-row analytical readiness.
2. Auth email signup was rate-limited for the synthetic reserved domain, so the
   authorized privileged provisioning path created the accounts. No extra
   accounts were created.
3. The initial execution script released C01 accidentally. The exact rental row
   was removed before downstream generation using a bounded owner transaction;
   its append-only release audit trace remains and is disclosed above. No
   application defect was found.
4. The two terminal maintenance scenarios have current-session service times.
   No historical timestamp was fabricated while the coverage gate is C.
5. Defense account passwords were not placed in tracked files or evidence.
   Secure Lead-managed password handoff/reset is required before group/user
   testing.

## Dataset classification

DEFENSE DATASET PARTIALLY READY — HISTORY TIME-GATED
