# Defense Dataset Verifier Fix

## Confirmed defect

The original PR omitted `pickup_at` and `return_at` from the booking read model
and protected-field comparison. A baseline booking schedule could therefore be
changed while verification still returned `DEFENSE BASELINE VERIFIED`.

The original finding remains preserved in
`DEFENSE-DATASET-VERIFIER-REVIEW.md`.

## Root cause

`TABLE_SELECTS.bookings`, `BookingSnapshotRow`, the snapshot mapper, and the
booking comparison field list contained customer, state, branch, and vehicle
fields but no booking schedule fields.

## Bounded implementation

Only the schedule protection was added:

- booking reads now select `pickup_at` and `return_at`;
- `BookingSpec` and `BookingSnapshotRow` represent `pickupAt` and `returnAt`;
- the snapshot mapper normalizes both fields as timestamp strings;
- booking comparison protects both fields; and
- manifest booking timestamps must be non-empty, parseable instants.

The adjacent manifest-only `requestedVehicleKey` and `assignedVehicleKey`
fields were inspected and deliberately left unchanged. The database booking
row stores the canonical vehicle IDs already compared by the verifier; these
keys are redundant labels and adding vehicle joins would broaden this bounded
fix.

## Manifest update

The canonical values were obtained from the authorized project
`vkfacfjkwomhfvrieaza` using one read-only query for the nine existing manifest
booking IDs: `select id,pickup_at,return_at`. No timestamps were invented or
changed in production.

| Label | Booking ID                             | Pickup (UTC)                    | Return (UTC)                    |
| ----- | -------------------------------------- | ------------------------------- | ------------------------------- |
| C01   | `ac1df55a-6342-43df-a5f9-18d0c6a2dbc7` | `2026-09-18T02:16:44.832+00:00` | `2026-09-20T02:16:44.832+00:00` |
| C02   | `ad4caf7e-f25c-467f-81a6-73ae7fbc4401` | `2026-09-16T02:16:44.832+00:00` | `2026-09-18T02:16:44.832+00:00` |
| C03   | `8dcb959f-7f42-456c-974b-9ba56227c288` | `2026-09-17T02:16:44.832+00:00` | `2026-09-19T02:16:44.832+00:00` |
| C04   | `4d7fc0b1-5cda-47fb-981a-5859f2e27212` | `2026-09-18T02:16:44.832+00:00` | `2026-09-21T02:16:44.832+00:00` |
| C05   | `4f5ee393-aef2-4012-85d0-0cdb3d25d3ea` | `2026-09-19T02:16:44.832+00:00` | `2026-09-21T02:16:44.832+00:00` |
| C06   | `d6cdd04a-608d-4bce-9d22-eb34cfc1c9d6` | `2026-09-20T02:16:44.832+00:00` | `2026-09-23T02:16:44.832+00:00` |
| C07   | `651cdf46-4982-4b1b-bcbe-cc8ddebb6a8a` | `2026-09-21T02:16:44.832+00:00` | `2026-09-23T02:16:44.832+00:00` |
| C08   | `b99d85f2-0063-433f-b329-6786b8b50972` | `2026-09-15T01:16:44.832+00:00` | `2026-09-17T02:16:44.832+00:00` |
| C09   | `d0fcd76c-0572-4a6b-a5c7-d3d10fc8086c` | `2026-09-14T02:16:44.832+00:00` | `2026-09-16T02:16:44.832+00:00` |

The timestamps were added to both the human-readable Markdown manifest and
`scripts/defense/manifest.json`. The Markdown/JSON digest currently matches:

`1cb739501b00ae87637a708d19288f0d7ea15f896eecd3dff6f8ddcd8067e937`

## Timestamp comparison

Comparison reuses the existing `sameValue` timestamp semantics, which compares
`Date.parse` instants rather than timestamp text. Equivalent representations
such as `2026-09-18T02:16:44.832+00:00` and
`2026-09-18T10:16:44.832+08:00` pass. Different instants fail. No local-time
conversion or timezone-dependent comparison was introduced.

## Regression tests

`npm run test:defense` passes all 14 tests, including:

- unchanged pickup/return schedule passes;
- pickup-only modification reports booking drift;
- return-only modification reports booking drift;
- equivalent timestamp representations pass; and
- changing both timestamps reports booking drift.

The original confirmed reproduction now returns
`DEFENSE BASELINE DRIFT DETECTED` rather than
`DEFENSE BASELINE VERIFIED`.

## Production read-only verification

`npm run defense:verify` was run against the configured authorized project and
returned:

`DEFENSE BASELINE VERIFIED`

All baseline checks passed, all extra-data counts were zero, and no production
insert, update, delete, RPC, SQL execution, Auth mutation, or Storage mutation
was performed.

## Security / scope review

- No application source, schema, or migration files changed.
- No restore or business-rule behavior was added.
- The verifier remains limited to table reads, Auth user listing, and Storage
  metadata listing.
- No credentials, private paths, document contents, or payment references were
  added to the manifests or output.
- The original review result was preserved unchanged.

## Result

FIX VERIFIED — READY FOR RE-REVIEW
