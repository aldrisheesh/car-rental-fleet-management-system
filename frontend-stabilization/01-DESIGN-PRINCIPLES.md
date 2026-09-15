# 01 - Design Principles

## P1. First-time comprehension
A renter who has never booked a car should be able to proceed without coaching. Avoid requiring knowledge of internal modules, status vocabulary, or car-rental operations.

## P2. Always answer three questions
Every transactional screen must make clear:
1. Where am I in the process?
2. What do I need to do now?
3. What happens next?

## P3. One journey, not disconnected modules
Requirements, payment, confirmation, pickup/rental, return, and settlement belong to a booking lifecycle. Do not force customers to discover unrelated pages to continue one rental.

## P4. Progressive disclosure
Show information and actions when they become relevant. Future steps may be visible as progress, but unavailable actions must explain their prerequisite.

## P5. One dominant action
Where practical, each screen/state should have one visually dominant next action. Secondary actions must not compete with it.

## P6. Plain language
Prefer customer language such as `Find a Car`, `My Bookings`, `Submit requirements`, and `Payment under review`. Avoid exposing implementation terminology unless it is necessary and explained.

## P7. Consistent vocabulary
Choose one canonical customer-facing term for each concept and use it everywhere. Do not casually alternate among booking/reservation/request when they represent the same customer concept.

## P8. Preserve context
Authentication, validation errors, and step transitions should not unnecessarily erase valid user input or force users to restart a journey.

## P9. Status must be actionable
Do not show `Pending`, `Rejected`, or similar labels without explaining what they mean and whether the user must act.

## P10. Accessible by default
Keyboard operation, visible focus, semantic labels, sufficient contrast, error association, touch-friendly controls, responsive layouts, and reduced ambiguity are baseline requirements.

## P11. Mobile-first comprehension, not mobile-only design
The client operates heavily on phones/iPads while customers may use mobile or desktop. Core journeys must remain understandable and operable across screen sizes.

## P12. Backend truth over visual convenience
Never fabricate state, totals, availability, status, or analytics to make a screen look complete. Empty/unknown/unavailable states must be honest.

## P13. Defense clarity
A panel member should be able to understand the core workflow from the interface without a team member explaining where to click next.

## P14. Distinguish customer action from business work
Every lifecycle state must say either `Action required from you` or `No action needed — we're [specific business action]`. A status badge alone is never sufficient. Waiting language must name the next business event and how the customer will be notified where that behavior is canonically supported.

## P15. Honest milestones, not invented statuses
Progress may simplify canonical data into customer-friendly milestones, but each milestone must be labelled as persisted, derived, or unavailable. The interface must not represent preparation, ready-for-pickup, settlement, or completion as a confirmed system fact unless canonical data supports that statement.

## P16. Responsive workflow preservation
On narrow screens, preserve the current state, next action, prerequisites, and key trip facts before secondary detail. Do not merely compress desktop tables, multi-column forms, or operational dashboards until their meaning is lost.

## P17. Accessible recovery and feedback
Forms, uploads, reviews, and asynchronous actions must preserve entered data where possible; give a visible in-context result; and provide a specific recovery path for errors, timeouts, empty data, and unavailable information. Do not rely on color, hover, a toast alone, or a hidden status change to communicate an outcome.
