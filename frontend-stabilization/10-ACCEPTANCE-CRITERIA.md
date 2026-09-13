**Governance:** Acceptance criteria for GitHub Issue #63 on `stabilization/frontend-rebuild`.

# 10 - Acceptance Criteria

## Product comprehension
A first-time renter, without coaching, can:
- identify how to find a suitable car;
- select a vehicle and enter trip details;
- understand why authentication is required;
- submit a booking request;
- identify requirements as the next step;
- understand that payment is unavailable until requirements are verified;
- submit/resubmit requirements when required;
- submit payment when eligible;
- determine whether they are waiting or must act;
- identify when the booking is confirmed;
- find pickup/return information;
- find current and historical bookings without being told which module to use;
- distinguish a confirmed backend fact from a derived customer milestone and from unavailable post-return information.

## Canonical workflow
- Requirements-before-payment is enforced and communicated.
- No frontend action bypasses server-side lifecycle rules.
- Customer/Admin/Staff controls match canonical authorization.
- Finder uses canonical recommendation/booking handoff behavior.
- Rental, maintenance, notification, reporting, forecasting, and allocation behavior remain canonical.

## Navigation
- No competing top-level customer entry points for the same task without a clear reason.
- Customer booking-related requirements/payment/status are discoverable from the booking.
- Admin can reach actionable booking work without unnecessary module hopping.
- Deep links and refresh behavior remain safe.
- Route changes move assistive-technology focus to main content and preserve appropriate back/scroll/filter context.

## UI quality
- Consistent typography, spacing, controls, statuses, and feedback.
- Loading, empty, error, disabled, waiting, success, and resubmission states are designed.
- No obviously nonfunctional controls.
- No fabricated placeholder operational data in canonical screens.
- Mobile customer flow is usable.
- Customer flow is verified at 375 px, tablet, and desktop; Admin queue/detail is verified at tablet and desktop plus a narrow-screen fallback.
- Keyboard/focus behavior passes targeted QA, including skip navigation, visible focus, modal escape/return focus, failed-form focus, and focus not hidden by sticky UI.
- Every form has visible labels, correct input/autocomplete semantics, inline recovery guidance, and an accessible async result. Status is not color-only; reduced motion is respected; key touch targets meet 44 by 44 px.
- Waiting, loading, empty, unavailable, error, success, and resubmission states are distinguishable and explain the next valid action or why none is available.

## P0 defense flow
The following controlled flow must be browser-verified end to end before mock defense:

`Find vehicle -> booking -> requirements -> Admin review -> payment -> Admin verification/confirmation -> assignment -> scheduled pickup/delivery information -> release -> active rental -> return`

Where a lifecycle transition requires controlled data or authorized role state, use approved synthetic/demo records and clearly identify them as such. Do not demonstrate settlement or completed-booking behavior as implemented until a canonical source and Lead decision exist.

## Decision-support demonstration
With approved synthetic/demo data, the system can demonstrate:
- sufficient-history forecasting;
- insufficient-history behavior;
- utilization/idle state;
- maintenance readiness exclusion;
- branch shortage/surplus/allocation recommendation where canonical;
- context Unknown/Unavailable handling;
- advisory rather than autonomous decision behavior.

## Release gate
A green build is necessary but insufficient. Release requires scoped regression, role checks, browser verification of P0 flows, no unresolved P0/P1 frontend regression accepted by Lead, and a stable demo dataset/script.
