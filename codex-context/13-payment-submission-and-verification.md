# Payment Submission and Verification Specification
**Status:** Frozen baseline with client-confirmed payment facts
**Last updated:** 2026-09-01

## Payment gate
Down-payment submission is available only after requirements are `Verified`. Client interview evidence confirms requirements are reviewed first and additional documents may be requested before payment.

## Required down payment
CLIENT CONFIRMED: minimum required down payment is 50% of the applicable total bill.

`RequiredDownPayment = ApplicableTotalBill × 0.50`

Customers may voluntarily pay more; that does not redefine the required minimum. Exact total-bill composition remains unresolved and must not be invented.

## Cancellation
CLIENT CONFIRMED at baseline: Briah stated the down payment is non-refundable when the renter cancels. Do not extrapolate this into a complete cancellation/refund state machine without clarifying exceptions.

## Current payment channels
CLIENT CONFIRMED:
- bank transfer;
- GCash;
- cash.

Manual verification remains canonical. Exact production account/QR details must be explicitly supplied by Briah and must never come from prototype placeholders. Integrated card/online payment remains future enhancement.

## Payment statuses
- `Not Submitted`
- `Pending Verification`
- `Needs Resubmission`
- `Verified`

Payment verification remains separate from booking confirmation and final settlement.

## Integrity
Where canonical pricing can calculate the applicable bill, calculate the 50% requirement from server-controlled values. Snapshot authoritative required amounts when appropriate.

Customer-entered amount/reference is untrusted and never self-verifies.

## Proof
Supported baseline proof: JPEG/JPG, PNG, PDF; maximum 10 MiB. Validate extension, MIME, and supported signature. Keep proof in private Supabase storage.

## Still open
- applicable-total-bill composition;
- production payment account details;
- cancellation/refund exceptions;
- final settlement;
- security deposit;
- damage/fuel/late settlement;
- integrated payment provider.
