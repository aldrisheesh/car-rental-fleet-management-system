# Notifications and Audit
**Status:** Notifications frozen through VS020; Audit pending
**Last updated:** 2026-09-02

VS019 established canonical recipient-specific event-driven in-app notifications.

VS020 adds scheduled booking/rental reminders using the SAME notification aggregate.

RESEARCHER-DESIGNED / PROVISIONAL:
- pickup: one reminder 24h before scheduled pickup;
- return: one reminder 24h before scheduled return;
- overdue: first eligible run after scheduled return, then at most once per Asia/Manila calendar day while physically unreturned.

Recipients: customer + all ACTIVE Owner/Admin. Operations Staff remains deferred.

Use due-at-or-before semantics, deterministic event keys, and existing `(recipient_id,event_key)` uniqueness. No separate reminder table is required.

VS019/VS020 remain in-app only. Planned future application email provider is Brevo behind a provider abstraction.

Deferred: maintenance reminders, low-availability/shortage alerts, email/SMS/push, preferences, escalation, and audit.

Overdue reminders never calculate/assert late fees; CQ-029 remains open.
