# Vertical Slice 008 — Down-Payment Submission and Manual Verification

**Status:** Approved for implementation  
**Objective:** Replace the prototype payment flow with canonical, booking-linked down-payment proof submission and Owner/Admin manual verification while preserving unresolved Briah-specific monetary/configuration details as explicit provisional assumptions.

## Purpose

VS007 completed renter requirement verification.

VS008 establishes the next canonical workflow:

`Requirements Verified → Payment Submission → Manual Verification`

The slice must implement secure proof submission, payment metadata, Owner/Admin verification, customer correction/resubmission, and payment-status visibility.

It must not confirm the booking or begin the rental lifecycle.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/13-payment-submission-and-verification.md`
- `codex-context/14-client-clarification-register.md`
- this slice contract.

## Payment Gate

Payment submission is available only when the authenticated customer's booking requirement set is:

`Verified`

Enforce this at the trusted server boundary.

Do not rely only on UI routing/button state.

## Canonical Statuses

Implement:

- `Not Submitted`
- `Pending Verification`
- `Needs Resubmission`
- `Verified`

Allowed VS008 transitions:

```text
Not Submitted
      ↓
Pending Verification
    ↙
Needs Resubmission
      ↓
Pending Verification

Pending Verification
      ↓
Verified
```

Owner/Admin performs verification decisions.

Customer performs submission/resubmission.

## Payment Persistence

Create canonical booking-linked payment persistence using additive migrations.

Maintain at most one current baseline initial-down-payment aggregate per booking.

Persist the fields required by `13-payment-submission-and-verification.md`.

Keep payment status separate from booking status.

## Temporary Monetary Assumption

The 50% down-payment percentage is established.

The exact composition of the applicable total-bill base remains `CQ-001`.

Do not invent undocumented fees.

If the existing system already has enough canonical rental-rate/duration data to derive a defensible development amount, isolate that calculation behind a clearly named/configurable provisional calculation.

If not, do not fabricate a monetary total merely to make the UI appear complete.

The implementation must make it straightforward to revise the charge base after Briah's confirms `CQ-001`.

Do not implement:

- security deposit;
- final remaining balance;
- damage charges;
- fuel charges;
- late charges;
- refunds.

## Payment Methods

Replace prototype payment instructions as transaction truth.

Do not use fake generated QR codes or placeholder account numbers as real Briah's payment instructions.

Until `CQ-004` is confirmed:

- use explicitly labeled development/demo payment-method configuration where needed;
- keep payment methods configurable/reference-driven;
- clearly distinguish demo configuration from client-confirmed production payment details.

## Proof Storage

Use private Supabase Storage bucket:

`payment-proofs`

Accepted:

- JPEG/JPG;
- PNG;
- PDF.

Maximum:

**10 MiB**

Validate extension + MIME + magic bytes server-side.

Reuse/refactor the secure-file validation patterns established by VS006 where appropriate instead of duplicating insecure logic.

## Proof Versioning

Maintain one current proof.

Replacement creates a new version and supersedes the previous version.

Preserve previous private versions.

Use failure-safe metadata/storage sequencing.

Enforce one-current-proof invariants at the database layer where practical.

## Customer Submission

Customer must work with one explicit canonical booking.

Customer may submit only for their own booking.

Required submission data:

- selected configured/demo payment method;
- transaction/reference number;
- submitted amount;
- current proof.

On explicit submission:

`Not Submitted → Pending Verification`

Do not allow customer-supplied status/ownership.

## Owner/Admin Verification

Provide a minimal Owner/Admin payment-review interface integrated with the existing payment/admin area.

Owner/Admin must be able to inspect:

- booking/customer;
- submitted payment method;
- submitted amount;
- transaction/reference number;
- current proof securely;
- current payment status.

Owner/Admin may explicitly:

- Verify;
- Request Resubmission;
- leave Pending Verification when external verification cannot yet be completed.

## Verified Gate

Server/database verification must ensure the review applies to the current payment/proof version.

Verification is manual.

Do not automatically verify based on:

- matching strings;
- uploaded proof;
- amount entered;
- reference existence.

## Needs Resubmission

Owner/Admin must provide a customer-facing reason.

Customer then sees the reason and may correct the permitted payment submission fields/proof.

After correction, customer explicitly resubmits:

`Needs Resubmission → Pending Verification`

Do not automatically verify.

## External Verification Unavailable

If Owner/Admin cannot check the external bank/e-wallet record:

- leave `Pending Verification`;
- do not blame the customer;
- do not fabricate verification.

## Operations Staff

Operations Staff must not receive payment-sensitive information.

Do not expose to Staff:

- amount;
- reference number;
- proof;
- payment-method transaction details;
- verification metadata;
- payment-review actions.

This must be enforced server-side.

## Customer UI

Adapt `/payment-details` or the existing customer booking area.

Preserve visual style where practical.

Remove prototype-only transaction behavior.

Customer must clearly see:

- booking being paid;
- requirement eligibility;
- payment status;
- configured/demo payment instructions;
- amount/reference inputs;
- proof upload;
- resubmission reason when applicable.

Do not automatically enter payment for bookings whose requirements are not Verified.

## Booking Confirmation Boundary

Payment `Verified` must not change booking status to `Confirmed`.

Do not assign a vehicle.

Do not start rental processing.

## Testing

Add focused tests for:

- requirements-Verified payment gate;
- ownership isolation;
- Operations Staff exclusion;
- file type/signature/size validation;
- private proof access;
- initial status control;
- payment submission;
- Needs Resubmission reason requirement;
- versioned replacement;
- corrected resubmission;
- stale-review protection;
- Verified does not confirm booking.

Provider validation should cover the same critical path where configured.

## Client Clarification Preservation

Do not resolve or delete:

- CQ-001;
- CQ-002;
- CQ-003;
- CQ-004.

Implementation assumptions must remain visibly provisional/configurable until client validation.

## Definition of Done

VS008 is complete when:

- only requirement-Verified bookings can enter payment;
- canonical payment metadata exists;
- proof is stored privately;
- proof validation/versioning works;
- customer can submit own payment;
- Owner/Admin can manually verify/request correction;
- Customer can correct and resubmit;
- Operations Staff cannot access sensitive payment data;
- payment status survives reload;
- Verified payment does not automatically confirm the booking;
- unresolved client monetary/configuration details remain isolated.

## Stop Rule

Stop after down-payment submission and manual verification.

Do not implement final booking confirmation, vehicle assignment, security-deposit settlement, remaining-balance settlement, rental lifecycle, or VS009.