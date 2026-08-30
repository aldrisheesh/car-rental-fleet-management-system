# Workflows and Status Rules

**Status:** Partially Frozen — booking, requirement submission/review, and payment-verification foundations frozen; later lifecycle state machines still pending  
**Last updated:** 2026-08-31

Existing repository mock statuses are not authoritative when they conflict with this document.

## Frozen High-Level Ordering

1. A Customer/Renter submits a booking request.
2. The Customer/Renter submits the required renter/driver documents for that booking.
3. Owner/Admin reviews the submitted requirements.
4. Requirements must be fully verified without unresolved red flags before payment submission may proceed.
5. Payment verification is manual and is performed by Owner/Admin against the business's external bank/e-wallet records.
6. A booking must not be treated as confirmed merely because it was submitted.
7. Vehicle assignment is an Owner/Admin decision and must respect applicable availability and maintenance-readiness rules.
8. Final booking confirmation requires the applicable requirement, payment, and vehicle-assignment gates defined below.
9. Active rental processing begins only after applicable pre-rental gates and vehicle release/turnover are satisfied.
10. Return processing includes vehicle condition review, applicable charges/balances, and settlement before the rental transaction is complete.
11. Customer cancellation is a pre-active-rental action. Exact cancellation/reopening/refund consequences remain open.

## Separation of Workflow Concerns

Booking status, requirement-verification status, payment-verification status, vehicle assignment, and rental lifecycle status are separate concerns.

Do not use one broad booking status to encode all processes. In particular, `Ongoing`, `Completed`, `Paid`, and `Requirements Verified` are not booking statuses.

## Booking / Reservation Status

Canonical statuses:

- `Submitted`
- `Confirmed`
- `Rejected`
- `Cancelled`

### Submitted

A booking request has been created. It does not mean requirements are verified, payment is verified, a vehicle is assigned, the booking is confirmed, or a rental has started.

### Confirmed

A booking may become `Confirmed` only when:

1. booking status is `Submitted`;
2. requirement-verification status is `Verified`;
3. payment-verification status is `Verified`;
4. a valid vehicle has been assigned by Owner/Admin; and
5. Owner/Admin explicitly performs the confirmation action.

Do not automatically confirm a booking merely because the other gates become satisfied.

### Rejected

Owner/Admin has determined that the booking request will not proceed. Detailed rejection reasons, reopening, and reconsideration behavior remain open.

### Cancelled

The booking has been cancelled before an active rental. Exact cancellation eligibility, reopening, refund/payment consequences, and administrative override behavior remain open.

## Requirement-Verification Status

Canonical statuses:

- `Not Submitted`
- `Pending Review`
- `Needs Resubmission`
- `Verified`

Allowed progression:

- `Not Submitted` → `Pending Review`
- `Pending Review` → `Needs Resubmission`
- `Pending Review` → `Verified`
- `Needs Resubmission` → `Pending Review` after the required corrected/replacement document set is resubmitted.

Missing, unreadable, inconsistent, expired, or otherwise unresolved requirement information must never be silently treated as `Verified`.

### Submission Gate

For the baseline self-drive renter scenario, a requirement set becomes eligible for `Pending Review` only after current uploads exist for:

- `Valid Government ID`
- `Driver's License`

and the customer explicitly submits the requirement set.

### Review Gate

Only Owner/Admin may perform requirement review.

A requirement set may become `Verified` only when all frozen review checks in `12-requirement-review-and-verification.md` are satisfied.

If a customer-correctable requirement problem is found, Owner/Admin records `Needs Resubmission` and identifies the affected document/check with a customer-facing reason.

If an external verification source such as the LTO portal is temporarily unavailable, the requirement set remains `Pending Review`; the system must not treat external unavailability as successful verification.

### LTO Verification

The LTO portal is an external manual verification aid used by Owner/Admin for the driver's-license check.

A separate customer-uploaded LTO portal screenshot is not a baseline required document.

The system records the outcome of the Owner/Admin LTO check; it does not automate or scrape the LTO portal in this baseline.

## Payment-Verification Status

Canonical statuses:

- `Not Submitted`
- `Pending Verification`
- `Needs Resubmission`
- `Verified`

Allowed progression:

- `Not Submitted` → `Pending Verification`
- `Pending Verification` → `Needs Resubmission`
- `Pending Verification` → `Verified`
- `Needs Resubmission` → `Pending Verification` after corrected/replacement proof or transaction information is submitted.

Payment submission for the required down payment must not proceed until requirement-verification status is `Verified`.

Payment verification is manual and belongs to Owner/Admin. Proof upload or transaction-reference submission alone does not mean payment is verified.

The current scope does not use an automated payment gateway.

## Requested Vehicle vs Assigned Vehicle

Customer preference/request and operational assignment are separate concepts:

- `requested_vehicle_id` — customer-selected/preferred/requested vehicle where applicable.
- `assigned_vehicle_id` — vehicle actually assigned by Owner/Admin.

Submitting a booking request must not automatically create an authoritative vehicle assignment.

## Owner/Admin Authority

Only Owner/Admin may:

- verify or request resubmission of renter requirements;
- record the manual LTO-check outcome;
- verify payment;
- assign the final vehicle;
- perform final booking confirmation.

Operations Staff must not receive raw renter requirement files or requirement-verification authority.

## Rental Lifecycle Boundary

`Confirmed` is a booking state, not an active-rental state.

Rental processing begins only after applicable pre-rental gates and vehicle release/turnover are satisfied.

Exact rental lifecycle statuses and transitions remain open.

## Maintenance Readiness Is Separate From Maintenance Lifecycle Status

The deterministic maintenance-readiness gate is frozen in `04-data-and-business-rules.md`.

The exact maintenance lifecycle enum and transitions remain open.

## Implementation Staging

A requirement-review slice may implement:

- Owner/Admin protected document viewing;
- current-document review outcomes;
- manual LTO-check recording;
- `Pending Review` → `Needs Resubmission`;
- `Pending Review` → `Verified`;
- customer visibility of review status and resubmission reasons;
- `Needs Resubmission` → `Pending Review` after permitted replacement/resubmission.

It must not implement payment verification or booking confirmation unless a later approved slice explicitly includes them.

## Warning to Codex

Do not infer additional booking, payment, rental, vehicle, maintenance, cancellation, rejection, reopening, refund, or alternate-document transitions from mock enums or UI labels.

Still open unless later frozen:

- exact Operations Staff editable reservation fields;
- alternate renter/driver scenario requirements beyond the baseline self-drive renter;
- exact rental lifecycle statuses/transitions;
- exact vehicle operational statuses/transitions;
- exact maintenance lifecycle statuses/transitions;
- detailed cancellation/rejection/reopening/refund consequences;
- long-term sensitive-upload retention/deletion duration.

See `10-open-decisions.md`.
