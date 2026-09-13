# Direction E Final Review

**Status:** Superseded by `DIRECTION-E-FINAL-REFINEMENTS.md` for the final customer terminology and progressive-disclosure corrections.
**Review date:** 2026-09-13
**Scope:** Customer visual references and proposed visual implementation contract only
**Branch:** `stabilization/frontend-rebuild`

## Skills loaded

- **frontend-design** — loaded fully. Used to keep the final direction specific to rental and automotive subject matter, make the recommendation task—not decorative copy—the Home focal point, preserve the serif/sans discipline, and remove template and location-slogan signals.
- **ui-ux-pro-max** — loaded fully. Used for system consistency, labelled forms, direct-browse escape, marketplace scanability, responsive breakpoints, 4/8 px spacing, 44 px targets, visible focus direction, non-color status cues, and error/empty/loading requirements. Its generated glass/gold/liquid-glass suggestions were rejected as inconsistent with the frozen Direction E brief.
- **web-design-guidelines** — loaded fully, and its latest upstream rules were fetched on 2026-09-13. Used to review labels, semantic-control direction, keyboard/focus expectations, heading order, image dimensions, async feedback, reduced motion, and stateful search/filter URL guidance.
- **image-to-code** — loaded fully. Used for image-first regeneration, one standalone image per screen, original-resolution inspection, design-system extraction, consistent cross-screen art direction, hero restraint, and the anti-nested-box gate. Its implementation phase was intentionally not used because application implementation is forbidden.
- **imagegen** — loaded fully as the required bitmap-production workflow. The built-in generator created the three accepted refinements from the existing Direction E references; accepted outputs were inspected and normalized to 1440 × 960.

## Lead refinements applied

1. Removed permanent Antipolo identity from the reusable visual language.
2. Preserved Briah's Car Rental as the current operator identity.
3. Kept `Antipolo branch` only where it is example operational data.
4. Rebuilt Home around the working task `Find the right car for your trip`.
5. Made guided discovery primary and `Browse all cars` secondary but visible.
6. Limited Finder controls and result explanations to verified implementation contracts.
7. Replaced prominent technical/algorithm language with plain customer language.
8. Preserved the approved marketplace grid and Requirements flows without reopening product behavior.

## Reusable product-shell rule

Direction E has three deliberately separate layers:

| Layer | May contain | Must not become |
|---|---|---|
| Business identity | Operator name, approved logo, approved brand colors, legitimate contact details | A city identity or invented business data |
| Operational data | Branch, pickup/return location, vehicle, dates, rate, booking reference | Permanent decoration or a location slogan |
| System visual language | Layout, typography, controls, navigation, spacing, lifecycle, status, recommendation and task flows | Hard-coded landmark, skyline, branch, or city styling |

The operator identity can be replaced at presentation level while the layout remains credible. This rule does not introduce multi-tenancy, white-label infrastructure, theme-management architecture, or business-management features.

## Location treatment

Removed from all final references:

- `Antipolo and beyond`;
- handwritten Antipolo branding;
- Antipolo skyline, church, landmark, and hillside illustrations;
- permanent city-name headings;
- city-specific photographic backdrops and decorative location claims.

May remain when supplied as canonical operational data:

- branch name;
- pickup location;
- return location;
- destination/travel-area context;
- vehicle, dates, and booking facts associated with a location.

The Find a Car cards and Requirements booking summary therefore retain `Antipolo branch` as example data. Home uses a neutral road/travel image with no identifiable location.

## Customer recommendation integration

### Internal/technical feature identity

Repository and manuscript material call the capability `Smart Vehicle Finder` or `Customer-Side Vehicle Recommendation`. These names remain useful for technical traceability only.

### Customer-facing terminology

- Entry task: `Find the right car for your trip`
- Primary action: `Show cars that fit`
- Evaluated-results heading: `Cars that fit your trip`
- Direct path: `Browse all cars`
- Results edit action: `Change trip`

The final customer references contain no Smart, AI, ML, engine, or percentage-match terminology.

### Supported criteria verified from implementation

Verified against `src/lib/vehicle-finder.ts`, `src/lib/vehicle-finder.server.ts`, `src/routes/api.vehicle-finder.ts`, `src/routes/vehicles.tsx`, `codex-context/23-smart-vehicle-finder.md`, and `frontend-stabilization/08-BACKEND-CONTRACTS.md`:

| Criterion | Contract | Home treatment |
|---|---|---|
| Rental start | Required valid Manila-local date-time; not in the past within the canonical tolerance | Included as `Rental start` |
| Rental end | Required valid Manila-local date-time; after start | Included as `Rental end` |
| Passenger count | Required whole number from 1–100 | Included as `Passengers` |
| Maximum budget | Required positive maximum **total base-rental** budget | Included as `Maximum budget`, with `total` made explicit |
| Preferred category | Optional and limited to an active canonical vehicle category | Included as optional `Vehicle preference` |
| Destination/travel area | Optional, maximum 200 characters; preserved for requirements/handoff but does not affect baseline eligibility or rank | Omitted from compact Home Finder to avoid implying a matching effect |

Pickup area/branch is not a current Finder criterion and is not shown as one. Branch remains available as operational vehicle/booking data elsewhere.

### Recommendation result behavior

A vehicle is eligible only when it is active, maintenance-ready, free of an overlapping Confirmed assigned booking or scheduled rental for the requested period, has known sufficient capacity, and has a known base rate whose estimated total is within the maximum budget.

Eligible vehicles are ordered deterministically by preferred-category match, least excess capacity, lower estimated base-rental cost, then stable name/ID tie-break. There is no arbitrary score. Destination does not affect this baseline order.

A result is not a reservation. Current eligibility must be refreshed and Finder-origin booking provenance is revalidated by the canonical booking server.

### Reason/explanation rules

Customer UI may render only reasons returned or directly proven by the current canonical evaluation:

- `Available for your selected dates`
- `Seats your group of {passengerCount}`
- `Within your maximum base-rental budget`
- `Maintenance-ready`
- `Matches your {category} preference`
- `Suitable alternative to your {category} preference`

The final Find a Car reference shows only one quiet reason per card to preserve scanability. It does not invent a percentage, AI endorsement, or unsupported availability state. No-match UI must preserve the canonical `CAPACITY`, `BUDGET`, `PERIOD_AVAILABILITY`, or `GENERAL` factors and give a truthful recovery path without silently relaxing hard requirements.

## Home final review

Home was substantively regenerated because the previous concept did not integrate the implemented recommendation capability and depended on permanent Antipolo identity.

The accepted visual keeps one strong photographic moment, a two-line serif task heading, a short explanatory sentence, five persistently labelled controls, one dominant evergreen action, and a visible direct-browse link. The form bridges copy and vehicle photography without becoming a nested panel stack. The four-step `How renting works` section is compact, below discovery, and ends with `Pay after verification`.

The output is readable at original resolution and after normalization to 1440 × 960. The first viewport communicates the task, criteria, action, and vehicle context without location branding or marketing clutter.

## Find a Car final review

Find a Car was regenerated only to apply the reusable-shell rule and truthful recommendation presentation. Its approved grid, categories, rate/identity hierarchy, supported vehicle facts, operational branch row, Filters control, and one action per vehicle remain intact.

The prior Antipolo-specific heading, skyline, handwritten mark, and city photographic backdrop are gone. `Cars that fit your trip` appears only in a Finder-results context, the trip summary reflects canonical eligibility inputs, and the card explanations use exact canonical reason types. The screen contains no ratings, discounts, favorites, urgency, arbitrary score, or AI label.

## Requirements final review

Requirements received a constrained regeneration, not a flow redesign. It preserves:

- the overall journey `Booking → Requirements → Payment → Confirmation → Rental → Return`;
- the task flow `Before you start → Upload documents → Review → Send for verification`;
- Valid Government ID and Driver's License upload targets;
- the review-before-payment explanation;
- one dominant `Review documents` action;
- the vehicle-led booking summary.

The summary's former skyline and handwritten Antipolo art are removed. `Pickup: Antipolo branch` remains as booking data. Complete, current, locked, and pending states use icons and words rather than color alone.

## Reusability review

Pass.

- Branch/location is treated as data.
- Operator name/logo/contact are replaceable presentation inputs.
- Photography and icons describe driving, vehicles, booking, documents, and payment rather than a city.
- Layout and component hierarchy remain credible for a similar rental operator.
- No multi-tenant, white-label, settings, or theme-management feature is implied.

## Accessibility review

Pass as a visual specification, with implementation verification still required.

- All form controls have persistent visible labels.
- Primary controls visually meet a 44 px minimum target.
- Heading and reading order are explicit.
- Active/complete/locked states use icon plus words, not color alone.
- Evergreen on white measures approximately 11.68:1; Road Ink on Rice Paper 14.56:1; muted body text on Rice Paper 5.73:1. Success, warning, error, and info tokens selected for normal text all exceed 4.5:1 on white.
- Calamansi (2.61:1 on Rice Paper) is restricted to non-informational lines/accents and never carries text or state.
- Stone dividers are structural only and cannot be the sole indicator of control/state boundaries.

Raster references cannot prove semantics or runtime behavior. Implementation must still verify semantic controls, keyboard order, visible `:focus-visible`, focus not obscured by sticky UI, labelled icon-only controls, inline and focusable error handling, polite async announcements, explicit image dimensions/alt text, reduced motion, 200% zoom, and 375/768/1024/1440 layouts.

## Backend/domain constraints respected

- Finder criteria, eligibility, ordering, reasons, and no-match factors are unchanged.
- Destination is not presented as affecting matching.
- Finder results are not represented as reservations.
- Direct browsing remains valid.
- Recommendation selection still hands off to the canonical booking flow.
- Requirements remain before payment.
- Payment remains locked until requirement verification.
- No automatic approval, instant confirmation, gateway automation, or unsupported availability is implied.
- Booking lifecycle, roles, backend architecture, schema, provider architecture, allocation, forecasting, and maintenance/readiness behavior are unchanged.

## Remaining visual risks

- Final production operator logo/wordmark assets and usage rights still require owner approval; the visual reference uses a typographic Briah's wordmark.
- Production vehicle photography must be owned/licensed and normalized for angle, crop, lighting, and aspect ratio.
- Instrument Sans and Newsreader licensing/loading must be confirmed during authorized implementation.
- Longer real vehicle names, categories, branch names, translated copy, currency values, validation messages, and browser-native date controls require responsive implementation tests.
- The current application still exposes technical Finder terminology in customer UI. The freeze contract resolves the intended copy, but source replacement must wait for implementation authorization.
- Mobile/tablet references were not requested in this pass; the design-system rules define their required recomposition but visual validation remains an implementation-stage task.

None of these risks requires reopening the frozen workflow or regenerating the three reviewed desktop concepts.

## Final recommendation

**DIRECTION E READY TO FREEZE**

The three final references and the accompanying design-system contract are coherent, location-neutral, canonically truthful, and specific enough to guide the separately authorized customer frontend implementation.
