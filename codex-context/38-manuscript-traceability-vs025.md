# VS025 Manuscript Traceability

**Status:** Frozen
**Last updated:** 2026-09-02

## Direct manuscript support

The latest manuscript supports:
- maintenance records and history;
- preventive maintenance / PMS scheduling;
- mileage/odometer monitoring;
- next PMS date/mileage;
- vehicle condition/readiness;
- maintenance cost;
- maintenance remarks;
- authorized maintenance administration;
- prevention of unresolved-maintenance vehicles from being treated as rental-ready.

The literature section explicitly connects mileage, service dates, vehicle condition, maintenance history, and PMS/readiness dashboards to fleet readiness and assignment safety.

## Current implementation authority

Canonical backend:
- `maintenance_records`;
- `/api/maintenance`;
- maintenance atomic RPCs;
- `calculateMaintenanceReadiness`;
- vehicle odometer / condition-blocking fields.

Canonical lifecycle:
- Open
- Completed
- Cancelled

Derived due/overdue state must not become a fake persisted status.

## Manuscript mismatch / reconciliation

The manuscript data dictionary currently lists a broader legacy model including:
- Scheduled / In Progress / Overdue statuses;
- pms_date;
- pms_mileage_interval;
- condition_before;
- condition_after;
- performed_by;
- recorded_by / updated_by fields in an older schema description.

VS025 must not recreate those fields solely to match the manuscript.

Use actual canonical schema and record manuscript correction requirements through existing MIC-018 or a new MIC only if implementation materially changes again.

## MIC-018

MIC-018 currently states:
maintenance backend is canonical but Admin Maintenance UI contains prototype data.

VS025 is the implementation slice intended to close that UI gap.

After implementation, update MIC-018 status to implemented/canonicalized.

## MIC-019

Maintenance and low-availability notifications remain pending.

VS025 must not mark the full notification requirement complete.

## No predictive-maintenance overclaim

The literature discusses predictive maintenance approaches, but the implemented capstone baseline remains deterministic maintenance/PMS/readiness monitoring.

Do not claim an AI predictive-maintenance algorithm unless one is actually implemented.

## Expected manuscript revision after VS025

Review/update:
- Maintenance use case/UI description;
- Maintenance_Records data dictionary;
- status vocabulary;
- PMS field mapping;
- vehicle condition/readiness description;
- Admin maintenance screen descriptions;
- diagrams showing maintenance workflow.

Do not update the manuscript before implementation review confirms the final VS025 fields.
