# DSS defense hardening — October 4, 2026

Local frontend follow-up to the DSS rehearsal. Uses synthetic records; no real client demand or production-domain certification is implied.

## Fixes

- Destination-area closure reports now say “Closure reported nearby” and “Requires verification,” preserving route estimates without asserting a known route intersection. The caution stays prominent.
- Unresolved shortages derive from all selected shortage evaluations, with distinct pending, actual approved and rejected quantities. Generation matches are shown separately. Saved supply is unchanged by approval.
- Changing forecast branch retains the valid vehicle category. A URL without a week preserves the resolved allocation selection instead of broadening results to all weeks while the selector shows only one.
- Development middleware ignores only confirmed disconnected-client ECONNRESET/aborted errors. Ordinary application errors still reach Vite's error handler. Production behavior is unchanged.

## Frontend rehearsal

- Confirmed Sedan stays selected after changing forecast branch.
- October 5–11 Sedan: Taft required 2, projected supply 0; Antipolo required 0, supply 1. Reviewed one Toyota Vios candidate and current external caution.
- Acknowledged advisory limitations and approved quantity 1 via the frontend confirmation. Recommendation `8ea98b28-5ac1-4485-89a6-b9d922e371f2` persisted after reload and Fleet round trip. Saved shortage remains 2; approved 1; one unit lacks approval.
- Fleet still shows Toyota Vios DEV-VIOS-001 allocated to Antipolo. No vehicle movement was submitted.
- October 12–18 rejected recommendation `11a978a2-1ff1-4f91-9a71-9a3bddb29716`: saved shortage 2, pending 0, approved 0, rejected 1; two units have no approved coverage.
- Navigated/reloaded normal frontend pages without recurrence of the aborted-request overlay after the fix. This is bounded local verification, not proof against every disconnect timing.
- Opened Allocation without URL filters: resolved week and selected-category results agree. Tested 390px viewport: document scroll width 390px. Restored the normal viewport.

## Validation

68 focused tests passed across operational context, advisory review, allocation coverage, recommendation/supply rules, external context and disconnected-request handling. TypeScript, scoped lint, production build and diff whitespace checks passed. TypeScript and route lint were rerun after the final omitted-week correction. Scoped Impeccable detection reported no findings.

Screenshots: `output/dss-defense-ready-2026-10-04/allocation-approved.png`, `allocation-rejected.png`, `allocation-mobile.png`, `fleet-unchanged.png`.

## Defense limits

Existing history already provides shortage and incompatible/insufficient surplus scenarios; no extra bookings were added to force them. Weekly requirements are planning signals, not proven lost sales or simultaneous capacity requirements. Provider evidence is current and requires verification before movement. Clean baseline snapshot/reset reproduction was not changed or certified. Partial approval has unit-test coverage; only a full approval of the single recommended unit was exercised through the frontend. Manual movement, production deployment and destructive negative-scenario mutations are outside this rehearsal.
