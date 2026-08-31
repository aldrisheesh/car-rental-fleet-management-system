# Workflows and Status Rules

**Status:** Partially Frozen — booking through physical rental return foundation frozen; settlement and full vehicle/rental/maintenance lifecycle machines still pending  
**Last updated:** 2026-09-01

## Frozen High-Level Ordering

1. Booking request
2. Requirement submission
3. Requirement verification
4. Down-payment submission
5. Payment verification
6. Vehicle assignment
7. Booking confirmation
8. Vehicle release / rental start
9. Active rental
10. Vehicle return / rental end
11. Later financial settlement / final business closure where applicable

## Booking Status

Canonical booking statuses remain:

- `Submitted`
- `Confirmed`
- `Rejected`
- `Cancelled`

A returned rental does not require inventing a new booking status.

## Rental Transaction

Baseline active state:

`started_at IS NOT NULL AND ended_at IS NULL`

Baseline ended state:

`started_at IS NOT NULL AND ended_at IS NOT NULL`

Do not introduce a broad rental lifecycle enum yet.

## Return

Vehicle return is explicit and Owner/Admin controlled.

Scheduled return time passing does not automatically end the rental.

Return/closure rules are in:

`17-rental-return-and-closure.md`

## Financial Settlement

Physical vehicle return and financial settlement remain separate in the provisional baseline.

Exact final settlement rules remain open under the client clarification register.

## Warning

Do not infer `Completed`, `Closed`, `Available`, refund, damage, fuel, late-charge, or deposit transitions from prototype data.

See `10-open-decisions.md` and `14-client-clarification-register.md`.
