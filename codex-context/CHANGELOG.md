# Changelog

## 2026-09-02 — Planned transactional email provider changed to Brevo
- Replaced Resend as the planned application transactional-email provider.
- Selected Brevo as the planned primary provider for future application email delivery.
- Recorded that Brevo SMTP may be used for Supabase Auth custom SMTP.
- Preserved VS019 as in-app-only; this change does not authorize external email implementation.
- Required future email delivery to use a provider abstraction rather than direct Brevo calls from business workflows.

## 2026-09-02 — VS019 in-app notification foundation planning
- Separated event-driven in-app notifications from audit logging.
- Defined recipient-specific persistence, read state, unread count, and deterministic deduplication.
- Frozen customer events for requirement/payment review outcomes and booking confirmation.
- Frozen Owner/Admin events for new booking, requirement submission/resubmission, and payment proof submission/resubmission.
- Deferred scheduled operational reminders to VS020.
- Deferred external email/SMS/push.
- Required reuse of the existing Notifications page.
