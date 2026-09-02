# Canonical Subsystem Map
**Status:** Active
**Last updated:** 2026-09-02

## VS029
Read `45-brevo-transactional-email.md` and `46-manuscript-traceability-vs029.md`.

Inspect canonical notification generation/types/preferences, lifecycle event creation points, trusted reminder processor, user/profile email resolution, Supabase database types/migrations, and environment conventions.

Do not redesign Notifications, business lifecycles, VS028 operational conditions, Reports, external context, or backup/recovery.

Rule: email is a secondary durable delivery channel. Business mutation success must not depend on Brevo.
