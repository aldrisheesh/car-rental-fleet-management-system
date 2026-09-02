# Vertical Slice 029 — Brevo Transactional Email Delivery

**Status:** Approved for implementation
**Objective:** Add durable, preference-aware, idempotent application transactional email delivery through a provider-neutral email abstraction backed by Brevo, while preserving canonical in-app Notifications as the primary awareness record.

## Purpose

The application already has canonical in-app notifications.

VS029 adds email as a secondary delivery channel.

The architecture is:

```text
Canonical lifecycle event / notification
                ↓
         Email eligibility
                ↓
       Recipient resolution
                ↓
        Email preferences
                ↓
       Durable email outbox
                ↓
      Email delivery processor
                ↓
     Provider-neutral adapter
                ↓
              Brevo
```

Email delivery must never become the authoritative business event.

---

# Manuscript Traceability

VS029 implements the application transactional-email portion of the notification/communication requirement.

It also implements the provider decision recorded in:

`MIC-007 — Planned Email Provider Changed from Resend to Brevo`

After successful VS029 implementation, MIC-007 should be updated from planned to implemented.

The manuscript must distinguish:

1. application transactional email through the application and Brevo;
2. Supabase Auth email through configured SMTP.

These are not the same delivery path.

---

# Required Context

Read first:

1. `engineering/AI-ENGINEERING-CONTEXT.md`
2. `engineering/sprints/VERTICAL-SLICE-029.md`
3. `codex-context/25-canonical-subsystem-map.md`
4. `codex-context/45-brevo-transactional-email.md`
5. `codex-context/46-manuscript-traceability-vs029.md`

Do not read earlier vertical-slice contracts unless an exact dependency genuinely requires it.

---

# Initial Inspection

Inspect only the relevant implementation surfaces:

1. canonical notification types/schema;
2. notification creation/generation helpers;
3. notification preferences;
4. VS028 operational notification additions only for compatibility;
5. requirement lifecycle notification generation;
6. payment lifecycle notification generation;
7. booking confirmation notification generation;
8. pickup/return/overdue reminder processing;
9. trusted reminder processor;
10. canonical user/profile email resolution;
11. environment conventions;
12. Supabase migrations/database types.

Do not inspect unrelated subsystems.

---

# Canonical In-App Notifications Remain Authoritative

VS029 must not replace:

```text
notifications
```

with email.

The relationship is:

```text
Canonical event
   ├── in-app notification
   └── optional email delivery
```

An email provider failure must not remove, rollback, or invalidate the canonical in-app notification.

---

# Provider

Application transactional email provider:

```text
Brevo
```

Do not implement:

```text
Resend
SendGrid
Mailgun
Postmark
```

as alternate providers in VS029.

However, application/domain code must depend on a provider-neutral email interface rather than Brevo-specific functions.

---

# Provider Abstraction

Create the smallest suitable abstraction.

Conceptually:

```text
EmailProvider
  send(message)
```

with a Brevo implementation:

```text
BrevoEmailProvider
```

Domain/event processing must not know:

- Brevo endpoint URL;
- Brevo request headers;
- Brevo provider response structure;
- Brevo error payload format.

Keep provider-specific behavior at the infrastructure boundary.

---

# Server-Only Configuration

Expected server configuration:

```text
BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME
APP_BASE_URL
```

Exact naming may follow repository conventions.

Never prefix secrets with:

```text
VITE_
```

Do not expose Brevo credentials to browser code.

Do not persist the API key in Supabase.

Do not log it.

---

# Sender Configuration

`BREVO_SENDER_EMAIL` must represent a sender accepted by the configured Brevo account.

`BREVO_SENDER_NAME` may default to:

```text
Briah's Car Rental
```

if no canonical business-name configuration already exists.

Do not use the prototype Admin Settings business profile as authoritative configuration.

The existing Settings page currently contains prototype data and is outside VS029.

---

# APP_BASE_URL

Use a server configuration value for application links in email.

Do not trust:

```text
request Host
window.location
client-provided origin
```

for security-sensitive email links.

If `APP_BASE_URL` is absent, templates that require links must either:

- omit the link safely; or
- classify delivery as configuration unavailable,

depending on the template's requirements.

Do not fabricate a production URL.

---

# Supabase Auth Email Boundary

Do not programmatically configure:

```text
Supabase Auth SMTP
```

inside VS029.

Account confirmation/password-reset delivery remains:

```text
Supabase Auth
        ↓
configured SMTP
```

Brevo SMTP may later be configured manually in Supabase.

VS029 implements:

```text
Application
        ↓
Brevo API/provider adapter
```

only.

---

# Email Eligibility

Do not automatically email every notification type.

Freeze a deliberate transactional baseline.

## Customer Email Baseline

Implement email delivery for these canonical customer-facing notification/event types where they already exist:

```text
requirements_needs_resubmission
requirements_verified

payment_needs_resubmission
payment_verified

booking_confirmed

upcoming_pickup
upcoming_return

rental_overdue
```

These are suitable because they represent direct customer action/status/reminder events.

---

# Events Not Emailed in VS029

Do not email these merely because they exist:

```text
new_booking_request
requirements_submitted
payment_proof_submitted

maintenance_attention
low_availability
```

The first group is primarily Admin operational awareness.

The second group is VS028 operational awareness.

They remain in-app in VS029.

Do not expand the email baseline without clear existing authority.

---

# Customer Recipient Resolution

Resolve the email server-side.

Use canonical authenticated/profile/user data already associated with the notification recipient.

Do not accept:

```text
toEmail
recipientEmail
customerEmail
```

from the browser as authoritative.

The delivery processor must resolve the recipient from canonical server-held identity.

---

# Missing Recipient Email

If no usable email exists:

```text
do not call Brevo
```

Record a safe terminal/skipped state such as:

```text
Skipped
RecipientUnavailable
```

or repository-consistent equivalent.

Do not invent an address.

Do not repeatedly retry a permanently missing recipient.

---

# Email Preferences

Inspect the existing notification preference model.

Email is a separate channel.

Do not assume:

```text
in-app enabled = email enabled
```

unless the existing canonical preference model explicitly defines that behavior.

Add the smallest explicit email-channel preference necessary.

A suitable baseline may be:

```text
email_notifications_enabled
```

for customer transactional email.

If the current preference architecture naturally supports per-category/per-channel settings without substantial expansion, a narrower mapping may be used.

Do not create an oversized notification-settings subsystem.

---

# Preference Default

Because these are transactional lifecycle emails, a default-enabled email channel is acceptable only if consistent with the existing notification preference baseline and manuscript intent.

If implemented:

```text
email_notifications_enabled = true
```

must remain user-controllable.

Do not bypass opt-out.

---

# Preference Evaluation Time

Check email preference when the email delivery is created/enqueued.

Also recheck before provider delivery if the architecture supports it safely.

If a user opts out before a pending email is delivered:

prefer suppressing that pending optional email.

Do not re-send previously completed delivery merely because preferences change.

---

# Durable Email Outbox

Do not send email as a fire-and-forget side effect of the business mutation.

Create durable delivery state.

Recommended table concept:

```text
email_deliveries
```

or:

```text
email_outbox
```

Use repository naming conventions.

---

# Required Delivery Fields

At minimum persist enough state for:

```text
id
recipient_user_id
notification_id / canonical event reference
delivery_key
email_type
status
attempt_count
provider_message_id
last_error_code
created_at
last_attempt_at
sent_at
```

Exact schema may vary.

Avoid storing:

- Brevo API key;
- full provider request/response;
- sensitive documents;
- payment proof contents.

---

# Delivery Status

Use a small explicit state model.

For example:

```text
Pending
Processing
Sent
Failed
Skipped
```

Exact values may follow repository conventions.

Do not create unnecessary dozens of provider states.

---

# Deterministic Delivery Key

Each canonical email delivery must have a deterministic unique key.

Conceptually:

```text
recipient
+
canonical event key
+
email channel
```

or:

```text
notification_id + email
```

if notification identity is sufficient.

The same event retry must resolve to the same delivery row.

---

# Idempotency

Required behavior:

```text
Canonical event occurs
→ one email delivery

Processor retry
→ same delivery

Server restart
→ same delivery

Concurrent processor
→ same delivery

Provider timeout followed by retry
→ do not create another outbox row
```

Use database uniqueness.

Do not rely only on in-memory state.

---

# Business Mutation Isolation

This is mandatory.

Example:

```text
Payment verified successfully
        ↓
canonical payment state committed
        ↓
in-app notification committed
        ↓
email outbox queued
        ↓
Brevo unavailable
```

Final result:

```text
Payment verification remains successful.
Email remains retryable/failed.
```

Do not rollback payment verification because email failed.

Apply the same principle to:

- requirement review;
- booking confirmation;
- reminder processing.

---

# Event-to-Email Integration

Prefer integrating at the canonical notification/event creation boundary rather than scattering Brevo calls throughout routes.

Possible architecture:

```text
canonical notification created
        ↓
email eligibility mapper
        ↓
email delivery row
```

This naturally reuses:

- recipient;
- notification type;
- event key;
- related entity.

If existing notification creation happens inside atomic RPCs where adding email rows there would be inappropriate, use the smallest reliable post-event/outbox integration that preserves idempotency.

Do not weaken existing atomic business transactions.

---

# Scheduled Reminder Emails

The existing trusted reminder processor creates:

```text
upcoming_pickup
upcoming_return
rental_overdue
```

notifications.

VS029 should allow those canonical reminder events to enqueue eligible customer emails.

Do not implement a second reminder scheduler.

---

# Operational VS028 Notifications

Do not email:

```text
maintenance_attention
low_availability
```

in VS029.

They remain canonical in-app operational notifications.

A later client decision may enable external delivery.

---

# Email Templates

Application-owned templates should be simple.

Do not introduce React Email merely because the manuscript previously mentioned it.

Suitable architecture:

```text
buildTransactionalEmail(notification/event)
→ {
    subject,
    text,
    html
  }
```

---

# Template Requirements

Each email should include:

- Briah's Car Rental identity;
- concise event-specific subject;
- concise explanation;
- safe action guidance;
- application link where useful and safely configured.

Do not include:

- uploaded requirement-document contents;
- payment proof image;
- sensitive identity-document details;
- internal database IDs unless presented as a safe booking reference;
- internal error messages.

---

# Requirements Needs Resubmission Email

Subject concept:

```text
Action required: update your rental requirements
```

Content should direct the customer back to the application.

If the canonical notification safely contains a correction reason, a concise safe version may be included.

Do not email uploaded-document contents.

---

# Requirements Verified Email

Subject concept:

```text
Your rental requirements were verified
```

Keep concise.

---

# Payment Needs Resubmission

Subject concept:

```text
Action required: update your payment proof
```

Do not attach or reproduce the submitted payment proof.

---

# Payment Verified

Subject concept:

```text
Your payment was verified
```

Do not call this:

```text
Payment settled
```

unless the canonical payment model actually supports settlement semantics.

MIC-026 remains authoritative.

---

# Booking Confirmed

Subject concept:

```text
Your Briah's Car Rental booking is confirmed
```

Use canonical booking details only where safely available.

---

# Pickup Reminder

Subject concept:

```text
Upcoming vehicle pickup reminder
```

Use the canonical scheduled pickup time.

Respect Asia/Manila semantics.

---

# Return Reminder

Subject concept:

```text
Upcoming vehicle return reminder
```

Use canonical scheduled return time.

---

# Rental Overdue

Subject concept:

```text
Vehicle return reminder
```

Avoid threatening language.

Do not include the unresolved PHP 3,000 late-fee rule.

CQ-029 remains unresolved.

---

# HTML Safety

Escape all user-derived values inserted into HTML.

Do not concatenate raw customer-entered strings into HTML without escaping.

Plain-text version should also be generated.

---

# Provider Request

Brevo adapter must send:

- sender;
- recipient;
- subject;
- HTML and/or text body

using server-held credentials.

Do not expose provider headers to the client.

---

# Provider Response

Persist only safe useful provider metadata.

Suitable:

```text
provider_message_id
```

Do not persist arbitrary Brevo response dumps.

---

# Error Classification

Normalize provider errors into safe categories.

Examples:

```text
ConfigurationError
RecipientInvalid
RateLimited
ProviderUnavailable
ProviderRejected
NetworkError
UnknownProviderError
```

Do not store secret-bearing provider responses.

---

# Retry Policy

Retry only transient failures.

Examples:

```text
RateLimited
ProviderUnavailable
NetworkError
```

Permanent failures such as:

```text
RecipientInvalid
ConfigurationError
```

should not retry forever.

Use bounded attempts.

A reasonable small baseline:

```text
max 3–5 attempts
```

may be selected if no repository-wide retry convention already exists.

Document the exact choice.

---

# Retry Timing

Use a simple bounded backoff.

Do not implement an elaborate queue system solely for VS029.

Reuse the trusted scheduled processor where practical.

---

# Processor

Prefer extending the trusted internal processor used by reminders/operational notifications.

Conceptually:

```text
POST /api/internal/reminders
        ↓
reminders
operational conditions
pending email deliveries
```

if this remains clean.

Alternatively create a narrowly scoped internal email processor if mixing responsibilities would make the current processor unsafe.

Do not require page loads to send email.

---

# Scheduler Boundary

VS029 does not configure hosting cron automatically.

Deployment must invoke the trusted processor periodically.

Document this requirement.

---

# Email Delivery and In-App Read State

Email delivery does not mark:

```text
notification.read_at
```

The user reading an email is not equivalent to reading the in-app notification.

Do not couple these states.

---

# Provider Disabled / Missing Configuration

If Brevo configuration is absent:

business workflows must continue.

Pending eligible email deliveries may be classified as configuration-blocked/failed according to the chosen state model.

Do not crash application startup merely because email is not configured.

---

# Development Behavior

Do not silently send real emails from local tests.

Mock the provider adapter for automated tests.

Live Brevo calls require explicit validation mode/configuration.

---

# Live Provider Validation

If all are configured:

```text
BREVO_API_KEY
BREVO_SENDER_EMAIL
controlled test recipient
```

a safe live validation may be run.

Never send test messages to arbitrary production customers.

The test recipient must be explicitly supplied for validation.

If no controlled test recipient is configured:

```text
LIVE BREVO VALIDATION
→ DEFERRED
```

This is not an application failure.

---

# Suggested Validation Variable

A non-production helper such as:

```text
BREVO_TEST_RECIPIENT
```

may be used only for explicit validation tooling.

Do not use it for actual application recipient resolution.

---

# Supabase Auth SMTP Documentation

VS029 may update:

```text
.env.example
deployment docs
```

to mention that Supabase Auth SMTP can be configured separately through the Supabase dashboard using Brevo SMTP credentials.

Do not store those SMTP credentials in browser code.

Do not attempt to modify the Supabase project SMTP configuration programmatically.

---

# Admin Settings Boundary

Do not modify the current prototype:

```text
/admin/settings
```

to manage Brevo.

VS029 uses environment/deployment configuration.

Settings canonicalization belongs to a separate later audit if still needed.

---

# Audit Boundary

Do not automatically add immutable audit events for every email attempt.

The durable email-delivery table itself provides operational delivery state.

If existing audit conventions explicitly require a final delivery event, inspect before adding.

Do not duplicate logs unnecessarily.

---

# Privacy

Do not store full rendered email bodies unless there is a strong existing architectural reason.

Prefer storing:

```text
email_type
canonical event reference
delivery metadata
```

and render from canonical safe data at delivery time or persist only minimal safe template variables.

Do not make the outbox a second database of customer-sensitive information.

---

# Tests

Add focused tests.

## Provider Abstraction

Test:

```text
domain code
→ EmailProvider
→ mocked provider
```

No Brevo-specific dependency in business logic.

---

# Server Secret Boundary

Test/build inspection:

```text
BREVO_API_KEY
```

must not appear in browser-facing configuration or `VITE_` variables.

---

# Email Eligibility

Test eligible:

```text
requirements_needs_resubmission
requirements_verified
payment_needs_resubmission
payment_verified
booking_confirmed
upcoming_pickup
upcoming_return
rental_overdue
```

Test not eligible:

```text
new_booking_request
requirements_submitted
payment_proof_submitted
maintenance_attention
low_availability
```

---

# Preferences

Test:

```text
email enabled
→ enqueue

email disabled
→ no new delivery
```

If preference changes before pending delivery:

test final chosen suppression semantics.

---

# Recipient Resolution

Test:

```text
canonical user email
→ recipient

missing email
→ skipped/permanent unavailable

client-supplied email
→ never authoritative
```

---

# Outbox Idempotency

Test:

```text
same event twice
→ one delivery row
```

Concurrent enqueue should also remain one row where practical.

---

# Mutation Isolation

Test provider failure does not roll back:

- requirement review;
- payment review;
- booking confirmation;
- reminder notification creation.

Do not necessarily retest every complete lifecycle if shared outbox boundary proves isolation cleanly.

---

# Delivery Success

Test:

```text
Pending
→ provider send
→ Sent
```

with:

```text
sent_at
provider_message_id
attempt_count
```

---

# Transient Failure

Test:

```text
Pending
→ transient failure
→ retryable state
→ later success
```

---

# Permanent Failure

Test:

```text
invalid recipient/configuration
→ no infinite retry
```

---

# Templates

Test:

- subject;
- plain text;
- HTML;
- safe app link;
- escaping;
- no payment proof/document contents;
- no unresolved late-fee assertion.

---

# Existing Notification Regression

Run existing tests for:

```text
notifications
preferences
reminders
VS028 operational notifications
```

Email additions must not alter in-app semantics.

---

# Validation

Run at minimum:

```text
email-focused tests
notification tests
notification preference tests
reminder tests
operational-notification tests
affected lifecycle tests
npm run build
focused lint
git diff --check
```

If a migration is added:

```text
Supabase schema validation
migration validation
generated database type validation
```

---

# Live Brevo Validation Result

Final response must classify:

```text
PASS
DEFERRED — CONFIGURATION
DEFERRED — NO CONTROLLED RECIPIENT
FAIL — PROVIDER
```

Do not classify absent test credentials as application failure.

---

# Manuscript Post-Implementation Review

After implementation report:

1. exact email-eligible event types;
2. exact preference model;
3. outbox schema/state model;
4. provider abstraction;
5. retry policy;
6. sender configuration;
7. recipient resolution;
8. live-provider validation status;
9. Supabase Auth SMTP boundary;
10. MIC-007 closure status;
11. manuscript sections requiring revision.

Do not edit the Proposal Paper during VS029.

---

# Definition of Done

VS029 is complete when:

- Brevo adapter exists behind a provider-neutral interface;
- credentials are server-only;
- eligible customer events enqueue durable email delivery;
- email preferences are respected;
- recipient address is canonical;
- duplicate event processing does not create duplicate deliveries;
- provider failure does not invalidate business mutations;
- transient failures can retry;
- permanent failures stop safely;
- templates are safe;
- in-app notifications remain canonical;
- VS028 operational alerts remain in-app only;
- Supabase Auth SMTP remains a separate deployment concern;
- automated validation passes.

Live provider delivery may be deferred solely because sender/test-recipient/account configuration is not yet available.

---

# Stop Rule

Stop after VS029.

Do not implement:

- VS030;
- Backup/Recovery;
- Admin Settings canonicalization;
- financial settlement/refunds;
- maintenance/low-availability email;
- report exports;
- CQ-028;
- CQ-029;
- CQ-030;
- CQ-031;
- CQ-032.
