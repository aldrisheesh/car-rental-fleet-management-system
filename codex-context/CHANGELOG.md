# Changelog

## 2026-09-02 — VS020 scheduled booking/rental reminder planning
- Froze provisional 24-hour pickup and return reminders.
- Froze overdue reminders once per Asia/Manila calendar day while physically unreturned.
- Required due-at-or-before semantics and deterministic VS019 event-key deduplication.
- Kept reminder processing provider-neutral and separate from hosting scheduler invocation.
- Deferred Operations Staff, maintenance, and low-availability reminders.
- Prohibited late-fee calculation.
- Added CQ-031 for client validation.
- Reaffirmed provider-validation cleanup discipline.
