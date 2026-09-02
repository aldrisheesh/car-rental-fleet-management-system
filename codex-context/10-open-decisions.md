# Open Decisions

**Status:** Active
**Last updated:** 2026-09-02

## Geocoding

Resolved by MIC-025:
- Primary: Geoapify Geocoding
- Fallback: LocationIQ Geocoding

Still open:
- whether final UI should add explicit destination confirmation/autocomplete;
- whether context snapshots should be persisted.

## CQ-032 — Canonical Operational Origin Locations

OPEN — CLIENT CLARIFICATION REQUIRED.

Need a client-approved routing origin/reference location for:
- Manila / Taft fleet;
- Antipolo fleet.

Do not infer or fabricate addresses.

## VS025 Maintenance UI

Resolved implementation baseline:
- canonical maintenance statuses remain Open / Completed / Cancelled;
- due/overdue is derived, not persisted;
- Admin Maintenance page must use canonical records/API;
- mock downtime analytics are removed unless backed by canonical data.

Still open for manuscript reconciliation:
- whether service provider / `performed_by` exists canonically and should be exposed;
- final mapping/removal of manuscript-only `condition_before` / `condition_after`;
- exact final Maintenance_Records data-dictionary wording after VS025.

## Other open items

CQ-028, CQ-029, CQ-030, CQ-031, maintenance/low-availability notifications, notification configuration, reports/dashboard, backup/recovery.
