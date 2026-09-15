# Customer Implementation References

## Source authority

Use authority in this order:

1. Current server/domain behavior in the repository, especially `src/routes/api.bookings.ts`, `src/routes/api.requirements.ts`, `src/routes/api.payments.ts`, `src/routes/api.vehicles.ts`, `src/routes/api.vehicle-finder.ts`, `src/lib/vehicle-finder.ts`, `src/lib/finder-booking.ts`, `src/lib/booking-reads.ts`, `src/lib/payment-integrity.ts`, and `src/lib/rental-projection.ts`.
2. `DIRECTION-E-DESIGN-SYSTEM.md`, `DIRECTION-E-VISUAL-FREEZE.md`, and `DIRECTION-E-FINAL-REFINEMENTS.md`.
3. The three final Direction E images under `art-directions/DIRECTION-E/`.
4. `04-INFORMATION-ARCHITECTURE.md`, `05-SCREEN-SPECIFICATIONS.md`, `07-CAPABILITY-MIGRATION.md`, `08-BACKEND-CONTRACTS.md`, and `CUSTOMER-SCREEN-REFERENCE-MATRIX.md`.
5. Older accepted lifecycle/action/waiting images for composition and responsive behavior only. Their operator name, palette, premature booking terminology, prominent reference IDs, city-specific art, and example content are not authoritative.

When sources conflict, current code and the frozen Direction E contract win only within the already-approved presentation boundary. No visual reference changes backend behavior.

## Frozen visual contract

- Direction: **Premium Familiar Mobility** — calm, practical, trustworthy, and quietly premium.
- Field/surfaces: Rice Paper `#F6F3EC`, white `#FFFFFF`, and soft neutral `#EFEDE6`; use alignment and quiet `#D8D5CC` dividers before containers.
- Text/actions: Road Ink `#182321`, muted `#52635F`, Evergreen `#123F3A`; Calamansi `#E77A3D` is a short decorative/active underline only.
- Semantic foregrounds: success `#267A55`, warning `#A45B13`, error `#B43B3B`, information `#2E647B`, locked `#52635F`; every state also uses words and an icon.
- Type: Instrument Sans for interface work; Newsreader only for Home, rare top-level customer headings, and the typographic operator wordmark when no approved logo is supplied.
- Geometry: 4px base/8px dominant spacing rhythm; 8px controls, 10px vehicle/summary surfaces, 12px dialogs/sheets; no universal pill or oversized radius.
- Desktop: 1440px reference, centered content up to 1344px, 48px outer gutters, 12 columns/24px gaps. Task layouts normally use an open 8/4 or 7/5 split.
- Mobile: 375px reference, 20px gutters, four columns, single reading path, 44px target floor, 16px input/body floor, and no desktop miniaturization.
- Imagery: attainable fleet vehicles, natural daylight, consistent scale/angle, stable media ratios, explicit dimensions, and no permanent city identity.
- Voice: sentence case, active/plain language, request before confirmation, outcome rather than algorithm terminology, and explicit action-versus-waiting guidance.
- Containers: one surface per real conceptual/interaction group; never card-inside-card stacks or giant rounded page wrappers.

## Existing accepted references

| Path | Screen/state | Implementation role |
| --- | --- | --- |
| `art-directions/DIRECTION-E/HOME/home-desktop-1440.png` | Home / initial discovery | Authoritative desktop shell, hero, two-date search rail, one primary action, photographic crop, and How renting works rhythm. |
| `art-directions/DIRECTION-E/FIND-CAR/find-car-desktop-1440.png` | Evaluated Finder results | Authoritative result grid, trip summary, refinement controls, image/fact/rate order, reason treatment, and one action per vehicle. |
| `art-directions/DIRECTION-E/REQUIREMENTS/requirements-desktop-1440.png` | Requirements upload task | Authoritative macro journey, task-progress separation, 8/4 task/summary split, upload rows, locked Payment, and request summary. |
| `visual-concepts/CUSTOMER-BOOKING-ACTION/booking-action-required-desktop-and-mobile.png` | Action-required booking detail | Behavior reference for placing the reason and valid action before facts, plus a mobile persistent action. Restyle and rewrite through Direction E. |
| `visual-concepts/CUSTOMER-BOOKING-WAITING/booking-waiting-desktop-1440.png` | Waiting / no action needed | Behavior reference for explicit no-action language, named review activity, no false CTA, and locked next stage. Restyle and rewrite through Direction E. |
| `art-directions/DIRECTION-D/MY-BOOKING/my-booking-desktop-1440.png` | Booking detail / lifecycle overview | Behavior reference for open task-first booking detail and supporting trip facts. Do not copy `Booking completed`, prominent reference, or Direction D palette. |
| `art-directions/DIRECTION-D/MY-BOOKING/my-booking-mobile-375.png` | Booking detail / lifecycle mobile | Behavior reference for current/adjacent lifecycle summary, full-journey disclosure, vertical action-first flow, and 375px prioritization. |

## New generated references

| Path | Route/capability | Canonical state | Primary task | Supported data/actions | Excluded unsupported behavior |
| --- | --- | --- | --- | --- | --- |
| `implementation-references/customer/VEHICLE-DETAIL/vehicle-detail-desktop-1440.png` | Target Vehicle Detail; current data from `GET /api/vehicles` plus optional Finder handoff | Selected evaluated Finder result | Understand and continue with the selected vehicle | identity, photo, category, daily rate, seats, transmission, fuel, branch, trip context, exact Finder reasons, continue/change trip | ratings, reviews, favorites, scarcity, discount, stock count, non-evaluated availability, reservation claim |
| `implementation-references/customer/VEHICLE-DETAIL/vehicle-detail-mobile-375.png` | Same capability | Same evaluated selection | Inspect and continue without losing the action on mobile | Same supported facts; concise rationale disclosure; reachable primary action | mechanically shrunk desktop, horizontal fact rail, hidden/gesture-only actions |
| `implementation-references/customer/RENTAL-REQUEST/rental-request-details-desktop-1440.png` | Replacement for `/booking`; `GET /api/booking-master-data`; eventual `POST /api/bookings` | Signed-in customer, selected car, step 1 of 2 | Supply remaining request fields | active pickup/return branches, pickup/return instants, purpose free text, pickup/delivery choice, conditional delivery locations, optional destination/seats, profile contact display, edit profile | vehicle reselection, policy checkbox, static insurance/refund claims, payment, requirements, confirmation, computed total |
| `implementation-references/customer/RENTAL-REQUEST/rental-request-details-mobile-375.png` | Same capability | Same request step | Complete a single-column request form | Same form fields and selected-car context | desktop sidebar, tiny paired fields, obscured/sticky content |
| `implementation-references/customer/RENTAL-REQUEST/rental-request-review-desktop-1440.png` | Request review before Customer-only idempotent `POST /api/bookings` | Step 2 of 2, not yet submitted | Verify facts and send the request | review/edit supported request fields, profile contact, selected-car facts, `Send rental request` | terms checkbox, payment, request ID, confirmed-booking or availability language |
| `implementation-references/customer/PAYMENT/payment-action-desktop-1440.png` | Consolidated Booking Detail Payment stage; `GET/POST /api/payments` | Requirements `Verified`; payment `Not Submitted` | Submit payment details/proof for manual review | active payment method, positive amount paid, transaction reference, JPEG/PNG/PDF proof up to 10 MiB, 50% policy, submit for review | invented required peso amount, computed bill, gateway, automated approval, instant confirmation |
| `implementation-references/customer/PAYMENT/payment-action-mobile-375.png` | Same capability | Same action-required state | Complete the proof flow on mobile | Same fields/policy, compact lifecycle and request summary | tiny controls, drag-only upload, hidden prerequisites, invented amount |
| `implementation-references/customer/PAYMENT/payment-waiting-desktop-1440.png` | Booking Detail Payment stage; payment proof read access | Payment `Pending Verification` | Understand that no action is needed | current method/reference/proof metadata/submission time when provided, signed proof view, manual review expectation | primary CTA, auto-verification, booking confirmation, amount invention |
| `implementation-references/customer/CONFIRMED/booking-confirmed-desktop-1440.png` | Booking Detail Confirmation stage | Booking `Confirmed`; rental not started | Understand the confirmed milestone and trip facts | assigned vehicle, requested schedule, service method, pickup/return branches, delivery locations when supplied, confirmation state | request-submitted equivalence, `Ready` state, pickup credential, unsupported customer controls |
| `implementation-references/customer/ACTIVE-RENTAL/active-rental-desktop-1440.png` | Booking Detail Rental stage; customer-safe rental projection | `started_at` present and `ended_at` absent | See that the rental is active and retrieve useful trip facts | assigned vehicle, actual start, scheduled return, branches/service, active state | GPS, emergency tooling, extension flow, mutable rental controls, invented contact promise |
| `implementation-references/customer/RETURNED/returned-desktop-1440.png` | Booking Detail Return stage; customer-safe rental projection | `ended_at` present | Understand that the return was recorded | assigned vehicle, requested schedule, actual start/end, branches/service, return-recorded state | Settlement, Completed, Fully settled, final charges, receipt/refund actions |
| `implementation-references/customer/STATES/my-bookings-desktop-1440.png` | Target My Bookings list replacing combined `/customer` dashboard | Mixed customer records, newest first | Find the booking that needs attention and open any request | booking/vehicle/schedule facts, composed requirement/payment/rental state, one contextual row action | separate fabricated history dataset, prominent internal IDs, batch actions, unsupported cancellation/refund |
| `implementation-references/customer/STATES/customer-sign-in-desktop-1440.png` | `/sign-in`; authentication interruption during a request | Anonymous customer with preserved vehicle/trip intent | Sign in and continue the request | email, password, password visibility control, registration switch, preserved request context | password reset, OAuth, passkey, generic post-auth dashboard redirect |
| `implementation-references/customer/STATES/customer-registration-desktop-1440.png` | Sign-up mode in the authentication shell | Anonymous customer with preserved vehicle/trip intent | Create a customer account and continue | full name, phone, email, password, confirmation, sign-in switch, preserved request context | unsupported profile fields, OAuth, terms checkbox not backed by supplied policy, guaranteed immediate session when email confirmation is required |

All fourteen matrix-approved images were freshly generated, inspected at original resolution, and accepted. Each desktop reference is 1440×960; each mobile reference is 375×900.

## Deep visual extraction

### Home

- **Purpose and priority:** begin discovery immediately. The two-line vehicle/trip heading is first, the complete date task and `Find cars` remain within the first desktop view, and photography is the single expressive device.
- **Visible copy:** `Find the right car for your trip`; `Choose your rental dates to start. You can narrow the results after you see the cars.`; `Rental start`; `Rental end`; `Find cars`; the optional-refinement hint; four How renting works labels; review/confirmation explanation.
- **Typography:** 72/76px semibold Newsreader display; approximately 20/30px guidance; 16px labels/controls/actions; 30/38px section title. Navigation and all task text use Instrument Sans.
- **Layout/spacing:** 80px white header. Asymmetric copy/photo hero fills roughly 630px high. Copy begins near the 48px outer gutter and stays under roughly 600px. Search rail bridges both halves and sits approximately 48px from the sides, with 24px internal gaps and a compact helper line.
- **Surfaces/controls:** one elevated white search rail only; two equal labelled date controls and one wider Evergreen action; no detached competing action. How renting works is open on the page with dividers, not four cards.
- **Imagery:** one full-bleed road/vehicle window, natural light, attainable MPV, no essential text over a busy crop, no identifiable landmark.
- **Responsive:** tablet makes the form two columns with action spanning; mobile stacks labels/fields/action and moves photography away from essential text. Four steps become a vertical ordered list.
- **Data dependencies:** dates are customer input; validation uses Manila business-time rules. Passengers/budget/category are absent until optional result refinement.

### Find a Car

- **Purpose and priority:** compare eligible Finder results while preserving direct browsing. Trip context comes first, then result heading/refinement, then image-first cards.
- **Typography:** 44/50px Newsreader task title; approximately 28/32px bold tabular rate; 19/25px semibold vehicle identity; 13–16px facts/reasons/actions.
- **Layout/spacing:** 48px desktop gutters; full-width trip summary; category rail and Filters align on one row; 3-column grid with roughly 16–24px gaps. Two card rows fit the 960px reference because card internals stay compact.
- **Card logic:** each card is one functional unit: stable wide image, name/rate/reason, consistent fact row, one full-width `View car`. No card is wrapped in another section card.
- **Status/reasons:** a small success icon plus one canonical reason; never a score. `Cars that fit your trip` only appears after evaluation. Direct browse removes the eligibility reason and availability subtitle.
- **Responsive:** 2 columns on tablet, 1 on mobile; filters move to a labelled sheet/disclosure; trip summary wraps; URL retains criteria/filter state.
- **Data dependencies:** Finder recommendation output provides image, rate, estimated base total, facts, branch, rank, and reasons. Ordinary browse uses only active-vehicle output and may not infer period/readiness availability.

### Vehicle Detail / Selection

- **Purpose and priority:** confirm the chosen vehicle and keep the rental-request handoff obvious. The vehicle photograph and identity/rate are co-primary; CTA follows facts and current trip context.
- **Visible copy:** `Back to cars`; `Toyota Vios`; `₱1,800 / day`; supported reason; four facts; current dates/passengers; `Continue with this car`; `Change trip`; four full Finder reasons; reservation warning.
- **Typography:** desktop title approximately 44/50px Newsreader; rate 36–40px bold tabular sans; facts/labels 14–16px; mobile title approximately 44px, rate about 36px, body 16px.
- **Desktop layout:** open 7/5 split beneath the back link. Gallery occupies about 55% width and uses a stable landscape main frame; detail surface occupies the other 45%. Full rationale runs as an open four-column strip below with vertical dividers.
- **Mobile layout:** header/back, 16:9 photo, thumbnail row, identity/rate/reason, 2×2 facts, trip row, rationale disclosure, then full-width bottom action. The fresh 375 reference is not a crop.
- **Gallery behavior:** selected thumbnail uses Evergreen boundary and must expose selected state semantically; thumbnail controls are buttons with useful alt text/labels. Missing image uses a truthful stable fallback rather than fabricated photography.
- **Controls:** one primary `Continue with this car`; `Change trip` and back are conventional links. Mobile bottom action needs content inset and focus-safe scrolling.
- **Data dependencies:** `GET /api/vehicles` provides identity/rate/facts/branch/image; evaluated context provides dates/passengers/reasons. There is no current single-vehicle endpoint or route.

### Rental Request — Details

- **Purpose and priority:** collect only remaining canonical create fields, preserving chosen vehicle and Finder context. Step progress makes Review explicit without turning the page into a long wizard.
- **Typography:** 44/50px Newsreader h1 desktop, 36–42px mobile; 24–28px sans subsection headings; 16px labels/values/body; 14px helper text only where nonessential.
- **Desktop layout:** open 8/4 grid. The left form uses three logical groups separated by 32px rhythm/quiet rules. Two-column pairs cover times and branches; radio choices remain on one comfortable row; trip information uses three fields. The right summary is one soft plane.
- **Mobile layout:** selected car becomes a compact in-flow strip. Every field is full width; radios stack; the form remains one reading path. Summary note appears before the full-width action rather than in a sidebar.
- **Control semantics:** dates supplied by Finder appear prefilled with a `Change trip` link; branches are canonical selects; service uses a labelled radio group; purpose/destination are free-text inputs; passengers is a numeric input. Delivery reveals two labelled location fields and preserves prior valid values.
- **Summary/contact:** selected vehicle cannot be casually swapped. Customer identity/contact is read-only from the principal/profile, with `Edit profile`; booking creation uses the principal phone rather than redundant editable identity fields.
- **Feedback:** inline errors sit below their fields; a multi-error submit adds a focusable linked summary. Preserve inputs, warn on unsaved navigation, and show progress only after an action starts.
- **Data dependencies:** active branches/vehicles from booking master data; create contract and Finder provenance revalidation from `POST /api/bookings`; optional destination <=200 characters; preferred seats positive integer when present.

### Rental Request — Review / Submit

- **Purpose and priority:** prevent accidental or misunderstood submission. The exact non-confirmation callout precedes the primary action.
- **Layout:** the same 8/4 grid maintains spatial continuity. Review groups use open rows and dividers; each group has one conventional `Edit` link. Selected-car summary remains visually unchanged from step 1.
- **Visible copy:** `Review your rental request`; supported request facts; `This sends a rental request. It does not confirm the booking.`; requirements next-step explanation; `Send rental request`; `Back to request details`.
- **Action behavior:** submit remains enabled until work starts; then lock duplicate submission without changing button bounds, announce progress politely, and reuse the idempotency key for an identical retry. Success says `Request submitted` and routes to the owning booking detail/Requirements task.
- **Excluded:** no terms checkbox from static rental-policy data, no payment/confirmation, and no prominent generated/internal reference.

### Requirements

- **Purpose and priority:** upload exactly two documents, review them, and send them for verification while Payment stays visibly locked.
- **Hierarchy:** macro journey first; 44px Newsreader task title; separate four-step task progress; `Upload documents` section; two open upload rows; What happens next callout; primary/tertiary actions; 4-column soft request summary.
- **Upload rows:** approximately 72–88px tall, requirement icon/name/guidance on the left and one dashed choose-file target on the right. File name, size/progress/error/success occupy the same stable row after selection.
- **State behavior:** `Not Submitted` permits both current uploads and send only after both exist; `Pending Review` locks replacement; `Needs Resubmission` enables only flagged types with reason; `Verified` is read-only. Upload success never means verification.
- **Responsive:** task first, summary second; task progress condenses; each upload becomes vertical but keeps a labelled choose-file button. Sticky action, if used, reserves safe-area/content inset.
- **Data dependencies:** required types and latest current documents/review reasons from Requirements API; MIME/magic-byte/size remains server authoritative.

### Payment — Action Required

- **Purpose and priority:** explain the verified prerequisite, 50% policy, missing canonical amount, and manual-review submission without implying confirmation.
- **Typography/hierarchy:** macro lifecycle; 44px Newsreader h1; warning status and guidance; 18–20px strong policy sentence; 16px persistent form labels/values; 48px primary action.
- **Desktop layout:** open 8/4. The form uses aligned label/control rows, then one info callout and action row. The request summary is one soft plane. Warning surface is the only attention-colored container.
- **Mobile layout:** current/adjacent lifecycle replaces the six-column rail; policy callout stays before fields; fields are full width; request summary becomes compact and in-flow; primary action is full width near the end.
- **Controls:** payment method is a canonical select; amount uses decimal/currency-aware input; transaction reference is text; proof is a dashed file target with explicit choose-file alternative. Instructions appear after the selected canonical method.
- **Status/copy:** `Action required`, `Requirements verified`, and `Payment is now available` use icon and words. Exact amount is absent. The ₱ glyph is only the input affordance, not data.
- **Data dependencies:** active payment methods/instructions, current requirement `Verified`, and customer payment create contract. Proof accepts JPEG/PNG/PDF up to 10 MiB. `required_amount` may appear only when non-null and trustworthy.

### Payment — Waiting / Under Review

- **Purpose and priority:** answer the action question immediately with `No action needed — we’re reviewing your payment.`
- **Layout:** lifecycle and modest page title, then a full-width pale information band. Below, 8/4 open split with one submitted-payment fact surface and a two-step next-expectation callout; request summary stays stable.
- **Controls:** no primary CTA. `View submitted proof` and `View request details` are secondary navigation only. Customer may leave/refresh without losing state.
- **Status:** Payment is current `Under review`; Confirmation remains locked/separate. Information foreground/tint, document-clock icon, and explicit text avoid color-only meaning.
- **Data dependencies:** payment status, method label, transaction reference, proof metadata, timestamps, and signed proof access are canonical. The reference intentionally shows no amount.

### Booking Confirmed

- **Purpose and priority:** name the later, persisted confirmation milestone without collapsing earlier submission/review events into it. The success status and confirmed trip are primary; pickup readiness is explicitly excluded.
- **Visible copy:** `Booking confirmed`; an explanation that the request, requirements, and payment were reviewed; assigned `Toyota Vios`; schedule, pickup/return branches, service method; `Your car is confirmed for this trip`; and a note that confirmation does not by itself mean the vehicle is ready for pickup.
- **Typography:** approximately 44/50px Newsreader h1; 20–24px sans vehicle/status headings; 16px trip facts; 13–14px muted labels. Confirmation uses semibold text and tabular dates rather than an oversized celebratory display.
- **Layout:** macro journey first, with Confirmation current and Rental/Return future. A success callout spans the content width, followed by an open 8/4 split: assigned vehicle/trip facts on the left and one quiet next-step plane on the right.
- **Controls/status:** no transactional primary CTA. `View request details` is ordinary secondary navigation. Success uses a check icon, success foreground/tint, and explicit `Confirmed`; it does not turn the entire page green.
- **Imagery:** one compact assigned-vehicle crop with stable aspect ratio; it supports identity rather than recreating the selection gallery.
- **Responsive:** journey condenses to current/adjacent stages; the vehicle/trip area becomes one column; next-step content follows the facts. No separate mobile image is required because behavior is the established Booking Detail reflow.
- **Data dependencies:** persisted booking `Confirmed`, assigned vehicle projection, requested schedule, service, branches, and conditional delivery locations. Do not display confirmation time or pickup instructions unless a canonical customer read supplies them.

### Active Rental

- **Purpose and priority:** make the active rental unmistakable, then expose the scheduled return and actual start that the customer can safely use. It is a read-only operational state.
- **Visible copy:** `Your rental is active`; assigned `Toyota Vios`; scheduled return; actual start; pickup/return branch and service facts; `Return is scheduled` guidance. No emergency, tracking, or extension copy appears.
- **Typography:** 44/50px Newsreader h1; 24–28px active-state heading; 28–32px tabular scheduled-return emphasis; 16px labels/values/body.
- **Layout:** lifecycle places Rental current. The active status is a restrained full-width success/information band. The body uses an open 8/4 split with the scheduled return and trip timeline on the left and compact vehicle/request context on one soft plane at right.
- **Controls/status:** status is icon + `Active rental`, never color alone. Navigation back to the request/booking may be a text link; no action-shaped unsupported control is present.
- **Imagery:** one compact assigned-vehicle image; no maps, telemetry, animated route, or dashboard simulation.
- **Responsive:** stack status, scheduled return, actual timestamps, and vehicle context in that order. Preserve exact date/time wrapping and a 44px link target. The established Booking Detail reflow is sufficient, so no standalone mobile image is needed.
- **Data dependencies:** customer-safe rental projection (`started_at`, `ended_at`, `active`) plus assigned vehicle and booking schedule/service facts. Active means `started_at != null && ended_at == null` only.

### Returned

- **Purpose and priority:** state only that the rental ended and the return was recorded. The page deliberately stops before any unsupported financial or booking-finality conclusion.
- **Visible copy:** `Return recorded`; `Rental ended`; actual return date/time; actual start; requested schedule; assigned vehicle and branch/service facts; explicit note that this status does not confirm settlement, final charges, or booking completion.
- **Typography:** 44/50px Newsreader h1; 24–28px status title; 20–24px actual-return value; 16px timeline/facts; muted 14px boundary note.
- **Layout:** Return is the current/final shown journey stage, labelled `Rental ended`. A restrained success band precedes a two-column factual timeline and compact booking summary. Quiet rules separate requested and actual facts without nesting cards.
- **Controls/status:** no primary CTA, receipt button, payment control, or celebratory completion badge. The status uses a return/check icon plus words; `View request details` remains secondary navigation.
- **Imagery:** one compact vehicle image with the same crop language as Confirmed/Active, maintaining recognition across lifecycle stages.
- **Responsive:** stack actual return before supporting facts, then vehicle context and boundary note. This is a straightforward Booking Detail reflow governed by existing mobile rules.
- **Data dependencies:** `rental.ended_at` is the only return-recorded trigger. Use available `started_at`, requested schedule, assigned vehicle, branches, and service; missing actual values receive explicit textual fallbacks.

### My Bookings

- **Purpose and priority:** expose current work before the full record list. The first row needing customer action receives one clear action; other rows stay scannable and read-only until opened.
- **Visible copy:** `My bookings`; short guidance; an attention summary for requirements/payment work; filter tabs such as `All`, `Needs action`, and `Current`; representative rows for action required, active rental, and return recorded; `View request` or one contextual action.
- **Typography:** 44/50px Newsreader h1; 19–22px vehicle identity; 16px schedule/status/action; 13–14px labels and supporting facts. Dates and comparable values use tabular numerals.
- **Layout:** heading and compact filter controls sit above one open list. Each booking row is a single surface with vehicle thumbnail, vehicle/trip identity, dates, worded state, and one right-aligned action. Roughly 16px row gaps and 24px inner spacing preserve density without dashboard widgets.
- **Controls/status:** tabs are conventional compact controls with selected text/boundary state, keyboard semantics, and no pill excess. Status is icon + wording. Only the next valid customer action receives the primary Evergreen button; read-only rows use links.
- **Imagery:** stable 4:3 or 3:2 vehicle thumbnails, identical dimensions, object-fit crop, and truthful fallback. No decorative stock illustration is required for an empty list.
- **Responsive:** filter controls horizontally scroll only if every control remains reachable, otherwise use a labelled select/disclosure. Rows stack thumbnail, identity/status, dates, then full-width contextual action. No separate mobile reference is necessary because the row has one unambiguous reflow.
- **Data dependencies:** customer-scoped bookings newest first plus assigned/requested vehicle, schedule, branches, service, safe rental projection, and composed current requirement/payment state. There is no separate history source; cancelled/rejected/returned records remain in this list when returned.

### Customer Sign-in

- **Purpose and priority:** authenticate without discarding an in-progress rental request. The form and `Sign in and continue` are primary; retained car/dates/branch context explains why the interruption occurred.
- **Visible copy:** `Welcome back`; `Sign in to continue your Toyota Vios request`; email/password labels; `Show`; `Sign in and continue`; registration switch; `Back to rental request`; retained vehicle, dates, and branch.
- **Typography:** 44/50px Newsreader h1; 30–36px Newsreader request-context heading; 16px form labels, values, links, and action; 14px supporting account copy.
- **Layout:** white global header, then an approximately 7/5 split. A large attainable-vehicle photograph and retained request summary occupy the left; a single bordered white auth surface occupies the right. The form uses 24px vertical rhythm and no nested panels.
- **Controls:** persistent labels, email autocomplete, current-password autocomplete, password visibility button, full-width primary action, mode switch link, and back link. The visibility control must expose pressed/state text and retain input focus.
- **Responsive:** form moves before or immediately after a compact retained-request summary; large photography becomes a shallow crop or is removed if context remains. Use 20px gutters, 16px inputs, and 44px targets. This reflow is straightforward and does not require a separate mobile reference.
- **Data dependencies:** auth email/password and preserved booking intent in URL/session-safe state. Successful redirect returns to the request; role-aware fallback applies only when no intent exists.

### Customer Registration

- **Purpose and priority:** collect the minimum canonical account fields and preserve the same selected trip. Account creation is framed as protecting/tracking the request, not as a new unrelated onboarding funnel.
- **Visible copy:** `Create your account`; `Your request details will stay here`; full name, phone number, email, password, confirm password; `At least 8 characters`; `Create account and continue`; sign-in switch; `Back to rental request`; retained Toyota Vios/date/branch context.
- **Typography/layout/imagery:** same auth shell, split, photograph, heading scale, field scale, and spacing as sign-in. The longer form determines the surface height; the retained-context side stays open rather than matching it with an artificial card.
- **Controls:** supported fields only; new-password autocomplete; paste allowed; labelled show/hide controls; useful phone/email input modes; confirmation is client-side validation, not another stored profile field. Inline errors do not erase valid input.
- **Status behavior:** when registration requires email confirmation, replace the form action outcome with an information/success callout that says confirmation is required; do not claim the customer is signed in or invent a verification route. Otherwise resume the preserved request using the canonical auth response.
- **Responsive:** retained context condenses above the form; all inputs become one column; the primary action stays in normal flow. No separate mobile image is required.
- **Data dependencies:** full name, phone, email, password (minimum eight characters), auth response, and optional `requiresEmailConfirmation`. Address and immutable-email profile behavior belong to Customer Profile, not registration.

### Acceptance and regeneration record

- All accepted images were inspected at original resolution for readable copy, canonical hierarchy, analyzable controls, Direction E fidelity, and unsupported claims.
- The first Rental Request Details desktop draft represented `Purpose of use` as a select. It was rejected and freshly regenerated because the create contract supports free text.
- The first Returned draft labelled the journey `Rental complete`. It was rejected and freshly regenerated because the repository has no Completed state; the accepted reference says `Rental ended` and `Return recorded`.
- No rejected draft was stored under `frontend-stabilization/`.

### Action-required and waiting composition

- Place a single action/waiting band before trip facts.
- Action-required uses warning icon, exact reason, prerequisite explanation, and one valid primary action.
- Waiting uses information/neutral icon and explicit `No action needed`; it may expose read-only details but no action-shaped false CTA.
- Locked stages name their prerequisite. Completed stages describe only the completed event, never a later implication.
- On mobile, the current/adjacent journey summary precedes the band; the full journey is available through a labelled disclosure.

## Shared component map

Names are implementation-oriented working names, not an imposed file structure.

| Primitive / component | Reference responsibility | Likely data/behavior boundary |
| --- | --- | --- |
| `CustomerHeader` | Operator identity, primary nav, account state, mobile menu, active underline | Auth principal; semantic links; skip link; focus-managed mobile disclosure |
| `DateSearch` | Home two-date discovery rail | Manila-local start/end validation and URL handoff |
| `TripContext` | Compact dates/passengers/budget/preference summary | URL/Finder criteria; `Change trip` |
| `VehicleCard` | Image-first comparable result unit | Browse or Finder result; reason only in evaluated context |
| `VehicleGallery` | Main image plus selected thumbnails | Canonical images/fallbacks; selected semantics; alt/dimensions |
| `VehicleFacts` | Consistent seats/transmission/fuel/branch order | Nullable truthful fallbacks |
| `FinderReasons` | Exact criterion-derived reasons | Canonical reason strings only; compact/detail variants |
| `RequestProgress` | Two-step Details → Review flow | Current/completed semantics; not the macro lifecycle |
| `RequestDetailsForm` | Canonical booking-create fields grouped by decision | Validation, conditional delivery locations, unsaved changes |
| `RequestReview` | Read-only review groups and edit links | Idempotent submit; request-not-confirmation warning |
| `RequestJourney` | Request → Requirements → Payment → Confirmation → Rental → Return | Ordered list; complete/current/locked/pending; `aria-current` |
| `StatusCallout` | Action, waiting, success, error, or locked explanation | Semantic icon/foreground/tint and exact next action/no-action copy |
| `BookingSummary` | One soft vehicle/trip/current-stage plane | Customer-safe booking projection; no prominent internal ID |
| `UploadRequirement` | One requirement file target/status/reason | File input, progress, current version, replacement gate |
| `PaymentSubmission` | Method/amount/reference/proof form | Requirements gate, active methods, multipart submit, manual-review copy |
| `WaitingState` | Read-only review expectation with no false CTA | Requirements/payment pending states |
| `TripSummary` | Scheduled/actual trip facts in one scan path | Locale-aware dates/times, branches/service, customer-safe rental fields |
| `BookingListItem` | Vehicle, dates, status, next-action cue | Joined booking/requirements/payment/rental view; deep link |
| `AuthShell` | Sign-in/sign-up and booking-intent context | Focus management, password manager/paste, mode state, role-aware redirect |
| `InlineError` / `ErrorSummary` | Field correction and multi-error navigation | `aria-invalid`, `aria-describedby`, focus after submit |

## State mapping

| Canonical source condition | Customer-facing state | Presentation/action |
| --- | --- | --- |
| Booking `Submitted`; requirements absent/`Not Submitted` | Request submitted — requirements needed | Action required; open Requirements; Payment locked. |
| Requirements `Pending Review` | Requirements under review | `No action needed`; submitted documents read-only; Payment locked. |
| Requirements `Needs Resubmission` | Update requirements | Show safe per-file reason; enable only flagged replacement and explicit resubmit. |
| Requirements `Verified`; payment absent/`Not Submitted` | Requirements verified — payment available | Payment action screen; 50% policy; amount only if trustworthy `required_amount` exists. |
| Payment `Pending Verification` | Payment under review | `No action needed`; proof/details read-only; Confirmation separate/locked. |
| Payment `Needs Resubmission` | Update payment information | Action required with canonical reason; replace current proof/details. |
| Payment `Verified`; booking still `Submitted` | Payment verified — confirmation next | Waiting state; no confirmation claim or customer mutation. |
| Booking `Confirmed`; no started rental | Booking confirmed | Success milestone; assigned vehicle/schedule/service facts; no Ready claim. |
| Rental `started_at != null`, `ended_at == null` | Active rental | Show actual start, scheduled return, assigned vehicle, and safe trip facts; no GPS/tools. |
| Rental `ended_at != null` | Return recorded | Show actual return and trip/vehicle facts; no settlement/completion/finality claim. |
| Booking `Rejected` or `Cancelled` when returned by canonical reads | Rejected or cancelled request/booking | Clear status/reason only when supplied; no invented retry/refund action. |
| Unknown/unavailable value | Not available / not recorded | Explicit textual fallback; never a blank successful-looking value. |

There is no customer-presentable persisted `Ready`, Settlement, Completed, or Fully settled state.

## Responsive implementation notes

- Validate 375, 768, 1024, and 1440px plus 200% zoom; no horizontal page scroll.
- Keep mobile at 20px gutters and desktop at 48px. Use CSS grid/flex rather than runtime measurement.
- Recompose rather than scale: side summaries move after the primary task; multi-column lifecycle becomes current/adjacent context plus full-list disclosure; forms become one column; result grid becomes 3/2/1.
- Mobile bottom actions require `env(safe-area-inset-bottom)`, matching content padding, and scroll padding so keyboard focus is not hidden.
- Long vehicle, branch, file, status, and reason text must wrap or clamp without hiding essential meaning. Give flex/grid children `min-width: 0`.
- Keep inputs at 16px or larger on mobile. Preserve native date/select behavior, correct input modes, and no zoom disabling.
- Header disclosure retains desktop navigation order, announces expanded state, supports Escape, returns focus, and prevents background interaction only when modal.
- Reserve image aspect ratios and dimensions. Above-fold vehicle media is high priority; repeated/below-fold fleet media may lazy load.

## Accessibility implementation notes

- Use semantic headings, lists, links, buttons, labels, fieldsets/legends, and file inputs before ARIA. Include a skip link.
- Every form control has a persistent label, meaningful `name`, correct type/input mode, and useful autocomplete. Never block paste.
- Authentication must support password managers and paste. Add labelled password visibility controls if implemented; do not invent unavailable recovery/OAuth/passkey actions.
- On failed multi-field submit, keep inline errors, focus a linked error summary or first invalid control, and retain all valid values/files.
- All controls require visible `:focus-visible`; compound inputs use `:focus-within`. Sticky header/action bars cannot fully cover focus.
- Maintain 4.5:1 normal-text contrast and 3:1 meaningful non-text/control-boundary contrast. Color never acts alone.
- Effective targets are at least 44×44px with roughly 8px separation on touch layouts.
- Icons use one outlined SVG family and consistent stroke; decorative duplicates are hidden; standalone/icon buttons receive accessible names and expanded/pressed state.
- Lifecycle uses an ordered list and `aria-current="step"`; locked/current/complete states include words and icons.
- Async search, uploads, submit, and review refresh use restrained polite live announcements; urgent blocking errors may use alert semantics. Toasts never replace inline state.
- Respect reduced motion; use opacity/transform only when motion clarifies a user-triggered change; never `transition: all`.
- Use `Intl.DateTimeFormat`/`Intl.NumberFormat`, tabular numerals for comparable dates/rates/counts, explicit image dimensions/alt text, and no hard-coded customer-facing date/currency formatting.

## Open implementation questions

1. Final route shapes for Vehicle Detail and per-booking Booking Detail are not implemented. IA permits route consolidation, but deep-link/back behavior must be chosen during the authorized implementation plan without changing domain contracts.
2. `payments.required_amount` is nullable and unpopulated. References state the approved minimum-50% policy and intentionally omit an exact peso requirement; implementation must not calculate one from incomplete financial semantics.
3. Production approval/licensing remains required for the Briah operator mark, Instrument Sans/Newsreader loading, and final vehicle photography.
4. Existing customer booking reads do not directly join requirement/payment state. The authorized implementation must compose existing role-safe reads without changing backend behavior or binding Requirements only to the newest record.
5. Notification links are coarse because no detail routes exist; they should point to the eventual booking detail/stage only after those route contracts are defined.

## Implementation readiness

**CUSTOMER REFERENCES COMPLETE WITH MINOR IMPLEMENTATION QUESTIONS**

All fourteen new references and the seven accepted baseline/behavior references have been inspected and mapped. The open questions above affect route composition, customer-safe read composition, absent payment amount semantics, and production asset approval; they do not require further customer-screen art direction. Application implementation remains separately gated and is not authorized by this document.
