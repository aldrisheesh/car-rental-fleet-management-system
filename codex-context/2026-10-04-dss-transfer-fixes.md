# DSS transfer eligibility and automatic generation fixes

- Automatic allocation keys now hash the exact run and sorted supply-evaluation IDs. A supply refresh cannot reuse an older context's idempotency key. Failed automatic supply/allocation attempts remain recorded for the mounted screen so errors do not trigger continuous retries; explicit controls still allow retry.
- Allocation generation returns saved decision history along with current rows. An empty new batch no longer hides older decisions until reload.
- Fleet is a persistent current-branch reassignment, not a scheduled temporary transfer. DSS donors now exclude all unfinished confirmed assignments, including reservations outside the selected week. Completed rental transactions release historical booking guards; merely passing the reservation's dates does not.
- Atomic Fleet movement also checks active rentals, inactive/condition-blocked vehicles, pending return inspections, blocking/in-progress maintenance, and the latest completed preventive target per service type. Maintenance and rental failures have specific API messages. Existing pending-request acknowledgement remains intact.
- Applied migration `20261004091455_fleet_transfer_readiness` to the linked database. CLI dry-run reported pre-existing remote migration versions absent locally; applied just this function and its own history entry transactionally, preserving prior migration history. Security advisors reported no error-level findings.

## Verification

45 focused unit/source regression tests pass; TypeScript and production build pass. Scoped lint has no errors (four existing hook-dependency warnings remain).

`node --env-file=.env.local --experimental-strip-types scripts/defense/fleet-transfer-acceptance.ts` verifies successful eligible movement, blocking maintenance, due preventive target, a real Vios confirmed assignment, and a real active rental. All fixture mutations and moves roll back; existing bookings are not cancelled or changed.

Browser: allocation cold reload settled; Refresh supply finished, controls re-enabled, 36/36 positions evaluated, shortage remains with zero eligible donors and two recorded historical decisions. Fleet maintenance/reservation checks are rehearsed separately. Screenshots in `output/dss-transfer-fixes-2026-10-04`.

Current baseline has future confirmed assignments on the Sedan donors. It intentionally has no safe persistent Sedan transfer; it does not prove a successful manual frontend donor move. The successful path above is a rollback database acceptance test. Supporting temporary week-specific transfers requires a separate scheduling/return-to-source workflow, not bypassing current reservation commitments.
