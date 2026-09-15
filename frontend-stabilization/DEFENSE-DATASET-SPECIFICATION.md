# Defense Dataset Specification

Date: 2026-09-15
Repository branch: `stabilization/frontend-rebuild`
Production project: `vkfacfjkwomhfvrieaza`
Baseline verification: `frontend-stabilization/PRODUCTION-SUPABASE-BASELINE-VERIFICATION.md`
Baseline verification commit: `886a64d15e352a167783779cb413528a208a5bd3`
Revision starting point: `36348396f8f25335cb40ff9043f617d591643700`

This document is a design and execution specification only. It does not authorize data creation, and no Auth users, profiles, bookings, requirements, payments, rentals, maintenance rows, historical rows, notifications, audit events, or Decision Support outputs are created by this specification.

## Purpose

The final defense dataset should make the Customer, Owner/Admin, Operations Staff, Reports, Calendar, Maintenance, and Decision Support surfaces demonstrable without depending on live data entry during the defense. It should remain small enough that every account, booking, rental, document, payment, maintenance record, and historical row has a known reason to exist.

The design is based on the current implementation and migrations, including the contracts in:

- `src/lib/auth.ts` and `src/lib/auth.server.ts`;
- `src/lib/admin-reports.ts` and `src/lib/admin-reports.server.ts`;
- `src/lib/forecasting.server.ts`;
- `src/lib/supply-evaluation.server.ts` and `src/lib/allocation-recommendation.server.ts`;
- `src/lib/vehicle-analytics.server.ts`;
- `src/lib/admin-dashboard.ts`, `src/lib/admin-calendar.ts`, and the maintenance modules;
- the canonical notification and audit triggers in `supabase/migrations/`.

The production project remains the only hosted Supabase environment. Existing migration reference rows, including the canonical `DEV-*` vehicle identifiers, are reference data and are not defense residue.

## Design principles

- Use the smallest population that covers the implemented workflows and panel questions.
- Use only canonical roles and lifecycle states.
- Use clearly synthetic names, contact values, documents, and payment proofs. No real identity documents, IDs, phone numbers, or payment information will be used.
- Keep current workflow data, controlled historical data, and derived analytics outputs separate in provenance.
- Prefer application workflows for current records. Use controlled historical generation only for bounded time-series coverage that cannot reasonably be reproduced through the UI.
- Never hand-author forecasts, supply evaluations, allocation recommendations, notifications, or audit events.
- Avoid rejected and cancelled bookings in the final target because the current application has no supported canonical reject/cancel workflow or corresponding booking audit path. Do not create those rows by direct status edits merely to fill a screen.
- Do not use `Ready`, `Completed`, or `Settled` as booking, requirement, payment, or rental states. `Completed` is retained only where it is a canonical maintenance status.
- Do not add branches, categories, roles, schema objects, migrations, or business rules.
- Do not use `QA-*` or `VS*` identifiers for defense data. `DEV-*` identifiers already present on canonical migration reference vehicles remain unchanged.

## Account population

The revised final population is **21 Auth users and 21 profiles**. It is intentionally larger than a compact test matrix so the panel can see a believable registration funnel rather than a population in which every customer reaches a successful rental.

| Role | Count | Purpose | Creation method |
| --- | ---: | --- | --- |
| Owner/Admin | 1 | Performs requirements/payment review, vehicle assignment and confirmation, release/return, maintenance actions, Reports, and Decision Support generation. | Privileged account provisioning, separately authorized. |
| Operations Staff | 2 | Provides two realistic staff sessions for Dashboard, booking/calendar, Notifications, and Reports read surfaces. | Privileged account provisioning with the canonical role; public signup cannot create this role. |
| Customer/Renter | 18 | Uneven mix of registered-only accounts, one-time renters, occasional repeat renters, frequent repeat renters, and current workflow personas. | Normal application signup workflow. |
| **Total** | **21** | A small operating population with a natural funnel and no artificial one-row-per-customer rule. | — |

The two Operations Staff accounts are intentionally not used as substitute Owners. The current authorization model allows them to view the operational surfaces but restricts users, maintenance, requirements, payments, fleet mutation, and Decision Support actions to Owner/Admin. The single Owner/Admin account is therefore necessary for the complete defense path.

All accounts must be Active and use synthetic `.test` contact values. Credentials are execution-time secrets and must not be written into this document, source files, or committed configuration.

Customer behavior is intentionally uneven. The booking distribution is a sanity-check grouping, not a set of mutually exclusive business roles:

- Four customers have zero bookings: C15–C18. They are valid registered accounts with no Requirements, Payments, Rentals, or booking rows.
- Three customers have exactly one booking: C02, C06, and C13.
- Four customers have exactly two bookings: C07, C10, C11, and C12.
- Four customers have exactly three bookings: C03, C04, C05, and C14.
- Three customers are frequent repeat renters: C01 has eight total bookings, C08 has seven, and C09 has seven.

The current-scenario group is C01–C09, the historical-only group is C10–C14, and the registered-only group is C15–C18. These dimensions overlap with repeat behavior where appropriate. In particular, C01, C08, and C09 are both current-scenario customers and frequent repeat renters.

## Customer personas

The following labels are specification-only scenario labels. They are not required to be stored in business names or identifiers. All names are synthetic, and all contact/identity/payment values must be generated placeholders.

| Label | Synthetic persona | Branch affinity | Current scenario | Historical returned target | Current bookings | Repeat/demo purpose |
| --- | --- | --- | --- | ---: | ---: | --- |
| C01 | Ari Santos | Taft, Manila | Confirmed future booking; Verified requirements and payment. | 7 | 1 | Frequent repeat renter and upcoming successful path. |
| C02 | Bea Navarro | Antipolo, Rizal | Submitted booking with no requirement set. | 0 | 1 | First-time, one-booking incomplete funnel. |
| C03 | Celine Rivera | Taft, Manila | Submitted booking; Requirements Pending Review. | 2 | 1 | Occasional repeat renter and review queue example. |
| C04 | Diego Cruz | Antipolo, Rizal | Submitted booking; Requirements Needs Resubmission. | 2 | 1 | Occasional repeat renter and requirements correction. |
| C05 | Elena Lim | Taft, Manila | Submitted booking; Requirements Verified and no Payment yet. | 2 | 1 | Occasional repeat renter and payment-actionable path; completed requirements correction history. |
| C06 | Felix Go | Antipolo, Rizal | Submitted booking; Payment Pending Verification. | 0 | 1 | First-time, one-booking payment review path. |
| C07 | Gia Ramos | Taft, Manila | Submitted booking; Payment Needs Resubmission. | 1 | 1 | Occasional repeat renter and payment correction. |
| C08 | Hana Villanueva | Antipolo, Rizal | Confirmed booking with one active rental. | 6 | 1 | Frequent repeat renter and active-rental path. |
| C09 | Ivo Castillo | Taft, Manila | Confirmed booking with one returned rental. | 6 | 1 | Frequent repeat renter, return path, and richest customer history. |
| C10 | Jules Mendoza | Antipolo, Rizal | No current booking. | 2 | 0 | Historical-only occasional repeat renter. |
| C11 | Kira Bautista | Taft, Manila | No current booking. | 2 | 0 | Historical-only occasional repeat renter. |
| C12 | Leo Mercado | Antipolo, Rizal | No current booking. | 2 | 0 | Historical-only occasional repeat renter. |
| C13 | Mira Salazar | Taft, Manila | No current booking. | 1 | 0 | Historical-only one-time renter. |
| C14 | Nico Villanueva | Antipolo, Rizal | No current booking. | 3 | 0 | Historical-only repeat renter with three returned rentals. |
| C15 | Quinn Reyes | Taft, Manila | Registered account; no booking. | 0 | 0 | Intentional registration drop-off; not customer-facingly labelled dormant or unused. |
| C16 | Rina Flores | Antipolo, Rizal | Registered account; no booking. | 0 | 0 | Intentional registration drop-off; not customer-facingly labelled dormant or unused. |
| C17 | Sol Navarro | Taft, Manila | Registered account; no booking. | 0 | 0 | Intentional registration drop-off; not customer-facingly labelled dormant or unused. |
| C18 | Tori Alcantara | Antipolo, Rizal | Registered account; no booking. | 0 | 0 | Intentional registration drop-off; not customer-facingly labelled dormant or unused. |

The personas show a natural funnel: some accounts stop at registration, some submit only one booking, some progress through review/payment, and a smaller frequent-repeat group supplies most historical activity. A single customer may own several historical rentals, but current workflow rows should not be duplicated merely to increase volume.

## Booking distribution by Customer

The Customer-level distribution is exact and reconciles the unchanged booking targets:

| Label | Current booking count | Historical returned booking count | Total bookings | Primary role |
| --- | ---: | ---: | ---: | --- |
| C01 | 1 | 7 | 8 | Frequent repeat renter; confirmed future booking. |
| C02 | 1 | 0 | 1 | First-time incomplete workflow. |
| C03 | 1 | 2 | 3 | Requirements Pending Review. |
| C04 | 1 | 2 | 3 | Requirements Needs Resubmission. |
| C05 | 1 | 2 | 3 | Verified requirements; payment actionable. |
| C06 | 1 | 0 | 1 | Payment Pending Verification. |
| C07 | 1 | 1 | 2 | Payment Needs Resubmission. |
| C08 | 1 | 6 | 7 | Frequent repeat renter; active rental. |
| C09 | 1 | 6 | 7 | Frequent repeat renter; returned rental. |
| C10 | 0 | 2 | 2 | Historical-only occasional repeat renter. |
| C11 | 0 | 2 | 2 | Historical-only occasional repeat renter. |
| C12 | 0 | 2 | 2 | Historical-only occasional repeat renter. |
| C13 | 0 | 1 | 1 | Historical-only one-time renter. |
| C14 | 0 | 3 | 3 | Historical-only repeat renter. |
| C15 | 0 | 0 | 0 | Registered-only account. |
| C16 | 0 | 0 | 0 | Registered-only account. |
| C17 | 0 | 0 | 0 | Registered-only account. |
| C18 | 0 | 0 | 0 | Registered-only account. |
| **Total** | **9** | **36** | **45** | — |

## Account / booking realism check

The distribution is intentionally uneven but mathematically reconciled:

- Customers: **18**;
- bookings: **45** = 9 current + 36 historical;
- mean bookings per Customer: **2.5** (`45 / 18`);
- median bookings per Customer: **2**;
- Customers with zero bookings: **4** (C15–C18);
- Customers with exactly one booking: **3** (C02, C06, C13);
- repeat renters with at least two total bookings: **11**;
- frequent repeat renters in the planned defense group: **3** (C01, C08, C09).

The mean and median are sanity checks only. The design does not attempt to make the customer distribution mathematically neat or to give every account an equal share of the 36-row historical window.

## Current operational scenarios

The current defense set contains **9 current bookings**: six Submitted bookings and three Confirmed bookings. The three Confirmed bookings cover future, active, and returned states without inventing a separate rental status.

| Current state | Count | Personas | Required related state |
| --- | ---: | --- | --- |
| Submitted | 6 | C02–C07 | Covers first-time submission, pending requirements review, requirements correction, payment-actionable, payment pending verification, and payment correction. |
| Confirmed future booking | 1 | C01 | Assigned vehicle, verified requirements, verified payment, pickup and return in the future, no rental yet. |
| Active rental | 1 | C08 | Confirmed booking, assigned vehicle, verified requirements/payment, one rental with `started_at` set and `ended_at` null. |
| Returned rental | 1 | C09 | Confirmed booking, assigned vehicle, verified requirements/payment, one rental with both start and end timestamps. |
| Rejected or Cancelled | 0 | — | Excluded because no supported canonical booking mutation and audit/notification path exists for these states. |
| **Total current bookings** | **9** | — | — |

Current booking distribution is five Taft requests/bookings (C01, C03, C05, C07, C09) and four Antipolo requests/bookings (C02, C04, C06, C08). The current schedule must be chosen after the historical window so future, active, and recently returned scenarios cannot alter the six-week forecast input window.

The requirements and payment matrix is:

| Persona | Requirement state | Payment state | Demonstrated surface |
| --- | --- | --- | --- |
| C01 | Verified | Verified | Confirmation and upcoming pickup. |
| C02 | Not Submitted by absence of a requirement set | No payment | First-time customer path. |
| C03 | Pending Review | No payment | Owner/Admin review queue. |
| C04 | Needs Resubmission | No payment | Correction request with a reason. |
| C05 | Verified after one correction cycle | No payment | Verified requirements with payment action available. |
| C06 | Verified | Pending Verification | Payment review queue with synthetic proof. |
| C07 | Verified | Needs Resubmission | Payment correction request with a reason. |
| C08 | Verified | Verified | Active rental. |
| C09 | Verified | Verified | Returned rental and customer history. |

This produces **8 requirement sets** and **5 payment rows**. Requirements use the two canonical document types, `Valid Government ID` and `Driver's License`. Payment proofs and documents are synthetic objects created only in the authorized execution phase. C02 must use the application’s canonical Not Submitted behavior rather than a fabricated status value.

Confirmation, release, and return must be performed through the existing Owner/Admin workflows. The confirmation gate must remain meaningful: assigned vehicle, verified requirements, verified payment, and conflict checks must all pass before C01, C08, or C09 is confirmed.

## Historical rental coverage

The minimum mathematical requirement for the WMA forecast implementation is three complete weekly buckets after the trustworthy forecast coverage week. The current week is excluded. A pair with fewer than three weekly buckets is reported as `Insufficient historical data`. Canonical active branch/category pairs are seeded into the extraction map, so zero-demand weeks are retained rather than silently omitted.

The recommended history is **six complete Manila weeks** and **36 historical returned bookings with 36 matching returned rental transactions**. Six weeks is deliberately larger than the three-week minimum: it gives Reports a meaningful range, gives vehicle analytics several rental intervals, shows demand change over time, and leaves enough variation to demonstrate a real shortage/surplus calculation without creating arbitrary volume.

The six-week window must begin at the first trustworthy Monday after `forecast_demand_coverage.tracking_started_at` and must end before the current in-progress week used for forecast generation. The execution team must wait for those weeks to complete; it must not backdate history before the configured coverage start or pretend that an incomplete week is complete.

Target distribution for the 36 historical rows:

| Branch | Category | Historical returned bookings | Canonical vehicle coverage | Analytical purpose |
| --- | --- | ---: | --- | --- |
| Taft, Manila | Economy | 12 | Toyota Wigo and Mitsubishi Mirage | Stable two-per-week demand using both Economy vehicles. |
| Taft, Manila | Sedan | 9 | Honda City | Recent two-per-week demand creates a controlled shortage against one local Sedan vehicle. |
| Antipolo, Rizal | Sedan | 3 | Toyota Vios | Demand occurs in the first three weeks only, leaving recent forecast demand at zero and creating a source surplus. |
| Taft, Manila | SUV | 2 | Ford Everest | Non-Economy branch/category coverage. |
| Antipolo, Rizal | SUV | 2 | Toyota Rush | Non-Economy branch/category coverage. |
| Taft, Manila | MPV | 2 | Toyota Innova | Non-Economy branch/category coverage. |
| Antipolo, Rizal | MPV | 2 | Toyota Avanza | Non-Economy branch/category coverage. |
| Taft, Manila | Van | 1 | Toyota Hiace | Van utilization and maintenance/report context. |
| Antipolo, Rizal | Van | 1 | Nissan Urvan | Antipolo maintenance/readiness context. |
| Taft, Manila | Pickup | 1 | Toyota Hilux | Pickup utilization coverage. |
| Antipolo, Rizal | Pickup | 1 | Ford Ranger | Pickup utilization and maintenance transition context. |
| Antipolo, Rizal | Economy | 0 | No canonical Antipolo Economy vehicle | Intentional zero-demand canonical pair; must not cause an invented vehicle. |
| **Total** | — | **36** | **All 12 canonical vehicles used at least once** | — |

The six weekly totals are six returned bookings per week. The Taft Economy series is `[2, 2, 2, 2, 2, 2]`; the Taft Sedan series is `[1, 1, 1, 2, 2, 2]`; the Antipolo Sedan series is `[1, 1, 1, 0, 0, 0]`. The remaining 12 rows are distributed two per week across the SUV, MPV, Van, and Pickup pairs to meet the table totals. The exact dates should vary across the week, with one-to-three-day rental durations and sequential, non-overlapping assignments for single-vehicle categories.

Customer ownership is a separate dimension from the branch/category plan. The generator must assign the exact Customer counts in the booking-distribution table to those existing 36 scheduled rows without changing the weekly, branch, category, or vehicle totals. Historical assignments must be sequenced so a Customer never has two overlapping rentals. C01, C08, and C09 may carry substantial historical volume, but their current future/active/returned scenarios are scheduled after H6 and do not alter the trusted forecast window. C10–C14 provide history without current bookings, while C15–C18 receive no booking, requirement, payment, rental, or storage rows.

Every historical booking remains `Confirmed`, has a valid assigned vehicle, and has one matching rental with a non-null `ended_at`. Historical records do not receive unnecessary requirements, payment proofs, or customer-facing correction stories. Those tables are not inputs to Reports or forecasting and would make provenance harder to defend.

## Branch distribution

The canonical branches remain exactly:

- Taft, Manila;
- Antipolo, Rizal.

The current account focus is five personas per branch. Current bookings are five Taft and four Antipolo. Historical rentals are intentionally Taft-heavy at 27 rows versus nine Antipolo rows because the Taft Economy and Taft Sedan patterns are the controlled high-demand examples, not because Antipolo is ignored.

Both branches appear in historical rentals, current bookings, maintenance context, reports, calendar data, and the allocation scenario. No branch is added to improve a metric.

## Fleet state

The 12 canonical vehicles remain unchanged. The execution plan uses the existing reference rows as follows:

| Fleet condition at defense time | Target assignment |
| --- | --- |
| Available | Keep both Taft Economy vehicles and the Antipolo Toyota Vios available for the supply/allocation demonstration unless a derived eligibility check legitimately excludes one. Most other vehicles also remain available. |
| Future-assigned | Assign C01 to a Taft vehicle outside the allocation Sedan pair, such as the Ford Everest, with a non-overlapping future window. |
| Active rental | Assign C08 to the Antipolo Toyota Rush. The rental has `started_at` and no `ended_at`. |
| Returned | Use the Taft Toyota Innova for C09’s recent returned rental. It is available again after return. |
| Maintenance-blocked | Keep the current Open blocking maintenance record on the Antipolo Nissan Urvan, which is not used by the active rental or the allocation source. |
| Historical use | Use all 12 vehicles at least once across the 36 returned rentals, with no overlapping assignment on a vehicle. |

The current data must not make every vehicle busy. The active rental, future reservation, and open maintenance record are enough to make availability and readiness screens visibly non-trivial while leaving a clear available fleet.

The migration-established operational state events are retained as the canonical baseline. Because the historical window begins after the configured tracking start, the initial active event for each vehicle should provide Complete analytics coverage for that window. No extra state events should be added merely to increase row counts. If an execution-time coverage query shows a gap, execution must pause for a bounded Lead-approved correction rather than silently fabricating state history.

## Maintenance coverage

The target is **3 maintenance records**, all using canonical statuses:

1. One historical `Completed` preventive service on the Toyota Hiace, non-blocking, with a coherent service timestamp and a next-service date/odometer after the reporting window.
2. One historical `Cancelled` service on the Ford Ranger, retained only to make the maintenance status and Reports transition visible.
3. One current `Open` blocking service on the Nissan Urvan, producing a genuine readiness-attention condition and an operational maintenance notification after the reminder processor runs.

The current Open record must not overlap the active rental. The completed and cancelled records must not make their vehicles unavailable at defense time. `Completed` here is a supported maintenance status; it is not introduced as a booking, payment, or rental lifecycle state.

The current maintenance record should be created and transitioned through the Owner/Admin maintenance workflow. The two historical maintenance timestamps may require the bounded historical generator if the application workflow cannot preserve completed historical timing. No maintenance audit or notification row is to be inserted by hand.

## Requirements scenarios

The eight requirement sets cover:

- C03: Pending Review with both synthetic document types present;
- C04: Needs Resubmission with one clear correction reason;
- C05: one prior review requiring correction followed by a final Verified review;
- C01, C06, C07, C08, and C09: Verified;
- C02: no requirement set, showing the canonical Not Submitted state.

The C04 correction remains visibly actionable at freeze. C05 proves that a customer can correct a requirement issue successfully without making every customer a correction case. The execution must use the actual upload, review, resubmission, and replacement-document paths. The files must contain synthetic placeholder content only.

## Payment scenarios

The single migration-established active demo payment method is used. The target payment rows are:

- C06: Pending Verification with a synthetic proof;
- C07: Needs Resubmission with a specific correction reason;
- C01, C08, and C09: Verified payments that satisfy confirmation/release gates;
- C05: no payment row yet, leaving the payment action available after requirements verification.

This yields five payment rows. C07 remains a useful visible correction case at freeze. Proofs are uploaded through the application storage flow only after authorization. No real bank details, payment reference, or proof image is used.

## Reports coverage

The proposed rows support meaningful outputs without metric inflation:

| Reports output | Supporting data | Expected defense value |
| --- | --- | --- |
| Booking volume and status breakdown | 9 current bookings plus 36 historical confirmed bookings, with created dates selected for the report window | Shows Submitted and Confirmed volume and the real absence of rejected/cancelled workflow rows. |
| Rental started/completed/active | 36 historical returned rentals, one current returned rental, one active rental | Demonstrates completed rental history and current operational activity. |
| Branch and category performance | Taft/Antipolo distribution across six categories and 12 vehicles | Shows comparative demand rather than one-branch-only totals. |
| Vehicle utilization | Six weekly periods, varied one-to-three-day rentals, all vehicles used | Produces non-zero utilization and idle variation when the state coverage is Complete. |
| Maintenance started/completed/cancelled and blocking workload | Three maintenance records across all three canonical maintenance statuses | Demonstrates maintenance history and current readiness impact. |
| Fleet availability/readiness | One active rental, one future reservation, one current blocking maintenance record, and otherwise available vehicles | Makes Dashboard and maintenance attention metrics visibly useful. |

The defense report should use a range covering H1 through H6, not only the default short recent range. The report implementation filters booking requests by `created_at` and rental/maintenance metrics by their operational timestamps, so the execution manifest must keep those timestamps coherent with the selected report range. The application has no invented financial-report requirement beyond the payment workflow itself.

## Decision Support requirements

The implementation findings and target output shape are:

- **Forecast minimum:** three complete weekly arrays after trustworthy coverage. The in-progress week is excluded. Fewer than three arrays produces `Insufficient historical data`.
- **Recommended forecast history:** six complete weeks. The 36-row plan gives six buckets for every canonical branch/category pair; the Antipolo Economy pair remains a legitimate zero-demand pair with no invented vehicle.
- **Forecast run:** one Owner/Admin WMA run after H6 is complete. With all 12 pairs and three horizons, the target is 36 forecast rows and 108 forecast-input rows. Forecasted demand and required units must come from `src/lib/forecasting.server.ts`; neither may be typed into the database.
- **MAPE:** initially null or limited. MAPE becomes meaningful only when positive actual demand finalizes a horizon-one forecast that was generated before its target week. It must be produced by later weekly finalization, never fabricated for the defense.
- **Supply evaluation:** evaluate each forecast through the application service. The target is up to 36 immutable supply evaluations, one per forecast. The Taft Sedan series produces a recent WMA requirement of approximately two units against one local vehicle; the Antipolo Sedan series produces zero recent demand against one available vehicle. Exact projected supply can be lower if a legitimate readiness, booking, rental, or maintenance conflict exists.
- **Allocation recommendation:** generate one immutable batch from the latest supply evaluations. The intended Taft-Sedan shortage and Antipolo-Sedan surplus can produce up to three horizon-matched recommendations, each with revalidated vehicle candidates. The actual count is derived and may be lower if eligibility or conflicts suppress a candidate.
- **Vehicle analytics:** use the H1-H6 range and verify Complete state coverage before relying on utilization percentages. Rental days, idle classification, and allocation candidate idle days must be calculated by the application services.

The target is useful even if some low-volume branch/category pairs have zero recent demand. It is not acceptable to replace an `Insufficient historical data` or eligibility result with a manually inserted value.

## Audit / notification coverage

Audit and notification evidence must be a consequence of the real workflows:

- Customer booking creation creates booking-created evidence for C02–C07 and the other current bookings as applicable.
- Requirement submission, resubmission, review, Needs Resubmission, and Verified transitions create the canonical requirement evidence for C03–C05 and the verified customers.
- Payment submission, resubmission, review, Needs Resubmission, and Verified transitions create the canonical payment evidence for C06, C07, C01, C08, and C09.
- Assignment, confirmation, release, and return create the corresponding booking/rental audit chain for C01, C08, and C09.
- Maintenance creation and status transitions create the canonical maintenance audit chain for the three planned records.
- The application’s notification triggers should notify internal reviewers for new bookings, requirement submissions, and payment submissions; notify customers about review outcomes; and notify C01 after confirmation.
- The scheduled notification cycle should be run after the current set exists. The current Open blocking maintenance should produce a maintenance-attention condition for the Owner/Admin. A low-availability condition may be produced for a branch if the canonical threshold is crossed. Upcoming pickup/return reminders may be produced by choosing execution-time timestamps inside the real 24-hour reminder window.

Notification preferences and operational conditions must be reconciled by the existing processor. Audit events and notifications are not fixed-count targets and must not be manually inserted. The processor is idempotent; rerunning it should reconcile rather than duplicate evidence.

## Creation-method matrix

| Class | Dataset component | Target | Method and boundary |
| --- | --- | ---: | --- |
| A. Application workflow | Owner/Admin, Operations Staff, and Customer accounts/profiles | 21 | 18 Customer accounts through signup; privileged roles through an explicitly authorized account-provisioning workflow because public signup defaults to Customer/Renter. Four Customers intentionally stop at registration. |
| A. Application workflow | Current bookings | 9 | Customer booking flow, with no direct status fabrication. |
| A. Application workflow | Current requirement sets/documents/reviews | 8 sets | Upload and review through the application; one visible current Needs Resubmission case and one completed correction history. |
| A. Application workflow | Current payments/proofs/reviews | 5 payments | Payment submission and review through the application; one visible Needs Resubmission case. |
| A. Application workflow | Assignment, confirmation, release, and return | 3 confirmed booking lifecycles | Owner/Admin actions for C01, C08, and C09; one future, one active, one returned. |
| A. Application workflow | Current maintenance | 1 Open record | Owner/Admin maintenance workflow, with real readiness and notification reconciliation. |
| A. Application workflow | Notifications and audit | Derived | Generated by the current workflows and scheduled processor; never hand-authored. |
| B. Controlled historical generation | Historical booking rows and matching returned rental rows | 36 + 36 | A bounded, idempotent generator after H6, with exact week/branch/category/vehicle/customer mapping and no QA fixture naming. Used because reproducing six completed weeks through live UI actions is unreasonable and would create unnecessary notification noise. |
| B. Controlled historical generation | Historical maintenance timing | 2 records | Only if the normal maintenance workflow cannot preserve historical service timestamps needed by Reports; no extra state or audit rows. |
| B. Controlled historical generation | Vehicle state events | 0 planned additions | Canonical migration-established initial events should cover H1-H6. Stop for Lead review if a read-only coverage check disproves that assumption. |
| C. Derived application output | Forecast run, forecasts, and inputs | 1 / 36 / 108 target | Owner/Admin forecast service with an idempotency key. No direct inserts. |
| C. Derived application output | Supply evaluations | Up to 36 | Application service, one per forecast, immutable snapshots. |
| C. Derived application output | Allocation recommendation batches/recommendations | 1 / up to 3 | Application service using latest evaluations and candidate revalidation. |
| C. Derived application output | MAPE and later forecast actualization | Later cadence | Generated only after target weeks complete; no initial fabricated values. |

The only controlled historical exception is the six-week analytical coverage and, if required by timestamp limitations, two historical maintenance records. It is not a generic fixture load and must be reviewed against the exact project ref before execution.

## Dataset storyboard

1. **Customer landing and signup:** C15–C18 can be shown as valid registered Customers with no booking history, while C02 can be shown as a first-time customer with a Submitted booking and no requirements submitted. C03 can be shown as the same workflow after documents are uploaded and awaiting Owner/Admin review.
2. **Requirements review:** the Owner/Admin opens C03’s Pending Review set, then opens C04’s Needs Resubmission reason. C05 demonstrates a completed correction path and a final Verified state.
3. **Payment review:** C06 appears in Pending Verification with a synthetic proof. C07 appears in Needs Resubmission with a correction reason. C05 remains actionable because no payment has been submitted after requirements verification.
4. **Booking confirmation:** C01 shows the full successful path: Verified requirements, Verified payment, assigned vehicle, and Confirmed future booking.
5. **Calendar and Dashboard:** Submitted bookings create reservation visibility; C01 creates future pickup/return events; C08 creates active-rental events; maintenance creates current service attention; the remaining fleet visibly remains available.
6. **Active rental:** C08 demonstrates a released vehicle with an active rental and no `ended_at`. The panel can show the assignment and current rental details without creating a transaction live.
7. **Return and customer history:** C09 demonstrates the canonical return closure and a returned rental. C10–C14 demonstrate historical repeat activity without current bookings, while C01, C08, and C09 show that frequent repeat renters can also be in current operational scenarios.
8. **Reports:** an H1-H6 range shows six complete weeks, both branches, all categories with the intentional Antipolo Economy zero pair, varied utilization, and maintenance transitions.
9. **Decision Support:** after H6, the Owner/Admin generates the WMA forecast, evaluates supply, and generates the advisory allocation batch. The Taft Sedan shortage and Antipolo Sedan surplus are explainable from the source rows.
10. **Staff view:** either Operations Staff account can inspect Dashboard, bookings, Calendar, Notifications, and Reports without receiving permissions that the role does not have.
11. **Natural funnel:** the Customer list visibly contains registration drop-off, one-time renters, occasional repeat renters, and a smaller frequent-repeat group; not every account reaches Requirements, Payment, Confirmation, or Rental.

The storyboard is designed so the panel can inspect existing rows and derived outputs. Live creation during the defense is optional, not required.

## Final target counts

| Dataset class | Exact target / expected shape | Notes |
| --- | ---: | --- |
| Auth users | 21 | 1 Owner/Admin, 2 Operations Staff, 18 Customer/Renter. |
| Profiles | 21 | One active profile per Auth user. |
| Customers with zero bookings | 4 | C15–C18; no Requirements, Payments, Rentals, or booking rows. |
| Customers with exactly one booking | 3 | C02, C06, and C13. |
| Repeat renters | 11 | At least two total current or historical bookings. |
| Mean bookings per Customer | 2.5 | 45 total bookings divided by 18 Customers. |
| Median bookings per Customer | 2 | Sanity check for the deliberately uneven distribution. |
| Current bookings | 9 | 6 Submitted, 3 Confirmed. |
| Historical returned bookings | 36 | Six complete weeks, all Confirmed with matching returned rentals. |
| Total booking rows after execution | 45 | Current set plus controlled historical set; C09 is the one current returned booking. |
| Requirement sets | 8 | C03 Pending Review, C04 Needs Resubmission, C05/C01/C06/C07/C08/C09 Verified; C02 has no set. |
| Payments | 5 | C06 Pending Verification, C07 Needs Resubmission, C01/C08/C09 Verified. |
| Active rentals | 1 | C08. |
| Returned rentals | 37 | 36 historical plus C09 current returned. |
| Maintenance records | 3 | One Open, one historical Completed, one historical Cancelled. |
| Notifications | Derived, no fixed count | Triggered and reconciled by application workflows and the scheduled processor. |
| Audit events | Derived, no fixed count | Append-only events generated by canonical transitions. |
| Forecast runs | 1 initial target | Generated after six complete weeks. |
| Forecast rows / inputs | 36 / 108 target | Twelve canonical branch/category pairs, three horizons, three inputs per forecast. |
| Supply evaluations | Up to 36 | One immutable evaluation per forecast; eligibility can reduce projected supply. |
| Allocation recommendation batches | 1 | Recommendations and candidates are derived; up to three horizon-matched recommendations expected from the planned Sedan pair. |
| MAPE | Initially null or limited | Becomes meaningful only after later finalization of positive horizon-one actuals. |

The exact number of document and proof objects is not a substitute for workflow verification: current requirement sets use both canonical document types, and current payments use synthetic proofs where the workflow requires them. A replacement upload may create an additional historical object according to the existing storage implementation; it does not change the target requirement-set or payment count.

## Provenance

Every row must be explainable as one of four classes:

1. **Canonical migration reference data:** branches, categories, the 12 `DEV-*` vehicles, the active demo payment method, and the migration-established initial vehicle state events. These rows predate the defense dataset and must not be relabeled or duplicated.
2. **Defense current-state workflow data:** the 21 accounts, nine current bookings, eight requirement sets, five payments, three rental-state examples, and current maintenance record. An execution manifest should map C01–C18 to user IDs, booking IDs, and intended scenario without changing customer-facing names to QA-style markers. C15–C18 must have no child workflow rows.
3. **Controlled historical analytical data:** the 36 historical booking/rental pairs and, only if required, two historical maintenance records. The generator manifest must record H1–H6, source branch/category, vehicle, customer, timestamps, and the reason the row exists. It must be idempotent and scoped to `vkfacfjkwomhfvrieaza`.
4. **Derived application output:** forecast runs, forecast inputs, forecasts, supply evaluations, vehicle snapshots, allocation batches, candidates, decisions, and MAPE. These must be generated by their application services with recorded idempotency keys and never inserted as hand-authored facts.

The execution record should preserve the source commit, target project ref, generation timestamp, manifest version, and verification query results. It must not contain passwords, service-role keys, payment secrets, or real personal information. Existing `DEV-*` vehicle names are canonical reference identifiers; no new QA or VS naming convention is introduced.

## Dataset manifest

After execution, create the future canonical restore and verification map:

`frontend-stabilization/DEFENSE-DATASET-MANIFEST.md`

This file must not be created before the dataset exists. It will eventually record, using safe labels rather than secrets:

- approved account identities for C01–C18 and the Owner/Admin/Staff roles;
- scenario ownership and the intentional no-booking status of C15–C18;
- current booking IDs and their lifecycle scenarios;
- historical booking and rental IDs mapped to H1–H6, branch/category, vehicle, and Customer label;
- maintenance record IDs and their three approved scenarios;
- document and payment-proof object ownership and paths, without file contents or credentials;
- forecast run, forecast, supply-evaluation, allocation-batch, recommendation, and later finalization IDs;
- final expected counts and verification results;
- provenance class for every baseline record.

The manifest becomes the canonical restore/verification map after execution. It is not a second business dataset, must not contain passwords or service-role keys, and must not be used to label customers as test or dormant in customer-facing surfaces.

## Freeze criteria

Before all of the conditions below are satisfied, the dataset status is **DEFENSE DATASET READY**. It must not be described as permanently `FROZEN` while the manifest or reproducibility/restore approval is missing.

A permanent `FROZEN` classification requires all of the following to be verified against the new production project:

- the 21-account role matrix is correct and all accounts are Active;
- C15–C18 have no bookings, Requirements, Payments, Rentals, or other child workflow rows;
- the Customer-level booking distribution sums to 9 current, 36 historical, and 45 total bookings;
- current booking, requirement, payment, rental, and maintenance counts match the target matrix;
- all booking/rental intervals are coherent and no vehicle has an impossible overlap;
- C01, C08, and C09 pass the canonical confirmation/release/return gates;
- H1-H6 are complete, the forecast coverage start is respected, and the 36 historical returned rentals map to the manifest;
- all 12 vehicles and both branches are represented as intended;
- Reports show Complete vehicle analytics coverage for the chosen H1-H6 range;
- forecasts, supply evaluations, and allocation recommendations are generated by services and explain their source inputs;
- notifications and audit events are present only as consequences of canonical workflows or the scheduled processor;
- no QA/VS residue, unexpected accounts, or unrelated runtime records are present;
- synthetic storage objects contain no real identity or payment data;
- application tests/build and read-only verification pass after the data is created.
- `frontend-stabilization/DEFENSE-DATASET-MANIFEST.md` exists and matches the verified database, Auth, Storage, audit, notification, and derived-output identifiers;
- a reproducibility/restore strategy has been designed, explicitly scoped to `vkfacfjkwomhfvrieaza`, and Lead-approved.

After freeze there are no casual edits, cleanup passes, extra demo rows, or ad hoc status changes. Only a bounded, defect-driven correction approved by the Lead is allowed. A correction must record the reason, affected scenario, before/after counts, and whether derived outputs were regenerated. If a source row changes, dependent forecasts/evaluations/recommendations must be regenerated through their normal services.

## Defense Baseline Reproducibility and User Testing

The production project will eventually serve both the approved defense demonstration and controlled group/user testing. The two datasets must be distinguished explicitly.

### A. DEFENSE BASELINE

The Defense Baseline is the intentional dataset described by this specification and identified by the future `DEFENSE-DATASET-MANIFEST.md`. It includes the 21 approved accounts, 45 bookings, current workflow rows, six-week historical rows, maintenance scenarios, synthetic Storage objects, naturally generated audit/notification evidence, and canonically generated Decision Support state. It is the only dataset that may be called the defense baseline.

### B. POST-FREEZE UAT DATA

Post-Freeze UAT Data consists of accounts or records created later by group/user testing against the same production project. UAT activity is not part of the Defense Baseline, must not be silently merged into its counts, and must be recorded separately from the manifest. UAT users must not alter baseline lifecycle rows merely to try a workflow. If the current schema cannot safely distinguish a UAT record from a baseline record, testing must pause until an explicit engineering plan is approved.

Before the baseline is permanently frozen, the team must design and obtain Lead approval for a reproducibility strategy. A future implementation may expose explicit engineering commands such as:

```text
npm run defense:verify
npm run defense:restore
```

Those scripts are not implemented in this revision. No hidden UI shortcut, destructive secret keyboard shortcut, or undocumented reset route is permitted.

Any later restore mechanism must:

- bind to the exact production project ref `vkfacfjkwomhfvrieaza` and refuse an old or ambiguous target;
- require explicit confirmation at execution time and fail closed when the target or manifest does not match;
- protect service credentials and Auth provisioning secrets outside the manifest and tracked repository files;
- restore the approved Defense Baseline, including Auth, Storage, current workflow rows, historical booking/rental rows, maintenance, audit, Notifications, Reports inputs, and derived Decision Support state;
- distinguish baseline records from later UAT records using the approved manifest and a safe allowlist, rather than customer-facing `QA-*` or `VS*` labels;
- regenerate or reconcile derived forecasts, supply evaluations, allocation recommendations, Reports inputs, Notifications, and audit evidence through canonical services where direct restoration would violate provenance;
- never silently delete legitimate baseline accounts, rows, objects, audit events, Notifications, or derived outputs;
- stop and report if UAT data cannot be safely isolated from the approved baseline or if a restore would require an unapproved destructive operation.

The read-only verification command should be designed before restore execution and should compare counts, status matrices, IDs, object ownership, provenance, and the current project ref against the manifest. A restore is not authorized merely because a count happens to match.

## Execution phases

1. **Lead approval and time gate:** approve this specification, record `tracking_started_at`, and schedule H1-H6 only after six complete Manila weeks are available. Confirm the exact project ref and verify the old project is not targeted.
2. **Account bootstrap:** create the single Owner/Admin and two Operations Staff accounts through the authorized privileged path; create the 18 Customer/Renter accounts through normal signup; verify role and account-status boundaries, including the four intentional registered-only accounts.
3. **Historical analytical load:** run the bounded generator for 36 confirmed booking/rental pairs and, only if necessary, the two historical maintenance rows. Validate exact week/branch/category/vehicle/customer mapping and non-overlap before proceeding.
4. **Current workflow creation:** create the nine current bookings and drive requirements, reviews, payments, assignment, confirmation, release, return, and current maintenance through the application. Upload only synthetic documents and payment proofs.
5. **Canonical evidence processing:** run the trusted scheduled notification cycle and verify the resulting notifications and audit trail. Do not insert either table directly.
6. **Derived Decision Support:** generate the WMA forecast, supply evaluations, and allocation batch through Owner/Admin APIs. Record idempotency keys and inspect the generated inputs, snapshots, candidate reasons, and any legitimate insufficient-data/eligibility result.
7. **Verification and Defense Dataset Ready classification:** run count, status, overlap, branch/category, reports, analytics, RLS/access, storage-safety, application smoke, test, and build checks. If the revised specification matches, classify the result as `DEFENSE DATASET READY`; do not call it permanently frozen yet.
8. **Manifest and freeze promotion:** create `frontend-stabilization/DEFENSE-DATASET-MANIFEST.md`, verify it against Auth, Storage, database, audit, Notifications, Reports inputs, and derived outputs, and obtain Lead approval of the reproducibility/restore strategy. Only then may the dataset be classified `FROZEN`.

No phase in this document is to be executed during the specification session. A failure in a migration, schema contract, workflow gate, or derived service is a stop-and-report condition, not permission to edit source, migrations, or production data ad hoc.

## Authorization required

Before execution, the Lead must explicitly authorize:

- creation of the 21 Auth users and profiles, including the four registered-only Customers;
- creation of synthetic requirement documents and payment proofs in the production project;
- the bounded historical generator and its exact manifest;
- the three maintenance scenarios;
- generation of forecasts, supply evaluations, allocation recommendations, and later forecast finalization;
- the verification queries, future manifest creation, and the reproducibility/restore design;
- final promotion from `DEFENSE DATASET READY` to `FROZEN` only after the manifest and restore strategy are verified.

The authorization must name `vkfacfjkwomhfvrieaza`, the branch `stabilization/frontend-rebuild`, the approved specification commit, and the rule that no old project, QA fixtures, defense data outside this manifest, schema edits, deployment, merge, or push to another branch is allowed.

## Readiness

DEFENSE DATASET READY

This is a pre-execution specification classification, not a claim that production data exists and not a permanent `FROZEN` classification. Execution still requires the explicit authorization above; freeze promotion additionally requires the future manifest and Lead-approved reproducibility/restore strategy.
