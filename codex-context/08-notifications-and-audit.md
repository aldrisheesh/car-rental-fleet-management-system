# Notifications and Audit
**Status:** Notifications frozen through VS019; Audit pending
**Last updated:** 2026-09-02

Notifications and audit are separate concerns. VS019 freezes only canonical in-app event-driven notifications.

## Notification foundation
Notifications are recipient-specific awareness records. They never replace or mutate the underlying booking, requirement, payment, rental, maintenance, forecast, or recommendation.

VS019 is IN-APP ONLY.

Do not implement external delivery in VS019:
- Brevo transactional email;
- SMTP;
- SMS;
- push notifications;
- browser push.

## Planned external email provider

For a later approved email-delivery slice, the planned primary provider is:

`Brevo`

Application transactional email should be integrated behind an internal email-delivery/provider boundary rather than called directly from booking/payment/requirements business logic.

Supabase Auth email remains a separate concern. Where custom SMTP is configured for account confirmation/password reset, Brevo SMTP may be used without changing Supabase Auth's responsibility for those flows.

This provider decision does not authorize email implementation in VS019.

## Canonical notification fields
Minimum:
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
- NTF-001 Requirements Need Resubmission
- NTF-002 Requirements Verified
- NTF-003 Payment Needs Resubmission
- NTF-004 Payment Verified
- NTF-005 Booking Confirmed
- NTF-006 Booking Rejected/Cancelled only where canonical transition exists

## VS019 Owner/Admin events
- NTF-101 New Booking Request
- NTF-102 Requirements Submitted / Resubmitted
- NTF-103 Payment Proof Submitted / Resubmitted

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

## Authorization
Customer reads/marks only own notifications.
Owner/Admin reads/marks only own recipient-specific notifications.
VS019 invents no Operations Staff event categories.
No user may read another recipient's notifications.

## Audit boundary
Notifications are not audit logs. System-wide audit remains a later slice.
