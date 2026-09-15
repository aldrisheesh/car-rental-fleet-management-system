# Defense Dataset Manifest

Manifest status: `DEFENSE DATASET PARTIALLY READY — HISTORY TIME-GATED`

This manifest is the safe verification map for the defense data created in the
single production Supabase project. It contains identifiers and synthetic
labels only. It contains no passwords, service keys, access tokens, private
document contents, or payment secrets.

| Field                                  | Value                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Repository branch                      | `stabilization/frontend-rebuild`                                                                        |
| Source commit                          | `9519b62655df4d2212adbeb4a495a43511c7fced`                                                              |
| Production project ref                 | `vkfacfjkwomhfvrieaza`                                                                                  |
| Approved specification                 | `frontend-stabilization/DEFENSE-DATASET-SPECIFICATION.md` at `9519b62655df4d2212adbeb4a495a43511c7fced` |
| Coverage tracking start                | `2026-09-14T20:17:49.748203Z`                                                                           |
| First trustworthy complete Manila week | `2026-09-21`                                                                                            |
| Trusted complete weeks at execution    | `0`                                                                                                     |
| History classification                 | `C — fewer than three complete trusted weeks`                                                           |
| Manifest scope                         | Current defense workflow data only; H1–H6 and all derived Decision Support outputs are deferred         |

## Provenance classes

- `MIGRATION REFERENCE`: canonical branches, categories, `DEV-*` vehicles,
  demo payment method, and initial vehicle-state events.
- `CURRENT DEFENSE WORKFLOW`: accounts, current bookings, current requirement
  and payment workflows, current rentals, maintenance scenarios, and their
  canonical notifications/audit evidence.
- `CONTROLLED HISTORICAL`: bounded H1–H6 booking/rental rows. None were
  created because the coverage gate is currently C.
- `DERIVED OUTPUT`: forecasts, forecast inputs, supply evaluations, allocation
  recommendations, and later finalization state. None were generated because
  the coverage gate is currently C.

## Account identities

The labels below are safe manifest identifiers. Names are synthetic and are not
customer-facing test labels.

| Label | Auth/profile ID                        | Synthetic name         | Role             | Account status | Current bookings | Child workflow status                            |
| ----- | -------------------------------------- | ---------------------- | ---------------- | -------------- | ---------------: | ------------------------------------------------ |
| A01   | `9a416420-324e-49eb-a737-975e5432bd71` | Defense Owner Admin    | Owner/Admin      | Active         |                — | Workflow actor                                   |
| S01   | `060e20ca-acb3-4f8f-878a-45f0aa496e09` | Defense Operations One | Operations Staff | Active         |                — | Read-surface actor                               |
| S02   | `189488f5-3fc4-4690-900d-1e6492690aa2` | Defense Operations Two | Operations Staff | Active         |                — | Read-surface actor                               |
| C01   | `4504b6ad-3ee0-4482-88a2-e3f015dd033d` | Ari Santos             | Customer/Renter  | Active         |                1 | Confirmed future booking                         |
| C02   | `0badf004-d6ce-4a36-8360-cd1f998a4f83` | Bea Navarro            | Customer/Renter  | Active         |                1 | Submitted; no requirement set                    |
| C03   | `8a87f14f-32e4-4347-a2ff-e2e3b623641a` | Celine Rivera          | Customer/Renter  | Active         |                1 | Requirements Pending Review                      |
| C04   | `bbf01016-c3b7-4a90-b036-afe83fc391c6` | Diego Cruz             | Customer/Renter  | Active         |                1 | Requirements Needs Resubmission                  |
| C05   | `1937a020-64a5-42e0-9c35-ae4a441854fd` | Elena Lim              | Customer/Renter  | Active         |                1 | Requirements Verified; payment actionable        |
| C06   | `0a9d6a88-9912-4b62-9e5f-32fc6427283a` | Felix Go               | Customer/Renter  | Active         |                1 | Payment Pending Verification                     |
| C07   | `71aacc49-c99e-42c2-809a-0d06b704f36e` | Gia Ramos              | Customer/Renter  | Active         |                1 | Payment Needs Resubmission                       |
| C08   | `b08c63c4-fba0-42d5-95b7-0cdc57ba5bdc` | Hana Villanueva        | Customer/Renter  | Active         |                1 | Active rental                                    |
| C09   | `6d357eac-d383-479a-9b99-d0419ed8a742` | Ivo Castillo           | Customer/Renter  | Active         |                1 | Returned rental                                  |
| C10   | `b17bb97c-3be9-4333-b588-8df1486cc702` | Jules Mendoza          | Customer/Renter  | Active         |                0 | History reserved; deferred by gate C             |
| C11   | `5aad17e6-5be7-4eed-92eb-8268c84e706d` | Kira Bautista          | Customer/Renter  | Active         |                0 | History reserved; deferred by gate C             |
| C12   | `e07b1d5d-904c-4807-a396-b99bb225ba75` | Leo Mercado            | Customer/Renter  | Active         |                0 | History reserved; deferred by gate C             |
| C13   | `33191bee-8ef9-4062-b2c0-9d2aad251ef8` | Mira Salazar           | Customer/Renter  | Active         |                0 | History reserved; deferred by gate C             |
| C14   | `39df0fb2-e813-451c-b01b-faad3150c2fe` | Nico Villanueva        | Customer/Renter  | Active         |                0 | History reserved; deferred by gate C             |
| C15   | `3aa113cb-a856-4db9-aae3-74487afb6907` | Quinn Reyes            | Customer/Renter  | Active         |                0 | Registered-only; verified no child workflow rows |
| C16   | `f3469861-b101-403e-a3ae-c4fc41962786` | Rina Flores            | Customer/Renter  | Active         |                0 | Registered-only; verified no child workflow rows |
| C17   | `4ed007d7-df12-4533-ae9e-2b066d3be88f` | Sol Navarro            | Customer/Renter  | Active         |                0 | Registered-only; verified no child workflow rows |
| C18   | `6701f797-b784-44e9-96cb-a8572f20b892` | Tori Alcantara         | Customer/Renter  | Active         |                0 | Registered-only; verified no child workflow rows |

Observed role counts are 1 Owner/Admin, 2 Operations Staff, and 18
Customer/Renter accounts. Auth and profile counts are both 21.

## Current booking map

All rows below are `CURRENT DEFENSE WORKFLOW` records. There are no H1–H6
historical rows in this execution.

| Label | Booking ID                             | Status    | Branch          | Assigned/requested vehicle | Scenario                                                                   |
| ----- | -------------------------------------- | --------- | --------------- | -------------------------- | -------------------------------------------------------------------------- |
| C01   | `ac1df55a-6342-43df-a5f9-18d0c6a2dbc7` | Confirmed | Taft, Manila    | `DEV-EVST-001`             | Future confirmed booking; verified requirements and payment; no rental row |
| C02   | `ad4caf7e-f25c-467f-81a6-73ae7fbc4401` | Submitted | Antipolo, Rizal | `DEV-AVAN-001`             | Submitted with no requirement set                                          |
| C03   | `8dcb959f-7f42-456c-974b-9ba56227c288` | Submitted | Taft, Manila    | `DEV-WIGO-001`             | Requirements Pending Review                                                |
| C04   | `4d7fc0b1-5cda-47fb-981a-5859f2e27212` | Submitted | Antipolo, Rizal | `DEV-VIOS-001`             | Requirements Needs Resubmission                                            |
| C05   | `4f5ee393-aef2-4012-85d0-0cdb3d25d3ea` | Submitted | Taft, Manila    | `DEV-CITY-001`             | Requirements Verified after correction; no payment row                     |
| C06   | `d6cdd04a-608d-4bce-9d22-eb34cfc1c9d6` | Submitted | Antipolo, Rizal | `DEV-RANG-001`             | Requirements Verified; Payment Pending Verification                        |
| C07   | `651cdf46-4982-4b1b-bcbe-cc8ddebb6a8a` | Submitted | Taft, Manila    | `DEV-HILX-001`             | Requirements Verified; Payment Needs Resubmission                          |
| C08   | `b99d85f2-0063-433f-b329-6786b8b50972` | Confirmed | Antipolo, Rizal | `DEV-RUSH-001`             | Confirmed active rental                                                    |
| C09   | `d0fcd76c-0572-4a6b-a5c7-d3d10fc8086c` | Confirmed | Taft, Manila    | `DEV-INNO-001`             | Confirmed returned rental                                                  |

Current booking distribution is nine rows: one each for C01–C09 and zero for
C10–C18. This is the truthful gate-C snapshot; it does not claim the approved
45-row distribution before trusted history exists.

## Requirements

| Label | Requirement set ID                     | Status             | Reviews | Document objects | Current objects |
| ----- | -------------------------------------- | ------------------ | ------: | ---------------: | --------------: |
| C01   | `bb42bd6d-0949-4340-9e95-f74abb293ac1` | Verified           |       1 |                2 |               2 |
| C03   | `db99c848-20fb-49dd-9fec-ec68dad92cfd` | Pending Review     |       0 |                2 |               2 |
| C04   | `4e668c51-fb17-45a0-8f9e-eb4aad1f623d` | Needs Resubmission |       1 |                2 |               2 |
| C05   | `03531c61-b4f4-41f7-bd06-dc2bda8fafe6` | Verified           |       2 |                3 |               2 |
| C06   | `85a59211-9ea5-444c-99a8-49656cc10ed8` | Verified           |       1 |                2 |               2 |
| C07   | `8a756d9b-f333-4dee-ac50-9f12a4fcacbf` | Verified           |       1 |                2 |               2 |
| C08   | `b3662c5a-e8cf-48b3-a4a7-0b27d197ac31` | Verified           |       1 |                2 |               2 |
| C09   | `71f99c98-baaa-4d0b-9d3e-960018a209c3` | Verified           |       1 |                2 |               2 |

Requirement totals are 8 sets, 17 document rows, 16 current document rows,
and 8 review rows. The canonical document types are used exclusively. C05 has
one superseded synthetic Driver's License object from its correction cycle.

## Payments and proofs

All payments use the one active migration-established demo method. All
`required_amount` values remain null; no percentage or settlement rule was
invented.

| Label | Payment ID                             | Booking ID                             | Status               | Proof object ID                        |
| ----- | -------------------------------------- | -------------------------------------- | -------------------- | -------------------------------------- |
| C01   | `d71bd0bf-f43f-4f3c-ad22-100fea93e90f` | `ac1df55a-6342-43df-a5f9-18d0c6a2dbc7` | Verified             | `155649a0-d43c-41d6-a0c2-4f4b6c4c6ce7` |
| C06   | `8d33eb4e-3690-4a7f-a6e7-3acdd48f35c5` | `d6cdd04a-608d-4bce-9d22-eb34cfc1c9d6` | Pending Verification | `17d85f56-4c55-41ee-bc02-64a97d353469` |
| C07   | `194e999b-a60b-478f-8dd3-2afcc4b26e41` | `651cdf46-4982-4b1b-bcbe-cc8ddebb6a8a` | Needs Resubmission   | `eeb65754-8ce1-46bb-87d3-8d4f250e0446` |
| C08   | `8e8d4587-a4b7-4cae-bcfb-bb76a4d76d9f` | `b99d85f2-0063-433f-b329-6786b8b50972` | Verified             | `22e94c0a-0690-4b40-9e8b-d315741586b1` |
| C09   | `442e0043-3afb-47e9-aada-624e42e0eeab` | `d0fcd76c-0572-4a6b-a5c7-d3d10fc8086c` | Verified             | `bbbefb70-85b2-48fe-92ad-8daa23a3873f` |

Payment totals are 5 payment rows and 5 current proof objects. C05 has no
payment row by design.

## Rentals

| Label | Rental ID                              | Booking ID                             | Vehicle        | State                          |
| ----- | -------------------------------------- | -------------------------------------- | -------------- | ------------------------------ |
| C08   | `d992a451-08e7-4f8f-bbc5-a6085a5a3cc7` | `b99d85f2-0063-433f-b329-6786b8b50972` | `DEV-RUSH-001` | Active; `ended_at` null        |
| C09   | `d4669028-e574-4b0f-9367-a94bbbd5bba7` | `d0fcd76c-0572-4a6b-a5c7-d3d10fc8086c` | `DEV-INNO-001` | Returned; `ended_at` populated |

There is intentionally no rental row for C01.

## Maintenance

| Label | Maintenance ID                         | Vehicle        | Status    | Blocks rental use | Provenance                                  |
| ----- | -------------------------------------- | -------------- | --------- | ----------------- | ------------------------------------------- |
| M01   | `974bf9c6-7c5f-4fdd-b788-f8abef089637` | `DEV-HIAC-001` | Completed | No                | Current-session canonical status transition |
| M02   | `5722c058-3880-4cdc-bbec-afe4ac7ba547` | `DEV-RANG-001` | Cancelled | No                | Current-session canonical status transition |
| M03   | `1ed9a28e-1093-4e55-907e-998c73cda6ff` | `DEV-URVN-001` | Open      | Yes               | Current defense workflow; readiness impact  |

The two terminal maintenance statuses were created and transitioned through
the canonical service during this execution. Their service timestamps are
current-session timestamps; no pre-coverage timestamp was fabricated.

## Storage ownership

The canonical private buckets are populated only with synthetic artifacts.
Object contents are intentionally not represented in this manifest.

| Bucket                | Owner labels                           | Object count | Ownership detail                                                     |
| --------------------- | -------------------------------------- | -----------: | -------------------------------------------------------------------- |
| `renter-requirements` | C01, C03, C04, C05, C06, C07, C08, C09 |           17 | Two canonical document types per set; C05 has one superseded version |
| `payment-proofs`      | C01, C06, C07, C08, C09                |            5 | One current synthetic proof per payment                              |

## Historical and derived records

No controlled historical booking/rental rows were created. H1–H6, the 36
historical returned bookings, and all Customer booking distribution beyond the
nine current rows are deferred until the coverage gate reaches A or B.

No derived outputs were generated:

| Derived class                     | Runs/batches |                        Inputs/rows |
| --------------------------------- | -----------: | ---------------------------------: |
| Forecast runs                     |            0 | Forecast inputs 0; forecast rows 0 |
| Supply evaluations                |            0 |         Supply vehicle snapshots 0 |
| Allocation recommendation batches |            0 |       Recommendations/candidates 0 |

## Generated evidence references

- Notifications: 39 rows, including the current maintenance-attention
  notification and workflow notifications for booking, requirement, and
  payment transitions.
- Active operational notification conditions: 1 maintenance-attention
  condition for the open blocking maintenance record.
- Audit events: 50 append-only rows generated by canonical workflows.
- Vehicle operational-state events: 12 migration-established initial events;
  no additional state events were fabricated.

## Bounded correction log

The first execution script accidentally released C01 in addition to C08 and
C09. Before any historical or derived output existed, the exact C01 rental row
was removed using a database-owner transaction constrained by the C01 profile,
booking, rental ID, and null `ended_at`. No application source, migration,
schema, notification, or audit row was edited. The append-only
`rental.released` event remains as a truthful trace of the attempted action;
the final baseline rental map above excludes the corrected row.

This correction is an execution trace, not an application defect or an
approved new business rule. Any future restore/verification tool must account
for this bounded correction record explicitly rather than silently normalizing
the audit stream.

## Reproducibility and post-freeze UAT

This manifest is the baseline allowlist for future verification. A future
explicit engineering tool may provide `npm run defense:verify` and, only after
Lead approval, `npm run defense:restore`. No restore script was implemented in
this execution.

Future restore tooling must bind to `vkfacfjkwomhfvrieaza`, require explicit
confirmation, protect credentials outside tracked files, and distinguish this
baseline from post-freeze UAT accounts and rows. It must account for Auth,
Storage, current workflow data, the bounded correction trace, append-only
Audit, Notifications, Reports inputs, and canonical regeneration of derived
Decision Support state. It must fail closed rather than silently delete
legitimate baseline or UAT records.

The dataset is not permanently frozen. Post-freeze UAT must be recorded
outside this manifest and must not mutate baseline rows.
