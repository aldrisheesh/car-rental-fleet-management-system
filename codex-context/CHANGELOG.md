# Changelog
## 2026-09-02 — VS029 Brevo email planning
- Confirmed no existing application Brevo/Resend delivery implementation.
- Preserved MIC-007 provider decision: Brevo.
- Froze email as a secondary durable delivery channel, not a replacement for in-app Notifications.
- Required provider abstraction, server-only credentials, durable outbox/idempotency, preference-aware eligibility, bounded retry, and provider-failure isolation.
- Distinguished application email from Supabase Auth SMTP deployment configuration.
- Required live validation only with controlled recipient/configuration.
