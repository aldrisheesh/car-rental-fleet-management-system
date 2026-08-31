# Workflows and Status Rules

**Status:** Partially Frozen — booking, requirement, payment, assignment, and booking-confirmation foundations frozen; later rental/vehicle/maintenance lifecycle state machines still pending  
**Last updated:** 2026-09-01

Existing repository mock statuses are not authoritative when they conflict with this document.

## Frozen Ordering

1. Booking request submitted.
2. Requirements submitted and reviewed.
3. Requirements become `Verified`.
4. Down payment submitted and manually reviewed.
5. Payment becomes `Verified`.
6. Owner/Admin assigns the final vehicle.
7. Owner/Admin explicitly confirms the booking.
8. A later vehicle-release/turnover event begins the rental lifecycle.
9. A later return/settlement process closes the rental lifecycle.

## Booking Status

Canonical:

- `Submitted`
- `Confirmed`
- `Rejected`
- `Cancelled`

`Submitted -> Confirmed` requires:

- requirement status = `Verified`;
- payment status = `Verified`;
- assigned canonical active vehicle;
- no overlapping `Confirmed` booking for that vehicle;
- explicit Owner/Admin confirmation.

Where implemented canonical maintenance-readiness data exists, the assigned vehicle must also be maintenance-ready.

Confirmation must recheck the gates transactionally.

## Requirement Status

Canonical:

- `Not Submitted`
- `Pending Review`
- `Needs Resubmission`
- `Verified`

See `12-requirement-review-and-verification.md`.

## Payment Status

Canonical:

- `Not Submitted`
- `Pending Verification`
- `Needs Resubmission`
- `Verified`

Payment Verified does not confirm the booking.

See `13-payment-submission-and-verification.md`.

## Vehicle Assignment

Requested and assigned vehicles remain separate.

Only Owner/Admin performs final assignment.

See `15-vehicle-assignment-and-booking-confirmation.md`.

Provisional client-specific behavior:

- substitution: `CQ-007`;
- cross-branch assignment: `CQ-017`;
- turnaround/preparation buffer: `CQ-018`.

## Rental Boundary

Booking `Confirmed` is not rental start.

The exact vehicle-release/rental-start transition and later rental lifecycle remain open.

## Warning to Codex

Do not infer unresolved rental, vehicle, maintenance, cancellation, settlement, or substitution-approval rules from prototype UI/statuses.
