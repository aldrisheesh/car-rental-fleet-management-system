# Phase 3 verification — 3 October 2026

Status: Implemented on `main` and verified locally in the paths below. Acceptance is partial: Ford Everest still has no uploaded image, and forced failure cases and integrated mutation journeys remain for Phase 4. Changes are uncommitted and have not been pushed or deployed. Earlier Phase 1/2 and unrelated manuscript files were preserved.

## Changes and evidence

| Audit scope | Change | Verification |
| --- | --- | --- |
| F08 | Staff sign-in lands at `/admin`. The server recovers active internal users from denied admin URLs to their permitted dashboard. Existing role authorization remains intact. Staff Fleet shortcut goes to Reports; booking review, confirmation, release and return wording identifies Owner/Admin responsibility. Reports hide the staff-inaccessible DSS action. | Signed in as the authorized Operations Staff account, inspected Dashboard, queue and exact booking details. A direct `/admin/payments` request recovered to `/admin`. Staff report evidence identified Owner/Admin and had no DSS link. Unit tests cover denied Requirements recovery, customer/inactive fallbacks and payment-notification destinations. |
| F09 | One display reference includes the first eight and last twelve ID characters. Applied to dashboard, queues, details, customer lists/summary and related inbox events. Full primary IDs and mutation/route identifiers remain unchanged. Queue searches also include the displayed reference. | Common-prefix seeded IDs are distinguishable in tests and rendered inbox/queue rows. Searching `#C1000000…000000000006` returned exactly one payment. Its detail displayed the same reference. Customer unpaid booking summary and notification bindings use the same helper. Short references are display aids, not a mathematical guarantee of UUID uniqueness. |
| F10 | Profile Email preferences links to the real customer inbox. Removed the unimplemented Security navigation item. Mobile identity and navigation are compact; links retain visible keyboard focus. | Followed the preference link from Profile. At 390×844, page width was 390, and the form began around 397px. No profile information was saved. |
| F11 | Initial notification state announces checking/loading, unknown counts and an unknown email preference. A loaded inbox remains visible during refresh. | Observed actual initial customer markup: “Checking your updates…”, counts “—”, and preference “Loading…” with no switch. Loaded account had 13 unread and its actual enabled preference. Empty Bookings filter correctly showed “No booking updates”. Forced HTTP failure/offline testing remains outstanding. |
| F12 | Report evidence is collapsible and keyboard accessible. Uses first forecast week terminology, inclusive Manila target ranges, existing generation timestamps, selected-period accuracy scope and exclusions. Staff receive a handoff rather than an inaccessible DSS link. | October 1 run displayed September 28–October 4 rather than “next week”; 25 eligible accuracy samples and 11 exclusions were visible. January 2027 period explicitly had no forecast run. Enter toggled the disclosure. |
| F12 layout | Report cards shrink independently of intrinsic table width. Mobile metric cards stack; wide tables retain local scrolling. Forecast table wrapper is keyboard focusable and named. | Found a 662px grid column hidden by the 390px page's clipping. Fixed and confirmed the report content column was 310px inside its 310px container. Confirmed final 1366×768 layout had page width 1366. |
| F13 | Image failure is tied to the failed source. A new valid source can recover. Detects server-rendered images that failed before the React error listener attached. | Isolated temporary local route exercised unavailable image → valid image without remounting `VehicleImage`; final image was complete with naturalWidth 1254. Fixture removed and generated route tree returned unchanged. Read-only vehicle/gallery queries confirmed Ford Everest has `image_url = null` and zero gallery records. Actual photo upload remains outstanding; no replacement image was invented and no shared media records were changed. |
| F14 | Inbox rows identify their related booking, or fall back to the actual entity reference, and show event time in Manila. Inbox description distinguishes recorded events from current status. Staff payment-event links use exact booking bindings instead of the restricted payment review route. | Rendered repeated overdue events could be distinguished by booking reference and recorded date. Customer requirements notifications resolved to their exact bookings. Tests cover valid/malformed bindings and staff/owner route differences. Staff inbox payment-event replay remains outstanding because the inspected staff account had no such events. |
| F15 | Quote states required downpayment, balance at handover after verified downpayment, and security deposit payable at handover/refundable after return. | Inspected existing unpaid booking: ₱11,000 total, ₱5,500 due now, ₱5,500 balance, ₱3,000 deposit. No payment submission or verification occurred. |

## Other scoped repairs

- Removed the two existing Notifications API TypeScript errors through runtime validation of entity projection rows, also removing unchecked `any` bindings. All notification reads remain scoped to the authenticated recipient; additional payment bindings derive only from that recipient's notifications. No schema, RLS, credential or access changes.
- Typed existing PDF loading tasks and supplied the canvas required by the installed PDF.js render signature. Secure PDF modal/thumbnail rendering should be included in Phase 4.
- Removed an empty props destructuring/type in the customer empty-state component so scoped lint passes.
- Closed Phase 1's missing owner payment-detail browser check: exact payment detail loaded through a direct URL and survived full reload.

## Checks

- `npx tsc --noEmit`: pass after final TSX changes.
- `npm run build`: pass after final CSS and report accessibility changes.
- 69 tests passed, zero failures: frontend role/context, auth recovery, auth permissions, notifications, reports, allocation review, admin decisions, maintenance readiness, Manila week intervals, rental duration, payment integrity and payment retrieval.
- Scoped ESLint: zero errors; one existing `react-hooks/exhaustive-deps` warning in the payment proof preview effect (`admin.payments.tsx`). Final changed report/customer files also passed scoped lint.
- `git diff --check`: pass.
- Browser checks used the local app only. Confirmed actual 1920×1080, 1366×768 and 390×844 viewports. Early synthetic-tab screenshots were 1920×1080; native viewport verification was used for the laptop and mobile checks.
- No baseline reset, customer profile save, preference update, mark-read action, booking mutation, payment review mutation, DSS final decision, fleet movement or production deployment was performed.

## Evidence

Screenshots in `frontend-phase3-2026-10-03/`:

- `reports-desktop.png`: owner report evidence at desktop size.
- `reports-laptop.png`: final report after mobile containment fix, 1366×768.
- `reports-mobile.png`: corrected containment and genuine no-run state, 390×844.
- `admin-notifications.png`: distinctive event references and times.
- `staff-booking-desktop.png`: staff role and Owner/Admin handoff.
- `profile-mobile.png`: compact account navigation.
- `notifications-mobile.png` / `customer-notifications-desktop.png`: loaded customer event history.
- `customer-quote-desktop.png`: quote timing and booking reference.
- `payment-detail-desktop.png`: exact authorized payment detail after reload.

## Phase 4 handoff

1. Supply a correct Ford Everest photo through the existing Owner/Admin fleet media workflow.
2. Replay final booking/payment/release/return and DSS decision/manual movement using designated resettable fixtures. Preserve shared records outside that scope.
3. Test forced notification/context failure, no-donor DSS cases, saved Approved/Rejected/partial states, affected-booking movement review, secure PDF preview and staff denied detail URLs.
4. Recheck tablet width and the final integrated desktop/mobile journeys, then verify a separately identified deployment. These local results do not establish live-site or complete defense readiness.
5. Retake affected GUI evidence only after accepted screens are stable. No manuscript changes were made in Phase 3.
