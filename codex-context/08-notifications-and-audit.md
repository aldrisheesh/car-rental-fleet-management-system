# Notifications and Audit
**Status:** Notifications frozen through VS019; Audit pending
**Last updated:** 2026-09-02

Notifications and audit are separate concerns. VS019 freezes only canonical in-app event-driven notifications.

## Notification foundation
Notifications are recipient-specific awareness records. They never replace or mutate the underlying booking, requirement, payment, rental, maintenance, forecast, or recommendation.

VS019 is IN-APP ONLY. Do not add Resend, React Email, SMTP, SMS, push, or browser push.

Minimum canonical fields:
- notification ID
- recipient user/profile ID
- notification type
- title
- safe message
- related entity type
- related entity ID
- deterministic event/deduplication key
- created timestamp
- read timestamp nullable

Records are per recipient. Event identity/content is immutable; read state is the only normal user mutation.

Notifications are created only by trusted business-transition boundaries. Browser clients cannot create arbitrary canonical notifications.

For direct transition notifications, prefer state change + notification in the same transaction. Failed transitions must not leave notifications.

Use deterministic event keys and a database uniqueness guarantee so retries/double-clicks do not duplicate one logical event. The key must distinguish legitimate later cycles.

Recipient may mark only their own notification read. Read timestamps are server-controlled. Expose recipient-specific unread count. VS019 has no automatic retention/deletion.

## VS019 customer events

### NTF-001 Requirements Need Resubmission
Trigger: successful transition to `Needs Resubmission`.
Recipient: booking customer.
Message: correction/replacement is required; direct customer to requirements. Do not expose internal reviewer notes.

### NTF-002 Requirements Verified
Trigger: successful transition to `Verified`.
Recipient: booking customer.
Message: requirements passed and the next canonical payment step is available. Do not claim booking confirmation.

### NTF-003 Payment Needs Resubmission
Trigger: successful payment transition to `Needs Resubmission`.
Recipient: booking customer.
Message: payment proof needs correction/review.

### NTF-004 Payment Verified
Trigger: successful payment transition to `Verified`.
Recipient: booking customer.
Message: payment proof was verified. Do not claim booking confirmation.

### NTF-005 Booking Confirmed
Trigger: successful booking transition to `Confirmed`.
Recipient: booking customer.

### NTF-006 Booking Rejected/Cancelled
Trigger only for rejection/cancellation transitions that actually exist canonically.
Recipient: booking customer.
Use an existing customer-facing reason when available; never invent one.

## VS019 Owner/Admin events

### NTF-101 New Booking Request
Trigger: successful customer booking creation.
Recipients: all ACTIVE Owner/Admin users.

### NTF-102 Requirements Submitted / Resubmitted
Trigger: successful complete requirement submission/resubmission that is ready for review.
Recipients: all ACTIVE Owner/Admin users.

### NTF-103 Payment Proof Submitted / Resubmitted
Trigger: successful payment-proof submission that becomes `Pending Verification`.
Recipients: all ACTIVE Owner/Admin users.

Internal events expand to one row per active Owner/Admin at event time. Do not create role pseudo-recipients.

## Deferred to VS020
Do not implement:
- upcoming pickup
- upcoming return
- overdue return
- maintenance due
- low availability/shortage
- recurring reminder cadence
- escalation
- scheduler/cron

## UI
Reuse the existing Notifications page/shell. Replace mock/prototype data.

Support:
- newest-first list
- unread/read distinction
- unread count/badge where existing navigation supports it
- mark own notification read
- safe related-entity navigation where straightforward
- empty/loading/error states

Do not redesign the whole navigation.

## Authorization
Customer reads/marks only own notifications.
Owner/Admin reads/marks only own recipient-specific notifications.
VS019 invents no Operations Staff event categories.
No user may read another recipient's notifications.

## Audit boundary
Notifications are not audit logs. System-wide audit remains a later slice.

## Testing
Test NTF-001 through NTF-005, NTF-006 only where canonical transition exists, and NTF-101 through NTF-103. Test active Admin expansion, inactive Admin exclusion, per-recipient privacy, deduplication, rollback behavior where transactionally integrated, unread count, mark-read ownership, no scheduler, no external delivery, and unchanged lifecycle behavior.
