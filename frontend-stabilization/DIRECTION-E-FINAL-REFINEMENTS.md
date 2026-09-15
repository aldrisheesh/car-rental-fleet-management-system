# Direction E Final Refinements

**Issue:** GitHub #63

**Branch:** `stabilization/frontend-rebuild`

**Scope:** Lead-authorized customer presentation refinements only; no application implementation

## Lead decisions applied

- Preserved Direction E — Premium Familiar Mobility as the approved customer direction.
- Kept the refined evergreen/neutral palette, premium attainable-vehicle photography, restrained serif display typography, readable sans-serif task typography, familiar controls, restrained surfaces, and location-neutral product shell.
- Reduced Home's first interaction to the minimum trip context and kept recommendation criteria available later through progressive disclosure.
- Separated a submitted rental request from a canonically confirmed booking in customer-facing copy.
- Kept Requirements after canonical request/booking-record creation and before Payment.
- Removed the internal-looking reference ID from the primary Requirements hierarchy.
- Kept direct fleet browsing discoverable without placing a competing link beneath the hero CTA.
- Integrated the optional-refinement hint into the Home search surface and removed the detached helper line.
- Left Requirements, Find a Car, Admin, and mobile artifacts unchanged in the final freeze pass.

## Customer lifecycle terminology

| Context | Previous wording | Revised wording | Reason |
| --- | --- | --- | --- |
| Macro journey | `Booking → Requirements → Payment → Confirmation → Rental → Return` | `Request → Requirements → Payment → Confirmation → Rental → Return` | The initial canonical record represents a request, not confirmation. |
| Completed first stage | `Booking completed` | `Request submitted` | Submission confirms receipt of the request only. |
| Pre-confirmation object | `Booking` / `Booking summary` | `Rental request` / `Your rental request` / `Continue your request` | Customer language must not overstate lifecycle state. |
| Later canonical outcome | Ambiguous use of booking language | `Booking confirmed` / `Confirmed booking` only after canonical confirmation | Confirmation remains a distinct later milestone after requirements verification and payment review. |

The final customer-facing presentation is:

`Find a car → choose vehicle / trip → submit rental request → complete requirements → Briah reviews requirements → requirements verified → submit required payment → payment review → booking confirmation → rental → return`

## Homepage progressive disclosure

Removed from the initial Home interaction:

- passenger count;
- maximum total base-rental budget;
- vehicle preference/category.

Retained in the initial Home interaction:

- Rental start;
- Rental end;
- one dominant `Find cars` action.

Pickup area/branch is not shown because it is not a current canonical Finder criterion. `src/lib/vehicle-finder.ts` defines requested start/end, passenger count, maximum budget, optional preferred category, and optional destination as the Finder input; there is no branch field, and `findVehicles()` does not filter or rank by branch. `src/routes/api.vehicle-finder.ts` validates that same contract. Branch is returned only as vehicle metadata and is required later by rental-request creation, not Finder evaluation.

Optional recommendation criteria now appear on Find a Car/results through the existing trip summary, category controls, and `Filters` entry. Home includes the quiet explanatory text `Want a better fit? Narrow by passengers, budget, and vehicle preference in your results.` inside the search surface, visually tied to the date controls but not styled as a link or CTA. The white panel remains compact.

## Recommendation capability preserved

The customer-side Finder remains available; it is revealed when it becomes useful instead of front-loading a questionnaire. Home establishes dates and starts discovery. Find a Car/results can then invite customers to narrow results by canonically supported passenger count, maximum total base-rental budget, and vehicle preference/category.

Customer copy names the outcome: `Find the right car for your trip`, `Cars that fit your trip`, `Narrow your results`, and `Help me find a better fit`. `Smart Vehicle Finder` and `Customer-Side Vehicle Recommendation` remain technical/manuscript terms only. No AI, intelligence, algorithm, engine, or match percentage is exposed.

The existing Find a Car desktop reference was reviewed and intentionally retained. Its Filters control and supported trip criteria already demonstrate optional refinement, so a new image was not needed.

## Requirements hierarchy refinement

The Requirements screen retains the approved task flow:

`Before you start → Upload documents → Review → Send for verification`

The macro journey above it now starts with `Request submitted`, makes Requirements visibly current, and keeps Payment visibly later and locked. The right-side `Rental request` summary prioritizes Toyota Vios, rental dates, pickup branch, and `Current stage: Requirements`.

The prominent `CR-2026-104` reference was removed from the breadcrumb and primary summary. If a customer-facing reference remains canonically useful, it belongs only in low-priority request/booking details or help/support context.

## Browse-all refinement

The detached `Browse all cars` link beneath the hero CTA was removed. Direct fleet browsing remains discoverable through the persistent `Find a Car` item in primary navigation. A future later-page `Browse vehicles` or `View all vehicles` action is acceptable only when composed within a relevant vehicle section and subordinate to the hero's `Find cars` action.

## Backend/domain boundaries preserved

- Request/booking record creation timing was **not changed**.
- Requirements still follow creation of the canonical request/booking record.
- Requirements-before-payment remains unchanged.
- Briah review and requirements verification remain before required payment submission.
- Confirmation remains a later stage after payment review.
- The frontend may continue relying on the existing canonical booking/request record internally.
- No schema, API, route, status, business-rule, eligibility, ordering, recommendation, payment, or verification change was made.

## Visual artifacts updated

Regenerated in this final freeze pass from the approved Direction E reference and normalized to 1440 × 960:

- `art-directions/DIRECTION-E/HOME/home-desktop-1440.png`

Not regenerated:

- Requirements — the existing reference already shows `Request submitted`, current Requirements, locked Payment, future Confirmation, the approved task flow, and no prominent reference ID.
- Find a Car — the existing desktop reference already demonstrates optional refinement.
- Mobile — the desktop corrections do not reveal an undocumented responsive conflict.
- Admin — outside this refinement scope.

## Self-critique gate

### Home

- Pass — the renter sees two date fields and one clear `Find cars` action.
- Pass — passenger count, budget, and preference no longer block initial exploration.
- Pass — quiet helper copy and the Find a Car results pattern keep recommendation discoverable.
- Pass — the primary CTA is visually dominant and has no detached competing link.
- Pass — the automotive photograph, serif/sans hierarchy, whitespace, and evergreen/neutral language preserve the premium character.

### Requirements

- Pass — `Request submitted` is visibly distinct from later `Confirmation`.
- Pass — Requirements is clearly the current macro stage and Upload documents is the current task step.
- Pass — Payment is later, locked, and explained by the review sequence.
- Pass — the internal-looking reference ID is absent from the primary hierarchy.
- Pass — the upload task and `Review documents` action remain dominant.

### System

- Pass — changes preserve Direction E rather than introduce a new art direction.
- Pass — all changes are presentation/documentation-only.
- Pass — no visual copy implies a changed backend lifecycle, instant confirmation, or payment before requirements verification.

## Final freeze status

**FROZEN FOR CUSTOMER IMPLEMENTATION**
