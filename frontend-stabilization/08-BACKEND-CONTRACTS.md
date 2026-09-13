# 08 - Backend Contracts

**Status:** Repository contracts inventoried on 2026-09-13; conflicts require Lead triage before freeze.

**Verified baseline:** `stabilization/frontend-rebuild`, HEAD `faed190d9b78bb845e2c89e7160eda90106f741f`; identical to fetched `origin/main` and `origin/stabilization/frontend-rebuild` at discovery time.

# Core rule

**THE FRONTEND MUST ADAPT TO THE CANONICAL BACKEND.**

Do not modify backend/domain behavior merely to simplify frontend implementation.

## Protected areas

A frontend stabilization task has no implicit authority to change:
- database schema or migrations;
- authentication architecture;
- authorization/RBAC/RLS;
- booking lifecycle/state transitions;
- requirement verification semantics;
- payment verification semantics;
- rental release/return lifecycle;
- maintenance readiness/lifecycle;
- forecasting algorithm/data qualification;
- allocation recommendation logic;
- report semantics;
- notification/event behavior;
- audit semantics;
- backup/recovery architecture;
- external-context provider architecture;
- production secrets/configuration.

A required change discovered here is a **Finding** and requires Lead triage/authorization.

## Known canonical boundaries to preserve

- Requirements are verified before payment proceeds.
- Baseline payment verification is manual; do not imply automated gateway verification.
- Customer-side vehicle recommendation is deterministic/rule-based and hands off to canonical booking.
- Booking creation includes server-side safeguards such as canonical validation/idempotency where implemented.
- Final assignment/allocation decisions remain human-authorized.
- Fleet monitoring does not mean live GPS tracking.
- Forecasting uses the implemented Weighted Moving Average rules; do not market it as AI/ML.
- External context is advisory and may be Unknown/Unavailable.
- Maintenance readiness can exclude vehicles from rental/recommendation/allocation eligibility.
- Reports must not fabricate deferred financial/revenue semantics.
- Notifications/preferences/recipient restrictions must remain canonical.

## Codex contract inventory template

For each frontend-critical capability, record:

```text
Capability:
Client route/component:
Data loader/query:
Server function/API:
Mutation/action:
Input schema:
Output shape:
Canonical states:
Role restrictions:
Error states:
Idempotency/concurrency behavior:
Frontend assumptions that must be removed:
```

## Required inventory
- authentication/session/role resolution;
- public vehicle browse/search;
- Finder/recommendation;
- booking create/read;
- requirements submit/resubmit/review;
- payment submit/resubmit/review;
- booking confirmation/vehicle assignment;
- rental release/return/settlement;
- notifications/preferences;
- admin dashboard;
- fleet/availability/readiness;
- maintenance;
- calendar;
- forecasting/allocation/context;
- reports;
- customers/branches/users/settings.

## Repository-derived contract inventory

### Authentication, session, roles, and profiles

| Contract | Repository behavior |
|---|---|
| Client | `SignInDialog`, `/sign-in`, `/customer/profile`, `/admin/profile`; `auth-client.ts`, `auth-integration.ts`, `customer-auth.ts`, `admin-auth.ts`. |
| API / functions | `POST /api/auth/sign-in` -> Supabase `signInWithPassword`; `POST /api/auth/sign-up` -> Customer account; `GET /api/auth/session`; `POST /api/auth/sign-out`; `GET/PATCH /api/auth/profile`. `getCurrentPrincipal`, `requirePrincipal`, and `requireRole` enforce server identity. |
| Inputs / outputs | Sign-in requires email/password and returns `{principal}`. Sign-up requires full name, phone, email, password >= 8 and returns principal or `requiresEmailConfirmation`. Principal contains userId, email, fullName, phoneNumber, canonical role, accountStatus. Customer profile exposes/persists structured address and contact fields. |
| Roles | Exact canonical values: `Owner/Admin`, `Operations Staff`, `Customer/Renter`; principal must be `Active`. Customer profile API rejects non-Customers. |
| State / errors | 400 missing/invalid signup fields, 401 invalid/no session, 403 inactive/wrong role, 500 failure establishing Customer. Access/refresh cookies are HTTP-only; a non-HTTP-only view cookie powers client presentation. Refresh token can renew the session. |
| Assumptions to remove | Legacy `Business Owner`/`Staff` seed types and local profiles remain in `admin-auth.ts`, although canonical auth maps only the three roles. `/admin/profile` persists only to localStorage, unlike the server-backed Customer profile. Client-only route guards are not the security boundary. |

### Public vehicle browse and Finder

| Contract | Repository behavior |
|---|---|
| Client | `/vehicles`, `VehicleCard`, `/booking` Finder handoff. |
| API / functions | Public `GET /api/vehicles`; public `POST /api/vehicle-finder`; `evaluateCanonicalVehicleFinder`, `validateFinderInput`, `findVehicles`, `calculateMaintenanceReadiness`; booking reuses the evaluator for server-side Finder provenance validation. |
| Inputs | Start/end Manila local date-times, integer passengers 1-100, positive maximum **total base-rental** budget, optional active category, optional destination <= 200 chars. |
| Output | `{criteria, rentalDays, recommendations, noMatch}`. Each recommendation supplies vehicle identity/category/capacity/rate/estimated base total/image/branch/transmission/fuel, preferred match, rank, and reasons. No-match code is `NO_ELIGIBLE_VEHICLES` with CAPACITY, BUDGET, PERIOD_AVAILABILITY, or GENERAL factors. |
| Eligibility / ordering | Active + maintenance-ready + no overlap with Confirmed assigned bookings or scheduled rentals + known sufficient capacity + known rate within budget. Sort: preferred category, least excess capacity, lowest cost, name/id. Destination does not affect eligibility/rank. |
| Errors | Field-level 400 validation; 503 source/evaluation failure. Browse endpoint returns 503 on read failure. |
| Assumptions to remove | `GET /api/vehicles` means active, not period-available or maintenance-ready. `/vehicles` currently converts every row to `available: true` and silently keeps mock data on failure. Finder is rule-based, not AI/ML. |

### Booking create and read

| Contract | Repository behavior |
|---|---|
| Client | `/booking`, `/customer`, `/admin/bookings`. |
| API / functions | Public `GET /api/booking-master-data` supplies active branches/vehicles. Authenticated `GET /api/bookings`. Customer creation is `POST /api/bookings`; `create_booking_idempotent` and `lookup_booking_creation_idempotency` RPCs. |
| Create input | Required UUID idempotency key, active requested vehicle, active pickup and return branches, pickup/return (return after pickup), purpose, service option `pickup` or `delivery`; delivery requires both locations. Optional destination and positive integer preferred seats. Optional Finder context is re-evaluated and must still match vehicle/time/passengers/destination and an eligible recommendation. |
| Create output/state | Existing identical booking (200) or created booking (201). Initial persisted booking status is `Submitted`. Fingerprint binds the idempotency key to all material inputs. |
| Read output | Customer receives own bookings with assignment actor/note/timestamps removed and rental reduced to safe fields. Staff receives `{bookings}`. Owner/Admin receives `{bookings,candidateVehicles}` plus requirement/payment statuses and full rental fields. Finder context is attached to all booking rows. |
| Roles | Customer creates and reads own records. Staff/Owner read all. Only Owner/Admin gets assignment candidates and later lifecycle mutations. |
| Errors / concurrency | 400 validation/inactive master data/Finder mismatch; 401/403 auth; 409 reused key with different request or stale Finder eligibility. Creation is RPC-idempotent. |
| Canonical states | Database constraint: `Submitted`, `Confirmed`, `Rejected`, `Cancelled`. Repository UI/API currently implements creation and Submitted -> Confirmed; no reject/cancel mutation is exposed. |

### Renter requirements

| Contract | Repository behavior |
|---|---|
| Client | Customer requirements inside `/customer`; review queues in `/admin/bookings` and `/admin/customers`. |
| API / functions | `GET/POST /api/requirements`; `replace_renter_requirement_document`, `resubmit_renter_requirements`, `record_renter_requirement_review` RPCs; private `renter-requirements` bucket with five-minute signed reads. |
| Inputs / output | Required types are exactly Valid Government ID and Driver's License. Upload is multipart with booking/type/file; JPEG/PNG/PDF <= 10 MiB and magic-byte validation. Customer reads safe latest review outcomes/reasons; Owner/Admin reads documents/reviews; Staff reads set state but no documents. |
| States / transitions | `Not Submitted` -> `Pending Review`; review may remain `Pending Review`, become `Needs Resubmission`, or become `Verified`; flagged file replacement then explicit resubmit returns to `Pending Review`. Only current document versions count. |
| Review gates | Verified requires both Accepted, identity Consistent, and LTO Clear. Needs Resubmission requires at least one Needs Replacement with customer-facing reason. |
| Roles | Customer owns upload/submit/resubmit. Owner/Admin alone can list review queues, open all protected files, and review. Staff cannot review or view files. |
| Errors / concurrency | Missing/invalid files, wrong state, replacing an unflagged type, missing reason, invalid verification combination; stale document/version returns 409. Storage cleanup is best-effort on failed persistence. |

### Payment submission and review

| Contract | Repository behavior |
|---|---|
| Client | `/payment-details`, payment summary in `/customer`, review at `/admin/payments`. |
| API / functions | `GET/POST /api/payments`; `submit_payment_proof_atomic`, `review_payment_atomic`; private `payment-proofs` bucket with five-minute signed reads. |
| Customer input | Booking, active payment method, positive submitted amount, transaction reference, JPEG/PNG/PDF proof <= 10 MiB. Requirements must be exactly `Verified`; this is server enforced. |
| Output | `{payments,paymentMethods}`; Customer projection excludes reviewer/storage internals and includes current proof metadata, `required_amount`, status, reference, amount, reason, and timestamps. Staff gets `{payments:[]}`. |
| States / transitions | `Not Submitted` -> `Pending Verification`; Owner/Admin action verify -> `Verified`, resubmit -> `Needs Resubmission`, or pending -> `Pending Verification`; resubmission creates a new current proof. Manual verification only. |
| Roles | Customer submits own payment and reads own proof metadata/content. Owner/Admin reads/reviews all. Staff cannot access payment data. |
| Errors / concurrency | Ineligible requirements, invalid method/amount/reference/file, already pending, storage errors. Review requires current Pending Verification record, proof version, submitted amount, and reference snapshots; stale/not-pending/insufficient known amount return 409. Resubmission requires a reason. |
| Blocking gap | `payments.required_amount` is nullable; no repository code populates or derives it from a booking total. Verification rejects insufficient amount only when it is non-null. Therefore the manuscript's “minimum 50%” cannot be displayed or enforced from current canonical data. |

### Assignment, confirmation, release, return, and settlement

| Contract | Repository behavior |
|---|---|
| API / actions | Owner/Admin JSON actions through `POST /api/bookings`: `assign`, `confirm`, `release`, `return`. RPCs are `assign_booking_vehicle`, `confirm_booking_atomic`, `release_vehicle_start_rental`, `return_vehicle_close_rental`. |
| Assignment | Requires active vehicle. Conflicting Confirmed booking is rejected. Substitution and cross-branch choices require acknowledgement and a note. It records assigned actor/time/note. It does **not** call maintenance readiness. |
| Confirmation | Requires current Submitted booking, assignment, Verified requirements, Verified payment, no schedule conflict, expected assigned vehicle and `assigned_at`. Sets booking to Confirmed. |
| Release | Requires Confirmed booking, expected vehicle/`confirmed_at`, active vehicle, no existing/active rental, condition summary, valid optional odometer/fuel, and three acknowledgement booleans passed through. Creates one rental transaction with scheduled and actual start fields. |
| Return | Requires active rental plus expected rental/booking/vehicle/start values, return condition, valid optional odometer/fuel; return odometer cannot be below release. Sets `ended_at` and return fields. Late return is only a timestamp comparison in UI. |
| Roles / concurrency | Every mutation is Owner/Admin-only at API and RPC level. Expected assignment/confirmation/rental snapshots, row locks/advisory locks, and unique constraints guard stale/concurrent operations. |
| Customer projection | Customer sees rental id, booking/vehicle, scheduled dates, started/ended, and derived active boolean; inspection detail and actor fields are hidden. |
| Blocking gaps | Return does not change the booking from `Confirmed`. There is no settlement record, charge/fee calculation, settlement mutation, completed booking state, preparation/ready state, or delivery completion state. These cannot be made persisted frontend states without protected domain/schema work. |

### Notifications and reminders

| Contract | Repository behavior |
|---|---|
| Client/API | Shared `NotificationsPanel`; `GET/POST /api/notifications`. Internal scheduled `POST /api/internal/reminders` invokes reminder processing under a secret boundary. |
| Output/actions | Recipient-scoped newest-first items, unread count, email preference. POST marks one owned notification read idempotently or upserts the caller's email preference. |
| Types/entities | Requirement/payment resubmission and verification, booking confirmed/new request, submitted requirements/payment proof, upcoming pickup/return, overdue rental, maintenance attention, low availability, backup attention. Related entity types: booking, requirements, payment, rental, vehicle, branch, backup_run. |
| Roles | Any active principal reads only own notifications. Operational recipients are role/preference constrained: maintenance attention Owner/Admin; low availability Owner/Admin or Staff; transactional customer events target Customers. |
| Errors/concurrency | 400 invalid input, 404 non-owned/missing item, 409 concurrent mark without recoverable read, 503 storage failure, 401 auth. Existing `read_at` is returned without rewriting. |
| Assumptions to remove | Links are coarse module routes, not detail contracts. Email preference does not imply provider delivery success; delivery queue/provider behavior remains separate. |

### Dashboard, fleet, readiness, and maintenance

| Capability | Exact repository contract |
|---|---|
| Admin dashboard | `GET /api/admin-dashboard`; Owner/Admin and Staff. Returns generatedAt/role; Submitted count, active-rental count, available-now count (active + maintenance-ready + no active rental), readiness-attention count; six recent bookings and readiness reasons. Loading/source failures are 503. Future booking availability is explicitly Finder's concern. |
| Fleet | Owner/Admin `GET /api/admin-fleet`; combines vehicles, branches/categories, all bookings/rentals, and readiness. Derived precedence: Inactive, Rented, Maintenance, Reserved, Available. “Reserved” is a future-ending Confirmed assignment; completed rentals are counted separately. Master-data `GET/POST/PATCH /api/master-data` creates/updates branches, categories, vehicles, validates unique/foreign keys and nondecreasing odometer. No delete endpoint. |
| Readiness | `calculateMaintenanceReadiness`: false for inactive vehicle, active blocking maintenance, authoritative completed preventive target due by date/odometer, missing odometer with a target, or vehicle condition block. Latest completed target per maintenance type supersedes older targets. Finder, dashboard, fleet, and supply reuse this logic. |
| Maintenance | `GET/POST/PATCH /api/maintenance`. Owner/Admin gets full list/fleet summary and mutates; internal Staff may get a single vehicle readiness result only. New record must be `Open`; required vehicle/type/description, optional block flag/start/odometer/next target/cost/remarks. Only Open -> Completed or Cancelled. Atomic RPCs update vehicle odometer/readiness effects. Creation reports `active_rental_conflict` as a warning rather than silently resolving it. |

### Calendar

`GET /api/admin-calendar?month=YYYY-MM` is read-only for Owner/Admin and Staff. It returns `{period,role,events}` in Manila calendar semantics. Submitted bookings become reservation events; Confirmed bookings without a rental become pickup/return events; rental transactions supply pickup/return instead when present; Open maintenance supplies a service event and non-cancelled records may supply a next-service due event. Invalid month is 400; auth 401/403; source failure 503.

### Forecasting, supply, utilization, allocation, and external context

| Capability | Read contract | Mutation / authority / concurrency |
|---|---|---|
| WMA forecast | `GET /api/forecasts` for Owner/Admin or Staff -> runs, forecasts with inputs/branch/category, MAPE. | Owner/Admin `POST`; UUID-like client key is treated as idempotency key. Uses canonical booking demand coverage, three weighted historical weeks, three horizons, `required_vehicle_units = ceil(forecast)`, and reports insufficient branch/category pairs. `action:finalize` fills actuals/APE atomically. |
| Supply | `GET /api/supply-evaluations` for Owner/Admin or Staff. | Owner/Admin `POST` with forecastId/idempotencyKey. Re-evaluates active fleet, booking/rental conflicts, maintenance readiness/future target and atomically persists projected supply, shortage/surplus and vehicle snapshots. |
| Vehicle utilization/idle | `GET /api/vehicle-analytics?start&end` for Owner/Admin or Staff. | Read-only. Returns vehicle reporting range, Complete vs Partial/Insufficient Historical Eligibility Data, rental/eligible days, nullable utilization/idle days, and Idle/Not Idle/Unable to Determine. |
| Allocation | `GET /api/allocation-recommendations` for Owner/Admin or Staff -> batches, recommendation snapshots and ranked candidates. | Owner/Admin `POST` generates from latest compatible supply snapshots and revalidates source candidates; idempotency/context mismatch is 409. Owner/Admin `PATCH` makes one terminal Approved/Rejected decision with optional approved units <= recommendation. Approval records advice only; it does not transfer a vehicle. |
| External operational context | `POST /api/operational-context`, Owner/Admin only, kinds include booking assignment and allocation review/candidate. | Reads canonical booking/branch/candidate context and trusted providers; returns evaluated/current-review semantics, weather/road/route/accessibility classifications, reasons, limitations, distance/time and reference fuel estimates when available. Provider failures must remain partial/unknown/unavailable and advisory. |

### Reports

`GET /api/admin-reports?start=YYYY-MM-DD&end=YYYY-MM-DD&branch=id|all` is read-only for Owner/Admin and Staff. Range is inclusive in Manila time and capped at 366 days; branch must be canonical. Output includes operational summaries; booking status breakdown by `created_at`; rental started/completed/active-at-period-end; vehicle utilization/idle with unavailable counts; maintenance started/completed/cancelled/blocking workload; and branch/category performance. Sources are booking, rental, maintenance, vehicle, branch/category, and vehicle-analytics records. It intentionally has no revenue, payment, charge, settlement, or profit semantics.

### Customers, branches, users/roles, settings, audit, and backup

| Capability | Repository contract and limitation |
|---|---|
| Customers | No customer-management API or canonical customer-list loader exists. `/admin/customers` uses static `src/data/admin` records and only its requirement-review subsection is canonical. No Add customer mutation exists. |
| Branches/categories/vehicles | Owner/Admin-only `GET/POST/PATCH /api/master-data`; resources are `branches`, `categories`, and `vehicles`; validates names, IDs, numeric fields, unique and foreign-key conflicts. Branch UI implements create/edit/activate/deactivate; Fleet implements vehicle create and branch update. |
| Users/roles | Owner/Admin-only `GET/PATCH /api/admin-users`; GET returns canonical profile/account fields; PATCH requires userId and one of the three canonical roles and persists `profiles.user_type`. No create, delete, account-status, or self-protection rule is exposed by this API. |
| Settings | No API, schema-backed settings read, or settings mutation is used by `/admin/settings`. Current business details, fees, limits, and Waze state are hard-coded UI values. Treating them as saved/canonical requires new backend/domain authority. |
| Audit | Owner/Admin-only `GET /api/audit-events` with validated page/limit/domain/actor/from/to; returns append-only event projection and total. It is an implemented capability omitted from the proposed IA. |
| Backup | Owner/Admin-only `GET /api/backup-status`; reads deployment-managed backup/recovery metadata and retention configuration. No direct screen consumes it; backup attention may arrive through notifications. |

## Blueprint feasibility conflicts

| Category | Conflict | Required disposition |
|---|---|---|
| Frontend-only | Consolidated discovery, My Bookings/detail composition, Admin detail composition, role-appropriate controls, explicit loaders/errors/empty states, and removal of fake controls are supported by existing contracts. | May proceed only after Lead authorizes implementation. |
| Implementation defect candidate | Staff booking UI exposes Owner/Admin actions; browse asserts availability without readiness/period data; requirements bind only newest booking; mock Customers and local Admin profile are presented as operational data; Contact simulates delivery. | Triage as bounded frontend defects; preserve server authority. |
| Manuscript mismatch | Proposed Ready, Settlement pending, and Completed customer states have no canonical fields; Settings is proposed as management despite no contract; Audit Trail is implemented but missing from proposed IA. | Amend/freeze the manuscript to label derived-only states and retain or explicitly disposition implemented capabilities. |
| Domain/client ambiguity | Minimum 50% payment, security deposit/refund, cancellation, late fee, delivery fulfillment, post-return inspection/settlement, and public policy claims are not fully defined by canonical code. | Obtain Lead/client decision; do not encode copy, totals, or actions from static legacy text. |
| Architecture/schema/authorization conflict | No persisted readiness/preparation/settlement/completion lifecycle; return leaves booking Confirmed; all lifecycle decisions and sensitive document/payment/maintenance/fleet/allocation mutations are Owner/Admin-only. | A literal full blueprint or delegation to Operations Staff requires separately authorized schema/domain/RBAC work. Frontend may only derive honest, non-persisted milestones from existing fields. |
