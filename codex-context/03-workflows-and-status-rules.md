# Workflows and Status Rules

**Status:** Partially Frozen — booking, requirement-verification, payment-verification, and baseline requirement-submission foundations frozen; later lifecycle state machines still pending  
**Last updated:** 2026-08-31

Existing repository mock statuses are not authoritative when they conflict with this document.

## Frozen High-Level Ordering

1. A Customer/Renter submits a booking request.
2. The Customer/Renter submits the required renter/driver documents for that booking.
3. Required renter documents are reviewed before the customer proceeds with the required down payment.
4. Incomplete, unreadable, inconsistent, or otherwise unacceptable requirements must not be silently treated as verified.
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
- `Needs Resubmission` → `Pending Review` after the required corrected/replacement document set is resubmitted.

Missing or unavailable requirement information must never be silently treated as `Verified`.

### Submission Gate

For the baseline self-drive renter scenario, a requirement set becomes eligible for `Pending Review` only after current uploads exist for both baseline required document types:

- `Valid Government ID`
- `Driver's License`

The exact upload/security rules are frozen in `11-requirements-and-secure-storage.md`.

Customer upload alone does not produce `Verified`.

### LTO Verification

The client-validated workflow uses the LTO portal as an external verification aid for driver's-license checking.

A separate customer-uploaded `LTO portal screenshot` is **not** a baseline required document in the current frozen implementation rules.

Owner/Admin may use the external LTO portal during later manual requirement review. The exact review-record fields for recording that external verification may be implemented in the requirement-review slice.

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

Final booking confirmation, payment verification, requirement verification, and vehicle assignment are Owner/Admin actions.

Operations Staff may perform only reservation activities explicitly allowed by `02-roles-and-permissions.md`.

Operations Staff must not receive raw access to protected government-ID or driver's-license files.

Exact Operations Staff editable reservation fields remain open.

## Rental Lifecycle Boundary

`Confirmed` is a booking state, not an active-rental state.

Rental processing begins only after applicable pre-rental gates and vehicle release/turnover are satisfied.

Exact rental lifecycle statuses and transitions remain open. Do not use booking statuses such as `Ongoing` or `Completed` as substitutes.

## Maintenance Readiness Is Separate From Maintenance Lifecycle Status

The deterministic maintenance-readiness gate is frozen in `04-data-and-business-rules.md`.

The exact maintenance lifecycle enum and transitions remain open. Do not substitute maintenance readiness for maintenance lifecycle status.

## Implementation Staging

The frozen statuses define authoritative semantics, but a vertical slice does not need to implement every transition immediately.

A secure requirement-upload slice may establish protected storage, requirement-set records, document metadata, and the `Not Submitted` → `Pending Review` submission gate without implementing manual review to `Needs Resubmission` or `Verified`.

## Warning to Codex

Do not infer additional booking, requirement, payment, rental, vehicle, maintenance, cancellation, rejection, reopening, or refund transitions from mock enums or UI labels.

Still open unless later frozen:

- exact Operations Staff editable reservation fields;
- alternate renter/driver scenario requirements beyond the baseline self-drive renter;
- exact rental lifecycle statuses/transitions;
- exact vehicle operational statuses/transitions;
- exact maintenance lifecycle statuses/transitions;
- detailed cancellation/rejection/reopening/refund consequences;
- long-term sensitive-upload retention/deletion duration.

See `10-open-decisions.md`.
