# Defense readiness and system understanding audit

Audit date: 28 September 2026, Asia/Manila.

Confirmed branch: `stabilization/ui-refinement`, including its uncommitted working-tree changes. `main` was not separately audited. Follow-up scope: assess the wider feature set and identify manuscript adjustments that preserve the study's essence. The manuscript is a draft reference, not an instruction to recreate every outdated detail.

**Assessment: not ready to sign off for defense.** The application has substantial operational and decision-support implementation, but the principal forecasting/allocation demonstration is stale, its current historical coverage cannot support fresh forecasts, and several objectives have incomplete or misleading user-facing delivery. This is not a finding that the system is entirely a mockup, nor a measured claim that fewer than 80% of features work. A defensible completion percentage requires an agreed feature inventory and observed acceptance results.

This audit follows the user's request to understand and assess the system. The attached documents are reference evidence, not instructions to modify the system. No application fixes, database mutations, deployments, manuscript changes, use-case changes, or activity-diagram changes were made. Existing working-tree changes were preserved.

## Evidence and limits

- Reference: `/Users/aldrich/Downloads/Capstone-Tool-Guidelines-2026.pdf`, all three pages extracted; defense gates and deadline pages visually checked.
- Reference: `/Users/aldrich/Downloads/Proposal Paper-2.pdf`, 375 pages extracted. Focused review of requirements R1–R14, objectives, scope, algorithm/evaluation sections; objective pages 41–42 visually checked. Physical PDF page numbers are used here. This is not a complete editorial or citation audit of 375 pages.
- Reviewed current local routes, services, algorithm implementations, migrations, tests, product/context documents and previous audit reports. Earlier audits are historical evidence, not proof of the current implementation.
- Queried the configured Supabase project read-only for aggregate state, forecasting coverage, forecast runs, recommendations, backup/recovery evidence, and the existing defense verifier. Service credentials and customer documents are not reproduced here.
- Ran the production build, TypeScript checking, 360 library/script tests, the defense dataset verifier, and a direct MAPE reproduction.
- No authenticated browser walkthrough, role-isolation penetration test, provider integration rehearsal, or deployment/migration parity certification was performed. Source inspection and database rows do not establish end-to-end UI success. Findings about local source may differ from the deployed application.

## What the system currently is

Briah's Car Rental is a React/TypeScript application using TanStack Start and file-based routes. Server handlers use Supabase for authentication, PostgreSQL records and Storage-backed documents. Trusted server database access uses a service-role client; authorization in the handlers is therefore material, in addition to database policies. Business roles are Owner/Admin, Operations Staff and Customer/Renter.

The main customer workflow is vehicle browsing or Find Your Ride, rental dates and trip details, a booking request, requirement documents, payment instructions/quote and payment proof, followed by booking and rental-status tracking. Find Your Ride applies eligibility rules and deterministic ranking; it is separate from branch allocation.

The administrative workflow covers booking coordination, requirement review, vehicle assignment, quote/payment review, confirmation, physical release, return inspection, maintenance and operational availability. Recent migrations allow a human payment-verification action to confirm an eligible booking atomically and record an exception when confirmation is blocked. Confirmation, physical rental activity, maintenance readiness, and financial settlement must not be treated as the same state.

Current quote code snapshots the vehicle's daily rate and billable duration, delivery fee, down payment and related amounts. This supersedes some September 26 descriptions. The database has two `booking_payment_quotes` rows, but that alone does not validate every new payment path or establish client approval of commercial rules. Return/inspection implementation is not a full charge, refund or settlement ledger; the supplied paper already acknowledges this boundary.

The decision-support chain is:

1. Count confirmed scheduled booking starts by Manila calendar week, pickup branch and requested-vehicle category, subject to an explicit trusted-history start.
2. Use the last three completed weekly observations with WMA weights 0.50, 0.30 and 0.20; recursively calculate three forecast periods and preserve input records.
3. Round forecasts upward for the existing planning proxy; compare with eligible projected fleet supply after activity, maintenance and commitment checks.
4. Pair same-category, same-week shortage/surplus positions, cap quantities by remaining balances and revalidated candidates, and rank candidates by known idle duration.
5. Preserve recommendation/candidate snapshots; Owner/Admin approves a positive quantity or rejects. Approval does not move a vehicle.
6. Show route, weather, incident and fuel context as supplementary review information. Missing context is not supposed to imply safe travel.

Supporting services include operational reports, dashboard summaries, notifications/reminders, audit events, transactional email and backup/recovery tooling. Some old mock helpers remain in the repository. The unused `branch-allocation-context.ts` mock helper must not be confused with the current canonical allocation API.

## What the guidelines require

The stated deadline is **October 2, 2026, 3:00 PM, Room S505A**, for document submission, not a stated defense date. Relative to September 28, that is four calendar days away.

Eligibility includes ethics clearance or submission proof, mock-defense score of at least 60, at least 80% of identified features working, at least one generated report, and internet hosting for web systems. The scheduled presentation includes 10 minutes of slides and 20 minutes of tool walkthrough; processing through modules and report generation must be demonstrated using meaningful dummy data. Actual-defense passing language is 61 and above, distinct from the mock-defense threshold.

Ethics status, mock-defense score, signed revision documents and the actual defense schedule cannot be determined from source code. The document submission package and diagram-copy requirements are administrative obligations; diagrams remain unchanged as requested.

## Objective-by-objective assessment

The authoritative objective list for this comparison is PDF pages 41–42 (printed 34–35), rather than outdated diagrams.

| Objective | Evidence and current assessment | Evidence needed for sign-off |
| --- | --- | --- |
| 1. Assess the client's existing process | Interview ground truth and clarification register exist. Research evidence is separate from application readiness. | Trace each important workflow/policy to interview evidence or an explicitly labeled researcher assumption. |
| 2. Centralized rental management | Substantial booking, requirement, payment, rental, fleet and notification implementation; live records exist. Customer directory remains partly mock. | Complete current customer-to-admin lifecycle and exception rehearsal; replace mock directory behavior. |
| 3. Customer recommendation | Eligibility/ranking includes dates, seats, luggage, rate estimate and readiness. Destination is separate admin context, consistent with the paper. **Budget is mandatory in code despite the objective describing it as optional.** | Empty-budget search must work; demonstrate matching, no matches, conflicts, maintenance exclusion and booking handoff. |
| 4. WMA forecasting | Formula and immutable storage implemented. **Fresh generation is blocked by current coverage; forecasts are stale; evaluation has defects.** | Trusted/labeled history, current reproducible generation, inspectable arithmetic and valid evaluation protocol. |
| 5. Branch allocation | Core pairing, quantity cap, idle ranking and advisory decision code exist. Four stored recommendations are all Pending. **Current demonstration and freshness are not established.** | Current shortage/surplus scenario, explanations, candidate exclusion, approved/rejected/reduced decisions and preserved history. |
| 6. External/operational context | Booking and allocation review context services exist, including missing-data handling. | Demonstrate usable data and unavailable/stale fallback behavior with source/time/coverage shown. Live provider success unverified here. |
| 7. Maintenance | Records, service targets, readiness and return-inspection blocking exist. One behavioral test contradicts current Open-maintenance semantics; one baseline maintenance record drifted. | Show a blocker propagating to finder/assignment/supply, then appropriate clearance, without overriding other blockers. |
| 8. Reports/dashboard | Operational reports are computed from real tables. **Payment and allocation reporting coverage is incomplete.** | Demonstrate a reconciled report and objective-specific coverage, not just a chart or record queue. |
| 9. Quality evaluation | Automated checks exist, but current checks are not clean. They do not substitute for the paper's software-quality evaluation. | Resolved regressions and documented functional, performance, browser/mobile, reliability, security and user-evaluation evidence. |

## Priority findings

### P1 — Current historical coverage prevents fresh forecasting

The configured `forecast_demand_coverage.tracking_started_at` is `2026-09-14T20:17:49.748203+00:00` (September 15 in Manila). The extractor correctly excludes the partial starting week. Its first fully covered week is September 21–28. On September 28 only one completed week qualifies; WMA requires three. With unchanged coverage, three full weeks become available on October 12.

The database has 320 booking requests and synthetic history described in `docs/demo-decision-support-fixtures.md`; a large row count does not override the coverage boundary. Existing older forecasts and current coverage are not mutually reproducible without explaining the changed provenance/configuration. Do not simply backdate coverage to force the feature to work. Validate genuinely complete history, or establish a clearly labeled and isolated simulation dataset with documented coverage.

Sources: `src/lib/forecasting.server.ts:30` (coverage), `:42` (extraction), `src/routes/api.forecasts.ts:123` (three-observation gate). Read-only reproduction confirmed one observation and a null WMA result.

### P1 — Decisions retains old forecasts and supply snapshots

The latest persisted forecast run is September 18. The 108 stored forecasts cover only weeks starting September 14, September 21 and September 28. None covers October 5 or October 12.

The Decisions page generates a forecast automatically only when there are no forecast rows; its manual Generate action is also in the no-forecast branch. There is no normal refresh action once forecasts exist. Supply evaluation runs for forecasts lacking any evaluation, rather than invalidating snapshots after fleet/maintenance changes. Regenerating recommendations alone does not refresh the source/destination balance evidence.

The allocation API takes the latest run even if it has zero forecast positions, whereas the UI selects the latest nonempty run. The forecast persistence function allows empty record arrays. An insufficient-history generation can therefore leave the UI showing old forecasts while allocation generation rejects the newest empty run.

Sources: `src/routes/admin.decisions.tsx:662`, `:855`, `:1156`; `src/lib/admin-decisions.ts:62`; `src/routes/api.allocation-recommendations.ts:175`; `supabase/migrations/20260901061000_forecasting_integrity.sql`.

Acceptance: controlled refresh/recalculation and explicit stale/insufficient states; consistent run selection; current supply evidence after meaningful changes; retain old snapshots as history.

### P1 — Forecast generation and MAPE evaluation are incompatible

Generation assigns horizon 1 to the current calendar week. MAPE accepts a horizon-1 forecast only if generated strictly before that week's start. A normally generated forecast cannot satisfy that condition, even if its actuals are finalized later. The current database has zero qualifying pre-period horizon-1 rows and zero finalized actuals.

Independently, MAPE deduplicates solely by target week, losing branch/category identity. Direct reproduction with two same-week series with errors 0% and 100% yields 0%, or 100% when input order is reversed, instead of 50% for an explicitly pooled two-series mean.

The finalize API exists, but no caller was found in the application/scripts/scheduled workflows searched. The UI says accuracy becomes available after finalization without supplying that workflow.

Sources: `src/routes/api.forecasts.ts:75`, `:117`; `src/lib/forecasting.server.ts:58`; `src/routes/admin.decisions.tsx:1133`.

Acceptance: specify forecast origin/cutoff and evaluation eligibility consistently; preserve branch/category/horizon identity; implement a usable finalization/evaluation path. Separate illustrative simulations from genuine held-out performance. Do not fabricate backdated forecasts or report these fixtures as validated prediction accuracy.

### P1 — Allocation can present historical recommendations as current decisions

Four recommendations are stored, all Pending. Two target elapsed weeks (September 14 and September 21). One was created September 24 for the already elapsed September 14 week. The generation and decision paths do not reject elapsed target periods. UI current-row selection matches branch/category display names, target week and horizon rather than exact current evaluation/run identity.

Candidate constraints are rechecked during generation, but source/destination demand balances remain those of the selected immutable evaluations. Approval checks decision state and quantity; it does not establish current feasibility. Since approval is advisory, this is a freshness/explanation problem rather than evidence that a vehicle was unsafely transferred.

Sources: `src/routes/admin.decisions.tsx:681`; `src/routes/api.allocation-recommendations.ts`; `src/lib/allocation-recommendation.server.ts`; `supabase/migrations/20260901080000_allocation_recommendations.sql:135`.

Acceptance: distinguish historical review from an actionable current recommendation, bind by identifiers, show age and changed conditions, and rehearse both valid and blocked cases. A dispatch/receipt transfer module is not required merely to satisfy this advisory objective.

### P1 — Customer directory still presents hard-coded customer metrics

`src/routes/admin.customers.tsx:20` imports the customer list from `@/data/admin`. Directory search/detail/trips/lifetime-spend use that array; Add customer has no handler. The same page has a separate database-backed requirement-review section. That real section does not make the upper customer directory canonical.

Acceptance: connect directory and histories to actual customer records and supported actions; avoid presenting invented spend or trip totals as operational facts.

### P1 — Reports do not cover all objective 8 subjects

`src/lib/admin-reports.server.ts:12` loads branches, categories, bookings, rentals, maintenance, vehicles and utilization analytics. It does not load payments, forecasts, supply evaluations or allocation recommendations. `src/routes/admin.reports.tsx` concentrates on period comparisons, activity trends, branch rental activity and leading fleet utilization. The dashboard's source is also booking/rental/fleet readiness data.

A basic generated operational report exists in source; the guideline does not expressly require PDF/CSV export. The gap is objective coverage and demonstrated reconciliation, not an invented export requirement. Payment queues and the Decisions screen should not automatically be counted as complete reports.

Acceptance: identify and demonstrate the report(s) satisfying each promised subject, including payment records and branch allocation recommendations, with filters and source reconciliation.

### P2 — Optional Finder budget is required by both UI and server validation

The proposal's objective 3 and scope allow an optional daily-rate reference budget. `src/routes/vehicles.tsx:312` and `src/lib/vehicle-finder.ts:153` reject an absent/nonpositive budget. This is an actual behavioral mismatch, not a diagram discrepancy.

Acceptance: searches without a budget remain valid, while entered budgets still constrain matches. Explain reference pricing consistently with the current quote workflow.

### P1 verification gate — Internet deployment has not been established

The configured `APP_BASE_URL` points to `https://briahscarrental.site`. Both Node fetch attempts failed; curl reported `Could not resolve host`. This establishes failure from the audit environment, not universal proof that every deployment is offline. Another deployment URL may exist. A local build and a reachable Supabase project do not meet the guideline's internet-hosting demonstration by themselves.

Acceptance: verify the actual defense URL, DNS/HTTPS, server/API/auth routes, uploads and the complete demonstration on the deployed version.

### P2 — Test/evidence baseline is not ready for sign-off

- Production build: passed.
- TypeScript: two TS2345 errors at `src/routes/booking.tsx:291` and `:292`; a reconstructed draft widens `pickupDeliveryOption` to string rather than the pickup/delivery union.
- Library/script checks: 360 tests, 348 passed, 12 failed. This invocation includes `src/lib/*.test.ts`, backup and Supabase test directories, defense and QA scripts; it does not include component tests or browser tests.
- Nine failures are source-text/regex assertions. Two deep-equality failures reflect added luggage fields. One operational-notification/readiness expectation treats nonblocking Open maintenance as ready while current readiness treats Open as in progress. Failures need triage; 12 failures do not mean 12 broken user features.
- Existing defense verifier: baseline accounts, bookings, requirements, payments, rentals, storage, notification and audit evidence pass; one maintenance baseline record changed. Overall result is `DEFENSE BASELINE DRIFT DETECTED`.
- Its decision-support baseline arrays are empty and additional decision-support records are allowed. The displayed decision-support PASS is not proof that the current forecasting/allocation workflow works.
- Database `backup_runs` and `recovery_drills` each contain zero rows. This does not rule out infrastructure-provider backups, but supplies no application-recorded evidence of the promised backup/restore procedure.

Acceptance: repair meaningful regressions, update stale tests only against approved behavior, refresh the scenario evidence baseline, and attach demonstrated backup/recovery results before claiming achieved recovery targets.

## Important interpretation boundaries

Weekly booking starts and physical vehicles have different units. Three sequential short bookings may be served by one vehicle, while one long booking can occupy it for weeks. The implemented ceiling-and-supply comparison is a conservative planning proxy, not an occupancy optimizer. The paper already recognizes that booking-count forecasts do not measure concurrent occupancy. Demonstrate this limitation explicitly; do not silently change the approved forecasting method or claim optimal transfers.

External context supplements human judgment. Missing route/weather data is not by itself a failed objective when unavailability is handled honestly, but fabricated favorable values or unexplained provider failures would undermine the defense. Live provider behavior was not validated in this pass.

The supplied paper, older context specifications and current code describe different generations of pricing, role permissions and workflow rules. Evaluate current behavior against the supplied objectives and record discrepancies. Do not reinstate obsolete diagrams or silently rewrite research commitments to make current code appear complete.

## Focused readiness sequence

1. Resolve forecast dataset provenance/coverage and origin/evaluation semantics. Establish a reproducible current demo scenario without changing the fixed WMA method or fabricating evidence.
2. Repair refresh/freshness, current-run selection and MAPE; verify the complete shortage/surplus/candidate/decision chain, including no eligible transfer and maintenance exclusion.
3. Replace the mock customer directory, align optional Finder budget and complete objective-specific reporting.
4. Resolve TypeScript and meaningful test failures; reconcile the defense fixture manifest with intended current data. Keep deterministic test evidence separate from actual end-to-end results.
5. Verify the public defense deployment and rehearse the main operational journey and one reconciled report using meaningful dummy data. Capture observed acceptance outcomes, source version and database migration state.
6. Assemble the feature acceptance matrix and administrative submission evidence. Preserve the diagrams for the separately requested later update.

A focused 20-minute walkthrough should show: maintained master/fleet data and maintenance readiness; customer matching and booking; requirement/payment handling and confirmation; release/return inspection; then the forecast inputs, demand/supply imbalance, candidate rationale, advisory decision and generated report. It should demonstrate the stated objectives rather than spend most of its time on login or visual polish.

## Read-only database snapshot

| Record family | Observed count/state |
| --- | --- |
| Booking requests / vehicles | 320 / 12 |
| Rental transactions / maintenance records | 302 / 7 |
| Payments / booking payment quotes | 13 / 2 |
| Forecast runs / forecasts | 5 / 108 |
| Supply evaluations | 38 |
| Allocation batches / recommendations / candidates | 5 / 4 / 4 |
| Recommendation decisions | Four Pending; no Approved or Rejected rows |
| Finalized forecasts / eligible pre-period horizon-1 rows | 0 / 0 |
| Backup runs / recovery drills | 0 / 0 |

These counts describe the configured database at audit time. They are not usage statistics, client-data provenance certification, or successful workflow-test counts.

## Follow-up: the other features and the draft manuscript

The first pass concentrated on the distinctive decision-support objectives. The following expands the source review to the surrounding rental system. “Implemented” here means a connected implementation was identified; it is not a claim that a fresh browser acceptance test passed. Database counts and test results above remain evidence from the initial pass, not new measurements.

### The essence to preserve

The draft describes a centralized rental-management system for Manila and Antipolo operations that reduces fragmented records, supports customer matching and rental coordination, monitors fleet/maintenance condition, and provides explainable statistical forecasting and advisory allocation for human decision-makers. Those outcomes are the stable baseline.

Implementation details may evolve: page organization, status labels, provider names, database identifiers, the exact sequence of review screens, and how a human approval is recorded. They should be documented consistently. Removing a promised operational capability simply because it is incomplete would change coverage rather than correct wording.

Distinguish three types of manuscript text: the client's existing business process, the proposed/delivered system, and future work. An existing-business description of manual GPS monitoring or financial settlement is not automatically a promise to implement GPS or a full settlement ledger. Likewise, a proposed feature cannot be counted as delivered because it appears in a diagram or data dictionary. The supplied PDF already labels some charge/expense tables as future work.

### Expanded feature assessment

| Feature / manuscript relationship | What exists in the current source | Remaining work or appropriate clarification |
| --- | --- | --- |
| Registration, login, logout, profile and roles (R13) | Supabase-backed sign-up/session handlers, principal lookup, active-account checks, customer profile reads/updates and Owner-only account-role management. | Rehearse account creation, session expiry and cross-account isolation. Admin profile editing still saves browser-local profile data; distinguish it from centrally persisted customer/account records. |
| Vehicle catalog and detail (R5, objective 3) | Vehicle APIs and customer browsing/detail routes; dates, availability, images and vehicle attributes feed booking and Finder. | Rehearse inactive/unavailable vehicles, changed availability between search and request, image fallback and mobile flow. Keep catalog visibility separate from guaranteed booking availability. |
| Customer directory/history (R1, objective 2) | Customer-owned profiles and booking records are real; the admin directory's upper section imports mock customers and calculated-looking mock metrics. | Connect directory/history to actual records. Do not describe the present mixed page as complete customer-record management. |
| Booking requests and lifecycle (R1–R2) | Create, edit customer draft, withdraw, reject, cancel, assign and confirm paths; idempotency and database transition routines exist. | Rehearse each transition and duplicate/conflicting requests. Draft means awaiting documents and is visible to admin; document this actual meaning. |
| Staff coordination (R1–R2, R13) | Booking/calendar access is available; calendar is backed by booking/rental data. | Staff encoding/editing is not implemented by the booking mutation API: creation/edit/withdraw are customer actions and operational mutations are Owner/Admin actions. If staff must encode requests, that is implementation work; otherwise accurately delimit the role without undermining the business need. |
| Rental requirements (R3) | Customer uploads, private file access, file size/type/signature checks, versioned documents, review and resubmission. Owner reviews; staff cannot open protected requirement documents. | Document human review, not automated authenticity verification. Current supported upload types are government ID and driver's license. Additional billing/passenger documents and automated LTO validation must not be claimed without implementation. Test rejected files, replaced versions and account isolation. |
| Policies and rental agreement (R4) | Release records an admin acknowledgment that the agreement was acknowledged. A static `src/data/rental-policy.ts` file exists. | No importing consumer for that policy file was found. Current customer routes do not expose a coherent rental-policy/agreement page or management workflow. Release acknowledgment is not proof that the customer could read or accepted a particular policy version. Implement accessible policy content using agreed terms; do not simply remove R4. |
| Quote and payment proof (R1, objective 2) | Stored quote snapshots, manual delivery fee, down payment, methods/QR details, proof upload/versioning, reference checks, Owner review and resubmission. Verification can confirm an eligible booking and record a confirmation exception. | Specify manual bank/e-wallet verification, not a payment gateway or automatic proof validation. Reconcile quote, payment requirement, customer amount and confirmation. Restrict quote access consistently with payment access. |
| Release and physical return (R1, R6) | Record odometer, fuel, condition, damage notes and acknowledgments; record physical return and pending inspection; clear inspection or schedule maintenance. | Demonstrate no release when blocked and no return-to-service while inspection remains pending. Financial settlement, deductions, refunds and penalties are separate capabilities, not implied by an ended rental. |
| Fleet/branch records and location (R5–R6) | Vehicle and branch management, assignment, condition/readiness projections, and a separate location-reconciliation action that checks affected bookings. | Explain public pickup locations, allocation branch and physical rental state separately. Reassignment is not GPS tracking or proof that a recommended transfer was physically completed. |
| Maintenance monitoring (objective 7) | Service records, dates, odometer targets, costs/remarks, transitions and readiness integration; return-linked maintenance can be saved atomically with inspection handling. | Demonstrate effects across availability, Finder, assignment and allocation; resolve the Open/nonblocking maintenance semantics noted above. Service costs do not imply a general expense ledger. |
| Utilization and idle detection (R6, objective 8) | Actual rental intervals and state-history coverage feed utilization; idle information feeds allocation ranking. | Review the promise of consecutive available idle days. The idle helper uses last rental end / active-state reference and does not receive maintenance intervals. Recent maintenance can therefore leave calendar idle duration overstated relative to that interpretation. |
| Notifications and reminders (R12) | Persisted recipient-scoped notifications, read state, preferences, workflow events, pickup/return/overdue-rental reminders, maintenance/low-availability processing and an email-delivery queue. | No scheduled overdue-payment reminder was found. Payment proof/review events are distinct from payment-due reminders. Verify the deployment scheduler and delivery outcomes; the presence of a processor endpoint does not establish that it runs regularly. |
| Audit trail (R13 / support) | Owner-only audit read API with actor/domain/date filters; workflow audit events are recorded. | Enumerate actual audited operations. Do not claim every action, access attempt or record change is captured unless demonstrated. |
| Reports/dashboard (R9, objective 8) | Real operational summaries and selected reporting; source coverage described earlier. | Complete payment/allocation report coverage and demonstrate source reconciliation. A change in layout is a manuscript adjustment; absent report subjects are an implementation gap. |
| Backup/recovery (R14) | Backup tooling, status API, metadata model and runbook exist. | Deployment scheduling and a successful non-production restore need evidence. Targets/configuration are not achieved recovery results. |
| Contact/settings | Public contact details, pickup locations and inquiry records are connected to administrative management. | Useful supporting functionality, but this settings page is not a substitute for rental-policy or notification-rule management. |

Source entry points: `src/routes/api.auth.*`, `src/routes/api.bookings.ts`, `src/routes/api.requirements.ts`, `src/routes/api.payments.ts`, `src/routes/api.payment-quote.ts`, `src/routes/api.admin-calendar.ts`, `src/routes/api.master-data.ts`, `src/routes/api.vehicle-location.ts`, `src/routes/api.maintenance.ts`, `src/routes/api.admin-fleet.ts`, `src/routes/api.notifications.ts`, `src/routes/api.audit-events.ts`, and the corresponding administrative/customer routes.

### Newly identified issues worth addressing before sign-off

**P1 — Payment-quote access is broader than payment access.** `src/routes/api.payment-quote.ts:12` requires an authenticated principal and checks booking ownership for customers, but never denies Operations Staff. It reads through the service-role database client and returns the quote. By contrast, `src/routes/api.payments.ts:45` explicitly denies staff. The booking read endpoint also attaches `payment_status` to all internal-role rows. This is a source-confirmed inconsistency; it was not exercised against live staff accounts. Restrict quote access and specify exactly which derived statuses staff may receive. Hiding payment screens does not enforce that boundary.

**P1 — Rental-policy access is missing from the connected customer experience.** R4 appears in both the Chapter 1 requirements matrix and Chapter 3 requirements list (physical PDF pages 35 and 157). A repository-wide source search found no consumer of the rental-policy constants. The current release acknowledgment cannot substitute for the customer-facing policy access described in the requirement. Do not publish the unused legacy policy text automatically: its document requirements and cancellation wording may also need client-policy reconciliation.

**P2 — Admin profile “saved” is browser-local.** `src/routes/admin.profile.tsx:107` uses `setAdminProfile`, which writes to localStorage in `src/lib/admin-auth.ts`. The UI reports account details as saved, but this is not the central profile persistence used by the customer profile API. Clarify or connect the behavior before demonstrating centralized administrative profile management.

**P2 — Payment reminders are not represented in the scheduled reminder model.** `src/lib/reminders.ts` supports upcoming pickup, upcoming return and overdue rental. `src/lib/reminders.server.ts` loads confirmed bookings/rentals for those rules, not outstanding payment due dates. The notification type list includes payment proof/review outcomes but no payment-due reminder. R12 specifically names payment reminders. Define an actual due-date/reminder rule before implementing it; do not relabel a payment-verification event as a reminder.

**P2 — Consecutive idle readiness needs verification.** `calculateCanonicalIdleSnapshot` in `src/lib/vehicle-analytics.server.ts:41` accepts rental ends and active-state events but no maintenance history. For a vehicle that last rented 20 days ago and came out of maintenance yesterday, calendar time since rental can still be 20 days. That is not necessarily 20 consecutive days available for rental. The paper's idle-availability wording and ranking explanation should match an agreed calculation; this matters to allocation quality.

### Manuscript adjustment register: preserve the purpose, correct the description

| Topic | Suitable adjustment | Boundary that still needs to be satisfied |
| --- | --- | --- |
| Business context versus delivered scope | Label existing manual practices, delivered workflows and future capabilities distinctly. | Keep the client problem and operational benefit intact. |
| Booking lifecycle | Explain draft/submitted/confirmed and physical rental/inspection states as actually implemented. Describe confirmation triggered by an Owner's payment-review action with operational checks. | No implication that a recommendation, uploaded screenshot or button visibility alone approves a rental. |
| Requirements | Describe the supported documents, human review, versioned resubmission and secure viewing. Update stale LTO-review claims. | Customers must still submit required evidence and administrators must be able to assess it. |
| Pricing/payment | Separate Finder reference estimate, issued booking quote, required down payment, remaining amount and security deposit. Document the current one-hour billing allowance, 50% quote down payment and PHP 3,000 deposit only with their policy provenance or explicit researcher-designed status. | Current source contains these rules; their presence does not prove client approval. Do not describe refund/penalty accounting as delivered. |
| Return/settlement | Retain the supplied paper's physical-return/inspection boundary and make related prose consistent. | Core return/maintenance readiness must work. Dropping an originally approved financial-settlement objective would require a substantive scope decision, not a cosmetic wording change. |
| Permissions | Publish one field/action permission matrix consistent across UI, APIs and database access. | Sensitive payment/identity access remains restricted; do not legalize an accidental access leak by changing the manuscript. |
| External context | Use actual providers and source/freshness/fallback semantics. Resolve the API definition on PDF page 50, which still describes TomTom/HERE geocoding despite updated scope naming Geoapify/LocationIQ. | Context must remain meaningful review information, with unavailable data identified honestly. |
| Finder | Make optional budget, luggage, destination treatment and estimate rules consistent across objectives, definitions and implementation. The customer-recommendation definition on PDF page 52 still includes destination among matching inputs. | Do not conflate customer matching with branch allocation. |
| Data dictionary | Replace conceptual MySQL-style identifiers/types and obsolete table descriptions with current PostgreSQL structures, relationships and ownership. Preserve clearly labeled future structures as future work. | Actual persisted relationships and security boundaries must remain explainable. |
| Notification/backup claims | Name actual event types, reminder schedules and delivery channels; describe recovery objectives as targets until demonstrated. | Missing required reminders or recovery evidence remain work items. |
| Evaluation | Distinguish functional scenarios, browser/user acceptance, software-quality evaluation and forecast-error evaluation. | Simulated functional correctness is not empirical real-world forecasting effectiveness. PDF page 49 already makes this useful distinction. |
| Navigation and diagrams | Refresh contents, references, captions and cross-references after substantive text stabilizes. | Use-case and activity diagrams remain untouched for now, per the user's request. |

The appropriate next implementation emphasis is a complete rental lifecycle with consistent permissions and readable policies, followed by trustworthy fleet/maintenance evidence, the forecasting/allocation chain, and objective-aligned reports. Visual refinements and extra contact/settings conveniences cannot stand in for those outcomes. No fixes or manuscript edits were performed in this follow-up; only this audit was extended.
