# Adviser follow-up: booking policy, classifications and transactional email

Implemented on 4 October 2026. Existing unrelated DSS and deployment changes were preserved.

## Changes

- Brevo dispatch after quote issue, requirement/payment review, booking decisions and date-change outcomes. Durable outbox retries, recipient preferences and existing reminders remain active. Business transactions survive provider failures. Scoped dispatch cannot claim another booking's messages. Customer cancellation/rejection notifications now create email outbox entries too.
- Customer review and pre-payment screens explicitly disclose that the 50% down payment is non-refundable when the customer cancels. The refundable handover security deposit is distinct. No automated forfeiture/refund accounting was added for operator cancellations.
- Customer date-change requests keep the original booking until an Owner/Admin approves. Online changes keep the same vehicle, duration and saved price; other changes require contacting the team for a revised quote. New handover dates must be from tomorrow onward; same-day changes require contacting the team. No rescheduling fee or automatic acceptance was invented. The client should ratify this provisional policy before operational use.
- Approval checks booking state, active rentals, vehicle readiness, inspection/maintenance requirements, conflicting confirmed reservations, duplicate requests and stale dates. Meeting details and verified payment records remain unchanged. Admin must confirm that the dates and handover instructions were agreed with the customer.
- Lookup tables and stable codes cover purpose, destination area, document/payment correction, rejection, cancellation, date-change and fleet-allocation decisions. Free detail remains available, required for Other. Exact delivery addresses remain addresses. Legacy text is preserved rather than guessed into categories. New codes are stored for report grouping; no historical category backfill was performed.
- Fleet-allocation decision and reason are recorded atomically; reasons cannot be changed after a decision. Forecast and candidate evidence remains immutable.
- Defense baseline restoration now includes the new date-change request table, with no baseline reset performed.

## Evidence and validation

- 33 focused tests passed, TypeScript passed, focused ESLint passed, production build passed.
- Transactional database acceptance checks passed for date requests, conflicts, original schedule retention, handover preservation, unchanged verified payment, email outbox scope and duplicate/stale guards. Fixtures rolled back.
- Allocation acceptance checks passed for categories, authorization, atomic persistence and immutable saved reasons. Fixtures rolled back.
- Supabase security advisors at error severity reported no issues.
- Customer/admin UI inspected through the browser; mobile date-change form had no horizontal overflow (390px viewport/content width).
- Three explicitly authorized, clearly labeled Brevo emails sent to the user-provided inbox. All had Brevo `delivered` events. User confirmed all three arrived: one Inbox, two Spam. Test fixture DB/outbox changes rolled back; no real reservation was made.

## Sender authentication follow-up

The configured sender domain is `briahscarrental.site` (extra s); it has no public DNS. Brevo's stored authenticated/verified status disagrees with current DNS status. Actual website domain `briahcarrental.site` uses Spaceship nameservers. Registered the correct domain in Brevo and prepared DNS records at `output/email-delivery-rehearsal/DNS-setup.md`. The user published the DNS records. On 4 October 2026 all four records matched; the Brevo domain authentication endpoint succeeded and GET confirmed verified=true, authenticated=true. Created active sender ID 2, notifications@briahcarrental.site (DKIM/SPF errors false). Updated local and Vercel Production/Preview BREVO_SENDER_EMAIL. The old sender is retained but is no longer configured for the app. A single explicitly authorized, labeled delivery retest was sent; evidence is in output/email-delivery-rehearsal/authenticated-sender-retest.json. Inbox placement is not considered resolved or guaranteed until the user checks the retest.

Evidence: `output/email-delivery-rehearsal/evidence.json` and screenshots in `output/adviser-booking-followup/`.

Availability-dependent date changes and possible revised prices follow the approach described by Enterprise's official reservation-change FAQ: https://www.enterprise.com/en/car-rental-faqs/us-reservations/change-cancel-reservation.html . This implementation limits online requests to unchanged duration/vehicle/pricing; it does not claim the client's policy has been confirmed.

## Production deployment

Vercel deployment `dpl_6szgjdppd2fqJhSppwDdHEx5Auxe` is Ready and promoted to https://briahcarrental.site (including the project's existing aliases). Immutable deployment: https://briah-car-rental-pr3c02cnz-aldrisheeshs-projects.vercel.app . Production booking route returned HTTP 200. Brevo and cron server variables are present in production; values were not exposed. No Git commit or push was performed.

Final UI polish places the fleet decision category before approval/rejection actions. Final deployment `dpl_F2AaU2GHHsZ6saoe4PaXCq1NvHsg` is Ready and supersedes the preceding deployment at the same production aliases. Immutable URL: https://briah-car-rental-i611sma0r-aldrisheeshs-projects.vercel.app . Customer purpose/destination choices and pre-submission cancellation notice were verified through the production browser.


Corrected-sender production redeployment `dpl_GkV4ayfMJKShCHNUkV1hDkTKYReB` is Ready and promoted to https://briahcarrental.site. It rebuilds the prior deployed source with updated sender configuration. Immutable URL: https://briah-car-rental-mjy4jfc3h-aldrisheeshs-projects.vercel.app . The user reported the single authenticated-sender test has not arrived yet. Brevo account SMTP is enabled and 296 daily credits remain; log confirms correct From address, but only a requests event is present so far. No duplicate retest was sent. Delivery remains unconfirmed; DNS authentication is complete.

User subsequently confirmed the authenticated-sender retest arrived in Inbox, not Spam. Controlled email delivery verification is complete.


5 October UI follow-up: destination area is mandatory in customer booking create/edit form and API validation. Purpose/destination arrows are inset 16px. BookingPolicy now uses a concise two-row forest-green notice with expandable date-change rules. DateChangeRequests reuses DateRangePicker, RentalDateTrigger and the existing popover styling. Its single-date mode calculates return from the original exact duration and shows it read-only, preserving saved price. Manila conversion is retained; before-tomorrow dates remain disabled. Date selection and 10:30 AM handover were tested in production: a one-day rental returned at 10:30 AM the next day. No request or payment submitted. TypeScript, component lint, four duration tests and design detector passed. Screenshots: output/booking-policy-calendar/. Final mobile fit patch uses the Radix available-height variable to keep the scrollable popup within the screen; final deployment dpl_AxpDn9ndL2f1tHmyTfK56ixdvqGh.

Final deployment dpl_AxpDn9ndL2f1tHmyTfK56ixdvqGh is Ready and production browser confirms the mobile-fit class. At 390×844, popup bottom 843.55px; after internal scrolling, Apply button bottom 616.16px. All controls remain reachable without horizontal overflow. Temporary viewport override was reset.

### Rental journey loading layout audit — October 5

- Replaced the generic customer booking-detail loader with a shared `BookingJourneySkeleton` that mirrors requirements upload/review, payment quote/submission/review/waiting, confirmation, active/returned rental, and closed/resolution screens.
- Kept the existing page grid, vehicle sidebar, document tile, payment quote/workspace and itinerary containers. Payment submission includes policy, stacked handover rows, payment method, QR/proof workspace placeholders; review prioritizes submitted proof before handover details.
- My Bookings and newly submitted requests seed per-booking stage hints. Authenticated detail responses refresh the hint. Hints contain only the lifecycle enum; unknown/invalid/blocked-storage hints fall back to a neutral title/sidebar shell. Server and initial client render share that neutral shell to avoid hydration mismatches. Hints never authorize content/actions.
- Initial request loading now matches pickup/delivery choices and purpose/destination dropdowns rather than the old purpose textarea.
- Desktop (1864×984) and mobile (390×844) previews checked for all normal and closed lifecycle layouts. Corrected collapsed confirmation/resolution loading columns on mobile; one loading status and reduced-motion support retained. Temporary local preview code removed before production build.
- Validation: typecheck, build, focused ESLint (existing booking.tsx search dependency warning only), two storage-hint tests, design detector returned no findings. Screenshots in `output/rental-journey-skeletons/`.
- Production deployment: `dpl_GntoRB78r1a79GbV3GKpfox1KvcY`.
- Deployment reached Ready on briahcarrental.site. Browser verified the authenticated payment page finishes loading, repeat reload selects the payment quote/form skeleton, no horizontal overflow or console errors. Live screenshot: `output/rental-journey-skeletons/payment-live.png`. First visits without a stage hint intentionally show the neutral shell until the stage is known.


## 2026-10-05 — payment policy acknowledgement, local development

Implemented the customer payment confirmation dialog with the existing Radix dialog and brand styles. A valid payment form now opens “Before you submit”; the final action stays disabled until the cancellation/date-change acknowledgement is checked. Back preserves the selected proof and reference; reopening clears acknowledgement. A compact non-refundable 50% down-payment notice remains visible beside payment instructions before the customer transfers money. Updated the payment skeleton accordingly.

The API rejects missing/outdated acknowledgement before uploading proof. Migration `20261005010000_payment_policy_acknowledgement.sql` records policy version, server timestamp and the exact policy snapshot on the submitted proof version, atomically with the existing payment submission function. A trigger preserves historical acknowledgement. Existing proof records are not backfilled with invented consent. Database RPC typing was added.

Validation: TypeScript, focused ESLint, production build and payment-policy unit test passed. Isolated local PostgreSQL verification passed acknowledgement/version rejection, duplicate prevention, immutable history, resubmission preservation and RPC permission checks. Local browser rehearsal reused the actual PaymentSubmission/component/CSS with synthetic fixtures and a mocked local endpoint: checkbox gating, back/form preservation, fresh acknowledgement on reopen, desktop/mobile layouts and double-click protection (one receipt) passed.

Important boundary: the normal development app is connected to the hosted dataset and remained on its existing SSR loading screen during this run. Interactive screenshots therefore come from the separate synthetic local rehearsal at http://127.0.0.1:3001/. This is not a claim of a live hosted end-to-end submission. The migration was applied only to isolated local PostgreSQL, which has been stopped. No hosted schema changes, deployment, real payment or email submission occurred. Before production rollout, apply the migration and verify the real application submission flow with controlled test data.

Screenshots and evidence: `output/payment-policy-local/modal-desktop.png`, `modal-mobile.png`, `submitted-local.png`, `browser-submissions.json`, `database-verification.txt`. The preview tab is left open for manual inspection.

## 2026-10-05 — corrected pre-payment acknowledgement timing

Supersedes the submit-proof modal above. The payment stage now checks a server-persisted booking/customer/policy-version acknowledgement on entry. Unacknowledged customers see “Before you pay” automatically, with a required checkbox and “Continue.” Continue saves acceptance only; no payment/proof is submitted. Payment methods/codes and proof inputs are withheld until the save succeeds. Dismissing via “Review later” leaves a deliberate policy review gate. Accepted customers returning/reloading skip the dialog. Actual proof submission proceeds directly, with no second acknowledgement dialog.

New `/api/payment-policy` GET/POST route validates authenticated customer ownership. New migration `20261005020000_booking_payment_policy_acceptance.sql` follows the earlier proof acknowledgement migration, adds service-only acceptance storage with RLS, validates verified requirements, and preserves the first server timestamp on retries. Proof submission requires persisted acceptance and copies the original timestamp/snapshot onto each proof version. The API checks acceptance before storage upload; the RPC independently enforces it.

Local database verification: missing persisted acceptance cannot submit proof, Continue does not create proof, repeated Continue preserves timestamp, wrong customer/outdated policy/unverified documents rejected, proof resubmission preserves acceptance history, and browser roles cannot access the table/RPC. TypeScript, focused ESLint and production build passed. Both policy migrations remain local-only; do not deploy the API before applying them to the target database.

Browser follow-up: the existing localhost:3000 customer tab renders the new “Before you pay” dialog. Its persistence check fails until the target database migrations are applied; that is expected because localhost still uses hosted Supabase. The separate local PostgreSQL rehearsal server is listening on localhost:3001, but its browser tab became an internal error page during restart. Requested the user reopen it because browser policy blocks controlling that internal page. Refresh-persistence browser verification remains pending that reopen; do not claim it passed yet.

## 2026-10-05 — Continue save error resolved

Confirmed the local app's hosted Supabase database was missing both payment policy migrations. Applied `20261005010000_payment_policy_acknowledgement.sql` and `20261005020000_booking_payment_policy_acceptance.sql` together in a transaction, recorded their migration history, and refreshed PostgREST's schema cache. Existing production frontend/payment API remains compatible; no frontend deployment occurred.

Verified the real application database's acknowledgement RPC as service_role against the shown test booking inside a rolled-back transaction. Saving works and a repeated call preserves the timestamp. No acceptance was committed by this verification. The actual localhost customer page now loads the modal without an initial-check error. The user must perform the Continue action to record their own acknowledgement of cancellation terms; browser policy prohibits the agent accepting those terms for them. Awaiting the user's action to verify the resulting payment view and refresh persistence. Screenshot: `output/payment-policy-fix/modal-ready.png`.

User confirmed Continue opens payment instructions. Verified the acknowledgement is committed with the current version and server timestamp. Reloaded the actual localhost:3000 customer page; payment instructions remained accessible and the modal did not reappear. Saved screenshot `output/payment-policy-fix/payment-after-refresh.png`. The previously pending refresh-persistence browser check is now complete.

## Local rescheduling calendar availability — 2026-10-05

The customer date-change picker now crosses out and disables starts that cannot fit the entire saved rental duration at the selected Manila handover time. It checks other confirmed reservations and scheduled rentals for the same vehicle, excludes the customer's own booking, and recalculates when the time changes. Clearing dates retains the handover time for this fixed-duration picker. Home and browse range selection keeps its existing behavior.

An authenticated, ownership-checked availability response contains only blocked intervals and the rental duration. Opening the picker refreshes availability; loading or failure prevents applying dates, with a retry on failure. The request API checks conflicts again before saving a request; approval retains its existing vehicle-lock, conflict and readiness checks. No reservation was changed during this rehearsal.

Validation: four interval tests pass, including a free Wednesday that cannot fit a three-day rental across Thursday's reservation, exact boundaries, time changes and invalid selections. Focused ESLint, TypeScript and production build pass; Impeccable detector reports no findings. The actual customer UI allows Nov 3 at 10:00 AM (return Nov 4 at 10:00 AM), then disables Apply when changed to 10:30 AM because another booking starts Nov 4 at 10:00 AM. Mobile picker scrolling and controls checked at 390 × 844; viewport restored afterward.

Screenshots: `output/reschedule-availability/desktop-calendar.png`, `output/reschedule-availability/conflicting-time.png`, `output/reschedule-availability/mobile-calendar.png`. Frontend/API changes are local only; no deployment or database migration was performed for this change.

## Admin photo review refinement — 2026-10-05

Rejection panel is transparent; rejection controls use white backgrounds. Enabled category selects use pointer cursors. Selfie with ID now offers seven photo-specific correction reasons (clarity, face visibility, ID visibility, holding the ID, identity mismatch, unverifiable photo, other). Other requires explanatory details. The same choices are used in booking detail and the separate requirements review page. Document fields keep their existing document choices; previously selected reasons remain readable for compatibility.

Added seven `selfie.*` codes to the existing `document_review` lookup domain through migration `20261005030000_selfie_review_categories.sql`; applied to the shared Supabase database used by the local app. All seven database category lookups verified. Existing reporting trigger and API validation work with these labels; no customer record or review request was submitted. Frontend remains local, undeployed. Screenshots are in `output/admin-selfie-polish/`.

## Approval ledger fixtures — 2026-10-05

Added 13 new synthetic bookings under `d1000000-*` for Jamie Cruz (`uat-c01@briah-uat.invalid`) using additive `scripts/qa/approval-ledger-cases.ts`. Existing baseline rows preserved; no fixture cleanup executed. Coverage: documents needed, pending document review, document resubmission, quote preparation, quote issued/payment awaiting proof, pending payment review, payment resubmission, verified payment with paused confirmation, confirmed awaiting release, rental active, return recorded, rejected, cancelled.

All 13 database fixtures matched the production ledger resolver's expected active stage (1,2,2,3,4,4,4,4,5,6,6,0,0). The active fixture had zero confirmed-reservation overlaps. Seed rerun preserved the complete set. Representative frontend screens inspected: request, quote preparation, document resubmission and confirmation exception; screenshots/index in `output/approval-ledger-cases/`. Data is in the shared Supabase project used locally, not an isolated database. No customer email/review action was submitted; seed transaction suppressed lifecycle side effects.

### Payment review return navigation — 2026-10-05

- Payment review now derives focused mode from the current router URL, fixing the back link that removed the payment query but left the review screen open.
- The approval ledger opens payment review with `returnTo=ledger`; its back link returns to the payment's booking and reads “Back to approval ledger”. Reviews opened from the payment queue retain “Back to payment queue”. Both use client navigation.
- Verified locally through the frontend: ledger → review → same ledger, and direct focused review → payment queue. No payment status was changed. ESLint, TypeScript, production build, and diff whitespace checks passed.
- Screenshot: `output/payment-return-navigation/back-to-ledger.png`.

### Local frontend rehearsal — 2026-10-05

Browser rehearsal findings/evidence: `output/ledger-rehearsal-2026-10-05/findings.md`. Inspected customer finder, request review, document correction, awaiting quote, policy gate, payment-under-review/correction, confirmed, active, returned, rejected, cancelled, My Bookings and notifications. Exercised named synthetic UI transitions: case 03 corrected upload → requirements verified → quote sent; case 06 payment correction → Needs Resubmission; case 07 date-change request → admin approval → customer dates/history/quote verified; case 08 confirmation retry → Confirmed; case 10 return → Returned and customer completed page. These fixture rows now differ from their seeded states; no baseline restoration attempted.

Priority findings: changed document inherits old review outcome; confirmed customer page omits remaining balance/deposit; paid-cancelled page omits financial explanation; finder optional recommendation inputs required on submit; rejected delivery page uses branch labels; delivery collection wording inconsistent; reschedule permits all hours unlike initial picker. Active/returned fixtures lack collection records, so new deposit settlement remains untested. Pending new request awaits user acknowledgement of rental terms; payment happy path and fresh release/settlement are incomplete. No implementation changes/deployment during this audit; no real money transfer or actual email-inbox validation.

### Local rehearsal fixes — 2026-10-05

Known findings fixed: document review/draft restoration bound to exact versions; customer confirmed/cancelled financial summaries; delivery collection wording/address labels; dates-only finder submit; shared handover hours and reschedule request validation; Vios model image fallback; pdf.js payment proof rendering. 42 relevant tests, scoped lint, TypeScript and production build pass. New additive synthetic fixtures: e1000000…0001 released/returned through frontend with saved deposit collection and settlement; f1000000…0001 demonstrates fresh v2 outcome with unchanged v1 decisions retained. Existing baseline preserved. Customer sees saved 3,000 deposit / 500 deduction / 2,500 refund; no real money transferred. Evidence: `output/ledger-fixes-2026-10-05/verification.md` and screenshots. Local only. Full fresh request/payment submission remains open pending user rental-terms acknowledgement in tab 33.

### Fresh request-to-confirmation completed — 2026-10-05

User explicitly authorized accepting/submitting the test request. Created booking ef0fb161-c34b-4abd-a7b7-cfd4879a8204 entirely through local customer frontend; four synthetic requirement uploads → admin simulated review → 7,100 quote including 500 delivery fee → persistent before-payment acknowledgement → synthetic 3,550 proof → admin simulated verification → automatic confirmation. Customer/admin figures match: 3,550 balance + 3,000 deposit = 6,550 at handover. Separate delivery/collection addresses retained. Ledger/payment return link and customer notification detail link verified. Release blocked until tomorrow as expected; prior separate release/return rehearsal remains evidence for that segment.

Fresh submission exposed missing service_role UPDATE permission on the policy fields of payment_proofs. Added/applied/recorded migration 20261005040000_payment_policy_proof_write_access.sql granting only those three columns. Real-role rollback regression verifies positive submission, required acceptance, preserved timestamp/snapshot, duplicate/immutability guards and denied browser/unrelated-field writes. No actual payment made. Clarified legacy payment-verified notification display and future email copy to avoid suggesting a manual confirmation step. 23 related tests, lint, TypeScript, production build and whitespace checks pass; security advisor error level reports no issues. Evidence: output/fresh-booking-rehearsal-2026-10-05/verification.md and screenshots 02–10. Scoped local booking rehearsal can now be marked clean; frontend remains undeployed, and this run did not test actual email-inbox delivery.
