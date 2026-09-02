# Manuscript Revision Backlog

**Generated from VS001–VS021 alignment audit**
**Date:** 2026-09-02

This is an editing queue, not authorization to change the manuscript without checking the final implemented system.

## Ready for manuscript revision now

### MR-001 — Audit data dictionary
Replace the generic field-change Audit_Logs design with the implemented semantic append-only audit_events design.

Affected:
- Data Dictionary
- ERD
- Audit feature description
- Security/accountability discussion
- Audit use case/UI

### MR-002 — Notifications data dictionary
Replace conceptual user/renter/is_read design with recipient-specific notifications, related entity linkage, deterministic event key, and read_at.

Affected:
- Data Dictionary
- ERD
- Notification use cases
- Notification architecture

### MR-003 — Email provider
If Brevo remains final, replace planned Resend/React Email application delivery references with Brevo and Brevo SMTP where applicable.

Affected:
- Development Tools
- Architecture
- Notification implementation description

### MR-004 — Finder → Booking
Show that Finder result selection enters the existing Booking flow and does not create a separate booking system.

Affected:
- Finder activity diagram
- Booking activity diagram
- DFD
- Architecture
- feature narrative

### MR-005 — Booking reliability
Document request idempotency as a reliability/data-integrity implementation detail where appropriate.

### MR-006 — Requirement correction loop
Ensure Needs Resubmission/resubmission is visible throughout requirement/payment diagrams.

### MR-007 — Payment baseline
Ensure manual verification is the implemented baseline and PayMongo is not described as currently implemented.

### MR-008 — Audit scope
Narrow any statement claiming Forecasting/Allocation/Reports/Login/Logout are currently audited unless later implemented.

## Wait until implementation is complete

### MR-009 — Maintenance UI
Wait for canonical Maintenance UI before final screenshots/data-flow wording.

### MR-010 — Maintenance/availability notifications
Wait for remaining notification slices.

### MR-011 — Reports/Dashboard
Wait for canonicalization.

### MR-012 — Backup/recovery
Wait for final implementation decision.

### MR-013 — External context
Wait for manuscript-aligned TomTom/HERE/Open-Meteo/OpenWeather implementation.

### MR-014 — Settlement/penalties
Wait for client clarification.

## Reassess conceptual data entities

Do not implement these automatically:
- Quotations / Quotation Items
- Booking Approvals
- Booking Status Logs
- Rental Charges
- Operational Expenses
- Rental Return Inspections
- Monitoring Records
- Trip Contexts
- Rental Policies
- System Settings
- Backup Logs

For each entity, determine whether the final system needs it, already represents it differently, or should remove/consolidate it in the manuscript.
