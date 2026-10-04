# Frontend booking rehearsal — October 4, 2026

## Scope and outcome

Rehearsed through the localhost frontend using the controlled customer Jamie Cruz and admin Avery Santos. Created two dedicated synthetic requests from the customer car finder. Used visible UI navigation, file chooser uploads, document review, quote issuance, payment submission, payment review, confirmation, release, return, calendar and customer past rentals. No backend state forcing or source changes were used to progress either booking. Both reached Returned in admin and Completed in customer past rentals.

These were synthetic records, not actual rentals or financial transactions. Existing test accounts were used; new account registration and email verification were not exercised. Release and return were simulated early on October 4 rather than waiting for the scheduled rental dates. No real money was transferred and all uploaded files were the synthetic document placeholder.

## Rehearsal records

- Pickup: `2c2c0391-3d1c-4419-9602-a34d32197d36`, Honda City DEV-CITY-001, October 5–7 at 10 AM. Rate 2,000/day, total 4,000, downpayment 2,000, balance 2,000, security deposit 3,000. Pickup and return: Robinsons Place Antipolo main entrance. Release odometer 45,000, valid return 45,120.
- Delivery: `f41bb865-bf2c-4977-9af1-744b5a951c50`, Toyota Vios DEV-VIOS-001, October 15–17 at 11 AM. Rate 1,800/day, rental 3,600, delivery fee 500, total 4,100, downpayment 2,050, balance 2,050, deposit 3,000. Delivery: Robinsons Place Antipolo main entrance. Separate return: Antipolo Cathedral main entrance. Release odometer 52,000, return 52,100.

Both purposes and operational inspection notes identify them as SYNTHETIC UI REHEARSAL. Both use Demo bank/e-wallet payment proofs with references ending NO-MONEY. The delivery proof went through an explicit correction request and customer replacement before verification.

The prior saved baseline pointer/snapshot was not changed or promoted. The live database now includes the two rehearsal records (281 requests observed, versus 279 in the saved baseline), with associated proof uploads, review records and events. Do not treat the live post-rehearsal state as the clean defense baseline. No whole-database restore or destructive cleanup was performed.

## Observed passes

1. Date selection and available/unavailable vehicle presentation worked. Sign-in after car selection preserved car and dates.
2. Pickup and delivery requests, including a separate delivery collection address, survived request review and submission.
3. Four requirement uploads and customer submission led to the admin review queue. Secure document preview and individual Accepted outcomes plus Consistent identity review worked.
4. Quote & handover appeared before Payment & confirmation. The pickup quote could not be sent while its four required handover fields were incomplete, even after the quote acknowledgement checkbox was selected.
5. Exact pickup/return points and delivery/custom collection addresses were visible to the customer before payment, with map links and correct quoted totals, downpayment, balance and deposit information.
6. Payment method selection, proof upload, reference and pending review presentation worked. The pending page emphasized submitted payment, with arrangements below and without duplicate sidebar arrangements.
7. Admin correction request produced a customer notification and a clear team remark. The customer replaced the proof and reference; the quote and arrangements remained intact. Admin saw the corrected reference and pending proof.
8. Verification checklists gated the verify action. Both verified payments could be confirmed using the visible retry action, automatically reserving the requested vehicles.
9. Calendar showed the rehearsal Honda City pickup/return and Toyota Vios delivery/return alongside existing maintenance items. October 7 included Ford Everest preventive maintenance and the Honda City return; October 15 showed Toyota Vios delivery at 11 AM.
10. Release required odometer, condition and acknowledgements. Return was inside the Return stage under its own disclosure. A return odometer of 44,999 against release 45,000 was rejected with an explicit explanation; correcting to 45,120 completed return.
11. Booking history recorded request, confirmation, rental start and completion. Customer active-rental guidance and final completed pages worked. Both completed records moved to Past rentals.

## Findings and follow-up priorities

### 1. Automatic confirmation pauses unnecessarily — reproduced twice

Immediately after verifying each new payment, admin showed Submitted / Ready to confirm, with “Automatic confirmation paused” and “Assign an available vehicle before confirming this rental.” No assignment control appeared in that stage. Clicking “Try confirmation again” succeeded, reserving the requested car automatically without any assignment action. This is recoverable but misleading and interrupts the intended happy path. Investigate the automatic-confirmation reservation/assignment order and align its explanation with the actual recovery.

### 2. Financial handover and closeout are not visible in these operational forms

The quote correctly states remaining balance and a refundable security deposit, but the exercised Release form only exposed vehicle condition, odometer, fuel and acknowledgements. Return exposed inspection fields, damage and remarks. Both could complete without a visible action recording remaining-balance collection, deposit collection or deposit refund/deductions. This is an observed frontend gap; this rehearsal does not establish whether another accounting surface supports those records. Confirm the business process before changing it.

### 3. Early release needs an explicit timing decision

The system allowed October 4 release for scheduled October 5 and October 15 bookings without a visible early-release warning. Actual start/return timestamps were recorded correctly, while the booking schedule remained unchanged. Early return is explicitly explained as allowed. Decide whether early release should be restricted or acknowledged, and how actual versus scheduled rental charges should behave. The rehearsal intentionally used simulated early operations; it does not validate real elapsed rental billing.

### 4. Notifications around quotation need review

After the two quotes were issued, the observed customer notification list had requirements-verified events but no distinct quote-issued event. Requirements-verified copy says the customer can proceed to payment even though quote issuance is still a separate gate. Payment correction, payment verification and booking confirmation notifications did appear. Email delivery itself was not tested.

### 5. Service and state wording inconsistencies

- Customer My Bookings / Past rentals labels delivery records “Pickup: Antipolo, Rizal.”
- Admin payment details uses the label Pickup with raw values pickup/delivery.
- Calendar delivery event is named Toyota Vios delivery but counted under Pickup; that grouping needs consistent customer-facing and admin terminology.
- Pickup handover copy still says “before paying” in a payment-under-review context.
- The main verification action displayed “Verifying…” while sending a correction request.

### 6. Finder refinement validation looks optional but requires all fields

“Refine your results” suggests optional refinements. Pressing Find my ride with only dates selected showed required passenger, bags and total-budget errors. Filling 4 passengers, 2 bags and 10,000 budget worked. The homepage date-only Find a car route worked without these refinements. Make that distinction intentional.

### 7. Fixture/media polish

Ford Everest displayed Vehicle image unavailable in fleet cards and customer rental cards. The Demo bank/e-wallet method had no payment code; GCash showed its code normally. No actual QR scan or transfer was attempted.

## Limits

No new-account registration, email receipt, real payments, elapsed-time/overdue progression, refund execution, cancellation/rejection branches, concurrent-confirmation race or full maintenance/conflict exclusion matrix was exercised. Availability showed unavailable vehicles, but that alone does not prove every reservation conflict case. This was a desktop frontend rehearsal at the browser's 1280×720 viewport, not a complete responsive/accessibility audit.

## Evidence

Screenshots are saved in `output/playwright/booking-rehearsal-2026-10-04/`:

- `06-pickup-quote-blocked.png`
- `10-pickup-before-payment.png`
- `12-delivery-before-payment.png`
- `15-delivery-correction-request.png`
- `16-delivery-resubmitted.png`
- `18-delivery-confirmation-paused.png`
- `19-delivery-calendar.png`
- `20-pickup-completed-admin.png`
- `21-delivery-completed-admin-history.png`
- `22-customer-delivery-completed.png`
- `23-customer-pickup-completed.png`

Screenshot `13-confirmation-blocker.png` has a misleading filename: it captured the successful pickup confirmation after retry, not the paused state. Use screenshot 18 for the reproduced pause.
