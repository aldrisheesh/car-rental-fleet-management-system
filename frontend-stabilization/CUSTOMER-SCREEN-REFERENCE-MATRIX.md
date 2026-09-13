# Customer Screen Reference Matrix

**Issue:** GitHub #63

**Branch:** `stabilization/frontend-rebuild`

**Visual authority:** Direction E — Premium Familiar Mobility, frozen 2026-09-13

**Purpose:** classify the complete customer-facing surface and state inventory before customer implementation-reference generation. This is a presentation inventory only; it does not authorize application-source changes.

## Classification

- **A. EXISTING ACCEPTED REFERENCE** — an accepted raster already establishes the material layout, hierarchy, or interaction.
- **B. NEW IMAGE REQUIRED** — implementation would otherwise require material layout or hierarchy invention.
- **C. DESIGN-SYSTEM-ONLY — no separate image required** — the state is a small variation or straightforward reflow already governed by the frozen system.
- **D. NOT CANONICALLY SUPPORTED** — current repository contracts cannot truthfully present the feature/state.
- **E. DUPLICATE / CONSOLIDATED** — the capability survives inside a clearer canonical surface rather than as another independent screen.

## Evidence read before classification

- Frozen visual contract: `DIRECTION-E-DESIGN-SYSTEM.md`, `DIRECTION-E-VISUAL-FREEZE.md`, `DIRECTION-E-FINAL-REFINEMENTS.md`, and all three accepted images under `art-directions/DIRECTION-E/`.
- Frozen journey/IA: `02-CANONICAL-WORKFLOWS.md`, `03-LIFECYCLE-STATES.md`, `04-INFORMATION-ARCHITECTURE.md`, `05-SCREEN-SPECIFICATIONS.md`, and `06-WIREFLOWS.md`.
- Migration/contracts: `07-CAPABILITY-MIGRATION.md`, `08-BACKEND-CONTRACTS.md`, and `evidence/CURRENT-UI-INVENTORY.md`.
- Current customer routes: `/`, `/customer-landing`, `/vehicles`, `/booking`, `/sign-in`, `/customer`, `/payment-details`, `/customer/profile`, and `/contact`, plus shared notifications and root loading/error/404 surfaces.
- Current server/domain sources: `GET /api/vehicles`, `POST /api/vehicle-finder`, `GET /api/booking-master-data`, `GET/POST /api/bookings`, `GET/POST /api/requirements`, `GET/POST /api/payments`, authentication/profile APIs, notification APIs, `vehicle-finder.ts`, `finder-booking.ts`, `booking-reads.ts`, `payment-integrity.ts`, and `rental-projection.ts`.

## Screen and state inventory

| Customer screen / state | Current or target capability | Class | Reference or disposition | Canonical evidence / boundary |
| --- | --- | --- | --- | --- |
| Home / initial discovery | `/` and duplicate `/customer-landing` | A | `art-directions/DIRECTION-E/HOME/home-desktop-1440.png` | Initial discovery uses only rental start/end; later Finder refinement is optional. |
| Find a Car — evaluated Finder results | `/vehicles`; `POST /api/vehicle-finder` | A | `art-directions/DIRECTION-E/FIND-CAR/find-car-desktop-1440.png` | Period/readiness/capacity/budget claims require a current canonical Finder evaluation. |
| Find a Car — direct browse | `/vehicles`; `GET /api/vehicles` | C | Apply the accepted results grid without Finder reason/availability language. | Active fleet data is not period availability or maintenance readiness. |
| Vehicle detail / selection — desktop | Target selection capability; current card hands directly to `/booking` | B | `implementation-references/customer/VEHICLE-DETAIL/vehicle-detail-desktop-1440.png` | Supported from active-vehicle list data; no single-vehicle API/route currently exists. |
| Vehicle detail / selection — mobile | Same capability | B | `implementation-references/customer/VEHICLE-DETAIL/vehicle-detail-mobile-375.png` | Gallery, facts, explanation, and CTA materially recompose on a phone. |
| Rental request — trip/request details desktop | Replacement of the current `/booking` form | B | `implementation-references/customer/RENTAL-REQUEST/rental-request-details-desktop-1440.png` | Required: selected vehicle, active pickup/return branches, pickup/return instants, purpose, and pickup/delivery method; delivery requires both locations. Destination and preferred seats are optional. |
| Rental request — trip/request details mobile | Same capability | B | `implementation-references/customer/RENTAL-REQUEST/rental-request-details-mobile-375.png` | The form becomes a single reading path with an in-flow summary and reachable action. |
| Rental request — review / submit | Same capability; absent as a dedicated current step | B | `implementation-references/customer/RENTAL-REQUEST/rental-request-review-desktop-1440.png` | Customer-only idempotent `POST /api/bookings`; submission creates `Submitted`, not confirmation. |
| Request submitted / requirements needed | Booking detail current action | A | Direction E Requirements reference plus accepted action/waiting composition rules | The accepted Requirements image establishes the next-step handoff and locked Payment. |
| Requirements — before you start / upload / review / send | `GET/POST /api/requirements` | A | `art-directions/DIRECTION-E/REQUIREMENTS/requirements-desktop-1440.png` | Exactly Valid Government ID and Driver's License; JPEG/PNG/PDF up to 10 MiB; only current versions count. |
| Requirements under review / no action needed | Booking detail state | A | `visual-concepts/CUSTOMER-BOOKING-WAITING/booking-waiting-desktop-1440.png` for hierarchy/state behavior; Direction E governs styling and terminology | `Pending Review`; Payment remains locked. Older image copy/branding is not a data authority. |
| Requirements need correction/resubmission | Booking detail and Requirements correction | A | `visual-concepts/CUSTOMER-BOOKING-ACTION/booking-action-required-desktop-and-mobile.png` for action-first behavior; Direction E governs styling and terminology | Only canonically flagged document types may be replaced; customer-facing reason is required. |
| Requirements verified / payment action required — desktop | Consolidated Booking Detail payment stage; current `/payment-details` | B | `implementation-references/customer/PAYMENT/payment-action-desktop-1440.png` | Payment is allowed only at requirement status `Verified`; method, positive amount, reference, and proof are required. |
| Requirements verified / payment action required — mobile | Same capability | B | `implementation-references/customer/PAYMENT/payment-action-mobile-375.png` | Form, policy callout, upload target, and action materially recompose on a phone. |
| Payment under review / waiting | Consolidated Booking Detail payment stage | B | `implementation-references/customer/PAYMENT/payment-waiting-desktop-1440.png` | `Pending Verification`; manual Owner/Admin review; no confirmation claim. |
| Payment needs correction/resubmission | Same payment stage | C | Reuse action-required pattern with canonical payment reason and `Resubmit payment information`. | `Needs Resubmission`; a new current proof is created. Layout does not materially differ from the accepted action-required pattern plus PaymentSubmission. |
| Payment verified but booking not yet confirmed | Booking Detail waiting state | C | Reuse waiting pattern; state `Payment verified — booking confirmation is next`. | Confirmation still requires assignment, Verified requirements/payment, conflict checks, and Owner/Admin action. |
| Booking confirmed | Booking detail canonical milestone | B | `implementation-references/customer/CONFIRMED/booking-confirmed-desktop-1440.png` | Persisted booking status `Confirmed`; show only assigned vehicle and request/schedule/service facts returned to the customer. |
| Pickup/delivery information | Confirmed booking detail | C | Part of Booking confirmed / TripSummary; no independent screen. | Schedule, branches, service method, and delivery locations are request facts; no persisted `Ready` state. |
| Active rental | Booking detail canonical rental projection | B | `implementation-references/customer/ACTIVE-RENTAL/active-rental-desktop-1440.png` | Derived when `started_at` exists and `ended_at` is null; safe customer rental fields are limited to ids, scheduled dates, start/end, and active flag. |
| Return due / overdue awareness | Active rental variation / notifications | C | StatusCallout variation; no separate image. | Reminder and schedule comparison may indicate due/overdue; no penalty amount or late-fee algorithm may be shown. |
| Returned | Booking detail derived return state | B | `implementation-references/customer/RETURNED/returned-desktop-1440.png` | Derived from `rental.ended_at`; does not mean settlement, completion, or full payment. |
| Settlement pending | Proposed legacy/manuscript milestone | D | Excluded. | No settlement record, charge calculation, mutation, or safe derived state exists. |
| Completed / fully settled | Proposed legacy/manuscript milestone | D | Excluded. | Return leaves the booking `Confirmed`; no persisted Completed state exists. |
| My Bookings — list / current work | Target replacement for the combined `/customer` dashboard | B | `implementation-references/customer/STATES/my-bookings-desktop-1440.png` | `GET /api/bookings` returns the customer's records newest first with vehicle/branch/schedule and safe rental projection. Requirements/payment must be joined through their existing reads. |
| Booking/request history | Target My Bookings list | E | Consolidated into the My Bookings reference; returned/cancelled/rejected records use status-specific list rows. | There is no separate canonical history dataset; current `pastCustomerBookings` is always empty. |
| Booking Detail / macro lifecycle | Target source-of-truth surface replacing stacked `/customer` modules | A | Accepted Direction E Requirements lifecycle plus accepted action/waiting references | `Request → Requirements → Payment → Confirmation → Rental → Return`; target detail route is not yet implemented. |
| Customer sign-in | `/sign-in` and booking authentication interruption | B | `implementation-references/customer/STATES/customer-sign-in-desktop-1440.png` | Email/password; active-principal resolution; role-aware destination; booking context can be preserved. |
| Customer registration | Sign-up mode in the same authentication surface | B | `implementation-references/customer/STATES/customer-registration-desktop-1440.png` | Full name, phone, email, password of at least 8 characters; email-confirmation-required is a supported response. |
| Email confirmation required | Registration result variation | C | Inline success/info callout in the registration shell. | API may return `requiresEmailConfirmation: true`; no separate verification workflow route exists. |
| Authentication interruption during request | Rental request submission precondition | E | Consolidated into sign-in/registration shell with explicit `Continue your rental request` context. | Existing search/handoff can be preserved through authentication. |
| Customer Profile | `/customer/profile`; `GET/PATCH /api/auth/profile` | C | Apply Direction E labelled-form, summary, validation, and save-feedback rules. | Canonical editable name, phone, and structured address; email is immutable in this surface. |
| Customer Notifications | Current panel inside `/customer`; target header/center | C | Apply Direction E list, unread, empty, loading/error, and preference rules. | Recipient-scoped list, mark-read, and email-preference update are canonical; links are currently coarse. |
| Contact | `/contact` | C | Informational two-column/open layout; no separate image. | Only verified contact details and supported `mailto:`/`tel:` actions are valid. |
| Contact message form / simulated success | Current `/contact` form | D | Excluded. | No delivery mutation/provider exists; timer-based success is fabricated. |
| Empty vehicle browse/filter results | Find a Car variation | C | Open empty treatment within the accepted grid footprint; `Clear filters` where valid. | Must not claim an API error means no inventory. |
| Finder insufficient/no-match results | `FinderNoMatch` | C | Open result explanation beneath trip summary; criterion-edit action. | Preserve `CAPACITY`, `BUDGET`, `PERIOD_AVAILABILITY`, or `GENERAL`; never silently relax criteria. |
| No bookings | My Bookings variation | C | Centered short empty state with `Find a Car`; no decorative illustration required. | Valid when customer booking array is empty. |
| No notifications / no submitted payment / no documents | Contextual empty variations | C | Use state-specific copy in the owning section. | These are content variations, not materially different page layouts. |
| Generic route/API loading | Shared shell and owning content geometry | C | Reserved image/card/form skeletons and one polite contextual status. | Avoid spinner-only full pages where geometry is known. |
| Generic route/API error | Shared shell and owning content geometry | C | Inline alert with failed action and safe retry; preserve valid data. | Root error/404 may use the same typography/action hierarchy. |
| Finder stale selection / changed provenance | Rental request variation | C | Warning callout with refresh recommendations or ordinary-selection explanation. | Canonical booking submission returns mismatch/stale errors; no silent relaxation. |
| Duplicate authenticated landing | `/customer-landing` | E | Consolidate with Home plus authenticated header state. | It duplicates `/` and has no distinct server-backed capability. |
| Top-level Payment module | `/payment-details` | E | Consolidate into the selected booking's Payment stage. | Payment is contextual to one booking and requirements prerequisite. |
| Combined customer dashboard | `/customer` | E | Replace with My Bookings plus per-booking detail and contextual Notifications/Profile access. | Current page mixes all bookings, newest-only requirements, payments, and notifications without a booking source of truth. |
| Direct editable booking start | Header `Booking` link/current `/booking` | E | Consolidate into Find a Car → Vehicle Detail → Rental Request. | Prevent competing start paths and unintended vehicle reselection after selection. |
| Ratings, reviews, favorites, discounts, urgency/scarcity | No current canonical contract | D | Excluded from every reference. | Static/marketing or absent data cannot be promoted to product behavior. |
| Live GPS, emergency tooling, extension request | No current canonical contract | D | Excluded from Active Rental. | Fleet/rental records do not provide these customer capabilities. |
| Cancellation/refund, late-fee calculation, final charges | Incomplete or static policy evidence only | D | Excluded from actionable references. | No complete canonical customer mutation/calculation contract exists. |

## Generation decision

The accepted set already resolves Home, evaluated results, Requirements, the macro lifecycle, and the two fundamental action-versus-waiting compositions. New standalone references are limited to surfaces that materially introduce a new page structure, form structure, or lifecycle action:

1. Vehicle Detail — desktop and mobile.
2. Rental Request details — desktop and mobile.
3. Rental Request review/submit — desktop.
4. Payment action required — desktop and mobile.
5. Payment waiting — desktop.
6. Booking confirmed — desktop.
7. Active rental — desktop.
8. Returned — desktop.
9. My Bookings list — desktop.
10. Customer sign-in — desktop.
11. Customer registration — desktop.

This yields **14 new standalone references**: eleven desktop and three mobile. Small state variations remain design-system-driven rather than screenshot-driven.
