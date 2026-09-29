# Researcher Designed Policy Baseline

## Purpose and status

This policy baseline lets the capstone prototype be evaluated where commercial-policy boundaries remain unverified. It is **researcher-designed**: it is not represented as the participating car rental business's approved operational policy, contract, rate card, or legal terms. It combines the recorded evidence with conservative controls that avoid automatic financial decisions.

The manuscript should introduce it as follows:

> Where commercial-policy boundaries remain unverified, the study uses a researcher-designed prototype policy baseline. The baseline supports consistent testing and demonstration but does not claim to establish the participating car rental business's commercial terms. Any production deployment requires an authorized policy owner to review and approve the rate card, deposits, penalties, cancellation rules, and travel restrictions.

## Evidence boundary

| Item | Evidence retained | Treatment in this baseline |
| --- | --- | --- |
| Down payment | Client interview: at least 50% of the applicable bill. | Preserved as a manual-verification threshold. |
| Cancellation | Client interview: down payment is non-refundable when renter cancels. | Preserved only after the booking has been confirmed and the payment was verified. |
| Late return | Interview mentions PHP 3,000 below six hours; one transcribed video mentions PHP 300 per hour. | Conflict is not resolved by inventing a charge. The prototype creates a manual review instead. |
| Return, deposit, fuel and RFID | Transcribed videos describe inspection before refund and return-at-release balance expectations. | The system records evidence and review state; it does not automatically refund or charge. |
| Damage | Interview describes itemized damage penalties. | Damage is documented and reviewed against a future approved schedule; no universal fee is generated. |
| 12-hour and long-term offers | Reviewed promotional materials show dated offers and varying minimum durations. | A rate card is versioned and manually selected; promotion values are never hard-coded as current policy. |

## Prototype rules

### 1. Rate quotation and approved amount

An Owner/Admin selects an effective rate-card entry for the requested vehicle or category and rental package, records any agreed delivery fee and discount, and creates an **approved rental subtotal**. The subtotal is the only amount used to assess the minimum down payment.

The approved rental subtotal is:

`selected package rate + agreed delivery fee - approved discount`

It excludes a refundable security deposit and every contingent charge, including late return, damage, cleaning, fuel, RFID, toll and violation charges. The prototype's finder estimate remains informational and cannot create a quotation or payment obligation.

### 2. Down payment

The required minimum down payment is 50% of the approved rental subtotal. A customer can submit more than this amount. Payment remains pending until an Owner/Admin manually verifies the proof and transaction reference.

The system must not automatically compute a required amount when the rate-card entry, delivery fee or discount has not been approved. In that situation it should show **Amount pending quotation review**, not a fabricated total.

### 3. Cancellation

For the prototype, a verified down payment is marked non-refundable if the renter cancels **after the booking has been confirmed**. Before confirmation, cancellation is recorded for administrative review; the system does not automatically decide a refund or forfeiture.

This narrow rule is intentionally conservative. It does not decide exceptional cases, rescheduling, force majeure, no-shows, third-party cancellations, or consumer-law outcomes.

### 4. Late return and extension

An actual return after the scheduled return time creates a **Late Return Review Required** record. The system stores scheduled and actual timestamps, the duration beyond schedule, reason, evidence and approving administrator.

No amount is calculated automatically. The administrator selects an approved charge from a future versioned schedule or records a waived outcome with a reason. This avoids choosing between the conflicting PHP 300/hour and PHP 3,000-under-six-hours claims without authority.

An extension must be approved before the scheduled return time whenever practicable. The system checks vehicle availability and maintenance readiness, then records approval or rejection; it does not promise that an extension is available.

### 5. Security deposit and return inspection

A security deposit, if requested, is stored as a separately recorded **held amount** and is never included in the down-payment threshold. Return begins with actual-condition, fuel and RFID observations. The deposit remains **Pending inspection** until an authorized reviewer records one of the following outcomes:

- Released with no deduction
- Held for documented review
- Partially released with documented approved deduction
- Retained pending an external violation or dispute review

The prototype must not release money, calculate deductions or send a promise of refund automatically. The wording represents an operational record, not a payment transaction.

### 6. Damage, cleanliness, fuel and RFID

Release and return records capture condition notes, photographs where available, fuel level and RFID balance. A variance creates a review item. Damage and cleaning outcomes need itemized evidence and an approved schedule entry. Fuel and RFID outcomes compare against the recorded release state; no cash refund is calculated by the system.

### 7. Requirements and privacy

The standard submission set remains a valid government ID and driver's license where applicable. Owner/Admin may request an additional document only with a recorded reason. The system stores the minimum necessary files in authenticated storage, limits access to authorized roles, and avoids copying identity documents into ordinary shared drives.

### 8. Travel and route context

Destination, route, weather and road context are advisory. They can support an Owner/Admin review but cannot automatically approve, decline or impose a charge on a booking. The prototype does not encode Bicol, Tagaytay or any other destination as a permanent restriction without an approved travel-policy record.

## Roles and auditability

| Decision | Permitted role | Required record |
| --- | --- | --- |
| Approve a rate/card entry or discount | Owner/Admin | effective date, selected entry, reason and approver |
| Verify payment | Owner/Admin | payment proof, reference, verified amount and verifier |
| Decide cancellation/refund exception | Owner/Admin | reason, decision and supporting evidence |
| Approve extension or late-return outcome | Owner/Admin | scheduled/actual times, decision, reason and approver |
| Resolve return inspection | Owner/Admin | outcome, observations, evidence and maintenance linkage where required |
| Request supplemental requirement | Owner/Admin | reason, requested type and review outcome |

Operations Staff may prepare records where the role configuration permits, but must not make final payment, refund, penalty or return-closure decisions in this baseline.

## Limits for the manuscript and defense

Use labels consistently: **Client-confirmed**, **Partially confirmed**, **Researcher-designed baseline**, and **Open commercial policy**. The evaluated system may demonstrate that it records approval, evidence and status transitions. It must not claim that it calculates lawful penalties, issues final quotations, moves money, decides refunds, or represents the participating car rental business's current terms.

For testing, use synthetic rates, deposits and penalty-schedule entries clearly marked as controlled fixtures. Report the test result as a validation of the workflow, not validation that the synthetic amounts match the client.

## Implementation sequence

1. Keep the current manual payment, physical-return and inspection workflows as the implemented baseline.
2. Add a versioned, admin-maintained rate-card and approved-subtotal record only if the team needs to demonstrate the 50% threshold.
3. Add review records for cancellation, late return and held deposits before adding any automated monetary calculation.
4. Treat a complete charge ledger, refunds and integrated payments as future work unless an authorized owner supplies a signed or otherwise verifiable policy.
