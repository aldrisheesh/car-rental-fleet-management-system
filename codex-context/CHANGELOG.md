# Changelog

## 2026-09-02 — VS021 canonical audit trail planning
- Moved Audit Trail ahead of Maintenance Awareness.
- Froze append-only semantic `audit_events` concept.
- Froze User/System actor model.
- Froze dotted action naming for core lifecycle events.
- Froze first-wave booking, requirement, payment, assignment, rental, and maintenance audit events.
- Required minimal safe metadata and prohibited sensitive document/payment snapshots.
- Required Owner/Admin-only read access.
- Required trusted semantic business-boundary creation rather than client logging.
- Preferred atomic mutation + audit insertion through canonical RPCs.
- Prohibited blanket database-wide audit triggers.
- Deferred notification/reminder, forecasting, supply, and allocation audit.
- Recorded that Admin Maintenance UI remains prototype-driven despite canonical VS012 backend.

## 2026-09-02 — VS020 scheduled reminders
VS020 established provider-neutral pickup, return, and overdue in-app reminders.
