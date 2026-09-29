# Phased plan for a functional, defense-ready system

Planning baseline: 28 September 2026. Branch: `stabilization/ui-refinement`, including existing uncommitted changes.

This is an implementation plan, not a record of completed fixes. It derives from the [September 28 audit](../codex-context/2026-09-28-defense-readiness-audit.md). The older `mock-defense-refinement-roadmap.md` remains historical context; its completion labels and payment-confirmation rule must not be copied into this plan without current verification.

## Intended result

A customer can find an eligible vehicle, submit a request and documents, receive payment instructions, submit proof and follow the booking. An authorized administrator can review, confirm, release and receive the vehicle, resolve inspection/maintenance, and see consistent records throughout. The same operational data supports explainable demand forecasts, advisory branch allocation and reconciled reports.

Preserve the study's essence: centralized records, fleet visibility, maintenance readiness, customer matching, fixed three-period WMA and human-reviewed allocation. Distinguish a functional rental system from defense readiness: the latter also requires the distinctive decision-support objectives, report evidence, internet deployment and administrative submission requirements.

The attached guideline sets October 2 at 3:00 PM for document submission; the actual defense date is not established here. The phases below are ordered milestones, not a promise that all work fits into four days.

## How to execute each phase

1. Reproduce its open findings on the current source/database before changing code; another ongoing change may have resolved them.
2. Implement a small, reviewable set of related changes. Preserve existing work. Do not combine unrelated redesigns or dependency upgrades.
3. Run relevant logic/integration checks and the phase's customer/admin browser scenario. Verify persisted results and failure behavior.
4. Record the source revision, environment, relevant migrations, scenario inputs and actual outcomes. Use labeled synthetic records for destructive or state-changing test scenarios.
5. Update the feature evidence matrix and manuscript discrepancy register. Mark complete only when the exit gate passes.

Database changes require migration review and controlled validation before application to a shared/deployed database. A feature is not done merely because a migration file exists locally. Small fixes need proportional checks; repeated broad testing is reserved for integration milestones and new regressions.

All phases begin **Not started under this plan**. Existing working features should be retained and verified, not rebuilt.

## Phase overview

| Phase                                         | Outcome                                                                                               | Dependency                                                    | Completion gate                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 0. Baseline and rules                         | A reproducible starting point, resolved immediate policy contradictions and a usable test environment | None                                                          | Build/typecheck baseline, issue triage, permission/lifecycle matrix and identified deployment target                     |
| 1. Rental workflow and access                 | Customer-to-admin request, review, payment and confirmation work with real records                    | Phase 0                                                       | A new request reaches confirmation without manual database repairs; isolation and conflict scenarios pass                |
| 2. Fleet, return and maintenance              | Operational state remains consistent through release, return, inspection and maintenance              | Phase 1                                                       | One rental completes and one maintenance blocker propagates correctly across all consumers                               |
| 3. Forecasting and allocation                 | The main research features work from explainable inputs to a stored admin decision                    | Trusted history decision from Phase 0; readiness from Phase 2 | Reproducible current forecast, supply and allocation scenarios, correct evaluation and honest insufficient-data behavior |
| 4. Reports, reminders and supporting records  | Operational outcomes are visible, reportable and communicated                                         | Relevant Phase 1–3 records                                    | Required report subjects reconcile; reminder, audit and profile scenarios pass                                           |
| 5. Deployment, recovery and defense rehearsal | The tested release can be demonstrated and its claims supported                                       | Phases 1–4                                                    | Public end-to-end rehearsal, recovery evidence, acceptance matrix and manuscript alignment                               |

Start hosting investigation, data-provenance work and manuscript discrepancy tracking in Phase 0. Finish them in the phase that depends on them. Do not postpone discovering a deployment or historical-data problem until Phase 5.

## Phase 0 — Establish a trustworthy baseline

**Tasks**

- [ ] P0.1 Record branch/commit, existing local changes, configured database/environment and deployed version. Identify which recent migrations are actually applied.
- [ ] P0.2 Fix the two audited booking-draft TypeScript errors if still present. Classify the 12 prior test failures into behavior defects, stale assertions and unresolved intended behavior. Do not remove tests simply to obtain a pass.
- [ ] P0.3 Write a single role/action/field permission matrix and lifecycle description. Preserve customer ownership, Owner/Admin financial authority and restricted staff access.
- [ ] P0.4 Resolve the immediate policy questions listed below, recording evidence or a clearly labeled prototype assumption. Existing implementation is evidence of behavior, not automatic proof of client policy.
- [ ] P0.5 Identify the actual public deployment URL and diagnose the configured domain's DNS failure. Confirm a controlled environment for scenario testing and document how database changes reach it.
- [ ] P0.6 Choose a trustworthy real-history or explicitly simulated dataset for forecasting. Inventory its coverage and provenance now; do not change coverage dates merely to satisfy the minimum observations.
- [ ] P0.7 Create a feature acceptance matrix tied to R1–R14 and objectives 1–9, splitting broad requirements into testable features and marking each Implemented-unverified, Passed, Failed, Blocked or Out of scope with a reason.

**Exit gate:** the team can identify the tested version, intended lifecycle, authoritative roles and dataset strategy. TypeScript/build pass; remaining failures are explicitly owned. Unsafe access is handled immediately in Phase 1, and no core policy ambiguity is hidden inside a coding task.

### Decisions to close before dependent changes

| Topic              | Planning baseline                                                                                                         | Decision/evidence still needed                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking inventory  | Submitted requests do not reserve inventory; conflicting confirmed bookings cannot coexist for a vehicle.                 | Reconfirm against current implementation and business requirements.                                                                                         |
| Confirmation       | Preserve the current human payment-review action that may confirm an eligible assigned booking, with explicit exceptions. | Ensure UI, database and explanation agree; avoid restoring the obsolete separate-confirm-only rule accidentally.                                            |
| Pricing            | Preserve a booking-specific quote and exact required amount.                                                              | Establish provenance of one-hour billing allowance, 50% down payment, PHP 3,000 deposit and delivery fee. Explain reference-price versus quote differences. |
| Documents/policies | Secure human review and accessible rental terms are required.                                                             | Supported required documents, policy content and acceptance point; do not publish the unused legacy constants unreviewed.                                   |
| Staff              | Financial proof/quote access and approval stay restricted.                                                                | Whether staff must encode bookings or edit limited coordination fields; enumerate any permitted derived status.                                             |
| Payment reminders  | Payment-related reminders remain a requirement.                                                                           | Choose a recorded due-date/request-reminder rule, recipients and frequency. No invented automatic cancellation, penalty or arbitrary deadline.              |
| Forecast timing    | Keep WMA weights 0.50/0.30/0.20 and three recursive horizons.                                                             | Define forecast origin, target periods and when observations become available so evaluation avoids future-data leakage.                                     |
| Idle duration      | Ranking should represent the stated operational meaning.                                                                  | Agree whether it means calendar time since rental or consecutive eligible idle days; reconcile maintenance downtime with the manuscript.                    |

## Phase 1 — Complete the rental request and approval workflow

**Tasks**

- [ ] P1.1 Fix the payment-quote API's staff-access gap; apply the permission matrix to booking projections, quote reads, proofs and requirement documents. Check APIs directly as well as visible controls.
- [ ] P1.2 Replace the hard-coded customer directory with canonical customer/booking history. Derive trip counts from an explicit definition; omit unsupported spend figures. Make Add customer functional if retained and required.
- [ ] P1.3 Complete Finder-to-booking handoff, including optional budget, seats/luggage, selected dates, maintenance and booking conflicts. Handle eligibility changing after search.
- [ ] P1.4 Connect readable policy/agreement content to the customer workflow. Record an appropriate acknowledgment tied to the terms shown; keep it distinct from staff release acknowledgment. Use the simplest content-management approach that meets the agreed requirement.
- [ ] P1.5 Verify request editing/withdrawal, requirement upload/review/resubmission, quote issuance, payment proof/resubmission and confirmation/exception handling as one workflow. Keep quote and required-payment amounts consistent in both roles.
- [ ] P1.6 Implement the agreed staff coordination actions if required. Enforce field limits on the server; otherwise describe the read-only role accurately and resolve the manuscript promise explicitly.

**Exit scenarios**

- A newly registered customer searches, submits and corrects a request, uploads valid documents, receives a quote, submits proof and sees the resulting confirmation.
- An admin can request document/payment corrections and the customer can recover without creating duplicate records.
- Two competing requests cannot both confirm the same vehicle for overlapping dates. A paid but blocked booking displays a clear exception rather than false success.
- Another customer and restricted staff cannot retrieve protected records or files through direct requests.
- Reloading or switching browsers preserves centrally stored records and gives both sides the same status and amount.

**Milestone:** a functioning request-to-confirmation system. This alone is not defense readiness.

## Phase 2 — Make physical fleet operations reliable

**Tasks**

- [ ] P2.1 Verify release requirements, actual start, odometer/fuel/condition recording and active-rental restrictions.
- [ ] P2.2 Verify physical return, pending inspection, clearance and maintenance scheduling. Clearing one blocker must not clear other reasons a vehicle remains unavailable.
- [ ] P2.3 Reconcile maintenance status semantics, due dates, mileage and preventive targets across database guards and application calculations.
- [ ] P2.4 Align catalog/Finder, assignment, fleet, calendar and projected supply with the same availability rules. Preserve historical records.
- [ ] P2.5 Verify branch/location reconciliation and impacts on pending/confirmed bookings. Explain allocation location versus customer delivery/collection address.
- [ ] P2.6 Correct or clarify utilization/idle calculations, including known historical coverage, maintenance downtime and unknown values. Do not present missing history as zero usage.

**Exit gate:** complete one confirmed rental through release, return, inspection and return-to-service. Demonstrate a second case requiring maintenance, show its exclusion from all relevant workflows, and demonstrate that service completion only removes applicable blockers. Independently reconcile one utilization/idle example.

**Milestone:** a functional operational rental system with reliable fleet records. Financial settlement/refund accounting is not implied by this milestone.

## Phase 3 — Deliver trustworthy forecasting and fleet allocation

**Tasks**

- [ ] P3.1 Establish enough complete, consecutive history with recorded provenance. Keep demo/simulated data identifiable and protect genuine records from contamination. Preserve an explicit insufficient-history case.
- [ ] P3.2 Resolve current-week generation versus pre-period MAPE eligibility. Define a valid origin/cutoff before implementation. If using historical walk-forward functional evaluation, label it as reconstructed evaluation, not forecasts originally issued in the past.
- [ ] P3.3 Correct MAPE grouping by branch/category/week and horizon. Exclude zero actuals from percentage-error calculations while retaining them as observations; report sample counts and the aggregation method.
- [ ] P3.4 Add accessible refresh/recalculation and finalization/evaluation workflows. Handle empty runs consistently. Preserve immutable input/output history.
- [ ] P3.5 Refresh supply after relevant operational changes and distinguish current evidence from historical snapshots. Prevent elapsed-week recommendations from being represented as current actions.
- [ ] P3.6 Bind recommendations to exact runs/evaluations. Verify same-category/week pairing, quantity caps, candidate revalidation and idle ordering; explain shortages that cannot be fulfilled.
- [ ] P3.7 Demonstrate approve, lower-quantity approve and reject. Approval remains advisory; it must not automatically change vehicle location. Show evidence age and review-time changes.
- [ ] P3.8 Verify route/weather/incident/fuel information and its unavailable/stale states on booking/allocation review. Keep source/time/limitations visible and do not imply travel authorization.

**Exit scenarios**

1. Independently calculate one three-week WMA example and reconcile every stored input, decimal forecast and rounded planning quantity.
2. Demonstrate a same-category source surplus/destination shortage, candidate rationale and saved human decision.
3. Demonstrate no compatible donor, no eligible candidates, insufficient history and a newly maintenance-blocked candidate without fabricated fallback output.
4. Recalculate after a meaningful change without overwriting old evidence or presenting it as current.
5. Check MAPE with multiple branch/category series, duplicate runs, zero actuals and valid temporal cutoffs.

**Milestone:** the principal research features can be explained and demonstrated. Weekly booking counts remain planning inputs; do not claim concurrent occupancy optimization, optimal transfers or real-world predictive accuracy from synthetic data.

## Phase 4 — Complete reports, reminders and supporting administration

**Tasks**

- [x] P4.1 Provide report coverage for bookings, verified/submitted payments, maintenance, utilization/idle, branch demand and allocation decisions. Use explicit metric definitions, reporting dates and filters. Implemented and reconciled against the synthetic baseline on 29 September 2026; see `docs/phase-4-decision-support-report-evidence.md`.
- [ ] P4.2 Reconcile each report with underlying records and align dashboard labels. Distinguish verified payment amounts from revenue/profit/final settlement. Show empty and unavailable states honestly.
- [ ] P4.3 Implement the agreed payment reminder and verify pickup/return/overdue/maintenance/low-availability processing. Configure the actual scheduler and test deduplication, corrected schedules and resolved conditions. Pickup, return, overdue, maintenance and low-availability logic has automated coverage; the Vercel cron/server deployment passed Preview and Production route checks, including an authorized Preview processing cycle. The payment-reminder rule is still unresolved. See `docs/phase-4-reminder-deployment-readiness.md`.
- [ ] P4.4 Verify email configuration and observed delivery outcomes with controlled recipients. Keep in-app notification success distinct from queued, provider-accepted and received email. Provider behavior has automated coverage; a controlled live recipient test remains.
- [ ] P4.5 Persist administrative profile changes centrally if the editing feature is retained. Verify account role changes and supported audit coverage; protect continued Owner/Admin access.
- [ ] P4.6 Check exact-record links, pending/error feedback and visible controls across the completed workflows. Limit visual work to usability failures that obstruct these tasks.

**Exit gate:** a report can be generated and reconciled during the walkthrough; every promised report subject has evidence. Scheduled reminders and audit records refer to the correct entities and roles. Report export is optional unless explicitly required; on-screen generation must still be demonstrable.

## Phase 5 — Verify the release and prepare the defense

**Tasks**

- [ ] P5.1 Confirm deployment/database parity and public DNS/HTTPS, authentication, server routes, uploads, cookies and provider configuration on the actual defense URL.
- [ ] P5.2 Reconcile the fixture manifest with reviewed intended data; include nonempty forecast/supply/allocation scenarios. Never relax the verifier just to obtain PASS.
- [ ] P5.3 Run integrated checks and browser rehearsals as customer, staff and Owner/Admin, including mobile customer use and presentation viewport. Preserve results, not only screenshots.
- [ ] P5.4 Demonstrate backup execution and a controlled non-production restore, including required uploaded-file recovery. Record observed recovery results; keep target RPO/RTO separate from measured values.
- [ ] P5.5 Finalize the acceptance matrix. Calculate working-feature coverage from the agreed feature inventory and observed passes; do not use unit-test counts as the guideline's 80% feature percentage.
- [ ] P5.6 Rehearse a 20-minute tool walkthrough: fleet/master data → customer request and review → payment/confirmation → rental return/maintenance → forecast/allocation → report. Use meaningful dummy data and no manual database repair mid-demo.
- [ ] P5.7 Prepare evidence-backed explanations of human authority, WMA, data provenance, context limitations, availability, permissions and recovery.

**Exit gate:** no unresolved defect prevents the core demonstration or leaks protected information; all main objectives have observed acceptance evidence; the public workflow completes; remaining limitations are explicit. Ethics/mock-defense score/document submission remain separate administrative gates.

## Manuscript track — update alongside implementation

After each phase, record the delivered behavior and affected manuscript sections. Consolidate the prose before the document deadline. Preserve the study's objectives and distinguish client-approved rules from prototype assumptions.

Updates include lifecycle/payment sequence, required documents/policy access, permissions, actual PostgreSQL structures, provider names, notification/report coverage, forecast timing/evaluation and recovery claims. Refresh table-of-contents/cross-references after substantive edits. Keep use-case and activity diagrams unchanged until separately requested; record their deferred alignment as an outstanding document item rather than declaring the manuscript fully finalized.

## Evidence register template

| Feature ID / requirement | Scenario and expected outcome                                            | Environment / revision | Observed outcome | Evidence  | Status                     |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------- | ---------------- | --------- | -------------------------- |
| AUTH-01 / R13            | Customer B cannot read Customer A's booking/proof                        | To record              | Not run          | To attach | Implemented-unverified     |
| RENT-01 / R1–R3          | New request reaches confirmation after review                            | To record              | Not run          | To attach | Implemented-unverified     |
| FLEET-01 / R5–R6         | Maintenance blocks all relevant availability consumers                   | To record              | Not run          | To attach | Implemented-unverified     |
| FORECAST-01 / R7         | Stored WMA agrees with independent calculation                           | To record              | Not run          | To attach | Failed/open audit findings |
| ALLOC-01 / R8            | Current compatible shortage/surplus produces explained advisory decision | To record              | Not run          | To attach | Failed/open audit findings |
| REPORT-01 / R9           | Selected-period figures reconcile with records                           | To record              | Not run          | To attach | Partial implementation     |

Expand this template before measuring completion. Preserve failed cases and fixes so evidence reflects what was actually tested.

## Deadline prioritization and deferrals

First protect access control and the complete rental/maintenance workflow. Reserve implementation and rehearsal time for Phase 3 from the outset: forecasting and allocation are central objectives, not optional extras after polish. Bring at least one reconciled report into integration testing early, then finish the remaining promised report coverage.

Investigate hosting and data coverage immediately. Reassess schedule after Phase 0 using remaining confirmed defects and team capacity; do not assign artificial completion dates before that triage. If time becomes constrained, defer new themes, decorative animation, extra contact/settings features, optional export formats and provider expansion. Do not hide core objective failures behind an 80% claim.

No new AI/ML method, live GPS integration, payment gateway, automatic physical-transfer system or comprehensive refund/penalty ledger is added by this plan. Any genuinely required change to approved scope needs its own explicit decision. Implementation, controlled synthetic-data work and the verified server deployment are recorded in the linked evidence files.
