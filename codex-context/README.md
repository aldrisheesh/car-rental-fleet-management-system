# Briah's Car Rental — Codex Context
**Status:** Development Baseline active
**Last updated:** 2026-09-02

Completed through VS018 Finder -> Booking.

## Next direction
VS019 is the canonical EVENT-DRIVEN, IN-APP notification foundation.

Read:
- `08-notifications-and-audit.md`
- `27-notification-foundation.md`
- `25-canonical-subsystem-map.md`

VS019 excludes:
- scheduled reminders;
- external email/SMS/push;
- audit logging;
- operational context;
- reports/dashboard redesign.

## Planned email provider

When external transactional email is implemented in a later approved slice:

- primary application email provider: `Brevo`;
- Supabase Auth may use Brevo SMTP as custom SMTP for authentication emails.

Keep application email behind a provider abstraction. Do not call Brevo directly from business-domain transition code.

VS020 remains reserved for scheduled operational reminders after VS019 is stable.

## AI workflow
New slice: fresh Codex session -> implement -> commit/push -> end session.
Correction: new fresh Codex session -> exact correction files only -> commit/push -> end session.
