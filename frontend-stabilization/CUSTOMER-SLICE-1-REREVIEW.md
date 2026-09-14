# Customer Slice 1 Re-review

## Commits reviewed

- Branch: `stabilization/frontend-rebuild`
- Original Slice 1 implementation: `e01aa0254ac9fa5082cb4a5e28065f414737cc50`
- Prior review document: `e9e9e5671ea9910bcd5d8da8a1f8bf95b6027b00`
- Defect-fix commit: `f9aa1d1f8becbd20cd2bb4ece4d6126cf510bdb9`
- Current `HEAD` and `origin/stabilization/frontend-rebuild` matched `f9aa1d1f8becbd20cd2bb4ece4d6126cf510bdb9` after fetch.
- `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f`.
- The working tree was clean before this document was created. No application source was changed during this re-review.

The review used the required image-to-code, frontend-design, ui-ux-pro-max, and web-design-guidelines review lenses. Scope remained `/`, `/vehicles`, `/vehicles/:vehicleId`, `/sign-in`, `/booking`, `/bookings/:bookingId`, and their Slice 1 support code.

## Prior defect regression results

All five previously confirmed defects remain fixed:

1. `/vehicles` computes a three-column desktop grid, two columns from 600–900px, and one column below 600px. The 768px headed check showed the two-column tablet composition.
2. Requirements task progress names the current task, preserves all labels in the mobile disclosure, and exposes `aria-current="step"` on the current task representation.
3. Requirements upload targets retain native file inputs and now expose visible `:focus-within` treatment. The headed requirements check found labelled, keyboard-usable `Choose a file` controls.
4. Header role handling now distinguishes anonymous, `Customer/Renter`, `Operations Staff`, and `Owner/Admin`. Operations Staff receives the permitted Admin workspace path; Owner-only access remains guarded by `canAccessAdminPath`.
5. Rental Request review resolves and displays canonical pickup and return branch names, service method, and conditional delivery addresses. Edit/back preserved the entered values and the source payload remains unchanged.

## Visual fidelity

Headed Chromium comparisons were run at 1440, 1024, 768, and 375px for the principal Home, Find a Car, vehicle-detail, rental-request, and authentication states. Requirements was also exercised at 1440 and 375px with a scoped authenticated test context. Typography, palette, open-surface treatment, hierarchy, control geometry, truthful image fallback, and mobile recomposition generally follow Direction E.

A material mismatch was confirmed in evaluated Find a Car results. The accepted Direction E Finder reference establishes a compact criteria summary, category/filter rail, and image-first result grid. The current evaluated route instead renders a simple dates/passengers/budget summary, an expanded six-field refinement form, a raw `12000 maximum budget` value, and no evaluated-result category/filter rail. `FinderResults` renders only the heading, metadata, and vehicle grid (`src/routes/vehicles.tsx`); this is not caused by unavailable backend imagery.

Requirements also has a non-blocking manuscript mismatch: the accepted reference calls the section `Upload documents` and uses a `What happens next` callout, while the implementation uses `Required documents` and `Before you start`. The state-specific `Request submitted` message is truthful for the tested submitted booking.

## Backend integration

The scoped implementation uses the canonical:

- `GET /api/vehicles`
- `POST /api/vehicle-finder`
- `GET /api/auth/sign-in` flow through `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/session`
- `/api/booking-master-data`
- `GET/POST /api/bookings`
- `GET/POST /api/requirements`

Live checks returned the active fleet from `/api/vehicles` and Finder recommendations with canonical reasons from `/api/vehicle-finder`. Finder failure showed an unavailable state without fabricated cards; no-match showed the returned factors without silently relaxing criteria. Direct browse did not show period availability, readiness, or Finder reasons. Operational values in the scoped routes originated from API data, authenticated state, validated route/search state, user input, or explicit unavailable/error fallbacks. No mock operational dataset was found in the scoped implementation.

## Routing/context preservation

Vehicle detail resolves the route ID against the active vehicle collection, works on direct deep-link/reload, and remains neutral when opened without evaluated Finder context. Evaluated detail shows Finder reasons only with valid evaluated URL context. Finder URL state survived reload and browser Back.

The headed request flow preserved vehicle, dates, passengers, budget, category, and destination through the anonymous authentication interruption. Mocked sign-in continuation reached `/booking` with those values intact; mocked registration displayed the email-confirmation-required state without claiming authentication. Unsafe external `returnTo` was ignored, and continuation destinations are limited to `/booking` or `/bookings/*` before role-aware fallback destinations. Booking review/edit, stale/conflict handling, and idempotency paths are supported by the inspected implementation and passing domain tests.

## Requirements binding

The exact `/bookings/:bookingId` context is preserved. The route reads the booking collection, selects `find(candidate.id === bookingId)`, and calls `/api/requirements?bookingId=<exact id>`. Upload, submit, and resubmit multipart forms include the same route parameter. Server-side requirements access enforces customer ownership and the requirement set is resolved by booking identity. No first-booking, newest-booking, implicit-current-booking, or customer-global fallback was found in this route.

The headed authenticated route check confirmed the exact query string, canonical `Valid Government ID` and `Driver's License` labels, disabled review action until both files exist, locked Payment messaging, mobile task disclosure, and no horizontal overflow.

## Responsive verification

No whole-page horizontal overflow was observed in the headed 1440, 1024, 768, or 375px checks for the principal Slice 1 routes. The repaired vehicle grid is 3/2/1 at the required desktop/tablet/mobile widths. Forms, summaries, long branch values, Finder no-match/error states, mobile navigation, and the rental request action remained reachable. A practical 200% zoom proxy at a 720px CSS viewport also produced no document overflow.

The Requirements mobile task progress condenses to a current-step summary while retaining the full labelled list in the disclosure. The file controls remain labelled and reachable. A full screen-reader audit was not claimed.

## Accessibility verification

Observed or statically verified: skip link and landmarks; heading hierarchy; semantic links/buttons; persistent form labels; fieldset/legend grouping; error summary focus after invalid submission; `aria-invalid`/`aria-describedby`; task-step `aria-current`; native file-input use and visible compound-control focus; password visibility controls, autocomplete, and paste-compatible inputs; reduced-motion rules; explicit image dimensions and accessible unavailable-image fallbacks; no color-only status meaning; and generally reachable 44px-class actions.

The skip-link overlay observed during initial keyboard focus is expected accessible behavior: it transitions into view, targets `#main-content`, and does not remain as a content obstruction. It is not classified as a defect.

A confirmed navigation-state defect remains: on `/bookings/:bookingId`, the shared Header renders no active navigation item because `My Bookings` is linked only to `/customer`. The accepted Requirements reference and the frozen navigation contract require the current customer section to retain an active weight/underline cue. This is also an orientation loss for keyboard and visual users.

## Regression verification

Relevant auth, Finder, booking/request, master-data, requirements, and rental-projection tests passed. Admin role authorization tests passed, including permitted Operations Staff paths and denied customer access. No backend, schema, business-rule, Admin, or unrelated legacy source changes were introduced by the reviewed commits.

The older `/customer` route still contains a first-booking requirements widget, and `VehicleCard` retains an optional legacy static-data fallback for compatibility. These were unchanged, are outside the six-route Slice 1 surface, and did not supply operational data to the reviewed Slice 1 API-driven paths; they remain observations rather than Slice 1 defects.

## Tests/build

- Selected Slice 1 test command: **61 passed, 0 failed**.
- Scoped ESLint: **passed**.
- Scoped Prettier check: **passed**.
- `npm run build`: **passed**; only existing dependency `"use client"` directive warnings were emitted.
- `git diff --check 8c10c234a79383fb534d23f69adcd40fc8d3d699..HEAD`: **passed**.
- Full `npm run lint`: failed on existing repository-wide Prettier errors outside the scoped Slice 1 files; classified as **Existing unrelated baseline issue**.
- Full `npx tsc --noEmit`: reported existing Admin/operational/API baseline errors; no Slice 1 files appeared in the reported failures; classified as **Existing unrelated baseline issue**.

## Findings / observations

### 1. Evaluated Finder does not match the accepted results composition

- Classification: **Confirmed defect**
- Evidence: accepted `art-directions/DIRECTION-E/FIND-CAR/find-car-desktop-1440.png`, `DIRECTION-E-DESIGN-SYSTEM.md` Finder summary/filter requirements, headed 1440 comparison, and `src/routes/vehicles.tsx` `FinderResults` implementation.
- Expected: compact URL-backed trip/refinement summary, accepted category/filter rail, and the image-first evaluated result grid.
- Actual: simple summary plus expanded refinement form, raw budget presentation, and no evaluated-result category/filter rail.

### 2. `/bookings/:bookingId` does not mark My Bookings active

- Classification: **Confirmed defect**
- Evidence: headed Requirements screenshot/DOM and `src/components/site/Header.tsx`, where `My Bookings` remains linked only to `/customer`; accepted Requirements reference shows the My Bookings active cue.
- Expected: the per-booking customer task route retains the My Bookings active navigation state.
- Actual: no customer navigation item is active on the Requirements route.

### 3. Requirements wording differs from the accepted manuscript

- Classification: **Manuscript mismatch**
- Actual wording is `Required documents` / `Before you start`; the accepted Requirements reference and implementation reference use `Upload documents` / `What happens next`.
- The mismatch does not change the API contract or upload gating, but it should be reconciled before visual sign-off.

### 4. Direct-browse category filter is local-only

- Classification: **Observation**
- Category filtering works and is keyboard operable, but selecting a category leaves the URL at `/vehicles` and reload resets it to all cars. Finder criteria themselves are URL-backed. The frozen contract says filter state should be URL-addressable where feasible; this is recorded without elevating it to a confirmed defect.

### 5. Legacy boundaries remain visible in supporting code

- Classification: **Observation**
- `/customer` retains the older first-booking requirement widget and `VehicleCard` retains an optional static-data compatibility type. Neither was used as an operational data source by the reviewed Slice 1 paths.

## Review result

**SLICE 1 NEEDS FIXES BEFORE SLICE 2**

The prior five defects pass regression. Slice 2 must not begin until the two confirmed re-review defects are corrected and the accepted Finder/Requirements visual composition is re-verified.
