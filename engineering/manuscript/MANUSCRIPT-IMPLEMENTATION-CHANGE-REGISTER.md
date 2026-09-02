# Manuscript–Implementation Change Register

**Project:** Briah's Car Rental Fleet Management System  
**Purpose:** Record every implementation decision, client clarification, technical improvement, or scope adjustment that requires manuscript review or correction.  
**Baseline manuscript reviewed:** Proposal Paper.docx, latest available project copy dated 2026-08-28.  
**Register started:** 2026-09-02

---

## How to Use This Register

This register is the bridge between the implemented system and the manuscript.

Whenever implementation differs from an earlier manuscript statement, add a change record here before editing the manuscript.

Each change must be classified as one of:

- **IMPLEMENTATION IMPROVEMENT** — the implementation satisfies the same research requirement using a better technical design; update the manuscript to describe the actual implementation.
- **CLIENT-CONFIRMED CHANGE** — implementation/context changed because Briah clarified the real business process.
- **RESEARCHER-DESIGNED DECISION** — the capstone team selected a reasonable rule/algorithm because the client does not already perform that process.
- **PROVISIONAL IMPLEMENTATION** — temporary value/rule awaiting client validation.
- **PLANNED / NOT YET IMPLEMENTED** — manuscript scope remains valid but implementation is incomplete.
- **REJECTED / NOT IMPLEMENTED** — an explored design was discarded and must not be reflected in the manuscript.
- **MANUSCRIPT CORRECTION REQUIRED** — the paper currently describes a materially different implemented system.

### Manuscript update rule

Do not change the manuscript merely because an implementation detail exists.

Update the manuscript when the difference affects at least one of:

1. Specific Objectives;
2. Scope and Limitations;
3. Requirements / Feature Matrix;
4. Use Cases;
5. Activity / DFD / Context / Architecture diagrams;
6. Data Dictionary / ERD;
7. Operational or Algorithm Logic;
8. Development Tools / API Selection;
9. Testing / Evaluation;
10. Limitations / Future Enhancements.

---

# Change Register

## MIC-001 — Vehicle Recommendation Moved to Customer-Side Smart Vehicle Finder

**Classification:** CLIENT/PANEL-APPROVED CHANGE — IMPLEMENTED  
**Implementation status:** Implemented through VS017 and connected to Booking in VS018.

### Earlier manuscript/design state
Vehicle recommendation was originally described as an Administrator-facing recommendation/decision-support capability.

### Implemented state
The recommendation capability is now customer-facing through the **Smart Vehicle Finder** before booking submission.

Baseline Finder uses deterministic rules based on:
- rental period;
- passenger capacity;
- maximum base-rental budget;
- optional preferred category;
- active vehicle state;
- maintenance readiness;
- requested-period availability.

Ranking uses:
1. preferred category;
2. closest sufficient capacity;
3. lower base rental;
4. stable tie-break.

No arbitrary match percentage is used.

### Manuscript impact
Review/update:
- Specific Objectives;
- Scope and Limitations;
- R10/R11 or equivalent Requirement–Feature Matrix entries;
- General and Detailed Use Cases;
- Activity Diagrams;
- DFD;
- System Architecture;
- feature descriptions;
- data dictionary if Finder provenance is documented.

### Status
**Mostly reconciled in latest manuscript. Continue checking naming consistency.**

---

## MIC-002 — Finder Recommendation Now Hands Off to Canonical Booking

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented in VS018.

### Implemented state
Selecting a Finder recommendation does not create a second booking flow. It transfers the recommendation into the existing Booking page, prefills compatible fields, and submits through canonical booking creation.

A small immutable Finder provenance record is retained only for successfully submitted Finder-origin bookings.

### Additional implementation safeguards
- server revalidates Finder eligibility;
- client-provided rank is not trusted;
- changed material Finder fields invalidate Finder provenance;
- booking + Finder provenance are persisted atomically;
- stale recommendation is rejected rather than falsely preserved.

### Manuscript impact
Potential updates:
- Booking Activity Diagram;
- Finder Activity Diagram;
- DFD;
- System Architecture;
- Database/Data Dictionary if the Finder provenance child record is included.

### Status
**Manuscript review required.**

---

## MIC-003 — Booking Creation Is Idempotent

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented after VS018 correction.

### Implemented state
Manual and Finder-origin booking creation use a request idempotency key.

Same customer + same key + same material request:
- returns the existing booking.

Same key + incompatible request:
- controlled idempotency mismatch.

A new key:
- represents a new intentional booking submission.

### Reason
Prevents duplicate booking records caused by browser retry, lost HTTP response, or double-submit race.

### Manuscript impact
Usually does not require a Specific Objective change.

Consider updating:
- System Architecture;
- transaction/data integrity description;
- testing/security/reliability section;
- database design if idempotency persistence is documented.

### Status
**Manuscript technical-description improvement recommended.**

---

## MIC-004 — Requirements Workflow Explicitly Supports Additional/Resubmitted Documents

**Classification:** CLIENT-CONFIRMED CHANGE / IMPLEMENTED  
**Implementation status:** Implemented before/through requirement review slices.

### Client-grounded state
Briah verifies renter requirements before payment and may request additional/replacement documents when concerns exist.

### Implemented state
Canonical requirement workflow supports:
- Not Submitted;
- Pending Review;
- Needs Resubmission;
- Verified;
- customer-facing correction reasons;
- replacement of affected requirements;
- resubmission to Pending Review.

### Manuscript impact
Verify:
- requirement submission/review use cases;
- payment preconditions;
- activity diagrams;
- status diagrams;
- requirements data dictionary.

### Status
**Should be explicitly aligned with the client-confirmed sequence.**

---

## MIC-005 — Down Payment Confirmed at 50% Minimum

**Classification:** CLIENT-CONFIRMED CHANGE  
**Implementation status:** Context frozen; payment baseline uses the confirmed minimum rule where applicable.

### Earlier uncertainty
Development initially treated the down-payment rule as a business-process gap requiring client confirmation.

### Client-confirmed state
Minimum required down payment is **50% of the applicable total bill**.

Customers may voluntarily pay more.

Client also stated that the down payment is non-refundable when the renter cancels, but complete cancellation/refund exceptions remain unresolved.

### Manuscript impact
Review:
- Scope;
- payment use cases;
- payment business rules;
- System Settings;
- payment data dictionary;
- limitations.

Do not overstate unresolved cancellation/refund exceptions.

### Status
**Manuscript should treat 50% as client-confirmed, while exceptions remain open.**

---

## MIC-006 — Payment Baseline Remains Manual Verification

**Classification:** IMPLEMENTATION ALIGNMENT / CLIENT-CONFIRMED  
**Implementation status:** Implemented.

### Implemented state
Current channels include:
- bank transfer;
- GCash;
- cash.

Payment proof/reference is manually verified by authorized personnel.

No automatic payment gateway is required for the baseline.

### Manuscript impact
Ensure PayMongo/payment-gateway wording is either:
- removed from current implementation claims; or
- clearly classified as a future enhancement.

### Status
**Manuscript consistency check required wherever PayMongo still appears.**

---

## MIC-007 — Planned Email Provider Changed from Resend to Brevo

**Classification:** MANUSCRIPT CORRECTION REQUIRED — PLANNED PROVIDER CHANGE  
**Implementation status:** External transactional email not yet implemented.

### Manuscript state
Latest manuscript still references:
- Resend;
- React Email;
- custom SMTP for Supabase Auth.

### Current implementation decision
Planned provider is now:
- **Brevo** for future application transactional email;
- Brevo SMTP may be used as Supabase Auth custom SMTP.

Application business logic will use a provider abstraction rather than calling Brevo directly.

### Important boundary
VS019/VS020 are in-app only. Brevo has not yet been integrated.

### Manuscript impact
Update:
- Development Tools;
- notification architecture;
- technical feasibility/provider descriptions;
- future email-delivery discussion.

Remove Resend/React Email as the planned provider unless deliberately retained for a separate purpose.

### Status
**Open manuscript correction.**

---

## MIC-008 — Notification Persistence Is Recipient-Specific and Event-Based

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented in VS019.

### Manuscript data-dictionary state
The manuscript describes a Notifications table using fields such as:
- notification_id;
- user_id;
- renter_id;
- booking_id;
- title;
- message;
- notification_type;
- is_read;
- created_at.

### Implemented state
Canonical notifications are recipient-specific records and include:
- UUID notification ID;
- recipient ID;
- stable notification type;
- title;
- safe message;
- related entity type/ID;
- deterministic event key;
- created_at;
- read_at.

Read state is derived from `read_at`.

The event key provides retry/double-click deduplication.

### Manuscript impact
Update:
- Notifications data dictionary;
- ERD;
- notification workflow description;
- RLS/security description if included.

Do not preserve obsolete renter/user dual-recipient columns if they do not exist in the final database.

### Status
**Manuscript correction required.**

---

## MIC-009 — Notifications Are Split Into Event-Driven and Scheduled Awareness

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** VS019 + VS020 complete.

### Event-driven notifications
Examples:
- requirements need resubmission;
- requirements verified;
- payment needs resubmission;
- payment verified;
- booking confirmed;
- new booking request;
- requirements submitted/resubmitted;
- payment proof submitted/resubmitted.

### Scheduled reminders
Researcher-designed/provisional baseline:
- pickup reminder: 24 hours before;
- return reminder: 24 hours before;
- overdue reminder: once per Asia/Manila calendar day while physically unreturned.

### Boundary
24-hour timing is not client-confirmed.

### Manuscript impact
Update:
- notification use cases;
- Configure Notifications expectations;
- activity diagrams;
- data dictionary;
- notification requirements.

The manuscript's maintenance and low-availability alerts are still **not yet implemented**.

### Status
**Partial manuscript requirement implementation.**

---

## MIC-010 — Reminder Processor Is Provider-Neutral

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented in VS020.

### Implemented state
Reminder eligibility is separate from the hosting scheduler.

Processor:
- reads canonical booking/rental state;
- uses trusted Asia/Manila time;
- derives due events;
- creates canonical notifications;
- does not mutate lifecycle state.

### Deployment boundary
A host scheduler still needs to invoke the trusted processor periodically.

### Manuscript impact
Potential System Architecture / Deployment description update.

### Status
**Technical documentation update recommended.**

---

## MIC-011 — Audit Log Design Changed to Semantic Append-Only Audit Events

**Classification:** MANUSCRIPT CORRECTION REQUIRED — IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented in VS021.

### Manuscript data-dictionary state
The manuscript currently describes `Audit_Logs` using:
- audit_id;
- user_id;
- module_name;
- action_type;
- table_name;
- record_id;
- field_name;
- old_value;
- new_value;
- description;
- ip_address;
- created_at.

### Implemented state
Canonical `audit_events` uses a semantic privacy-conscious model:
- id;
- actor_type;
- actor_user_id;
- action;
- entity_type;
- entity_id;
- booking_id;
- metadata;
- occurred_at.

Examples:
- `booking.created`;
- `payment.verified`;
- `rental.returned`;
- `maintenance.completed`.

Audit records are append-only.

### Reason
The implementation avoids generic database snapshots and prevents sensitive payment/identity/document values from being copied into immutable audit history.

### Manuscript impact
Update:
- Audit Logs data dictionary;
- ERD;
- security/accountability section;
- maintenance/audit discussion;
- relevant use cases.

Explain semantic metadata instead of old/new field dumping.

### Status
**High-priority manuscript correction. Do not rewrite implementation back to the old table.**

---

## MIC-012 — Audit Coverage Is Deliberately Limited to Core Human Lifecycle Mutations

**Classification:** IMPLEMENTATION SCOPE REFINEMENT  
**Implementation status:** Implemented.

### Implemented first-wave audit
- booking created;
- requirements submitted/resubmitted/reviewed;
- payment submitted/resubmitted/reviewed;
- vehicle assignment;
- booking confirmation;
- rental release;
- rental return;
- maintenance create/complete/cancel.

### Not currently audited
- notification generation/read;
- scheduled reminders;
- forecasting;
- supply;
- allocation;
- generic page/API reads.

### Manuscript impact
If manuscript says audit covers Forecasting, Allocation, Reports, Login/Logout, etc., revise wording to distinguish:
- current implemented core audit scope; and
- future/possible broader coverage.

### Status
**Scope consistency correction required.**

---

## MIC-013 — Manila Business Time Is Explicitly Canonicalized

**Classification:** IMPLEMENTATION IMPROVEMENT  
**Implementation status:** Implemented from VS017 onward and reused by reminders.

### Implemented state
HTML `datetime-local` inputs are explicitly interpreted in Asia/Manila rather than server/browser timezone.

This prevents an 8-hour deployment-time shift.

Daily overdue recurrence also uses the Asia/Manila calendar date.

### Manuscript impact
Optional but useful technical-methodology update:
- system time assumptions;
- booking date/time validation;
- reminder timing.

### Status
**Technical documentation improvement recommended.**

---

## MIC-014 — Customer Finder Destination Is Preserved but Does Not Yet Affect Baseline Ranking

**Classification:** RESEARCHER-DESIGNED SCOPE BOUNDARY  
**Implementation status:** Implemented.

### Implemented state
Destination/travel area may be captured and handed into Booking, but baseline Finder eligibility/ranking remains primarily based on:
- vehicle active state;
- maintenance readiness;
- requested-period availability;
- passenger capacity;
- budget;
- category preference.

### Manuscript impact
This is aligned with the latest manuscript's statement that external contextual information is supporting/advisory and should not independently determine final decisions.

Ensure diagrams/feature descriptions do not imply live contextual APIs are already affecting the Finder before those later slices exist.

### Status
**Aligned; continue traceability.**

---

## MIC-015 — Restricted Travel Rules Exist but Are Not Yet Encoded

**Classification:** CLIENT-PARTIALLY-CONFIRMED / OPEN CLARIFICATION  
**Implementation status:** Not implemented.

### Known
Briah stated that restricted travel areas exist and mentioned Bicol in relation to road conditions and some sedan use.

### Unknown
- exact boundaries;
- affected vehicles/categories;
- absolute vs conditional restriction;
- exceptions;
- penalties.

### Manuscript impact
Do not state a hard rule such as:
`Bicol = no sedans`.

Context-aware sections may acknowledge route/accessibility assessment, but exact Briah restriction logic remains pending.

### Status
**Open CQ-028.**

---

## MIC-016 — External API Provider Stack Must Follow Manuscript Primary/Fallback Architecture

**Classification:** MANUSCRIPT-AUTHORITATIVE DESIGN — NOT YET IMPLEMENTED  
**Implementation status:** VS022 has NOT been implemented.

### Manuscript-authoritative stack

Weather:
- Primary: Open-Meteo Forecast API
- Fallback: OpenWeather One Call API 3.0

Geocoding:
- Primary: TomTom Orbis Geocoding API
- Fallback: HERE Geocoding and Search API v7

Routing:
- Primary: TomTom Orbis Routing API
- Fallback: HERE Routing API v8

Route feasibility/accessibility and road condition:
- TomTom Routing/Traffic Incidents
- fallback HERE Routing/Traffic API

Fuel efficiency:
- internal reference data.

Fuel estimate:
- internal route-distance / km-per-liter calculation.

### Rejected exploration
Geoapify + WeatherAPI.com was briefly proposed during planning but was rejected before commit/implementation because it conflicted with the manuscript.

### Manuscript impact
**None from the rejected proposal.**

Future implementation must trace to the manuscript provider table unless the team formally approves a manuscript/provider change first.

### Status
**Keep manuscript authoritative.**

---

## MIC-017 — Vehicle Reference Fuel Efficiency Is Already Present in the Implemented Data Model

**Classification:** MANUSCRIPT ALIGNMENT  
**Implementation status:** Canonical vehicle model includes reference fuel efficiency.

### Implemented field
Vehicle records include a reference fuel-efficiency value in km/L.

### Planned calculation
When canonical route distance exists:

`Estimated Fuel Consumption = Route Distance / Reference Fuel Efficiency`

### Manuscript impact
Keep the existing manuscript definition.

Do not add an external fuel-consumption API.

### Status
**Aligned / pending operational-context implementation.**

---

## MIC-018 — Maintenance Backend Is Canonical but Admin Maintenance UI Still Contains Prototype Data

**Classification:** PARTIAL IMPLEMENTATION  
**Implementation status:** Backend implemented; UI canonicalization pending.

### Implemented backend
Canonical maintenance supports:
- maintenance records;
- PMS/next-service values;
- vehicle odometer;
- rental-use blocking;
- readiness calculation;
- create/complete/cancel transitions.

### Remaining gap
Current Admin Maintenance UI still contains mock/prototype-derived dashboard/schedule values.

### Manuscript impact
Do not claim the entire maintenance user interface is fully canonical until the later UI consolidation slice is complete.

### Status
**Planned canonicalization.**

---

## MIC-019 — Maintenance and Low-Availability Notifications Are Not Yet Implemented

**Classification:** PLANNED / NOT YET IMPLEMENTED

### Manuscript expectation
Notifications include maintenance alerts and low-availability alerts.

### Current system
VS019/VS020 implemented core lifecycle notifications and booking/rental reminders only.

### Manuscript impact
Do not mark the complete notification requirement as fully implemented yet.

### Status
**Remaining roadmap item.**

---

## MIC-020 — Backup Logs / Backup-Recovery Functionality Has Not Yet Been Implemented

**Classification:** PLANNED / NOT YET IMPLEMENTED

### Manuscript state
The latest data dictionary includes `Backup_Logs` and backup/recovery expectations.

### Current implementation
No completed vertical slice has yet established the manuscript-described Backup Logs workflow.

### Manuscript impact
Do not claim operational backup-log functionality is implemented until verified.

The final architecture may rely partly on managed Supabase backup/recovery capabilities, but any manuscript claim must match the actual final implementation and evidence.

### Status
**Remaining alignment item.**

---

## MIC-021 — Tie-Up Partner Fleet Fallback Is Real but Outside Current Canonical Fleet Model

**Classification:** CLIENT-PARTIALLY-CONFIRMED / NOT IMPLEMENTED

### Known
Briah may source vehicles from tie-up partners when internal supply cannot satisfy demand.

A 30% Briah / 70% partner arrangement was described in the interview.

### Unknown
- whether 30/70 is universal;
- partner vehicle verification;
- maintenance/liability responsibility;
- payment handling;
- whether partner vehicles should appear in Browse/Finder;
- whether this is inside current capstone scope.

### Manuscript impact
Do not silently model tie-up vehicles as ordinary internal fleet.

### Status
**Open CQ-030.**

---

## MIC-022 — Late-Return PHP 3,000 Statement Is Partial, Not a Complete Penalty Rule

**Classification:** CLIENT-PARTIALLY-CONFIRMED

### Known
Client stated approximately/typically PHP 3,000 for a late return/extension of less than six hours.

### Unknown
- exact applicability;
- six-hour boundary;
- >= six-hour behavior;
- full-day transition;
- exceptions.

### Implemented state
VS020 overdue notifications deliberately do not calculate or assert this fee.

### Manuscript impact
Do not freeze a complete late-fee algorithm until CQ-029 is resolved.

### Status
**Open CQ-029.**

---

# Immediate Manuscript Revision Backlog

## Priority A — Direct mismatches

1. **Audit Logs data dictionary**
   - replace generic field-change Audit_Logs design with actual semantic append-only `audit_events` model.

2. **Email provider**
   - replace Resend/React Email planned application provider with Brevo, if Brevo remains the final approved choice.

3. **Notifications data dictionary**
   - update to actual recipient-specific/event-key/read_at model.

4. **Audit coverage wording**
   - remove unsupported claims that all Forecasting/Allocation/Reports/Login/Logout actions are currently audited.

## Priority B — Partial implementation claims

5. Clearly mark Maintenance UI canonicalization as pending until mock data is removed.

6. Do not claim maintenance and low-availability notifications are implemented yet.

7. Do not claim Backup Logs / backup workflow is implemented yet.

8. Keep external API providers exactly aligned to the manuscript while VS022 is being developed.

## Priority C — Technical implementation improvements worth documenting

9. Booking request idempotency.

10. Finder-to-Booking provenance and server revalidation.

11. Explicit Asia/Manila business-time handling.

12. Notification/reminder deduplication and provider-neutral scheduling.

---

# Rule for Every Future Vertical Slice

Every future `VERTICAL-SLICE-XXX.md` should contain:

## Manuscript Traceability

**Supports**
- Specific Objective:
- Requirement:
- Use Case:
- Scope/Algorithm section:
- Data Dictionary entities:

**Implementation changes requiring manuscript update**
- None / list change IDs.

**Must not contradict**
- exact manuscript rules/providers/limitations.

After each completed slice:

1. review the implementation commit;
2. create/update one MIC entry if implementation changes manuscript-level behavior/design;
3. list affected manuscript sections;
4. only then revise the manuscript;
5. preserve unresolved client rules as unresolved.

---

# Manuscript Revision Status Legend

- **NO CHANGE** — implementation matches manuscript.
- **UPDATE TEXT** — wording/technical description must change.
- **UPDATE DIAGRAM** — use case/activity/DFD/architecture must change.
- **UPDATE DATA DICTIONARY** — actual schema differs.
- **UPDATE REQUIREMENT** — behavior/scope changed.
- **LIMITATION / PENDING** — manuscript feature not yet fully implemented.
- **CLIENT VALIDATION REQUIRED** — cannot finalize until client confirms.
- **REJECTED DESIGN** — never implemented; do not add to manuscript.
