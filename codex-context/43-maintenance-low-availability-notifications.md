# Maintenance & Low-Availability Notifications
**Status:** Frozen for VS028

Close MIC-019 by extending the existing recipient-specific in-app Notifications subsystem.

Maintenance attention must reuse canonical maintenance readiness/PMS. Low availability must reuse VS026 current availability (active, maintenance-ready, no active physical rental, plus existing canonical constraints). Do not use prototype status.

Generate server-side, not on page load. Respect canonical roles and existing notification preferences. Never notify customers for management operational conditions.

Notifications must be deduplicated for an unchanged condition and may recur only after resolution then recurrence, or a materially different condition.

Add only necessary canonical notification/entity types. Maintenance should link to `/admin/maintenance`; low availability to `/admin` or `/admin/fleet`.

Do not invent a Briah-confirmed numeric low-availability threshold. If no authoritative value exists, use a configurable/provisional threshold and record it as an open decision.

No Brevo/external email in VS028.

Definition of Done: actionable maintenance and low-availability conditions produce preference-aware, recipient-specific, deduplicated in-app notifications from canonical server-side condition evaluation.
