# Notifications and Audit

**Status:** Notifications frozen through VS020; Audit frozen for VS021
**Last updated:** 2026-09-02

Notifications and audit are separate concerns.

## Notifications

VS019:
- canonical recipient-specific event-driven in-app notifications.

VS020:
- scheduled pickup/return/overdue in-app reminders.

Notifications answer:

`Who needs to know about something?`

Read/unread state belongs only to notifications.

## Audit — VS021

VS021 introduces append-only semantic history for meaningful core lifecycle mutations.

Audit answers:

`Who did what, to which entity, and when?`

Canonical first-wave domains:

- booking creation;
- requirement submission/resubmission/review;
- payment submission/resubmission/review;
- vehicle assignment;
- booking confirmation;
- rental release/return;
- maintenance create/complete/cancel;
- rejection/cancellation only where those transitions already exist.

Audit events are NOT created for:

- notification creation;
- notification read state;
- reminder generation;
- page views;
- reads;
- generic database updates;
- forecasting/supply/allocation in VS021.

Owner/Admin read only.

Customer and Operations Staff have no audit access in VS021.

For full audit specification see:
`29-canonical-audit-trail.md`
