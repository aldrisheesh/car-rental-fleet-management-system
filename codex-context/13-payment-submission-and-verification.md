# Payment Submission and Verification Specification

**Status:** Frozen for Baseline Down-Payment Submission and Manual Verification
**Last updated:** 2026-08-31

This document defines the baseline payment-proof submission and Owner/Admin manual verification workflow.

Client-specific monetary/configuration details that remain subject to confirmation are tracked in `14-client-clarification-register.md`.

## 1. Scope

The current payment capability covers the required **initial down payment** associated with a canonical booking.

It does not define:

- final rental settlement;
- remaining-balance settlement;
- security-deposit refund/deduction;
- damage charges;
- fuel charges;
- late-return charges;
- cancellation refunds.

Those concerns remain separate.

## 2. Payment Gate

Customer/Renter may begin down-payment submission only when the booking's requirement set is:

`Verified`

Payment submission must remain unavailable for:

- `Not Submitted`
- `Pending Review`
- `Needs Resubmission`

Requirement verification is therefore a trusted server-side prerequisite.

## 3. Down-Payment Business Rule

Existing validated client information establishes the required down payment as:

**50% of the applicable total bill**

The percentage is frozen as the current business rule.

However, the exact components included in the applicable "total bill" remain subject to client clarification under:

`CQ-001`

Do not invent undocumented charge components.

The percentage and future charge-base configuration should remain isolated/configurable where practical.

## 4. Payment Concern Separation

Payment-verification status is separate from booking status.

Canonical payment statuses:

- `Not Submitted`
- `Pending Verification`
- `Needs Resubmission`
- `Verified`

Payment `Verified` does not automatically:

- confirm the booking;
- assign a vehicle;
- start a rental;
- mean the final rental balance is fully settled.

## 5. Canonical Payment Submission

Each booking may have at most one current baseline down-payment submission aggregate.

The payment aggregate should preserve at minimum:

- canonical payment ID;
- booking ID;
- customer ID or safely derivable ownership;
- payment purpose/type = initial down payment;
- currency = `PHP`;
- required down-payment amount where canonically available;
- submitted amount;
- selected payment-method reference or method label;
- transaction/reference number;
- payment-verification status;
- submitted timestamp;
- created timestamp;
- updated timestamp.

Do not allow the Customer/Renter to choose:

- customer ownership;
- verification status;
- verified amount;
- reviewer;
- booking confirmation state.

## 6. Required Down-Payment Amount

Where the system has enough canonical pricing information to calculate the applicable bill:

`RequiredDownPayment = ApplicableTotalBill × 0.50`

The calculation must use server-controlled/canonical monetary values.

If the applicable total-bill composition is not yet canonically available because `CQ-001` remains unresolved, do not fabricate a production amount.

The current slice may use a clearly isolated/configurable development assumption only when explicitly authorized by its vertical-slice contract.

Persist/snapshot the required down-payment amount once it becomes transactionally authoritative so later configuration changes do not silently rewrite historical payment expectations.

## 7. Submitted Amount

Customer/Renter records the amount represented by the submitted transaction/proof.

Rules:

- amount must be positive;
- currency is PHP;
- customer may pay the required amount or more;
- submitting more than the required down payment does not redefine the required amount;
- Owner/Admin manually verifies the actual external transaction.

Do not automatically treat a typed amount as verified.

## 8. Payment Methods

Production payment methods/account details are business configuration/reference data.

The existing frontend placeholder:

- GCash details;
- BPI details;
- BDO details;
- generated fake QR codes;

must not become canonical payment information.

Client-confirmed production payment configuration is tracked by:

`CQ-004`

Until confirmed, development/test payment methods must be explicitly marked as development/demo configuration.

Do not present fake account details as real Briah's payment instructions.

## 9. Transaction / Reference Number

A customer payment submission requires a transaction/reference number when the selected method provides one.

Treat the value as untrusted customer input.

Normalize surrounding whitespace but do not silently alter the substantive reference.

Do not mark payment verified solely because a reference number exists.

Owner/Admin compares the submitted reference/proof against the external bank/e-wallet records.

## 10. Proof of Payment

Baseline accepted proof formats:

- JPEG/JPG — `image/jpeg`
- PNG — `image/png`
- PDF — `application/pdf`

Maximum:

**10 MiB per file**

Validate:

- extension;
- MIME type;
- supported file signature.

Do not trust browser `accept` attributes alone.

## 11. Private Payment Storage

Use a separate private Supabase Storage bucket:

`payment-proofs`

Do not store payment proof in `renter-requirements`.

Recommended object namespace:

`{customer_id}/{booking_id}/{payment_id}/{generated_file_id}.{extension}`

Do not use the original filename as the canonical object key.

Do not expose permanent public URLs.

## 12. Proof Metadata and Versioning

Persist payment-proof metadata separately from the binary object.

At minimum preserve:

- canonical proof ID;
- payment ID;
- booking ID;
- customer ownership relation;
- private storage path;
- original filename;
- MIME type;
- size;
- version;
- current/non-current state;
- uploaded timestamp;
- superseded timestamp where applicable.

Maintain one current proof for the active down-payment submission.

Do not overwrite previous proof objects in place.

## 13. Initial Submission

A customer may submit payment only when:

1. authenticated as active Customer/Renter;
2. customer owns the booking;
3. requirement status = `Verified`;
4. required payment fields are valid;
5. a valid current proof exists.

On explicit submission:

`Not Submitted` → `Pending Verification`

Proof upload alone does not mean the payment was submitted for verification unless the UX explicitly combines the final upload and submit action.

## 14. Owner/Admin Manual Verification

Only Owner/Admin may verify payment.

Owner/Admin reviews:

- booking/customer identity;
- payment method;
- submitted amount;
- transaction/reference number;
- current payment proof;
- external bank/e-wallet transaction record.

The system does not automatically query or approve the external payment.

## 15. Verification Outcome

From:

`Pending Verification`

Owner/Admin may explicitly choose:

- `Verified`
- `Needs Resubmission`

### Verified

Use only when Owner/Admin confirms that the submitted payment information/proof matches the external business transaction record and satisfies the applicable required down-payment expectation.

Record at minimum:

- reviewer Owner/Admin ID;
- verified/reviewed timestamp;
- verified status;
- current proof version reviewed;
- submitted amount/reference reviewed.

### Needs Resubmission

Use when the customer can correct the submitted payment information.

Examples:

- unreadable proof;
- wrong proof;
- reference number does not match;
- amount/details inconsistent with the external transaction;
- incomplete payment information.

A customer-facing reason is required.

Do not use `Needs Resubmission` merely because an external bank/e-wallet service is temporarily unavailable.

If Owner/Admin cannot complete external verification because the external source is unavailable, payment remains:

`Pending Verification`

## 16. Customer Resubmission

When status is:

`Needs Resubmission`

Customer may correct the fields explicitly requiring correction.

At minimum the workflow may permit:

- replacement proof;
- corrected transaction/reference number;
- corrected submitted amount;
- corrected payment method where appropriate.

Replacement proof must be versioned.

After the required corrections are made, Customer/Renter explicitly resubmits:

`Needs Resubmission` → `Pending Verification`

Do not automatically verify corrected information.

## 17. Review Version Safety

Owner/Admin verification must apply to the current canonical payment submission/proof version.

A stale review must not verify a newer proof/reference/amount that the reviewer did not inspect.

Use transactional/version checks appropriate to the implementation.

## 18. Protected Access

### Customer/Renter

May access only their own:

- payment status;
- submitted payment details;
- payment proof;
- customer-facing resubmission reason.

### Owner/Admin

May access payment information/proof required for manual verification.

### Operations Staff

Must not receive:

- payment proof;
- transaction/reference number;
- submitted amount;
- required down-payment amount;
- verification metadata;
- payment-review actions.

This restriction must exist at the trusted server boundary.

## 19. Signed File Access

Protected payment proof may be delivered through:

- trusted server-mediated response; or
- short-lived signed URL after authorization.

Maximum signed URL lifetime:

**5 minutes**

Do not persist signed URLs.

## 20. Payment Verification Does Not Confirm Booking

When payment becomes:

`Verified`

the booking remains governed by its independent booking status.

Final booking confirmation still requires:

- requirements Verified;
- payment Verified;
- valid vehicle assignment;
- explicit Owner/Admin confirmation.

VS008 must not implement final booking confirmation.

## 21. Client Clarification Links

The following remain subject to Briah's confirmation:

- `CQ-001` — components included in the 50% calculation base;
- `CQ-002` — security deposit;
- `CQ-003` — remaining-balance timing;
- `CQ-004` — production payment methods/account details.

These items must not be silently treated as confirmed merely because a development assumption exists.

## 22. Warning to Codex

Do not:

- use prototype fake QR codes/account numbers as production truth;
- expose payment data to Operations Staff;
- allow payment before requirements are Verified;
- treat proof upload as payment verification;
- automatically confirm a booking after payment verification;
- invent security-deposit/final-settlement/refund rules;
- overwrite proof history;
- trust client-supplied payment status or ownership.
