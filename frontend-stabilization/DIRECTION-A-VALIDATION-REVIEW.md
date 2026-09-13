# Direction A Validation Review

## Skills loaded

- **frontend-design** — loaded fully and used as the primary art-direction authority. Its two-pass discipline fixed a subject-specific palette, type hierarchy, image role, route metaphor, and anti-template rules before generation.
- **ui-ux-pro-max** — loaded fully and used for design-system consistency, customer/Admin density, breakpoint recomposition, 44 px controls, visible focus, non-color status communication, readable typography, and content priority. Its generic brutalist/luxury and motion-heavy search matches were rejected as incompatible with the frozen Direction A.
- **web-design-guidelines** — loaded fully, with the current upstream rules fetched on 2026-09-13, and used for labelled controls, semantic interaction direction, visible `:focus-visible`, focus-not-obscured, image sizing, status/copy clarity, and non-hover-only actions.
- **image-to-code** — loaded fully and used for standalone image-first generation, original-resolution inspection, fresh responsive compositions, anti-nested-box review, and targeted regeneration when a state or canonical detail was unclear.
- **imagegen** — loaded fully as the supporting raster-production workflow. The built-in generator created all source images; accepted outputs were copied into the workspace and resampled to the named viewport widths.

## Direction A visual rules preserved

- Road Ivory daylight surfaces, Night Asphalt structure, Tail-light Red actions, Windshield Blue focus/information, and quiet Concrete Mist dividers.
- Editorial automotive/travel character grounded in attainable vehicles and Antipolo/Metro Manila context.
- Newsreader-like serif for selective identity/display moments and Public Sans-like support typography for comprehension.
- Large meaningful vehicle photography on comparison-heavy customer surfaces, with no decorative Admin photography.
- Low chrome, restrained corners, strong whitespace, thin dividers, and no uniform card kit.
- A road/journey metaphor that changes form by task: result baseline, compact customer route strip, Admin attention route, and booking-operation spine.
- Briah's Car Rental wordmark, consistent outline icon family, plain-language tone, and the frozen lifecycle vocabulary.

## Direction A refinements

- Waiting uses informational blue and explicit language, leaving coral for customer actions and Admin work actions rather than error semantics.
- Admin serif is restricted to the wordmark, greeting, booking identity, and major section headings; operational labels and data stay sans-serif.
- Customer Waiting uses one functional vehicle image on desktop and none on mobile, avoiding repeated context that would displace the state message.
- Dark surfaces are limited to the Admin navigation/action zones and are not repeated as broad decorative bands.
- Admin spacing is compressed through aligned rows and 8/12/16 px relationships while preserving open section boundaries.
- Status always combines icon and words; warning, success, locked, and informational meanings remain independent of the brand CTA color.

## Concept inventory

### Customer — Find a Car / results

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/CUSTOMER-FIND-CAR/find-car-desktop-1440.png`
- **Viewport:** 1440 × 960 desktop
- **Role:** Customer/Renter
- **Primary task:** Compare canonical Finder recommendations and select one vehicle.
- **Visual rationale:** Large landscape vehicle images, asymmetric specification and eligibility columns, restrained rules, and one coral selection action per result keep comparison editorial and automotive rather than ecommerce-like.

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/CUSTOMER-FIND-CAR/find-car-mobile-375.png`
- **Viewport:** 375 × 814 mobile
- **Role:** Customer/Renter
- **Primary task:** Review trip fit and select a vehicle with touch-sized controls.
- **Visual rationale:** Criteria reflow into two readable rows; each result becomes a full-width image-led sequence separated by whitespace and a rule. Actions remain visible without a sticky bar or horizontal compression.

### Customer — Booking Detail / Waiting

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/CUSTOMER-WAITING/booking-waiting-desktop-1440.png`
- **Viewport:** 1440 × 960 desktop
- **Role:** Customer/Renter; Requirements under review
- **Primary task:** Understand that no action is needed and what Briah is doing next.
- **Visual rationale:** A large blue informational stage mark and the line `No action needed` precede the compact journey strip. Supporting copy explains the review, update path, possible resubmission, and locked Payment prerequisite before trip detail.

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/CUSTOMER-WAITING/booking-waiting-mobile-375.png`
- **Viewport:** 375 × 656 mobile
- **Role:** Customer/Renter; Requirements under review
- **Primary task:** Confirm the waiting state without searching or scrolling past secondary context.
- **Visual rationale:** Vehicle photography is removed, the state explanation leads, and the journey becomes a current-stage `2 of 6` summary with prior completion and next lock stated in words.

### Admin — Dashboard

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/ADMIN-DASHBOARD/dashboard-desktop-1440.png`
- **Viewport:** 1440 × 960 desktop
- **Role:** Owner/Admin
- **Primary task:** Identify and open the work requiring attention now.
- **Visual rationale:** A single coral attention route connects compact booking, payment, and readiness queues. Today and fleet facts occupy a quieter secondary column; the dark sidebar supplies product-family continuity without turning the workspace dark.

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/ADMIN-DASHBOARD/dashboard-tablet-768.png`
- **Viewport:** 768 × 1152 tablet/narrow
- **Role:** Owner/Admin
- **Primary task:** Triage the same queues with touch-safe controls at narrower width.
- **Visual rationale:** The persistent sidebar becomes a labelled top bar. Record rows use stacked label/value groupings rather than clipped desktop tables, and Today/Fleet move below the complete attention route.

### Admin — Booking Detail

- **Artifact:** `frontend-stabilization/art-directions/DIRECTION-A-VALIDATION/ADMIN-BOOKING-DETAIL/booking-detail-desktop-1440.png`
- **Viewport:** 1440 × 960 desktop
- **Role:** Owner/Admin, with an explicit Operations Staff read-only adaptation note
- **Primary task:** Review requirements in full booking context and understand later lifecycle prerequisites.
- **Visual rationale:** The page combines an unboxed sticky context column, a vertical operational route, one open review area, one compact role-safe action zone, and history. It avoids tab sprawl, repeated buttons, and six stacked boxes.

## Customer scalability review

Direction A scales to comparison-heavy browsing without becoming a product-tile marketplace. Vehicle photography remains meaningful and large, but facts, evaluated criteria, rate, and selection actions remain scannable. It also scales to a low-action waiting state: the editorial headline carries reassurance, while the refined route treatment supplies progress and prerequisites without an enterprise stepper. The two customer concepts retain personality while supporting opposite task modes—active selection and passive waiting.

## Admin scalability review

Direction A scales to Admin by compressing spacing, reducing photography, limiting serif use, and turning the road metaphor into a functional attention or lifecycle spine. The Dashboard answers the attention question before showing current summaries. Booking Detail supports customer/trip context, requirements, locked payment, assignment/confirmation, rental release/return, and activity without a generic card or tab framework. Owner/Admin controls are concentrated in one action zone; the Staff adaptation explicitly removes protected documents, payment data, and mutation controls.

## Responsive review

- Customer Find a Car at 375 px restacks criteria and results, keeps vehicle imagery prominent, preserves 16 px-equivalent readable copy, and provides full-width touch actions without horizontal overflow.
- Customer Waiting at 375 px removes repeat photography and retains current state, no-action instruction, next update, Payment prerequisite, and document status before secondary trip detail.
- Admin Dashboard at 768 px replaces—not shrinks—the desktop sidebar, avoids clipped data tables, preserves the full attention hierarchy, and moves secondary daily/fleet facts below it.
- No mobile/tablet concept uses a sticky action that can obscure content. Focus direction is shown on an in-flow control.

## Accessibility review

- Intended normal-text pairs retain the approved Direction A contrast: Night Asphalt on Road Ivory `14.31:1`, white on Tail-light Red `5.04:1`, and white on Night Asphalt `16.02:1`.
- Controls are drawn at a minimum 44 px on desktop and approximately 48 px on touch layouts.
- A 3 px Windshield Blue outline demonstrates keyboard-focus direction on the primary or disclosure control in each interactive concept.
- State is never color-only: checks, locks, warning marks, labels, and explanations are paired.
- Waiting and action-required semantics do not share the same color or headline language.
- Labels remain present; no primary action depends on hover; lifecycle meaning is readable without interpreting icons.
- The raster concepts specify interaction direction only. Semantic HTML, alternate text, keyboard order, live regions, reduced motion, focus management, and responsive image dimensions remain implementation acceptance work.

## Brand-consistency review

All accepted screens use the exact `Briah's Car Rental` name, the same restrained serif/sans relationship, consistent outline icons, the Direction A palette, and the Booking → Requirements → Payment → Confirmation → Rental → Return vocabulary. Locations are limited to Antipolo, Manila, Makati, and Quezon City. Customer photography depicts attainable local rental vehicles rather than luxury or foreign travel imagery.

## Generic-template risk review

The customer screens are not ecommerce grids: there are no ratings, sale badges, promotional tiles, floating filters, or repeated rounded cards. The Admin screens are not dark SaaS or ERP templates: there is no KPI wall, decorative chart, bento grid, tab strip, command palette, or stacked-card shell. Car, branch, trip, review, pickup/return, maintenance, and readiness language makes the product unmistakably rental-operational. Remaining risk is concentrated in implementation: overusing serif in dense Admin views, multiplying coral buttons, turning open rows into cards, or weakening the route spine would make the system generic.

## Regenerated concepts

- **Customer Find a Car desktop:** the first draft combined evaluated recommendations with an ordinary browse vehicle while still offering `Choose this car`; regenerated so every displayed result is an evaluated Finder recommendation.
- **Customer Find a Car desktop, precision correction:** an invented `Comfortable for city and highway travel` reason and an unnecessarily specific SUV criterion were replaced with the canonical `Available for your selected dates` reason and `Any category`.
- **Customer Waiting mobile:** a green check incorrectly implied locked Payment was complete; regenerated with a neutral lock icon.
- **Admin Dashboard desktop:** the first draft used Pasig and Taguig; regenerated using only the permitted Philippine locations.
- **Admin Booking Detail desktop:** the first draft showed `Settings` and customer-facing destinations in Admin navigation; regenerated with the frozen Admin IA and no Settings.

## Validation result

**DIRECTION A VALIDATED WITH MINOR REFINEMENTS**

The four concepts demonstrate that Direction A supports customer comparison, customer waiting, attention-first administration, and dense role-safe booking operations. Remaining refinements are implementation-level discipline: preserve the open row hierarchy, keep Admin serif and coral sparse, validate real content expansion at 768 px, and implement an actual Operations Staff read-only variant during authorized frontend work.
