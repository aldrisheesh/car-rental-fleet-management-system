# Mock Defense Refinement Roadmap

## Outcome

By the mock defense, the system demonstrates one truthful, continuous rental
workflow: a customer finds an eligible vehicle, submits requirements and
payment, an admin verifies them, confirms the booking, and the operations
views show the same status and dates.

This roadmap separates **demonstration-critical correctness** from polish so a
finished screen never hides an incomplete workflow.

## Operating Rules

- A visible action is either functional, disabled with an explanation, or not
  shown. No dead controls.
- The database and server transition functions are the source of truth. Cards,
  calendars, finder results, notifications, and reports only present that
  state.
- Every status-changing action shows pending, success, and error feedback.
- No workflow is marked complete until its acceptance checks pass with the
  controlled demo fixtures.

## Phase 0 - Lock the business rules

**Goal:** remove ambiguity before implementation.

| Decision           | Proposed rule for the mock defense                                                                                                                                                                       | Owner                           | Exit evidence                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Reservation timing | Booking must be at least one calendar day ahead.                                                                                                                                                         | Confirmed by team on 2026-09-17 | Enforced in the date picker, client validation, API, and database. |
| Delivery model     | The business delivers and collects vehicles; use `Deliver`, `Return`, and `Collect`, not branch pickup.                                                                                                  | Team/client                     | Customer and calendar labels agree.                                |
| Availability       | A vehicle is unavailable when inactive, blocked by maintenance, actively rented, or assigned to an overlapping **Confirmed** booking. Submitted requests remain reviewable but do not reserve inventory. | Team/client                     | Finder, fleet, and confirmation checks agree.                      |
| Conflict handling  | If two submitted requests overlap, the first request successfully confirmed wins; the other requires reassignment or rejection.                                                                          | Team/client                     | Admin receives a clear conflict error.                             |
| Payment            | Requirements must be verified before payment. Payment verification alone does not confirm a booking; the admin assigns and confirms it.                                                                  | Team/client                     | Lifecycle and admin controls agree.                                |

**Acceptance check:** all team members use these exact terms in the live demo
and presentation. If the client requires pending requests to reserve a vehicle,
this phase must be revised before Phase 1 because it changes the availability
model.

## Phase 1 - Inventory and booking integrity (P0)

**Goal:** prevent a car from being offered, assigned, or shown inconsistently.

1. Keep finder eligibility, fleet status, calendar entries, and booking
   confirmation based on the same canonical data.
2. Ensure overlapping confirmed bookings, active rentals, inactive vehicles,
   and blocking maintenance cannot be confirmed or offered as available.
3. On maintenance completion, recalculate readiness so the vehicle is
   available only when no other blocking reason remains.
4. Make the Smart Vehicle Finder remain on its recommendation result rather
   than redirecting to the generic vehicle catalog.
5. Replace calendar terminology with `Deliver`, `Returned`, `Maintenance`,
   and `Reserved`; never display a calendar event that does not match stored
   data.

**Acceptance checks:**

- A blocked-maintenance vehicle does not appear as available for a requested
  period.
- An overlapping confirmed booking cannot be confirmed a second time.
- Completing a blocking maintenance record removes only that maintenance block;
  another conflict still keeps the vehicle unavailable.
- The same vehicle/date is shown consistently in finder, fleet, and calendar.

## Phase 2 - Customer-to-admin handoff (P0)

**Goal:** make the primary demo path completely navigable.

1. Customer checkout shows an editable review, complete invoice breakdown,
   correct delivery/return address, and Do's and Don'ts before submission.
2. Customer can preview uploaded requirements and payment proof.
3. Admin and staff `Open details` / `Review` controls open the relevant
   requirement or payment record, not a generic bookings screen.
4. Payment review displays the receipt before the admin verifies or requests
   resubmission.
5. Status notifications link to the exact booking or requirement requiring
   action.

**Acceptance checks:** run a new customer request through requirements,
payment, assignment, confirmation, and notification review without manually
editing the database.

## Phase 3 - Operations truthfulness and usability (P1)

**Goal:** make operational pages trustworthy during questions from the panel.

1. Remove dead controls and fix text overflow, especially in staff views.
2. Use clear labels: `All Status`, delivery-oriented language, and consistent
   vehicle status labels.
3. Preserve completed and cancelled maintenance records in history/audit data.
4. Add or complete admin and staff profile/account screens only if their
   navigation exposes them.
5. Remove irrelevant branch IDs and clarify whether branches represent
   operational allocation locations rather than customer addresses.

**Acceptance checks:** every visible action on the demo route works or has an
intentional disabled explanation; no text overflows at the presentation
viewport.

## Phase 4 - Evidence, reporting, and defense rehearsal (P1)

**Goal:** replace empty or misleading analytics with defensible evidence.

1. Seed controlled, labeled demo data for reports and decision support.
2. Show an honest empty/insufficient-data state where no evidence exists; do
   not manufacture recommendations.
3. Run the defense verifier and retain a screenshot/checklist for each demo
   transition.
4. Rehearse the seven-step demo and prepare concise answers on availability,
   verification, payment, maintenance, and auditability.

**Acceptance checks:** controlled fixtures validate, reports describe their
data scope, and the demo completes in one browser session.

## Execution Board

| Phase                      | Priority | Status      | Completion signal                                  |
| -------------------------- | -------- | ----------- | -------------------------------------------------- |
| 0 - Rules                  | Blocker  | In review   | Team confirms the five rules above.                |
| 1 - Inventory integrity    | P0       | Complete    | Automated checks + database enforcement verified.  |
| 2 - Customer/admin handoff | P0       | In progress | One end-to-end request completes.                  |
| 3 - Operations UX          | P1       | In progress | Demo-route UI sweep passes.                        |
| 4 - Evidence/rehearsal     | P1       | In progress | Fixtures and defense verifier pass.                |

## Saturday Demo Route

1. Find a vehicle for valid future dates.
2. Show that a maintenance-blocked or reserved vehicle cannot be selected.
3. Submit the booking, requirements, and payment proof.
4. Review the documents and proof as admin.
5. Assign and confirm the booking.
6. Show the matching Reserved / Deliver / Return calendar and fleet state.
7. Complete a maintenance record and show the vehicle's recalculated
   availability.
