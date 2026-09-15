# Admin Slice 1 Review

## Commit reviewed

- Accepted customer baseline: `a45e39435063085c5fc6f43c2859d5c06018e262`
- Admin Slice 1 implementation: `382a318f7fc059f093903727e4010a2254215601`
- Branch: `stabilization/frontend-rebuild`
- Pre-flight: `origin` fetched; local `HEAD` and `origin/stabilization/frontend-rebuild` matched the implementation commit; `origin/main` remained `faed190d9b78bb845e2c89e7160eda90106f741f`; worktree was clean before this review document.

## Scope

Reviewed the complete implementation diff and Slice 1 surfaces: Admin shell/navigation, `/admin`, bookings list/detail, requirements queue/detail, payments queue/detail, and their presentation/retrieval helpers. Customer code was spot-checked only for regression from shared changes.

All eight accepted Admin references were inspected at their native resolutions:

- Owner and Staff dashboards
- Bookings list
- Owner desktop/tablet and Staff desktop booking detail
- Requirements Review
- Payment Review

Review stopped after the confirmed accessibility defect recorded below, as required by the workflow. Results marked as source/API evidence were completed before that stop; no headed-browser claim is made.

## Admin shell / roles

**Source/API evidence:** Owner/Admin navigation exposes Slice 1 surfaces; Operations Staff navigation is limited to Dashboard, Bookings, Calendar, Notifications, and Reports. Staff direct-route presentation redirects away from sensitive workspaces, while API authorization is server-side through the authenticated principal rather than client navigation alone.

- Customer and anonymous requests are denied by the server-side principal boundary.
- Requirements review is Owner/Admin-only at both route presentation and `GET`/`POST /api/requirements` behavior.
- Payment queue, proof access, and review mutations are denied to Operations Staff by `GET`/`POST /api/payments`.
- Booking mutation requests are Owner/Admin-only server-side.

This result is subject to the keyboard-focus defect in the Accessibility section.

## Dashboard

**Source/API evidence: passed.** The dashboard is attention-first rather than a fabricated KPI wall. It uses the canonical dashboard response as its required base and composes authorized bookings, calendar, notifications, and—only for Owner/Admin—requirements and payment sources. Source failures remain explicit unavailable/partial states rather than becoming zero counts. Staff does not request or render Owner-only requirements/payment content.

Empty, loading, and partial-source states are present. No unsupported Ready, Completed, or Settled lifecycle state was found.

## Bookings

**Source/API evidence: passed, subject to F-01.** The queue uses canonical customer, vehicle, schedule, branch, request, requirements, payment, and rental data. IDs are secondary to operational identity. Filters operate on the authorized response and preserve their state in the URL. Each action is an explicit deep link to the matching booking ID; no selected-row implicit entity remains.

The desktop table has semantic caption/header structure and the narrower disclosure layout retains an explicit detail action. No unsupported lifecycle state or fabricated requirement/payment content was found.

## Booking Detail

**Source/API evidence: passed.** `/admin/bookings/:bookingId` takes the route parameter and resolves its booking via exact ID matching. It rejects unmatched requirements/payment responses and does not substitute a first, newest, or global record. Its payment handling treats zero or multiple records as unavailable/ambiguous rather than selecting one.

Owner controls are locally conservative and the canonical booking API/RPCs independently enforce assignment, confirmation, release, and return prerequisites and stale snapshots. Operations Staff receives the safe read projection only; staff detail excludes document/proof access, operational context, and lifecycle/review controls.

## Requirements Review

**Source/API evidence: passed.** The workspace binds the route booking ID to both the authorized booking and requirement set, shows only the two canonical document types/current versions, and submits document IDs/versions to the canonical review endpoint. Customer-facing resubmission reasons and server-side review gates are present. No OCR, identity-extraction, extra document type, or fabricated metadata was found.

Staff cannot use the navigation, direct UI route, review endpoint, or signed-document endpoint for this workspace. The API returns no documents to Operations Staff for a known booking.

## Payment Review

**Source/API evidence: passed.** The payment detail resolves the exact payment ID and joins booking context only through `payment.booking_id`; an unavailable context is explicitly retained as unavailable rather than substituted. It renders submitted amount, method, reference, proof metadata, review status, and nullable `required_amount` truthfully.

No client-side percentage, expected amount, balance, Ready, Completed, or Settled state was found. `required_amount: null` remains an explicit unavailable state. Operations Staff receives neither payment records nor proof/review API access.

## Exact entity binding

**Passed by source inspection.** Searches for first/newest/global and selected-row fallbacks found no Slice 1 review or mutation binding that can cross bookings.

- Booking detail: exact `bookingId`; exact requirement/payment response checks.
- Requirements detail: exact `bookingId` and requirement-set booking match; document IDs/versions are submitted explicitly.
- Payment detail: exact `paymentId`; exact `payment.booking_id` join; current proof is accepted only when unambiguous.
- Lifecycle mutations include the exact booking/vehicle/rental and stale-snapshot expectations required by the server RPCs.

The only `reviews[0]` use is backed by the API's explicit descending `reviewed_at`, `limit(1)` query, so it is the canonical current review rather than an arbitrary fallback.

## Sensitive document/proof access

**Passed by source/API authorization evidence.** Signed URLs are issued only after an authenticated, resource-ID-specific server request. Requirements documents require Owner/Admin or the matching customer; payment proofs deny Operations Staff and require the matching customer for customer access. The client receives only a short-lived signed URL (300 seconds), never a raw storage path, and does not construct storage paths.

The UI opens only current proof/document identities. No cross-customer or Staff proof/document path was found in the reviewed Slice 1 code. No destructive or enumerative live requests were performed.

## Responsive verification

No approved headed Chromium/Playwright runner or installed browser runner was available, so headed verification was not performed.

**Static source verification:**

- Shell is sidebar at `lg` and named Menu navigation below that breakpoint.
- Dense tables are desktop-only at `xl`; their disclosure/list composition is used at 1024 and 768.
- Booking detail and review workspaces move from desktop multi-column grids to stacked layouts below `xl`.
- Touch controls use the 44 px `touch-target`/`min-h-11` pattern.

This is static responsive evidence for 1440, 1024, and 768 only, not browser-rendered validation.

## Accessibility

The shell has a skip link, nav/header/main landmarks, current-navigation state, named mobile menu with Escape handling, semantic tables/captions, labelled form controls, live mutation feedback, icon/text status treatment, 44 px controls, and reduced-motion CSS.

### F-01 — Confirmed defect: visible focus is removed from Admin controls

**Expected behavior established:** Direction E and the Admin implementation references require a visible `:focus-visible` indicator for every interactive control. The current Web Interface Guidelines likewise prohibit removing an outline without a visible replacement.

**Incorrect implementation demonstrated:** `src/styles.css` defines a global 2 px visible focus outline, but the later Tailwind utility generated by `focus-visible:outline-none` sets `outline-style: none`. The affected Admin controls do not add a ring, box shadow, or other replacement:

- `src/components/admin/AdminShell.tsx` — sidebar navigation links and brand link
- `src/routes/admin.bookings.tsx` — booking disclosure summary
- `src/routes/admin.requirements.tsx` — requirements queue row action
- `src/routes/admin.payments.tsx` — payment disclosure summary

This makes keyboard focus non-visible on in-scope shell/queue interactions. It is a confirmed accessibility defect and requires an application source/style correction before acceptance.

## Customer regression

**Spot-check passed by source and test evidence.** The only shared functional helper change is additive: Staff can parse an authorized booking response without `candidateVehicles`; Owner/Admin behavior remains strict. The new Admin palette is scoped under `.admin-app`, so it does not alter customer styling. Header, Home/Finder, My Bookings/Booking Detail lifecycle, notification routing, and role helpers showed no Slice 1 regression. Customer shared-code tests in the focused run passed.

## Tests/build

- Focused authorization, booking retrieval/lifecycle, requirements, payments, proof/document access, Admin presentation/dashboard, and customer shared-code tests: **53 passed, 0 failed**.
- Full relevant library suite: **240 passed, 1 failed, 241 total**.
- The sole failure is the explicitly classified legacy UI-source test below.
- Scoped ESLint over Slice 1 implementation files: **passed**.
- Prettier: all reviewed hand-authored Slice 1 files passed. `src/routeTree.gen.ts` fails Prettier at both the accepted baseline and implementation commits; this is an **existing unrelated baseline formatting issue** and was not modified.
- Production build: **passed**.
- `git diff --check` for the reviewed implementation diff: **passed**.

## 240/241 test classification

**B. STALE TEST / STALE IMPLEMENTATION EXPECTATION**

The failing test is `src/lib/admin-operational-context.server.test.ts` at line 351, specifically the source-text assertions beginning at line 356. It expects `/admin/bookings` to import/render `OperationalContextPanel`, read `getAdminSession`, preserve a selected row, and gate the old embedded panel by `staffView` and `selected` state.

At the accepted baseline, that test protected the legacy selected-row booking panel: an Owner selecting a Submitted row inside `/admin/bookings` could see advisory operational context, while Staff could not. The accepted information architecture explicitly supersedes that presentation contract: matrix row 4 replaces “Selected row inside `/admin/bookings`; no detail route today” with a deep-linkable Admin Booking Detail. The accepted Owner and Staff Booking Detail references place the canonical booking context on `/admin/bookings/:bookingId`; the Staff reference expressly excludes operational context. Operational context remains an Owner-only Decision Support concern, and its API authorization test continues to pass.

The new list instead links each exact booking to `/admin/bookings/:bookingId`; the new detail performs exact entity binding and keeps Staff read-only. Therefore the failed assertion is not a removed canonical capability—it is a stale assertion of an intentionally superseded presentation contract.

**Minimum reconciliation before final acceptance:** replace only the legacy `/admin/bookings` selected-row/`OperationalContextPanel` source assertions with checks for the exact deep link and the new detail's exact route binding/Staff-safe exclusion. Retain the operational-context endpoint Owner/Admin authorization coverage and the Decision Support coverage. Do not simply delete the test. Changing it is appropriate because the accepted deep-link architecture, not the legacy selected-row panel, is now canonical.

## Findings / observations

1. **Confirmed defect — F-01:** Admin keyboard focus is suppressed without a visible replacement. This requires a source/style fix.
2. **Stale test / stale implementation expectation — B:** the sole 240/241 failure asserts the intentionally retired selected-row operational-context panel. It requires the bounded test reconciliation above.
3. **Manuscript mismatch / non-blocking observation:** the Owner sidebar includes permanent Requirements and Payments entries even though the accepted navigation reference presents those as contextual queue/detail workspaces rather than permanent sidebar destinations. Access is correctly Owner-only; this is not role leakage.
4. **Existing unrelated baseline issue:** generated `src/routeTree.gen.ts` is not Prettier-compliant at both compared commits.

## Review result

**ADMIN SLICE 1 NEEDS FIXES**

Before final acceptance, restore visible keyboard focus for every affected Admin control and reconcile the one stale legacy test to the accepted deep-link Booking Detail contract. No application or test source was modified during this review.
