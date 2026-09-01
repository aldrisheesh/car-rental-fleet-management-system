# Open Decisions
**Status:** Active
**Last updated:** 2026-09-02

See `24-client-interview-ground-truth.md`.

## Smart Vehicle Finder
VS017 and VS018 are frozen. CQ-028 restricted-area rules and later context influence remain open.

## Notifications
VS019 event-driven in-app notification foundation is frozen in `08-notifications-and-audit.md` and `27-notification-foundation.md`.

Planned future external email provider:
- Brevo for application transactional email;
- Brevo SMTP may also be used as Supabase Auth custom SMTP where configured.

This does not move external email into VS019.

Deferred:
- scheduled pickup/return/overdue/maintenance/low-availability reminders;
- external transactional email implementation;
- SMS/push;
- notification preferences;
- escalation;
- retention rules.

## Audit
System-wide audit coverage remains unresolved and separate from notifications.

## Payment / settlement
Confirmed: 50% minimum down payment; requirements before payment; bank transfer/GCash/cash; baseline renter-cancellation down payment stated non-refundable.

Still open: total-bill composition, production account details, cancellation exceptions, final settlement, deposit handling, complete late-return schedule, and detailed damage/fuel/cleaning penalties.

## Late return
PARTIALLY CONFIRMED: PHP 3,000 for less than six hours. CQ-029 remains open.

## Tie-up fleet
PARTIALLY CONFIRMED: partner sourcing exists and a 30/70 split was described. CQ-030 remains open.

## Allocation / transfer
VS016 remains advisory. CQ-017/CQ-026 remain open.

## Remaining product work
Scheduled reminders, audit, operational context, reports/dashboard canonicalization, role/mobile UX validation, demo data, unresolved settlement, and later external email delivery remain pending.
