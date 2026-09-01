# Changelog

## 2026-09-02 — VS019 in-app notification foundation planning
- Separated event-driven in-app notifications from audit logging.
- Defined recipient-specific persistence, read state, unread count, and deterministic deduplication.
- Frozen customer events for requirement/payment review outcomes and booking confirmation.
- Frozen Owner/Admin events for new booking, requirement submission/resubmission, and payment proof submission/resubmission.
- Deferred scheduled operational reminders to VS020.
- Deferred external email/SMS/push.
- Required reuse of the existing Notifications page.
- Updated subsystem navigation and fresh correction-session strategy.

## 2026-09-01 — VS018 Finder -> Booking
VS018 completed canonical Finder handoff, provenance, and idempotent booking creation.
