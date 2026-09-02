# Brevo Transactional Email Delivery
**Status:** Frozen for VS029
**Last updated:** 2026-09-02

## Objective
Add provider-neutral application transactional email delivery backed by Brevo, without replacing canonical in-app Notifications.

## Existing state
In-app notifications are canonical through VS028. Repository search shows no current Brevo/Resend transactional-email implementation. MIC-007 already records the provider decision: Brevo replaces the earlier planned Resend/React Email stack for application transactional email.

VS029 is application email delivery. Supabase Auth SMTP configuration is a deployment/account configuration concern and must not be conflated with application notification delivery.

## Architecture
Canonical event/notification creation remains authoritative. Email is a secondary delivery channel.

Prefer:
canonical event/notification -> email eligibility/preferences -> durable delivery/outbox state -> provider-neutral email adapter -> Brevo.

Do not make successful business mutations depend on Brevo availability.

## Provider abstraction
Application/domain code must not call Brevo directly. Introduce a small email-provider interface/adapter so Brevo-specific request/response details remain at the infrastructure boundary.

## Credentials
Server-only environment configuration. Never use VITE_ prefixes.
Likely configuration:
- BREVO_API_KEY
- BREVO_SENDER_EMAIL
- BREVO_SENDER_NAME
- optional APP_BASE_URL for safe links

Never log keys or credential-bearing requests.

## Sender verification
A Brevo sender/domain must be verified before live delivery. Validation should classify missing/unverified account configuration as deployment/provider configuration, not corrupt application state.

## Email scope
Do not automatically email every in-app notification merely because it exists.

Inspect manuscript/preferences and implement only defensible transactional categories. Strong candidates are customer-facing lifecycle/reminder events already represented canonically:
- requirements needs resubmission / verified;
- payment needs resubmission / verified;
- booking confirmed;
- upcoming pickup;
- upcoming return;
- rental overdue where appropriate.

Admin operational notifications may remain in-app unless the existing preference model/manuscript explicitly authorizes email delivery.

Do not email maintenance/low-availability by default without a clear preference/category decision.

## Recipient address
Resolve email server-side from canonical authenticated/profile identity. Do not trust a client-supplied destination address.

If no usable email exists, record/return a safe skipped/unavailable delivery result; do not invent an address.

## Preferences
Reuse/extend canonical notification preferences. In-app preference and email-channel preference must not be silently treated as identical unless the existing model explicitly says so.

Prefer explicit email-channel enablement at an appropriate granularity. Do not send after an email opt-out.

## Durable delivery state
Do not rely on fire-and-forget fetch after a business mutation.

Use durable email delivery/outbox state with:
- deterministic event/delivery key;
- recipient;
- template/type;
- status;
- attempts;
- provider message id where safe;
- last error classification/safe code;
- created/sent timestamps.

Avoid storing full sensitive provider payloads.

## Idempotency
Retries must not create duplicate emails for the same canonical event + recipient + channel.

Use a unique deterministic delivery key.

## Failure behavior
Brevo/network failure must not roll back an already-successful booking/payment/requirement/rental mutation.

Delivery remains pending/failed for retry.

Do not create a new in-app notification solely to report provider failure to the same customer.

## Retry
Use bounded retry/backoff compatible with the existing trusted processor architecture. Do not infinite-loop. Permanent configuration/recipient errors should not be retried endlessly.

## Templates
Use simple application-owned subject/text/html builders. React Email is not required and should not be reintroduced unless already installed for another reason.

Emails must be concise, branded, and safe. Avoid sensitive document/payment-proof content. Prefer links back to the application.

## Security
No API keys in browser bundles. No secrets in database. Escape user-derived content in HTML. Do not put sensitive tokens in email URLs.

## Live validation
If BREVO_API_KEY and verified sender are configured, perform a safe provider validation/test using an explicitly controlled recipient only. Do not email arbitrary real customers during validation.

If account configuration is absent, automated mocked/provider-contract tests can pass while real delivery is classified CONFIGURATION BLOCKED.

## No auth SMTP automation
Do not attempt to configure Supabase Auth SMTP through application code. Document the required Brevo SMTP settings separately for deployment if desired.

## Tests
Provider adapter contract; secret/server boundary; outbox idempotency; preference/recipient eligibility; mutation independence from provider failure; retry classification; safe template rendering; existing notification regression.

## Definition of Done
Canonical customer transactional events can create durable, preference-aware, idempotent email deliveries through a provider-neutral adapter, with Brevo as the configured provider, without weakening in-app notifications or business transaction reliability.
