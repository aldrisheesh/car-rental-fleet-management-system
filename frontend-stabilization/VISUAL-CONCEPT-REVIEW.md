# Visual Concept Review

## Skills used

| Name | Local path | Role in this design pass |
| --- | --- | --- |
| frontend-design | `/Users/aldrich/.codex/skills/frontend-design/SKILL.md` | Established the deliberate subject-specific visual language, restrained hero, plain-language copy, and anti-template critique. |
| web-design-guidelines | `/Users/aldrich/.codex/skills/web-design-guidelines/SKILL.md` | Guided visible focus, labels, semantic controls, keyboard/touch expectations, content resilience, and responsive review. Its current upstream guideline file was read fresh. |
| ui-ux-pro-max | `/Users/aldrich/.codex/skills/ui-ux-pro-max/SKILL.md` | Read-only design-system and accessibility guidance: contrast, 44 px targets, mobile-first prioritisation, state clarity, and focus-not-obscured direction. |
| image-to-code | `/Users/aldrich/.codex/skills/image-to-code-skill/SKILL.md` | Required the image-first workflow, standalone readable concepts, image inspection, consistency checks, and regeneration of a noncompliant concept. |
| imagegen | `/Users/aldrich/.codex/skills/.system/imagegen/SKILL.md` | Used the built-in image generator to create and then persist the selected raster visual-concept artifacts. |

## Visual direction

The system is a daylight operations interface: warm off-white working surfaces, charcoal copy, restrained deep-blue actions, and green/amber/red states paired with clear iconography and words. A single humanist sans-serif treatment keeps customer and operational language familiar. The distinctive device is the lifecycle rail: a clear route through Booking, Requirements, Payment, Confirmation, Rental, and Return. It teaches a first-time renter the process without surfacing backend terminology.

Customer screens are deliberately open and calm, with one dominant next action. Admin screens use aligned rows and an attention-first operating model rather than KPI-card grids. The dark-blue Admin navigation is a bounded orientation element; content surfaces remain daylight and high contrast.

## Concept inventory

| Concept | Artifact path | Viewport/device | Role and lifecycle/state | Primary task | Design rationale |
| --- | --- | --- | --- | --- | --- |
| Home / entry | `visual-concepts/CUSTOMER-HOME/home-desktop-1440.png` | 1440 desktop | Customer, pre-booking | Start the rental journey | A short promise, one Find a car action, and a three-stop route explain the process before asking for details. |
| Home / entry | `visual-concepts/CUSTOMER-HOME/home-mobile-375.png` | 375 mobile | Customer, pre-booking | Start without navigation ambiguity | The route rail becomes vertical, the action becomes full width, and secondary material does not displace the start action. |
| Find a Car / results | `visual-concepts/CUSTOMER-FIND-CAR/find-car-results-desktop-1440.png` | 1440 desktop | Customer, finder results | Compare cars evaluated against trip criteria | Eligibility is explained as a match to entered criteria; ordinary inventory is explicitly not misrepresented as period availability. |
| Booking Detail — action required | `visual-concepts/CUSTOMER-BOOKING-ACTION/booking-action-required-desktop-and-mobile.png` | 1440 desktop + 375 mobile | Customer, requirements need resubmission | Correct and resubmit requirements | The amber action panel precedes all secondary facts, names the reason, locks payment truthfully, and retains the visible next action on mobile. |
| Booking Detail — waiting | `visual-concepts/CUSTOMER-BOOKING-WAITING/booking-waiting-desktop-1440.png` | 1440 desktop | Customer, requirements under review | Understand that no action is needed | A green waiting panel names the staff activity and notification expectation while showing why Payment remains locked. |
| Dashboard | `visual-concepts/ADMIN-DASHBOARD/dashboard-desktop-and-tablet.png` | 1440 desktop + 768 tablet | Owner/Admin, attention queue | Locate operational work now | Linked attention rows precede compact today-at-a-glance summaries. Tablet stacks priorities rather than squeezing a desktop grid. |
| Booking Detail | `visual-concepts/ADMIN-BOOKING-DETAIL/booking-detail-desktop-1440.png` | 1440 desktop | Owner/Admin; Submitted booking | Review the booking as one operational workspace | The page keeps context, requirements, payment, assignment/confirmation, rental/return, and activity coherent while making state prerequisites explicit. The Staff inset is explanatory read-only, not a failing control. |
| Decision Support | `visual-concepts/ADMIN-DECISION-SUPPORT/decision-support-desktop-1440.png` | 1440 desktop | Owner/Admin; advisory and unavailable-data states | Understand recommendation evidence before acting | Advisory language appears before outputs; charts carry legends/text summaries; insufficient data and external-context unavailability are first-class states. |

## Customer experience rationale

The customer path uses a sequential visual grammar: begin, select, request, provide requirements, then wait or act. The customer never needs to infer whether staff are working or whether they must respond. Action-required and waiting states use different messages, icons, and calls to action—not color alone. Payment is visibly locked until requirement verification and no concept supplies a peso amount.

## Admin experience rationale

The dashboard answers “What needs my attention now?” before reporting secondary metrics. Booking Detail consolidates work that legacy screens split between queues and modules, but it does not broaden authorization. Decision Support makes uncertainty and advisory scope legible so that a defense panel can distinguish a recommendation from an automated action.

## Responsive rationale

Customer Home is represented at 375 and 1440 px. The action-required lifecycle screen is represented in both desktop and mobile compositions; the mobile screen uses a vertical rail and a safe-area-aware persistent action rather than shrinking the desktop layout. The Admin Dashboard shows desktop and tablet adaptations: a labelled compact header and vertically prioritised queue replace the desktop sidebar/table geometry.

## Accessibility rationale

The concepts visibly direct high-contrast charcoal-on-light copy, labelled status plus icon, one clear primary action, generous 44 px-scale action controls, readable grouped facts, and focus outlines on primary actions. They reserve distinct treatments for waiting, error/action, locked, unavailable, and success states. Final implementation must add semantic HTML, keyboard behaviour, live announcements, proper labels, error association, and reduced-motion behaviour; these are intentionally not simulated by raster images.

## Backend/domain constraints respected

- Requirements are shown before payment; payment remains manual review.
- The 50% minimum policy may be described only after verification; no concept invents or calculates a peso amount.
- Finder results communicate criterion-specific suitability and do not equate active inventory with requested-period availability.
- No concept exposes persisted Ready, settlement, completed, or fully settled states. The customer path ends at Return.
- Admin lifecycle controls are Owner/Admin-only. The Operations Staff representation is read-only and explanatory.
- Assignment does not assert maintenance readiness; Decision Support is explicitly advisory and does not move vehicles automatically.
- External context can be unavailable, and decision outputs show insufficiency/data-quality states rather than fabricated certainty.
- Settings is absent from the final Admin concepts; Audit trail is retained in Admin navigation.

## Skill-guideline traceability

| Decision | Source Skill(s) | Frozen blueprint source | Why it improves usability |
| --- | --- | --- | --- |
| Lifecycle rail instead of disconnected customer modules | frontend-design, image-to-code, ui-ux-pro-max | 01 P2–P4; 03 Progress representation; 09 Desired character | Makes the next stage and locked prerequisites learnable at a glance. |
| Action panel before facts; explicit waiting language | frontend-design, ui-ux-pro-max | 01 P14/P17; 03 State UI rules; 05 Booking Detail | Separates renter action from business work and prevents status-badge ambiguity. |
| Daylight, road-sign-clear palette and restrained containers | frontend-design, image-to-code | 09 Deliberate visual direction | Matches the frozen operations identity while avoiding legacy dark SaaS styling and card nesting. |
| Mobile rails and full-width action | ui-ux-pro-max, web-design-guidelines, image-to-code | 01 P11/P16; 09 Responsive expectations | Preserves task priority and touch comfort instead of compressing desktop columns. |
| Attention queue before summary metrics | frontend-design, ui-ux-pro-max | 02 Admin journey; 05 Admin Dashboard | Puts human work ahead of passive reporting. |
| Advisory banner, legend/text alternative, unavailable context | ui-ux-pro-max, web-design-guidelines | 02 Decision-support journey; 05 Decision Support; 08 contracts | Communicates evidence, uncertainty, and non-automation truthfully. |
| Focus direction, text-plus-icon status, labelled actions | web-design-guidelines, ui-ux-pro-max | 01 P10/P17; 09 Accessibility; 10 UI quality | Makes critical states perceivable and operable beyond color or hover. |

## Known limitations

- These are raster review references, not interactive or semantically testable UI.
- Generated names, dates, vehicle identifiers, locations, and chart labels demonstrate hierarchy only and must be replaced by canonical data or clear empty/unavailable states in implementation.
- The remaining customer results, waiting, and Admin detail breakpoints are design-system implications, not separately rendered screen references.
- Generated typography and logo marks are visual placeholders; implementation must use approved assets and the chosen licensed humanist sans-serif family.

## Recommendation

READY FOR LEAD VISUAL REVIEW
