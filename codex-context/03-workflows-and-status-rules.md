# Workflows and Status Rules

**Status:** Partially Frozen — booking, requirement-verification, and payment-verification foundations frozen; later lifecycle state machines still pending  
**Last updated:** 2026-08-31

Existing repository mock statuses are not authoritative when they conflict with this document.

## Frozen High-Level Ordering

1. A Customer/Renter submits a booking request and applicable renter information/requirements.
2. Required renter documents are reviewed before the customer proceeds with the required down payment.
3. Incomplete, unreadable, inconsistent, or otherwise unacceptable requirements must not be silently treated as verified.
4. Payment verification is manual and is performed by Owner/Admin against the business's external bank/e-wallet records.
5. A booking must not be treated as confirmed merely because it was submitted.
6. Vehicle assignment is an Owner/Admin decision and must respect applicable availability and maintenance-readiness rules.
7. Final booking confirmation requires the applicable requirement, payment, and vehicle-assignment gates defined below.
8. Active rental processing begins only after applicable pre-rental gates and vehicle release/turnover are satisfied.
9. Return processing includes vehicle condition review, applicable charges/balances, and settlement before the rental transaction is complete.
10. Customer cancellation is a pre-active-rental action. Exact cancellation/reopening/refund consequences remain open.

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

A booking request has been created. It does not mean requirements are verified, payment is verified, a vehicle is assigned, the booking is confirmed, or a rental has started. New booking requests begin as `Submitted`.

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
- `Needs Resubmission` → `Pending Review` after corrected/replacement requirements are submitted.

Missing or unavailable requirement information must never be silently treated as `Verified`.

Exact required documents, upload constraints, replacement mechanics, and retention rules remain open in `10-open-decisions.md`.

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

Smart Vehicle Finder output or customer selection may inform the requested vehicle but does not replace Owner/Admin assignment.

## Owner/Admin Confirmation Authority

Final booking confirmation, payment verification, and vehicle assignment are Owner/Admin actions.

Operations Staff may perform only reservation activities explicitly allowed by `02-roles-and-permissions.md`. Exact Operations Staff editable reservation fields remain open.

## Rental Lifecycle Boundary

`Confirmed` is a booking state, not an active-rental state.

Rental processing begins only after applicable pre-rental gates and vehicle release/turnover are satisfied.

Exact rental lifecycle statuses and transitions remain open. Do not use booking statuses such as `Ongoing` or `Completed` as substitutes.

## Maintenance Readiness Is Separate From Maintenance Lifecycle Status

The deterministic maintenance-readiness gate is frozen in `04-data-and-business-rules.md`.

The exact maintenance lifecycle enum and transitions remain open. Do not substitute maintenance readiness for maintenance lifecycle status.

## Implementation Staging

The frozen statuses define authoritative semantics, but a vertical slice does not need to implement every transition immediately.

A Booking Request Foundation slice may create a booking with `booking_status = Submitted` without implementing confirmation, rejection, cancellation, requirement review, payment verification, or rental transitions.

## Warning to Codex

Do not infer additional booking, requirement, payment, rental, vehicle, maintenance, cancellation, rejection, reopening, or refund transitions from mock enums or UI labels.

Still open unless later frozen:

- exact Operations Staff editable reservation fields;
- exact rental lifecycle statuses/transitions;
- exact vehicle operational statuses/transitions;
- exact maintenance lifecycle statuses/transitions;
- detailed cancellation/rejection/reopening/refund consequences;
- exact requirement/document upload rules.

See `10-open-decisions.md`.
