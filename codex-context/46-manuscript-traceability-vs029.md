# VS029 Manuscript Traceability
**Status:** Frozen
**Last updated:** 2026-09-02

MIC-007 records the planned provider change from Resend/React Email to Brevo.

VS029 should implement Brevo for application transactional email while preserving in-app Notifications as the canonical awareness record.

The manuscript must distinguish:
1. application transactional email via Brevo provider abstraction; and
2. Supabase Auth confirmation/password-reset email via configured SMTP, if Brevo SMTP is used there.

Do not claim email delivery for notification categories that VS029 does not actually wire.

After implementation, update MIC-007 from planned to implemented and document exact email categories, preferences, retry/outbox behavior, sender configuration, and any live-validation limitation.
