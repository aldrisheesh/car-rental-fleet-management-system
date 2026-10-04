# Booking detail ledger restructuring

Preserved evergreen/ivory visual language and existing backend actions. All workflow actions now belong to the ledger:

- Booking request shows requested vehicle, times, service, operating area, purpose, destination and delivery/collection addresses. Rejection is a collapsed secondary action with unchanged required reason/confirmation. Missing documents explicitly mean waiting, not automatic rejection.
- Quote & handover owns pickup/return arrangements (or the customer’s delivery/return addresses) and the rental quote. It follows verified requirements and precedes payment. Payment & confirmation owns the proof-review link, confirmation exception and retry/manual confirmation. Existing persistence and readiness guards remain unchanged.
- Release owns its existing odometer/fuel/condition/acknowledgement controls. Cancellation is collapsed after the release checklist, retaining its confirmation dialog and expected-confirmed-at concurrency guard. Missing pickup arrangements have an action to open Payment & confirmation.
- Active rentals highlight Return. The stage shows the scheduled return and overdue text where applicable. The existing inspection form opens only via Record vehicle return. Early returns remain available; no date restriction was added.
- Returned bookings show completion time and no inspection mutation form. Cancelled/rejected records have no highlighted next action.
- Header and ledger summary distinguish active/returned rentals from booking-level Confirmed. The initial expanded stage can now be collapsed; changing booking resets expansion.

Stage selection extracted to src/lib/booking-ledger.ts with tests covering draft, requirements, payment, confirmed, active, returned and terminal records. Updated matching skeleton copy. Existing forms/handlers/fields are reused through OwnerActionArea filtered by owning stage. No database mutations or schema changes during this task.

Validation: typecheck, changed-file lint, four ledger/pickup helper tests, production build, Impeccable detector (no findings). Browser inspection of draft Leo Mercado, confirmed Jules Mendoza, active Mira Salazar and returned Diego Cruz. Verified expandable cancellation and return forms retain required-input disabled buttons; no cancellation, release or return was submitted.

Screenshots: output/bookings-concepts/ledger-draft-review.jpg and ledger-active-rental.jpg.

## Intended prepayment sequence refinement

The ledger now has six stages: Booking request → Requirements review → Quote & handover → Payment & confirmation → Release → Return. Verified requirements with no issued payment request activate Quote & handover; an issued payment request activates Payment & confirmation. Rental timestamps and terminal statuses retain precedence. The six-row loading skeleton matches. Missing pickup arrangements during release link back to Quote & handover.

Pickup arrangements remain editable before proof submission and become a saved summary afterward; incomplete legacy arrangements can still be repaired before release. Delivery addresses and scheduled handover times appear alongside the quote. Quote issuance and payment submission retain the existing server guards requiring complete pickup arrangements. Canonical automatic confirmation on verified payment is unchanged.

Validation: 11 ledger, admin action and booking-stage tests passed; TypeScript and changed-file ESLint passed. Browser checked unpaid Jamie and verified-payment Taylor without submitting mutations. Mobile width 390px has no horizontal overflow. Screenshots: output/bookings-concepts/admin-sequence-before-payment.jpg and admin-sequence-payment-confirmation.jpg.
