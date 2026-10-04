# Synthetic bookings: pickup and delivery variation

The client interviews describe both vehicle delivery and customer pickup. This update adds that distinction to the existing October 4 baseline; it is not a claim about the client's measured service proportions or actual delivery rates.

## Changes

- Same 278 booking requests: 166 customer pickups and 112 deliveries, selected deterministically by booking label. The configured delivery sampling threshold is 45%; the resulting sample is about 40% delivery.
- Delivery and collection addresses use clearly synthetic numbered Demo Buildings in Manila or Antipolo neighborhoods appropriate to the booking's operating area. They are not private customer addresses or verified premises.
- 24 deliveries use an alternate collection address; the others return at the original delivery address.
- Illustrative admin-entered delivery charges: PHP 500, 700, 900 or 1,200. These are not a client-approved tariff and are not calculated route charges. Pickup charges remain zero.
- Rental subtotal, delivery fee, total, 50% down payment, remaining balance, required/submitted payment and verified amount snapshots agree.
- Request creation dates and minute-level times vary instead of sharing the same cutoff timestamp. Recent Submitted and Draft review examples appear first in the creation-date ordering; confirmed future plans span earlier creation dates.
- Purposes vary between family visits, business appointments, weekend trips, airport transfers, family celebrations and errands. Passenger counts vary within vehicle capacity.
- Bookings now accurately label the service as Pickup or Delivery. Calendar handover labels identify delivery events, retaining the three existing event categories.
- October 4 Urvan/Hiace handovers remain customer pickups at the times already documented. Booking dates, statuses, maintenance dates and the DSS sedan example are unchanged.

## Validation and reset

17 targeted baseline/calendar tests pass, including delivery address/fee/payment consistency and calendar delivery labeling without duplicate events. The complete generated dataset passed a rolled-back database import rehearsal before replacement. TypeScript, targeted ESLint and production build pass.

Accounts, fleet, operating locations and schema/RLS are preserved. The prepare tool archives the prior database state; the latest snapshot is in `backup-artifacts/defense/latest.txt`.

```sh
npm run defense:baseline -- reset --apply
```

This restores the fixed October 4 reference-date scenario, including the mixed services. Normal testing can add notification/audit records after exact baseline verification.

## Applied snapshot

- Snapshot: `backup-artifacts/defense/baseline-2026-10-04-2026-10-03T22-13-47.868Z.json`.
- Previous state archive: `backup-artifacts/defense/before-prepare-2026-10-03T22-13-14.802Z.json`.
- Future bookings now span 25 distinct creation dates, with no identical creation timestamps in that future subset.
- Browser check: delivery booking E6488D22…83740ABE97A8 has PHP 3,200 rental + PHP 900 delivery = PHP 4,100 total, PHP 2,050 down payment.
- Final database verification reports `databaseMatches: true` and no differences; all 1,373 synthetic Storage artifacts passed byte verification.
- Final browser queue shows the draft, ready-to-confirm, payment-review, awaiting-payment and document-review scenarios first, with Pickup and Delivery service labels. Task strip correctly reports one document review, one payment review and one ready-to-confirm on this page.
- Screenshot: `output/bookings-concepts/bookings-realistic-service-mix.jpg`.
