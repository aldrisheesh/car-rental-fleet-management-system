# Booking rehearsal fixes — October 4, 2026

Implemented the issues found by navigating the frontend as customer and owner/admin. Existing UI identity and six-stage approval ledger are preserved.

## Behavior

- Payment verification assigns the requested car and attempts confirmation in the same protected operation. Existing readiness/conflict guards stay in force. A pending post-return inspection saves payment verification and explains that Fleet must clear the car before confirmation.
- Release requires a saved quote, verified payment, balance/deposit collection record, handover acknowledgements, and inspection fields. Balance uses the actual verified payment amount. Release is blocked before the scheduled Manila calendar day or after the rental period ends.
- Return requires a deposit settlement for rentals with a collection record. Deductions must fit the received deposit, use exact cents, and have a reason when positive. Refunds must equal deposit minus deduction. Rental transitions and their financial records save atomically.
- Completed customer rentals show the recorded collection and refund. Historical rentals without original collection records explain the limitation and do not fabricate receipts.
- Quote publication creates an in-app notification. New requirements-verification messages explain that the quote and arrangements come before payment.
- Delivery labels, payment-correction copy, finder instructions, and the customer Ford Everest image fallback were corrected.

## Database

Applied and recorded migrations `20261004071833`, `20261004072926`, and `20261004074425`. Financial table RLS is enabled. Client roles have no direct read or lifecycle-wrapper execution grants. Server-only wrappers use a fixed search path, active Owner/Admin checks, and the original stale-state and rental-readiness checks.

## Verification

- Frontend: synthetic payment verification automatically confirmed the ready car without retry; owner recorded release collection, invalid-deduction feedback, valid deduction/refund and return; Fleet cleared the return inspection; customer saw the completed financial summary and quote notification.
- Frontend: an existing confirmed December booking still could not be released after all input fields and acknowledgements were completed.
- Desktop/mobile checks: no horizontal overflow at 390px; existing typography, colors, and ledger styling retained. Impeccable detector returned no findings for the scoped UI files.
- Type check and production build passed. Scoped UI lint passed. The API route has preexisting explicit-any lint debt outside the new financial-read block.
- 71 focused tests passed: 28 booking/payment/calendar tests, 16 detail/notification/finder tests, 27 defense-tooling tests.
- Transactional database checks passed for automatic assignment/confirmation, future-day release rejection, exact collection amounts, invalid refund/deduction/reason rejection, valid settlement persistence, exact-cent validation, customer actor rejection, and server-role permissions. Failed settlements left the rental active.
- Completed rental handovers remain in calendar history but no longer inflate dashboard due counts. Dashboard labels cover pickup and delivery. An additional regression test and four dashboard tests passed (76 distinct focused tests in total).
- Transactional baseline restore rehearsal passed and rolled back every database change.
- The older `defense:verify` September-fixture reader was stopped after an extended read; it is not the verifier for the current generated baseline (see `docs/defense-baseline.md`). No result is claimed for it.

## Fixture and baseline

Dedicated clearly labeled synthetic fixture: booking `dff20919-76aa-4c9f-9887-0b3b5593f936`, payment `35f1dc0c-14b4-4126-a837-049e12d19312`. Actual frontend collection: balance PHP 1,000, deposit PHP 3,000, simulated agreed fuel deduction PHP 250, refund PHP 2,750. No money was transferred.

This fixture represents a booking created two days earlier with a current-day handover. Preparation temporarily exempted only this historical insert from the lead-time trigger inside a locking transaction, then restored the trigger before commit. The normal customer next-day booking rule remains enabled.

Previous rehearsal Honda City and Toyota Vios post-return inspections were cleared through Fleet. The new fixture was also inspected and cleared through Fleet after return.

The clean reset baseline was upgraded by immutable copy, adding an empty financial-record table and updated schema signature. The script first proved the original schema signature matched the current schema excluding only that new table. Original snapshot, booking rows, dependencies, and synthetic assets were preserved. `backup-artifacts/defense/latest.txt` identifies the compatible copy. Live rehearsal rows remain extras; no database reset was performed. Reset tooling now includes financial records in FK-safe deletion/restoration order.

Screenshots: `output/playwright/defense-ready-2026-10-04/01-release-collection.jpg`, `02-return-settlement.jpg`, `03-customer-refund-receipt.jpg`, `04-upcoming-release-guard.jpg`, and mobile captures.
