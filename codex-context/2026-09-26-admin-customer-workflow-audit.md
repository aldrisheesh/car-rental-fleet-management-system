# Admin-to-customer workflow audit

Audit date: 26 September 2026. Scope: current working tree, local application at port 3000, and read-only queries against the configured Supabase project `vkfacfjkwomhfvrieaza`.

## Conclusion

The daily-rate editor is connected, but the system still has missing management controls, incomplete handoffs, and deployed-schema differences. It is not ready to be described as a fully completed operational system. Earlier build success and fixture verification do not establish these cross-module workflows.

This audit changed no application code, records, configuration, or migrations. Source-confirmed findings below are distinguished from live read observations. No payment was submitted or verified, no vehicle was modified, and no destructive or transactional reproduction was performed.

## Implementation status update — 26 September 2026

Phase 1 and Phase 2 were completed after this audit. The original findings remain as evidence of the gaps found; the status below records the work subsequently applied and verified.

- **F01–F03:** The live database now has the return-inspection and maintenance lifecycle contract. Pending inspections participate in the shared readiness rule, release rechecks readiness, and scheduling a return-related maintenance record records the inspection and maintenance hold together.
- **F05:** Resolved. Both normal and date-filtered customer catalog responses load the same ordered vehicle gallery.
- **F06:** Resolved for ordinary sequential use. New uploads choose the first unoccupied gallery position, so deleting a middle photo no longer causes a unique-position collision.
- **F07:** Resolved. The API sends cover photos first, and the vehicle-detail gallery initializes from that cover and resets when the selected vehicle or cover changes. Cover synchronization failures now return an error instead of reporting an unqualified success.
- **F10:** Resolved for vehicle intake and editing. Fleet Management now lets an owner set fuel type, reference fuel efficiency, current odometer, and a condition-based rental block. The raw image-URL editor has been removed; the upload gallery is the supported source for customer vehicle photos.
- **F04:** Resolved for the simplified manual-payment scope. An Owner/Admin records one exact, booking-specific required payment amount after requirements are verified. The same amount is shown to the customer, enforced at submission and review, and locks after a proof enters the review workflow. It does not depend on a later catalog-rate edit.
- **F09:** Resolved. Owner/Admin can create and update customer-facing payment methods, instructions, demo status, and active state. Active methods appear in the customer payment form; hidden methods remain readable on existing payment records.
- **F12:** Resolved. Owner/Admin can reject a Draft or Submitted request with a customer-visible reason; Owner/Admin cancellation of a confirmed, unreleased booking now preserves that reason on the booking as well. Customers can withdraw an unfinished request before payment is pending or verified. Each action preserves booking history and records an audit event.
- **F13:** Resolved. The queue now describes the actual order: requirements, payment amount and verification, then rental confirmation. “Ready to confirm” requires verified requirements and payment; page-level task counts are labelled honestly.
- **F14:** Resolved. Fleet location changes now block confirmed reservations, warn about Draft or Submitted requests that reference the vehicle, require explicit Owner/Admin acknowledgement, and record a reconciliation event against every affected booking.
- **F08:** Resolved. The public contact form now saves a validated inquiry through the server and only confirms success after persistence. Owner/Admin can view and close saved inquiries.
- **F11:** Resolved. Owner/Admin manages the public phone, email, office hours, service area, acknowledgement text, and customer-facing locations in Settings. The customer Contact page and every footer read the same public source; operational fleet branches remain separate.
- **F15:** Resolved in the backup/recovery implementation. Vehicle gallery objects are now included in the protected storage set. Recovery verifies their restored bytes while allowing the `vehicle-images` bucket to retain its intentional public visibility.

Validation after the update: TypeScript check and production build passed; normal and date-filtered local API reads both returned the Ford Everest gallery with its selected cover photo first. The payment lifecycle and integrity tests pass. The live booking-resolution, location-reconciliation, and cancellation RPCs were verified to grant execution only to the service role. The live public-contact endpoint returned the saved public settings and locations. The backup/recovery suite verifies all three protected buckets, including public vehicle media.

## Evidence collected

- Reviewed customer catalog, vehicle details, finder, booking creation/history, requirements, payment submission, contact, profile and notifications; admin fleet, locations, maintenance, booking review, calendar, payments, users, dashboard, reports, decision support and hidden legacy pages; their API handlers and relevant migrations.
- Called the local public catalog with and without rental dates and the booking-options endpoint. Both catalog requests returned HTTP 200 and 12 vehicles.
- Normal catalog: Ford Everest returned three gallery photos. Date-filtered catalog (`finderStart=2026-10-15T10:00`, `finderEnd=2026-10-16T10:00`): every vehicle lacked the `images` field. This is a reproduced read-path failure.
- Database read: 12 vehicles, all with daily rates and fuel types; all 12 missing reference fuel efficiency; 11 missing current odometer. Existing seed data therefore conceals the inability to enter fuel type through Fleet Management.
- Database read: one active payment method, explicitly marked demo; 11 payments, all with null `required_amount`.
- Schema probes returned PostgreSQL `42703` for the four return-inspection fields and maintenance `scheduled_for`/`archived_at`.
- `supabase migration list --linked` lists `20260918083304_vehicle_return_inspections` and `20260918100000_maintenance_lifecycle` locally without matching remote versions. The gallery and simplified-payment migrations are recorded remotely. Earlier migrations also use different local/remote version identifiers, so do not infer that every unmatched old filename is unapplied or blindly push the entire directory.
- 35 existing targeted tests passed across customer lifecycle/data, master data, admin booking actions, payment integrity, booking availability, maintenance readiness, notifications and users. These do not exercise every UI/API/database handoff identified here; some assert source text or pure functions.

## Findings and acceptance criteria

### F01 — High: the live database lacks two operational workflows expected by the UI

**Evidence:** `src/lib/admin-fleet.server.ts:45` requests inspection fields, but the failure list below excludes `inspectionResult`; missing inspection data silently becomes undefined. The live database lacks `inspection_status`, `inspection_remarks`, `inspected_at`, `inspected_by`, `maintenance_records.scheduled_for`, and `archived_at`. `src/routes/api.maintenance.ts` falls back to a legacy RPC when the new scheduling signature is missing.

**Impact:** the admin can see a functioning-looking fleet/maintenance screen without the intended return-inspection and Scheduled/In Progress workflow being installed.

**Action:** reconcile the actual deployed schema and function definitions, apply only the missing compatible migrations, and replace silent inspection failure with a clear unavailable state. Verify each transition after deployment. Do not push all historically unmatched migrations.

**Acceptance:** a recorded return creates a pending inspection; it appears in Fleet Management; scheduling persists a scheduled timestamp and the intended lifecycle; an unavailable inspection source never means ready for rental.

### F02 — High: inspection status is not a shared rental-readiness rule

**Evidence:** `src/lib/admin-fleet.ts:153` accounts for pending inspections when computing the displayed fleet status. `src/lib/maintenance-readiness.server.ts:23`, `src/lib/vehicle-finder.server.ts:44`, and `src/routes/api.supply-evaluations.ts:58` do not retrieve pending inspections. The latest local `assert_vehicle_rental_ready` in `20260918100000_maintenance_lifecycle.sql:140` checks maintenance/vehicle condition but not inspections.

There is a second interruption: `src/routes/admin.fleet.tsx:572` saves the outcome “Maintenance scheduled” first and only then opens a separate maintenance dialog. Closing that dialog can leave the inspection resolved without a maintenance record. The resolver itself only updates the rental inspection (`20260918083304_vehicle_return_inspections.sql:84`).

**Impact:** applying the missing migration alone will not close the gap. Admin fleet status, customer availability, confirmation, and allocation can disagree about whether the vehicle is usable.

**Action:** centralize readiness, including unresolved inspections, across all consumers. Keep the inspection blocked until the required maintenance record is successfully created, ideally in one transaction.

**Acceptance:** pending inspection excludes a vehicle everywhere; cancelling the follow-on maintenance dialog cannot clear the block; clearing inspection only restores availability if every other check passes.

### F03 — High: release does not recheck maintenance readiness

**Evidence:** the local `release_vehicle_start_rental` definition in `20260901020000_rental_release_start.sql:60` checks active vehicle/active rental but never calls the readiness assertion. `src/routes/api.bookings.ts:357` delegates directly to it. No later local release replacement was found.

**Impact:** a vehicle that becomes blocked after booking confirmation can still reach the release operation under the local implementation.

**Action:** enforce the current shared readiness rules at release time. Confirm the deployed function body during the deployment reconciliation. This was not reproduced by releasing a real vehicle.

**Acceptance:** confirm a controlled booking, create a blocking condition, and ensure release is rejected with a useful explanation.

### F04 — High: the 50% payment requirement has no manageable booking amount

**Evidence:** `src/routes/bookings.$bookingId.tsx:1252` says a minimum 50% is required. The active admin screens have no editor for an agreed booking total/required payment. `20260926120000_simplify_payment_submission.sql` no longer fills `required_amount`; all 11 live payment rows have null values. `20260831223000_payment_review_atomic.sql:23` only enforces an amount threshold when that value is non-null.

**Impact:** admin verification can establish that a payment was received, but cannot establish the advertised 50% threshold from a recorded system amount. A live catalog rate is also not an agreed historical booking price.

**Action:** retain the simple daily-rate catalog. If 50% remains a system rule, provide a small booking-level agreed-total/required-payment entry with customer-visible amount and recorded approval. Otherwise explicitly describe external manual amount confirmation and remove claims that the system enforces the percentage. A package rate-card module is not necessary.

**Acceptance:** admin and customer see the same recorded amount; later catalog-rate edits do not change that agreed amount; insufficient payment is handled consistently with the chosen scope.

### F05 — High: selecting dates drops the customer vehicle gallery

**Evidence:** `src/routes/api.vehicles.ts:16` returns the availability helper's result before gallery enrichment. `src/lib/vehicle-finder.server.ts:48` only selects `image_url`. The vehicle detail page uses that date-filtered path at `src/routes/vehicles.$vehicleId.tsx:142`. Confirmed with HTTP reads as described above.

**Action:** use the same gallery projection for both catalog paths.

**Acceptance:** all uploaded photos remain available after choosing/changing dates and when arriving from Finder.

### F06 — Medium: removing a middle photo can prevent the next upload

**Evidence:** `src/routes/api.vehicle-images.ts:62` assigns `sort_order` from the current row count. DELETE does not renumber remaining rows. The migration has `unique(vehicle_id, sort_order)`.

**Reproduction from code:** start with positions 0, 1, 2; remove position 1; two remain, so the next upload attempts position 2 and conflicts. No live photos were deleted to demonstrate this.

**Action:** allocate a free position or reorder atomically, and serialize per-vehicle changes.

**Acceptance:** repeated upload → remove middle → upload succeeds up to five photos, including concurrent changes.

### F07 — Medium: selected cover is not consistently used as the first detail photo

**Evidence:** the gallery is sorted by `sort_order`, while detail uses `activeImage = 0` (`src/routes/vehicles.$vehicleId.tsx:117,270`). Set-cover changes `is_cover` and `vehicles.image_url`, not order. Catalog cards use `image_url`, so they can show a different default photo from the details page. Several secondary cover/vehicle updates in `src/routes/api.vehicle-images.ts:66,79,95` ignore returned errors.

**Action:** initialize/select the actual cover on the customer side; make cover changes transactional and report failed synchronization.

**Acceptance:** choose a later photo as cover; catalog and initial vehicle detail agree after reload; failures cannot report successful completion with mismatched cover state.

### F08 — High: Contact reports success without delivering the message

**Evidence:** `src/routes/contact.tsx:70` validates input and uses a timer to show “Message sent” and a promised response. There is no API call, persistence, or email dispatch.

**Action:** implement delivery to a real monitored destination with error handling, or replace the form with accurate configured contact links. A full support inbox is optional.

**Acceptance:** a successful submission has a durable delivered/saved result; failure never displays success.

### F09 — Medium: payment instructions are customer-visible but not admin-manageable

**Evidence:** `/api/payments` reads `payment_methods` labels/instructions and the customer form displays them. No active admin editor/API mutation for payment methods exists. The live configuration contains only `demo-bank-transfer`.

**Action:** add a small Owner/Admin payment-method editor for label, instructions, active state, and any supported payment destination/QR. Keep demo destinations unmistakably marked in defense data. No payment gateway is required.

**Acceptance:** admin updates an instruction, and the customer sees it; disabled methods disappear from new submissions while old recorded payments remain readable.

### F10 — Medium: missing vehicle and category management inputs

**Evidence:** `src/routes/admin.fleet.tsx:393` creates a vehicle without fuel type, reference fuel efficiency or initial odometer. Editing at line 501 only reuses the existing values. Customers display `fuel_type` in `src/components/customer/CustomerPrimitives.tsx:112`; operational context consumes reference fuel efficiency. Categories have API support in `src/routes/api.master-data.ts` but no active category editor was found.

**Action:** add fuel type and initial/current odometer with suitable validation; include reference efficiency if retained in decision-support scope. Add lightweight category management or explicitly freeze the category list. Odometer updates already exist at actual maintenance/release/return stages, so this is an intake/editing gap, not complete absence of mileage entry.

**Acceptance:** create a vehicle entirely from the admin UI and obtain complete customer specifications and truthful readiness/context data without SQL edits.

### F11 — Medium: public contact details and locations are disconnected from administration

**Evidence:** `src/routes/contact.tsx:35,47` and `src/components/site/Footer.tsx:16` hard-code phone, email, hours and public branch/address copy. Operational location edits persist, but do not feed these public details. Operational allocation locations and public collection/delivery addresses are intentionally different concepts.

**Action:** provide one manageable public business-contact source. Explicitly map public locations to operational branches only when appropriate; do not assume every fleet allocation location is a public pickup office.

**Acceptance:** a contact edit propagates to Contact/Footer consistently, without exposing internal operational addresses unintentionally.

### F12 — Medium: there is no active path to reject/withdraw an unconfirmed request

**Evidence:** the booking API dispatches assign/confirm/cancel/release/return (`src/routes/api.bookings.ts:32`); create is customer-only. Cancellation is limited to confirmed bookings without a rental (`src/lib/admin-slice-1.ts:64`). No rejection action or customer draft-withdraw action exists, although customer lifecycle handles Rejected/Cancelled states. The cancellation reason is written to audit data, while customer lifecycle displays no reason for cancellation (`src/lib/customer-lifecycle.ts:106`).

**Impact:** declined or abandoned Draft/Submitted requests have no normal terminal action. Staff-assisted creation/editing is also not implemented, despite older scope documents describing it.

**Action:** supply a constrained rejection/withdrawal process with customer-visible reason/notification. Separately decide whether staff-assisted booking entry belongs to the final scope; do not invent staff edit privileges.

**Acceptance:** resolve an unconfirmed request without database editing, retain history, and communicate its status/reason to the affected customer.

### F13 — Medium: admin queue guidance and counts do not match actual work

**Evidence:** `src/routes/admin.bookings.tsx:247` says confirm then collect payment, but `src/lib/admin-slice-1.ts:52` and the confirmation RPC require verified payment first. “Ready for request review” counts requirements-verified submissions without checking payment. Attention counts at lines 214–236 use only fetched rows, normally the current 25-row server page, alongside the total for all requests.

**Action:** align instructions and readiness labels with the actual lifecycle. Obtain global filtered attention totals from the server or explicitly label page-only counts.

**Acceptance:** paging does not misleadingly change a supposedly global task count; “ready” requests satisfy the action's actual prerequisites.

### F14 — Medium: allocation changes can strand a pending booking

**Evidence:** Fleet's location change directly edits `vehicles.branch_id` (`src/routes/admin.fleet.tsx:321`). The confirmation API automatically assigns the requested vehicle with `p_cross_branch_acknowledged: false` and no note (`src/routes/api.bookings.ts:308`). The assignment/confirmation SQL rejects a different current branch without acknowledgement/note (`20260917064844_enforce_maintenance_readiness_on_booking.sql:68,94`).

**Impact:** moving a vehicle to another operational location after a customer request can make confirmation fail without an admin reconciliation control. This is source-derived and was not reproduced by moving a live vehicle.

**Action:** warn about affected requests and provide an explicit audited reconciliation process for operational location changes while preserving customer delivery addresses.

**Acceptance:** a legitimate location change leaves affected requests reviewable and resolvable from the admin UI.

### F15 — Medium: gallery storage is outside the existing backup/restore coverage

**Evidence:** `src/lib/backup/backup-domain.ts:3` lists only `renter-requirements` and `payment-proofs`. The runner iterates this list. Restore currently requires private buckets, whereas vehicle photos are intentionally public.

**Action:** extend recovery coverage for vehicle media with per-bucket public/private expectations, or explicitly document a separate restore source. Simply adding the public bucket name will conflict with the current restore privacy check.

**Acceptance:** a controlled recovery restores both gallery database rows and the corresponding files; customer images remain usable.

## Additional boundaries and follow-up items

- **Hidden unfinished pages:** `AdminShell.tsx:331` redirects `/admin/settings`, `/admin/customers`, and `/admin/profile` away. Their inert Settings buttons, mock customer totals and local-storage admin profile are not active supported features. Remove/replace this dead implementation before exposing it. Users & Roles provides real account reads and role edits, but not customer CRM/profile editing.
- **Role administration:** `/api/admin-users` allows role updates without an explicit self-demotion/last-owner check in the handler. Inspect live database guards before asserting the last administrator can be removed. Account suspension/invitations are not supported by this UI; they are scope decisions, not automatically promised functions.
- **Authorization scope drift:** source allows staff to read some reports/analytics/allocation endpoints while old role specifications forbid them. Reconcile against the latest accepted role scope and verify with actual staff/customer sessions before treating this as an access-control defect.
- **Fixed policy scope:** two standard requirement types, next-day booking lead time, and delivery-only request entry are explicit implementation choices. They do not each require a settings screen. Document the chosen supported policy; do not claim flexible configuration that is absent.
- **Financial boundaries:** final settlement, refunds, deposits and penalties remain outside the simplified implementation. This audit does not recommend adding an accounting subsystem merely to close a catalog-management gap.
- **Advisory transfer approval:** approving an allocation recommendation records a decision; actual operational location change happens in Fleet. Keep this distinction visible and avoid implying that approval dispatches or physically moves a vehicle.
- **Customer refresh:** customer booking pages load on entry and after their own actions; no live subscription/polling was found. Verify the refresh experience during an admin/customer demonstration before promising immediate updates.

## Coverage summary

| Area | Current connection found | Outstanding concern |
| --- | --- | --- |
| Daily reference rate | Fleet save → vehicles.daily_rate → catalog/Finder | Agreed payment basis is separate and missing |
| Vehicle photos | Admin upload/cover/remove → storage + gallery | Dated reads, replacement order, initial cover, atomicity, backups |
| Specifications/categories | Database-backed customer facts | Missing intake/editor controls |
| Customer identity | Customer profile API persists own profile; booking reads join it | No supported separate customer-management page |
| Requirements | Upload, review, replacement reasons, own-document protection paths | Fixed supported types; full role-session mutation test not performed |
| Payment | Proof upload, manual review, customer status/replacement reason | Amount source and method management |
| Booking/calendar | Database-backed requests and schedule | Unconfirmed terminal actions, misleading copy/counts, allocation changes |
| Return/maintenance | Local UI/API/migrations exist | Missing deployment and inconsistent readiness/inspection handoff |
| Notifications | Recipient-scoped reads, read state, email preference mutation | Cancellation event/reason communication; delivery not exercised |
| Dashboard/reports | Server-derived operational records | Depends on correct lifecycle and accepted role scope |
| Forecast/allocation/context | Persisted inputs/outputs, advisory admin decisions | Readiness inputs and missing reference efficiency |
| Business contact | Public page and footer exist | Hard-coded data; nonfunctional message delivery |
| Users | Persisted role changes | Limited management scope and guard review |
| Recovery | Database/private-document backup implementation | New public media excluded; restore not run |

## Recommended implementation order

1. Reconcile deployed inspection/maintenance schema and shared readiness, including release and the interrupted maintenance handoff (F01–F03).
2. Repair gallery retrieval and the replace/cover operations (F05–F07).
3. Establish a simple, explicit payment amount and payment-method management path consistent with the chosen manual-payment scope (F04, F09).
4. Complete vehicle intake and public contact management; repair or remove the misleading contact form (F08, F10–F11). **Complete.**
5. Complete request resolution and location-change handling; correct queue wording/counts (F12–F14).
6. Include gallery recovery and run controlled cross-role workflow demonstrations with explicit before/after evidence (F15). **Gallery recovery coverage is complete; the demonstration remains.**

For each delivered field, completion means an authorized person can edit it, reload it from persistence, see the correct effect on the other interface, preserve existing records where appropriate, and receive an honest error when a save/read fails. A button, table column, migration file, or passing build alone is insufficient.
