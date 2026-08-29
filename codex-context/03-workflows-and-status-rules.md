# Workflows and Status Rules

**Status:** Partially Frozen — exact state machines still pending  
**Last updated:** 2026-08-29

This document defines the known workflow gates and will later contain the authoritative state-transition tables for:

- booking/reservation
- customer requirement verification
- payment verification
- vehicle assignment
- rental lifecycle
- vehicle return and settlement
- vehicle operational status
- maintenance lifecycle
- cancellation/rejection/resubmission paths

## Frozen High-Level Ordering

The implementation must preserve these established rules:

1. A customer submits a booking request and applicable renter information/requirements.
2. Required renter documents are reviewed before the customer proceeds with the required down payment.
3. Incomplete or rejected requirements must not be silently treated as verified.
4. Payment verification is manual and is performed by Owner/Admin against the business's external bank/e-wallet records.
5. A valid/approved booking cannot be treated as ready for vehicle release until the required verification and payment gates for that transaction are satisfied.
6. Vehicle assignment remains an Owner/Admin decision and must respect availability and maintenance-readiness rules.
7. Active rental processing begins only after the applicable pre-rental gates and vehicle-release action are satisfied.
8. Return processing includes vehicle condition review, applicable charges/balances, and settlement before the transaction is considered complete.
9. Customer cancellation is a pre-active-rental action; exact cancellation/reopening/refund transitions remain to be frozen.
10. Existing repository mock statuses are not authoritative when they conflict with this package.

## Maintenance Readiness Is Separate From Maintenance Lifecycle Status

The deterministic maintenance-readiness gate is frozen in `04-data-and-business-rules.md`.

The exact maintenance lifecycle enum and allowed status transitions are still open. Do not substitute the readiness boolean/derived state for the maintenance record lifecycle.

## Warning to Codex

Do not finalize or infer booking, requirement, payment, rental, vehicle, or maintenance state machines from existing mock enums.

Until the exact state-transition matrix is frozen:

- database foundations may be implemented
- read models may be implemented
- authorization infrastructure may be implemented
- stable entities may be migrated
- final transactional mutation workflows must remain conservative and must not invent transitions

See `10-open-decisions.md`.
