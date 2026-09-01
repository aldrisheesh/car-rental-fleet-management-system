# In-App Notification Foundation
**Status:** Frozen for VS019
**Last updated:** 2026-09-02

## Scope
VS019 creates canonical recipient-specific in-app notification persistence, unread/read state, unread count, canonical event-driven triggers, and connects the existing Notifications UI to real data.

No scheduled reminders or external delivery.

## Persistence
Recommended table: `notifications`.

Minimum:
- `id uuid primary key`
- `recipient_id uuid not null`
- `notification_type text not null`
- `title text not null`
- `message text not null`
- `related_entity_type text not null`
- `related_entity_id uuid not null`
- `event_key text not null`
- `created_at timestamptz`
- `read_at timestamptz null`

Unique `(recipient_id, event_key)`. Use restrictive RLS.

## Event key
Identify one logical transition and distinguish legitimate later cycles such as requirement/payment resubmissions. Use an existing submission/review version, transition timestamp, persisted event ID, or other stable transition identity. Do not use only booking ID + type when the same event type may recur.

## API
Expose only current-principal notification reads/unread count and mark-one-own-notification-read. No client create/delete/arbitrary update API.

## Transition integration
Integrate only with successful canonical transitions defined in `08-notifications-and-audit.md`.

Where a transition already uses a database RPC/transaction, extend it using a NEW additive migration. Where it does not, use the narrowest reliable trusted transaction boundary; do not broadly refactor lifecycle code.

## Existing UI
Inspect the existing Notifications route before creating UI. Keep useful structure, remove mock arrays, and do not create a duplicate page.

## Copy safety
Messages must be concise/actionable and never contain government ID numbers, payment account details, private document URLs, or internal reviewer notes.

## Definition of Done
Canonical RLS-protected recipient notifications exist; high-value event transitions create them; retries deduplicate; Notifications UI uses canonical data; unread/read state works; lifecycle behavior is unchanged; no scheduler or external delivery exists.
