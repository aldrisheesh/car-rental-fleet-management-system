# Calendar and synthetic defense baseline — October 4 through December 31

This supersedes the booking counts, end date and overlapping payment-review note in `2026-10-04-realistic-defense-baseline.md`. Data is researcher-designed synthetic demonstration data, not client history or a demand estimate derived from Facebook followers.

## Calendar

Only confirmed pickups, returns and maintenance are displayed. Submitted requests remain in Bookings; they no longer create calendar events. Reserved is removed from the legend and daily totals. Scheduled service uses its actual scheduled time, with duplicate same-day due reminders suppressed; ongoing corrective service uses its start time. Existing completed rental handovers remain visible in historical months.

## Baseline

- Reference date remains October 4, 2026, 8 AM Manila.
- 278 booking requests; last scheduled return December 31, 2026, noon Manila.
- October 4: Nissan Urvan pickup at 11 AM, return October 6 at 11 AM; Toyota Hiace pickup at 3 PM, return October 5 at 3 PM. Both are confirmed future handovers at the baseline reference time.
- Six planned preventive service days: Everest October 7; Wigo October 26; Rush November 12; Hiace December 1; Ranger December 18; Avanza December 28. Full service days are excluded from synthetic booking generation. Existing ongoing Mirage corrective service remains, with no future bookings assigned to it.
- Irregular weekday, duration, handover time and gap distributions retained, including quiet days. Bookings end by December 31.
- Upcoming confirmed bookings avoid both existing confirmed commitments and Submitted review scenarios, with 12 hours of turnaround. This removes the earlier Rush payment-review collision.
- No confirmed vehicle bookings overlap; no Confirmed or Submitted vehicle request overlaps a scheduled service day or ongoing blocking service.
- Accounts, fleet catalog, two locations and confirmed map references are preserved. No schema or RLS changes.
- DSS sedan scenario preserved: recent weekly demand 1/2/1; WMA 1.3; required 2; Taft shortage 2; Antipolo surplus 2; Vios/City candidate transfer 2.

## Validation

14 targeted baseline/calendar tests pass, including October 4, late December, maintenance exclusion and negative collision detection. TypeScript, targeted ESLint and production build pass. The database import rehearsal passed and rolled back before the actual replacement. The prepare tool archives the prior database and checks restored foreign keys, table rows, protected accounts and enabled triggers inside a transaction.

The reset restores the fixed reference-date scenario and does not advance to the current date:

```sh
npm run defense:baseline -- reset --apply
```

The latest baseline path is recorded in `backup-artifacts/defense/latest.txt`. Database snapshot verification should run before UI use, because normal application activity can add notification or audit records afterwards.

## Applied and verified

- Applied snapshot: `backup-artifacts/defense/baseline-2026-10-04-2026-10-03T21-52-34.231Z.json`.
- Prior database archive: `backup-artifacts/defense/before-prepare-2026-10-03T21-52-02.571Z.json`.
- 271 Confirmed, 4 Submitted, 1 Draft, 1 Cancelled, 1 Rejected requests.
- Read-only verification found no differences across baseline tables and verified all 1,373 synthetic Storage artifacts.
- Browser verification: October 4 shows the two correctly timed pickups; October 7 shows one 9 AM maintenance item; November contains varied handovers and November 12 service; December contains services on December 1, 18 and 28, with the final return on December 31.
- Screenshots: `output/bookings-concepts/calendar-oct4-final.jpg` and `output/bookings-concepts/calendar-december-final.jpg`.
