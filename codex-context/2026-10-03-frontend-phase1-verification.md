# Frontend Phase 1 verification — 3 October 2026

Status: implemented on `main`, checked locally; **not fully accepted or verified on production**. Baseline commit: `02705878`. Changes remain in the working tree for review. Phase 2 has not started.

## Implemented changes

| Audit item | Result | Evidence and limits |
|---|---|---|
| F01: Desktop allocation location | Existing location-change control restored in the desktop fleet detail panel. Reuses affected-booking review and cancellation. | Visible at 1920 and 1366 widths; existing mobile workflow checked at 390. Review listed an affected request; Cancel retained the original location and returned focus to the selector. No committed movement performed. |
| F02: Protected direct URLs | Payments, Requirements, and their detail guards now defer client-only principal checks during server rendering, matching the existing admin route pattern. AdminShell still gates rendering after hydration; server API authorization is unchanged. | Authenticated direct Payments and Requirements navigation and reload passed. A real Requirements detail page loaded. Payment-detail route browser coverage remains outstanding. Signed-out access redirects to sign-in. Staff access was denied, but landed at the public home page rather than the intended admin landing page; retain this as a Phase 3 redirect refinement. |
| F03: DSS week dates | Shared date-only helpers preserve exclusive stored week ends and inclusive labels in Manila time. | Actual DSS page displayed Sep 28, 2026 – Oct 4, 2026. Regression tests cover Oct 5–11, year and leap-day boundaries, and Manila/UTC/Los Angeles process timezones. Browser timezone emulation was not performed. |
| F06: Portaled dialog theme | Admin context now supplies theme tokens and input styles to dialogs rendered outside the admin DOM subtree. | Location dialog white inputs and readable actions confirmed at laptop and narrow widths. Dialog focus restoration added for controlled admin dialogs; existing custom close handlers take precedence. |
| F07: Maintenance details | Added an accessible title and description; narrowed history dot selectors so they no longer style the prior-record count. | Desktop count remained readable. Escape closed details and returned focus to View details. |

## Validation

- `npm run build`: passed on the final source changes.
- Targeted Node tests: **24 passed, 0 failed** across planning intervals, admin decisions, server auth, maintenance admin, and maintenance readiness.
- `git diff --check`: passed.
- Scoped ESLint with the Prettier rule disabled: **0 errors, 6 existing hook dependency warnings** in DSS and Payments. Full formatting lint is not clean; existing formatting drift was preserved instead of reformatting entire large route files.
- `npx tsc --noEmit`: failed with two errors in `src/routes/api.notifications.ts`, lines 100–101 (`booking_id` and `id` on `never`). The same errors were reproduced from untouched HEAD in a temporary checkout. No new type errors remained.
- One pre-existing maintenance test fixture was corrected to explicitly mark its legacy Open record as blocking rental use. This repairs the fixture's stated expectation without changing readiness policy.
- Impeccable detector ran on the changed dialog, fleet, maintenance, and shared stylesheet. It reported stylistic heuristics in existing shared CSS, including brand font and colored borders. These are not an accessibility certification or a reason to replace the established brand in this repair phase. Visual checks supplied the evidence for the scoped layout fixes.

## Screenshots

Local app screenshots only; these do not show a deployed release.

- [Desktop fleet](frontend-phase1-2026-10-03/fleet-desktop.png)
- [Affected-request review](frontend-phase1-2026-10-03/allocation-review.png)
- [Location dialog at laptop width](frontend-phase1-2026-10-03/location-dialog-laptop.png)
- [Location dialog at narrow width](frontend-phase1-2026-10-03/location-dialog-mobile.png)
- [Maintenance details](frontend-phase1-2026-10-03/maintenance-desktop.png)
- [Mobile fleet](frontend-phase1-2026-10-03/fleet-mobile.png)
- [DSS dates](frontend-phase1-2026-10-03/dss-dates.png)

## Remaining acceptance work

1. Verify a real Payment detail URL directly and on reload, plus signed-out/staff detail access.
2. Refine staff sign-in/denied-route landing in Phase 3. Access denial is confirmed; the landing experience is not accepted.
3. Replay a committed location movement only with identified resettable fixtures during integrated acceptance. The current check intentionally exercised review and cancellation.
4. Resolve baseline Notifications type errors when that feature is addressed in Phase 3; preserve this failure in release records until fixed.
5. Verify the accepted changes on a deployment separately. No push or production deployment was performed.

No schema migrations, new dependencies, baseline resets, booking/payment decisions, or fleet movements were performed. The broader DSS evidence hierarchy and recommendation review flow remain Phase 2 work; this report does not declare DSS or the entire system defense-ready.
