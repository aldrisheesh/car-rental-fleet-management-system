# Admin Slice 2 Final Re-review

## Commits reviewed

- Branch: `stabilization/frontend-rebuild`
- Accepted Admin Slice 1 baseline: `c31d927b5056ccfe7be675ff20aee0a600e774f7`
- Admin Slice 2 implementation: `5f5fdfabe866a076d8dd51f7d615ff853d9ced83`
- Branch-deactivation fix: `ec86794186b1ac75a08a62d06eef5e003677f4b2`
- Prior Slice 2 re-review: `081e07763bf917d8fd6bbffe84dab9b25173f5af`
- Fleet data-integrity fix / reviewed HEAD: `37d5450c36e1409f1a5b99f3d7be60d83fd728d1`

Pre-flight passed. `origin` was fetched; the checked-out branch and `origin/stabilization/frontend-rebuild` both pointed to `37d5450c36e1409f1a5b99f3d7be60d83fd728d1`; the working tree was clean; and `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f`.

This review changed no source, backend, schema, RBAC, or business-rule files. The only intended output is this review document.

## Branch deactivation regression

**Pass.** Desktop and narrow layouts pass the same exact-record flow. Deactivate stores the selected branch record and opens a confirmation dialog containing the exact branch name. Cancel, Escape, and close produce no PATCH. Confirm targets the exact `branch.id`; duplicate submissions are guarded; failed PATCH responses leave canonical state unchanged and surface the error; successful responses update the canonical branch state. Activation remains a direct state change. No DELETE path exists.

## Fleet branch-preservation regression

**Pass.** Branch reassignment targets the exact selected vehicle ID, rehydrates that exact canonical vehicle, and sends a full vehicle PATCH with only `branchId` changed. The preservation helper retains name, category, license plate, transmission, seats, daily rate, active state, fuel type, reference efficiency, image URL, odometer, and `conditionBlocksRentalUse`, including exact null values. Derived readiness is not persisted and remains unchanged apart from legitimate branch context. `api/master-data` PATCH semantics are unchanged.

The dedicated regression suite passed: **8/8**.

## Fleet

**Pass.** Fleet reads the canonical admin-fleet projection and presents canonical vehicle, branch, category, plate, active state, readiness, maintenance summary, and supported allocation/rental context. Ready is derived and never written. Owner/Admin mutations are limited to supported master-data operations; Staff has no Fleet route/API access. Exact vehicle identity is preserved through detail and branch mutation flows. Loading, error, and empty states are explicit; no fabricated metrics or unsafe partial vehicle updates were found.

## Maintenance

**Pass.** The screen uses canonical maintenance records, vehicle identities, readiness calculation, and supported create/PATCH contracts. Open, Completed, and Cancelled behavior is canonical; due and overdue reasons are derived from the authoritative maintenance/vehicle data. Create and transition flows use exact vehicle/maintenance IDs, preserve errors, and respect active-rental and stale-state protections. No unsupported DELETE, predictive maintenance, health score, or persisted Ready behavior was found.

## Branches

**Pass.** Branch fields and assigned-vehicle counts are canonical. Management is Owner/Admin-only, exact branch IDs are used, deactivation uses confirmation, activation remains direct, and mutation failures do not create false state. No staffing, hours, geofencing, delivery-radius, or revenue fields were invented.

## Users / Roles

**Pass.** Users/Roles is Owner/Admin-only and reads canonical accounts. The role set is limited to `Owner/Admin`, `Operations Staff`, and `Customer/Renter`; PATCH targets the exact user ID. There is no unsupported account creation, deletion, profile/settings editor, or invented permission matrix. Server-side authorization is enforced.

## Reports

**Pass.** `/api/admin-reports` supplies the displayed operational metrics. Date and branch filters are validated, use Manila-day bounds, and enforce the supported maximum range. Loading, empty, and error states distinguish unavailable data from true zero. No revenue, profit, payment, export, ranking, or forecast data is fabricated. Reports are available to Owner/Admin and Operations Staff as the canonical read-only surface.

## Decision Support

**Pass for the current Owner/Admin surface.** Forecasts, supply evaluations, vehicle analytics, allocation recommendations, and operational context use canonical supporting records and exact IDs. Advisory language, data basis, uncertainty, and insufficient-data states are present. API failure is distinct from insufficient history. There are no AI/ML/autonomous claims, fabricated confidence values, guaranteed predictions, or autonomous allocation execution. Owner/Admin-only generation, decision, and operational-context mutations are enforced.

## Decision Support RBAC status

**C. AUTHORIZATION / ARCHITECTURE CONFLICT.**

The conflict remains documented in the current code and references:

- `src/routes/admin.decisions.tsx` redirects Operations Staff away from the route.
- `AdminShell` does not expose Decision Support in Staff navigation.
- `GET /api/forecasts`, `GET /api/supply-evaluations`, `GET /api/vehicle-analytics`, and `GET /api/allocation-recommendations` currently allow Staff reads.
- Decision generation, allocation decisions, and operational-context access remain Owner/Admin-only.

This does **not** block acceptance of the current Admin Slice 2 UI because no Staff Decision Support destination or mutation is exposed, and the current approved presentation baseline explicitly follows the stronger Owner/Admin UI boundary. It remains an unresolved authorization/architecture decision and must be resolved before exposing Decision Support to Staff; no RBAC change was made in this review.

## Audit Trail

**Pass.** Audit Trail is Owner/Admin-only, read-only, and backed by the append-only audit API. It presents actor, action, domain, entity/reference, timestamp, and structured details with supported filters and pagination. Manila date bounds are applied. No PATCH, DELETE, fabricated booking activity feed, or mutable-history behavior was found.

## Exact entity binding

**Pass.** All reviewed mutations use explicit canonical IDs: branch ID for branch state, selected vehicle ID for fleet reassignment, selected vehicle and maintenance record IDs for maintenance, account ID for roles, and forecast/recommendation IDs for Decision Support actions and context. Child/parent context reads are checked against their supplied IDs. Initial first-record selections exist only as read-only default context; no mutation uses first/newest/global fallback. No cross-entity mutation path was found.

## Role / RBAC

**Pass, with the Decision Support conflict recorded above.** Owner/Admin can reach supported management and evidence surfaces. Operations Staff is limited to the approved Dashboard, Bookings, Calendar, Notifications, and Reports surfaces; Fleet, Maintenance, Branches, Users/Roles, Decision Support UI, and Audit Trail are denied. The single-vehicle readiness read exception is consistent with the backend contract and is not a general Fleet surface. Customer/Renter and anonymous callers are denied Admin workspace/API access. Server-side checks are present in addition to frontend route hiding.

## Visual fidelity

**Static pass.** Fleet, Maintenance, Users/Roles, Reports, Decision Support, and Audit Trail follow the accepted Direction E references: Rice Paper/light surfaces, Evergreen primary color, Road Ink text, Instrument Sans administration typography, restrained cards/badges, dense operational rows, readable tables, explicit state labels, and minimal serif use. Decision Support is uncertainty-forward and advisory. Branches follows the approved management-list pattern. No generic SaaS analytics drift was found.

## Responsive verification

**Static verification only.** Source and layout rules were checked for 1440, 1024, and 768 widths. Desktop tables/shells apply at the large breakpoint; narrow layouts switch to prioritized disclosures and stacked forms/filters; comparative tables use local overflow. Fleet, Maintenance, Reports, Decision Support, and Audit Trail preserve labels and operational state across the narrow variants. No page-wide horizontal overflow is introduced by the reviewed layout rules.

No approved headed Chromium/Playwright runner or browser binary was available, so no live browser claim is made.

## Accessibility

**Static pass with one non-blocking finding candidate.** The reviewed surfaces provide semantic landmarks/headings, skip navigation, visible focus styles, labelled fields, semantic tables, keyboard-reachable disclosures, accessible Radix dialogs/confirmation, mutation feedback, non-color state labels, 44px touch targets, and reduced-motion handling. Branch deactivation restores focus to its trigger after the dialog closes.

Finding candidate: the narrow Fleet disclosure places a selection `<button>` inside native `<summary>` at `src/routes/admin.fleet.tsx:637-651`. Static review did not establish a browser interaction failure, and no mutation or identity defect results from it, but the nested interactive semantics should be checked in a headed accessibility pass.

## Admin Slice 1 regression

**Pass on the requested spot checks.** Admin shell boundaries, Dashboard/Bookings/Booking Detail/Requirements Review/Payment Review coverage, Staff read-only behavior, exact booking identity binding, and focus-visible behavior remain covered by the accepted baseline and current regression tests. No Slice 2 change was found to weaken them.

## Customer regression

**Pass on the requested spot checks.** Header, Home/Finder, My Bookings, lifecycle detail, and notification routing remain covered by the current customer regression suite. No unrelated customer expansion was required.

## Tests/build

- Branch deactivation and Fleet preservation regressions: **8 passed, 0 failed**.
- Targeted Slice 2/Fleet/Maintenance tests: **22 passed, 0 failed**.
- Full relevant library and backup suite: **270 passed, 0 failed**.
- Full relevant suite including `scripts/qa/*.test.ts`: **301 passed, 0 failed**.
- The requested `272+` threshold does not match the current library-only inventory; the complete relevant run is 301/301 and exceeds the threshold.
- Scoped ESLint for changed Slice 2 UI/model files: **pass**.
- Prettier for changed Slice 2 UI/model files: **pass**.
- `npm run build`: **pass**.
- `git diff --check`: **pass**.
- `tsc --noEmit`: **15 existing standalone baseline diagnostics** in unchanged/pre-existing typed Supabase, operational-context, maintenance-readiness, notifications, and audit API code; the production build still passes.
- A broader lint/format check also reports pre-existing issues in unchanged `src/routes/api.allocation-recommendations.ts` and `src/routes/api.supply-evaluations.ts`. These were not modified.
- Headed browser verification: **not available**; responsive and accessibility results above are static/source verification only.

## Findings / observations

1. **Authorization/architecture conflict:** Decision Support remains classification **C** because Staff-readable GET APIs coexist with an Owner/Admin-only route and navigation boundary. This is non-blocking for the current approved UI and must not be silently resolved.
2. **Finding candidate:** native `<summary>` contains a Fleet selection button in the narrow disclosure. Verify/adjust in a headed accessibility pass if browser behavior shows nested interactive conflicts.
3. **Existing unrelated baseline issue:** 15 standalone TypeScript diagnostics remain outside the Slice 2 source changes; the build passes.
4. **Existing unrelated baseline issue:** two unchanged Decision Support API files fail the broader lint/Prettier check; changed Slice 2 files pass scoped checks.
5. **Stale test/expectation:** the requested 272 count is not the current library-only count (270), while the complete relevant suite passes 301/301.
6. **Observation:** no headed Chromium/Playwright runner was available, so live interaction and pixel comparison were not claimed.

No confirmed defect was found in the reviewed Slice 2 behavior or in either prior confirmed regression.

## Review result

# ADMIN SLICE 2 ACCEPTED WITH NON-BLOCKING OBSERVATIONS
