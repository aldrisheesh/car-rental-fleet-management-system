# Customer Slice 1 Review

## Commit reviewed

- Branch: `stabilization/frontend-rebuild`
- Base: `8c10c234a79383fb534d23f69adcd40fc8d3d699`
- Reviewed commit: `e01aa0254ac9fa5082cb4a5e28065f414737cc50`
- Remote verification: local `HEAD` and `origin/stabilization/frontend-rebuild` matched the reviewed commit after `git fetch --prune origin`.
- `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f` across the fetch.
- The working tree was clean before this document was created.

## Scope

Review-only pass for `/`, `/vehicles`, `/vehicles/:vehicleId`, `/sign-in`, `/booking`, `/bookings/:bookingId`, and their Slice 1 shared code. The complete requested pass was stopped when confirmed defects were established, as required by the review instructions. No application source, backend, schema, or business rule was changed.

## Visual fidelity

**Result: Fail (partial review).** The accepted Direction E and customer implementation-reference PNGs were inspected at original resolution. Static implementation comparison found a material tablet grid mismatch and a mobile Requirements-progress mismatch before headed-browser comparison began. Headed visual verification was not run after the mandatory defect stop.

## Backend integration

**Result: Partial pass.** The reviewed paths use the canonical vehicle, Finder, authentication, booking master-data, booking, and requirements APIs. The inspected operational vehicle, booking, Finder-reason, session, branch, and requirement fields came from API responses, validated route/search state, authenticated state, user input, or explicit unavailable fallbacks. No operational mock dataset was found in the inspected Slice 1 paths. Review stopped before exhaustive runtime integration verification.

## Routing/context preservation

**Result: Partial pass.** Vehicle detail resolves the route ID from `GET /api/vehicles` and does not invent a single-vehicle endpoint. Finder reasons are re-evaluated before display, and direct browse does not render Finder reasons. The sign-in search validator rejects non-relative and protocol-relative `returnTo` values, and the continuation code limits accepted destinations to `/booking` or `/bookings/*`. Full browser back/reload, expired-continuation, and role-path execution was not completed after the defect stop.

## Requirements binding

**Result: Pass for the Slice 1 route.** Every inspected customer requirement read, upload, submit, and resubmit uses the explicit `/bookings/:bookingId` route parameter. The UI selects the exact booking with `find(candidate.id === bookingId)` and has no first/newest fallback. `/api/requirements` verifies booking ownership, looks up the requirement set by that booking ID, and passes the same booking/set/customer identity into the upload RPC. The database has a unique requirement set per booking. Payment remains presentation-locked on this Slice 1 screen. Exactly the two canonical API-returned requirement types are rendered.

The older `/customer` route still contains a first-booking requirement widget, but that file was unchanged by the reviewed commit and is outside the new `/bookings/:bookingId` implementation.

## Responsive verification

**Result: Fail.** Static CSS proves the 768px Find a Car layout cannot meet the frozen 2-column tablet requirement. Static CSS also removes all Requirements task-step labels at tablet/mobile widths. Headed checks at 1440, 1024, 768, 375, and 200% zoom were not started after the mandatory defect stop.

## Accessibility verification

**Result: Fail (partial review).** Skip-link, semantic form labels, fieldsets/legends, error summaries, image fallbacks, reduced-motion handling, and general focus rules are present. Confirmed failures were found in Requirements task-state semantics and keyboard focus visibility for the file target. Full keyboard, zoom, obstruction, and screen-reader-oriented browser verification was not run after the mandatory defect stop.

## Tests/build

**Not run.** Scoped tests, lint, formatting check, build, and `git diff --check` were intentionally not executed after confirmed defects triggered the instruction to record and stop. No test/build result is claimed.

## Findings

### 1. Find a Car collapses to one column at the required 768px tablet width

- Classification: Confirmed defect
- Severity: Medium
- Evidence: `DIRECTION-E-DESIGN-SYSTEM.md:515-520` requires a 3/2/1 desktop/tablet/mobile grid. `src/styles.css:2171-2173` initially sets two columns below 1100px, but `src/styles.css:2187` and `src/styles.css:2352-2354` override the grid to one column for every viewport at or below 900px, including 768px.
- Reproduction: Open `/vehicles` at a 768px viewport with vehicle results. The applicable `max-width: 900px` rule computes `.vehicle-grid` as `grid-template-columns: 1fr`.
- Expected behavior: Two vehicle columns at 768px.
- Actual behavior: One vehicle column at 768px.
- Recommended next action: Correct the responsive breakpoint behavior and re-run headed comparison at all four required widths; do not begin Slice 2 until verified.

### 2. Requirements task progress loses its labels and current-step semantics on narrow screens

- Classification: Confirmed defect
- Severity: Medium
- Evidence: `DIRECTION-E-DESIGN-SYSTEM.md:382-390` requires a compact current-step summary plus an accessible disclosure/list on mobile and says labels must not disappear. `src/styles.css:2561-2563` hides the last span in every task-progress item at widths up to 900px. `src/routes/bookings.$bookingId.tsx:273-301` renders the current class visually but never applies `aria-current="step"` to the current task.
- Reproduction: Open a valid `/bookings/:bookingId` Requirements screen at 768px or 375px and inspect the task progress visually and in the accessibility tree.
- Expected behavior: The current task remains named, all task labels remain available through the compact/disclosed presentation, and the current item exposes programmatic current-step state.
- Actual behavior: All four visible task labels are removed at narrow widths, leaving marker numbers only; no task item has `aria-current="step"`.
- Recommended next action: Recompose the narrow task progress per the frozen contract and verify visual and programmatic current-state exposure.

### 3. The keyboard-focused Requirements file input has no visible focus treatment

- Classification: Confirmed defect
- Severity: Medium
- Evidence: `DIRECTION-E-DESIGN-SYSTEM.md:529-540` requires visible focus for every action. `src/components/customer/CustomerPrimitives.tsx:418-433` places the native file input inside the visual label. `src/styles.css:1956-1963` clips that focusable input to 1px, while the `.customer-file-target` rules have a hover state but no `:focus-within` or equivalent visible focus state.
- Reproduction: On a Requirements upload state, use Tab until the native file input receives focus.
- Expected behavior: The dashed file target displays a clearly visible focus ring/boundary change.
- Actual behavior: Browser focus is applied to the visually clipped 1px input and the visible target has no focus styling.
- Recommended next action: Add a visible compound-control focus treatment and verify keyboard selection at 375px and desktop widths.

### 4. The shared customer header misclassifies an authenticated Operations Staff principal

- Classification: Confirmed defect
- Severity: Medium
- Evidence: `src/lib/auth.ts:1-5` defines `Operations Staff` as an application role and `src/lib/auth.ts:47-59` grants that role scoped Admin routes. `src/components/site/Header.tsx:61-67` treats only `Owner/Admin` as Admin and falls through to the text `Sign in` for Staff. `src/components/site/Header.tsx:97-103` then links Staff to `/customer`; `src/components/site/Header.tsx:174-182` omits the mobile Admin workspace link for Staff.
- Reproduction: Load any reviewed public customer route while authenticated as active Operations Staff, then inspect the desktop account action and mobile menu.
- Expected behavior: Staff is represented as authenticated and receives a valid link to its permitted Admin workspace.
- Actual behavior: Desktop labels the authenticated Staff principal `Sign in` and targets the customer area; mobile provides no Admin workspace link.
- Recommended next action: Restore role-aware Staff navigation without changing authorization rules, then regression-test Owner/Admin, Operations Staff, Customer/Renter, and anonymous states.

### 5. Rental-request review omits the selected pickup and return branches

- Classification: Confirmed defect
- Severity: Medium
- Evidence: The accepted Rental Request review contract requires review of supported pickup and return branch facts. `src/routes/booking.tsx:902-914` renders only `Pickup at branch` for pickup mode (or delivery addresses for delivery mode) and optional destination; it does not resolve or display either selected branch even though both branch IDs are required before reaching review.
- Reproduction: Select distinct canonical pickup and return branches on `/booking`, continue to Review & send, and inspect `Branches and handoff`.
- Expected behavior: The review step shows the selected pickup branch, return branch, and service method before submission.
- Actual behavior: The review step shows only the generic service text `Pickup at branch` and omits both selected branch names.
- Recommended next action: Bind the read-only review presentation to the already-loaded canonical branch records and re-test edit/back preservation and submission payloads.

## Review result

**SLICE 1 NEEDS FIXES BEFORE SLICE 2**
