# Manuscript–Implementation Alignment Matrix

**Project:** Briah's Car Rental Fleet Management System  
**Audit scope:** Implemented Vertical Slices VS001–VS021 versus the latest Proposal Paper baseline and client-ground-truth decisions  
**Audit date:** 2026-09-02  
**Purpose:** Identify what is aligned, what must still be implemented, and what manuscript material must be revised to match the verified system.

---

## Status Legend

- **ALIGNED** — current implementation materially matches the manuscript requirement.
- **ALIGNED — MANUSCRIPT DETAIL UPDATE** — capability matches, but manuscript technical/data details should be updated.
- **IMPLEMENTATION IMPROVEMENT** — implementation satisfies the intent using a safer/stronger architecture; manuscript should follow implementation.
- **PARTIAL** — only part of the manuscript capability is implemented.
- **PLANNED** — valid manuscript capability intentionally remains for a future slice.
- **CLIENT-BLOCKED** — exact rule cannot safely be finalized without client clarification.
- **OBSOLETE MANUSCRIPT DESIGN** — conceptual manuscript structure should not automatically be implemented; reassess/rewrite around the canonical system.
- **REJECTED DESIGN** — explored but never implemented; must not enter the manuscript.

---

# A. Vertical Slice Alignment

| VS | Implemented Capability | Manuscript Alignment | Manuscript Action |
|---|---|---|---|
| VS001 | Supabase backend foundation, profiles, branches, categories, vehicles, RLS | **ALIGNED** | Update only final technology/schema details if names changed |
| VS002 | Authentication and role foundation | **ALIGNED** | Verify role terminology is consistently Owner/Admin, Operations Staff, Customer/Renter |
| VS003 | Canonical vehicle/branch data integration | **ALIGNED** | Ensure mock-data wording is removed from final implementation discussion |
| VS004 | Customer authentication/registration progression | **ALIGNED** | Verify actual Auth fields and flows against use cases |
| VS005 | Booking request persistence/workflow foundation | **ALIGNED — DETAIL UPDATE** | Update final Booking data dictionary to actual schema |
| VS006 | Renter requirement submission/secure storage | **ALIGNED** | Verify requirement entities/storage wording |
| VS007 | Requirement review and verification | **ALIGNED** | Ensure Needs Resubmission + Verified lifecycle appears in diagrams |
| VS008 | Payment proof submission/manual verification | **ALIGNED** | Remove/qualify automatic gateway claims; preserve manual baseline |
| VS009 | Vehicle assignment and booking confirmation | **ALIGNED** | Verify requested vs assigned vehicle distinction |
| VS010 | Rental release/start and return/closure foundation | **ALIGNED** | Update actual rental transaction fields in data dictionary |
| VS011 | Maintenance lifecycle/readiness foundation | **ALIGNED — UI PARTIAL** | Backend aligned; final Admin Maintenance UI still requires canonicalization |
| VS012 | Maintenance readiness / PMS / rental-use exclusion | **ALIGNED** | Ensure maintenance readiness is shown as shared eligibility boundary |
| VS013 | Utilization / idle-vehicle analysis | **ALIGNED** | Verify actual canonical metric fields and reporting wording |
| VS014 | WMA demand forecasting | **ALIGNED** | Preserve 0.50/0.30/0.20 WMA and approved forecast behavior |
| VS015 | Projected supply / shortage-surplus analysis | **ALIGNED** | Ensure projected supply is distinguished from current available count |
| VS016 | Branch allocation recommendation/advisory decision support | **ALIGNED** | Preserve advisory/non-automatic transfer boundary |
| VS017 | Customer Smart Vehicle Finder | **ALIGNED** | Latest manuscript already reflects customer-side move; verify all diagrams |
| VS018 | Finder → canonical Booking handoff + provenance + booking idempotency | **IMPLEMENTATION IMPROVEMENT** | Update booking/Finder diagrams and actual data model |
| VS019 | Canonical event-driven in-app notifications | **PARTIAL + IMPLEMENTATION IMPROVEMENT** | Rewrite Notifications data dictionary; maintenance/low-availability/settings still pending |
| VS020 | Scheduled pickup/return/overdue reminders | **PARTIAL / PROVISIONAL** | Document 24h timing as researcher-designed pending CQ-031; host scheduling deployment must be described accurately |
| VS021 | Semantic append-only Audit Trail | **IMPLEMENTATION IMPROVEMENT** | Replace old Audit_Logs data dictionary/coverage with actual audit_events model |

---

# B. Specific Objective / Core Research Capability Alignment

## Customer Smart Vehicle Finder

**Status:** ALIGNED

Current system:
- customer-side;
- rule-based/deterministic;
- capacity;
- budget;
- rental period;
- optional category preference;
- current availability;
- maintenance readiness;
- no arbitrary percentage score;
- Finder selection hands off to canonical Booking.

Manuscript action:
- ensure all older Administrator-facing recommendation remnants are removed;
- add Finder → Booking handoff where diagrams still end at recommendation display;
- optionally document Finder provenance as implementation detail.

Related MIC:
- MIC-001
- MIC-002
- MIC-003
- MIC-014

## WMA Demand Forecasting

**Status:** ALIGNED

Current system follows the defended WMA direction and remains separate from contextual APIs.

Manuscript action:
- verify formulas, 0.50/0.30/0.20 weights, forecast horizon, historical booking source, and validation language match actual implementation.

## Projected Supply

**Status:** ALIGNED

Current system distinguishes projected supply from simple current availability.

Manuscript action:
- verify diagrams and operational logic use projected supply when discussing future shortages/surpluses.

## Branch Allocation Recommendation

**Status:** ALIGNED

Current system is advisory and does not automatically transfer vehicles.

Manuscript action:
- preserve this human-in-the-loop boundary;
- future context should supplement allocation rather than independently execute transfers.

## Maintenance Readiness

**Status:** ALIGNED

Current backend provides a shared canonical readiness boundary used by decision-support features.

Manuscript action:
- ensure customer Finder and allocation eligibility consistently reference maintenance readiness;
- later canonicalize the Admin Maintenance UI.

---

# C. Functional Requirement Alignment

## Authentication / Authorization

**Status:** ALIGNED

Implementation uses Supabase Auth/profile roles and trusted server authorization with RLS defense in depth.

Manuscript action:
- reconcile exact final profile/user schema;
- ensure obsolete role names are removed.

## Fleet / Vehicle Management

**Status:** ALIGNED — UI review still required

Canonical vehicles/branches/categories exist.

Manuscript action:
- final data dictionary should use actual field names/types;
- preserve reference fuel efficiency.

## Booking Management

**Status:** ALIGNED — MANUSCRIPT DETAIL UPDATE

Important implemented improvements:
- requested vehicle vs assigned vehicle distinction;
- Finder-origin booking provenance;
- idempotent booking creation.

Manuscript action:
- update data dictionary and activity/DFD diagrams;
- do not introduce a second Finder booking aggregate.

## Requirement Verification

**Status:** ALIGNED

Canonical states include submission, review, Needs Resubmission, resubmission, and verification.

Manuscript action:
- ensure client-confirmed “requirements before payment” sequence is explicit everywhere.

## Payment

**Status:** ALIGNED WITH CLIENT BASELINE / SOME BUSINESS RULES OPEN

Current baseline:
- manual proof/reference submission;
- manual verification;
- 50% minimum down payment client-confirmed;
- bank transfer / GCash / cash.

Still unresolved:
- complete final bill composition;
- cancellation exceptions;
- settlement;
- deposit handling;
- full late-fee schedule.

Manuscript action:
- remove PayMongo from implemented-baseline claims;
- classify gateway automation as future enhancement if retained.

## Rental Release / Return

**Status:** ALIGNED

Current implementation has canonical release/start and physical return/closure.

Manuscript action:
- verify actual rental transaction schema and statuses;
- do not claim complete settlement logic yet.

## Maintenance

**Status:** PARTIAL AT PRODUCT-UI LEVEL

Backend/readiness is canonical.

Admin Maintenance presentation still contains prototype/mock-derived sections.

Manuscript action:
- capability may be described as implemented at backend/business-rule level;
- final screenshots/evaluation must wait for UI canonicalization.

## Notifications

**Status:** PARTIAL

Implemented:
- canonical in-app recipient-specific notifications;
- requirement/payment/booking event notifications;
- pickup/return/overdue scheduled reminders;
- unread/read state;
- deduplication.

Not implemented yet:
- maintenance alerts;
- low-availability alerts;
- configurable notification preferences/settings;
- external transactional email.

Manuscript action:
- do not mark full notification requirement complete;
- rewrite notification schema.

## Audit

**Status:** IMPLEMENTATION IMPROVEMENT

Implemented semantic append-only audit is safer than manuscript generic old/new-value Audit_Logs.

Manuscript action:
- replace old data dictionary;
- narrow coverage claims to actual audited domains.

## Reports / Dashboard

**Status:** PARTIAL / PLANNED CANONICALIZATION

Research metrics exist in canonical services, but final Reports/Dashboard reconciliation remains pending.

Manuscript action:
- do not finalize screenshots or report claims until canonicalization slice is complete.

## Backup / Recovery

**Status:** PLANNED / REASSESS REQUIRED

Manuscript contains Backup_Logs/backup-recovery expectations.

No completed VS001–VS021 slice provides the manuscript-described Backup Logs workflow.

Manuscript action:
- determine final backup strategy;
- distinguish managed Supabase backup/recovery from an application-level Backup_Logs feature;
- implement or revise manuscript accordingly.

---

# D. Data Dictionary Reconciliation

## Keep / Reconcile With Actual Schema

These conceptual entities clearly correspond to implemented canonical data and should be reconciled to actual database names/fields:

- Users / Profiles
- Branches
- Vehicle Categories
- Vehicles
- Booking Requests / Bookings
- Renter Requirement Sets/Documents/Reviews
- Payments / Payment Proofs / Payment Methods
- Rental Transactions
- Maintenance Records
- Notifications
- Audit Events
- Forecast-related canonical data
- Supply/allocation-related canonical data
- Finder provenance / booking Finder context
- Booking idempotency persistence

## High-Priority Data Dictionary Rewrites

### Notifications

**Manuscript conceptual model:** user/renter/booking fields + `is_read`.

**Actual model:** recipient-specific row, related entity, deterministic event key, `read_at`.

Action:
**UPDATE DATA DICTIONARY + ERD**

### Audit Logs

**Manuscript conceptual model:** module/table/field/old/new/IP generic log.

**Actual model:** semantic append-only `audit_events`.

Action:
**REPLACE DATA DICTIONARY MODEL + ERD**

### Booking

Add/reconcile:
- requested vehicle;
- assigned vehicle;
- Finder context where appropriate;
- idempotent creation architecture if persistence entity is included.

### Maintenance

Reconcile actual maintenance/PMS/readiness fields rather than prototype UI objects.

## Entities Requiring Reassessment Before Implementation

Do NOT automatically implement these solely because they appear in the manuscript data dictionary:

- Quotations
- Quotation Items
- Booking Approvals
- Booking Status Logs
- Rental Charges
- Operational Expenses
- Rental Return Inspections
- Monitoring Records
- Trip Contexts
- Rental Policies
- System Settings
- Backup Logs

For each, ask:

1. Is the capability still required by the current Specific Objectives/Scope?
2. Is it already represented by another canonical aggregate?
3. Is it needed for evaluation?
4. Was it superseded by a later implementation decision?
5. Does the client actually require it?

Classify each as:
- IMPLEMENT;
- CONSOLIDATE;
- REMOVE FROM MANUSCRIPT;
- FUTURE ENHANCEMENT;
- CLIENT CLARIFICATION.

---

# E. Use Case / Diagram Reconciliation

## Must Be Verified or Updated

### Smart Vehicle Finder
Ensure:
- Customer is actor;
- Finder occurs before booking;
- result selection leads into existing Booking;
- no arbitrary percentage score.

### Booking
Ensure:
- requested vehicle may originate from Browse/Finder;
- booking is not automatically confirmed;
- requirements precede payment;
- assignment/confirmation remains authorized Admin action.

### Requirements
Ensure:
- Needs Resubmission loop exists;
- accepted documents need not be unnecessarily reuploaded if actual implementation preserves them.

### Payment
Ensure:
- manual verification baseline;
- no PayMongo success callback in implemented flow.

### Notifications
Update diagrams/use cases to distinguish:
- event-driven in-app notifications;
- scheduled reminders;
- future configurable/external delivery.

### Audit
Update actor/access:
- Owner/Admin read-only Audit Trail;
- Customer/Operations Staff denied in current implementation.

### Allocation
Preserve advisory decision and no automatic transfer.

### External Context
Do not draw context APIs as already implemented until VS022+ is complete.

---

# F. Development Tools / Provider Reconciliation

## Supabase

**Status:** ALIGNED

Used for:
- Auth;
- PostgreSQL;
- Storage;
- RLS;
- server-side canonical persistence.

## Transactional Email

**Status:** MANUSCRIPT UPDATE REQUIRED

Manuscript:
- Resend + React Email.

Current planned architecture:
- Brevo;
- Brevo SMTP may support Supabase Auth;
- external application email not yet implemented.

Action:
- update Development Tools after final provider decision is confirmed.

## External Context Providers

**Status:** MANUSCRIPT AUTHORITATIVE / PLANNED

Future implementation must currently follow:

Weather:
- Open-Meteo primary;
- OpenWeather fallback.

Geocoding:
- TomTom Orbis primary;
- HERE fallback.

Routing:
- TomTom Orbis primary;
- HERE fallback.

Traffic/incidents:
- TomTom primary;
- HERE fallback.

Any provider change requires a new MIC entry before implementation.

Rejected Geoapify/WeatherAPI planning must not enter manuscript history as an implemented change.

---

# G. Client-Ground-Truth Reconciliation

## Confirmed

- requirements are verified before down payment;
- 50% minimum down payment;
- bank transfer / GCash / cash;
- manual payment verification;
- customer traditionally chooses vehicle;
- mobile/tablet/laptop use matters;
- privacy is important.

## Partially Confirmed

- PHP 3,000 for <6h late/extension;
- restricted travel areas;
- tie-up partner vehicle fallback;
- described 30/70 tie-up arrangement.

## Researcher-Designed

- Smart Vehicle Finder algorithm;
- deterministic Finder ranking;
- WMA forecasting;
- supply/shortage logic;
- allocation recommendation;
- provisional 24h reminder lead time.

## Still Open

- exact restricted-area rules;
- complete late-return schedule;
- tie-up partner workflow;
- final settlement;
- transfer execution;
- exact notification timing preferences.

Manuscript must distinguish these categories and not present researcher-designed/provisional values as client-confirmed rules.

---

# H. Immediate Manuscript Revision Backlog

## Priority 1 — Correct Current Contradictions

1. Replace Resend/React Email with Brevo if Brevo is confirmed final.
2. Rewrite Notifications data dictionary to actual VS019 model.
3. Rewrite Audit Logs data dictionary to actual VS021 semantic model.
4. Correct audit coverage claims.
5. Remove/qualify PayMongo as implemented payment processing.
6. Ensure API provider table remains TomTom/HERE/Open-Meteo/OpenWeather.

## Priority 2 — Update Diagrams to Actual Workflow

7. Finder → existing Booking handoff.
8. Requirements Needs Resubmission loop.
9. Manual payment verification.
10. Requested vs assigned vehicle.
11. Notifications vs scheduled reminders.
12. Owner/Admin Audit Trail.

## Priority 3 — Do Not Overclaim Incomplete Features

13. Maintenance UI canonicalization pending.
14. Maintenance alerts pending.
15. Low-availability alerts pending.
16. Notification configuration/preferences pending.
17. Reports/Dashboard final canonicalization pending.
18. Backup/recovery design pending.
19. External context APIs pending.
20. Settlement/penalty rules partially client-blocked.

---

# I. Remaining Development Roadmap Derived From Alignment Audit

Before final manuscript freeze, remaining work should explicitly account for:

1. manuscript-aligned external context provider foundation;
2. context interpretation/administrative decision support;
3. remaining notification requirements/settings;
4. Maintenance UI canonicalization and appropriate maintenance awareness;
5. Reports/Dashboard canonicalization;
6. backup/recovery decision and implementation/documentation;
7. role/mobile UX validation;
8. demo dataset and full E2E validation;
9. unresolved client-rule updates after presentation.

Do not create slices solely to reproduce obsolete conceptual tables.

---

# J. Permanent Traceability Rule

Every future vertical slice must contain:

```text
## Manuscript Traceability

Supports:
- Specific Objective:
- Requirement:
- Use Case:
- Scope/Algorithm:
- Data Dictionary entities:

Implementation changes requiring manuscript update:
- None / MIC-XXX

Must not contradict:
- authoritative manuscript rules/providers/limitations
```

After implementation review:

1. compare actual commit against the traceability declaration;
2. update the Change Register if behavior/design changed;
3. update this Alignment Matrix status;
4. identify exact manuscript revisions;
5. preserve unresolved client rules as unresolved.

No provider, algorithm, actor, business rule, or manuscript-level scope may be silently substituted.
