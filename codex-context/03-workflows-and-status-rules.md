# Workflows and Status Rules

**Status:** Partially Frozen — booking through rental-start foundation frozen; return/settlement and full vehicle/rental/maintenance lifecycle machines still pending  
**Last updated:** 2026-09-01

Existing repository mock statuses are not authoritative when they conflict with this document.

## Frozen High-Level Ordering

1. Customer submits booking request.
2. Customer submits required renter documents.
3. Owner/Admin reviews requirements.
4. Requirements become `Verified`.
5. Customer submits down payment.
6. Owner/Admin verifies payment.
7. Owner/Admin assigns final vehicle.
8. Owner/Admin explicitly confirms booking.
9. Owner/Admin explicitly records vehicle release/turnover.
10. A canonical active rental begins.
11. Later return/settlement closes the rental.

## Separate Workflow Concerns

Keep separate:

- booking status;
- requirement status;
- payment status;
- requested vehicle;
- assigned vehicle;
- rental transaction;
- vehicle operational lifecycle;
- maintenance lifecycle.

Do not encode all processes into booking status.

## Booking Status

Canonical:

- `Submitted`
- `Confirmed`
- `Rejected`
- `Cancelled`

`Confirmed` is not active rental.

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

See `13-payment-submission-and-verification.md`.

## Vehicle Assignment / Confirmation

See `15-vehicle-assignment-and-booking-confirmation.md`.

## Vehicle Release / Rental Start

A rental begins only after an explicit canonical release action on a Confirmed booking.

VS010 does not freeze a broad rental-status enum.

Baseline active-rental semantics are derived from the rental transaction:

`started_at IS NOT NULL AND ended_at IS NULL`

See `16-rental-release-and-start.md`.

## Return Boundary

Return/settlement behavior remains open.

The rental must not be marked completed/closed merely because scheduled return time has passed.

## Warning to Codex

Do not infer rental, return, vehicle, maintenance, extension, settlement, or cancellation transitions from prototype labels.

See `10-open-decisions.md` and `14-client-clarification-register.md`.
