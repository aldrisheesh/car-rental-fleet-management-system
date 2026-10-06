# Bookings stage verification — 2026-10-04

Approved scope: extend the existing Bookings visual world with version A: a compact task summary, stage-led table, and expandable full-width status band. This is a page-level extension, not a global design replacement.

## Evidence and compatibility

Reviewed `PRODUCT.md`, `src/routes/admin.bookings.tsx`, `src/lib/booking-stage.ts`, and the Bookings styles around `src/styles.css:10019`. The implementation preserves the existing evergreen and ivory palette, serif page heading, sans-serif controls, restrained borders, and operational density. The task summary counts document reviews, payment reviews, and requests ready to confirm on the visible page. Each row exposes a current stage, explanation, and next action; expanded desktop rows retain the separate booking, document, payment, and rental states in a pale green band.

Desktop and mobile layout captures were inspected:

- `output/bookings-concepts/implemented-stage-table.jpg`
- `output/bookings-concepts/implemented-stage-mobile.jpg`

The desktop capture shows the stage table and expanded status band. The mobile capture shows the wrapped task summary, stacked search controls, and booking disclosure layout within the narrow viewport.

## Verification record

- Five stage tests passed.
- TypeScript check passed. Mechanical design detector returned no findings.
- Focused lint passed.
- Production build passed.
- Searching for Ford Ranger returned 19 results.

Pagination advanced to page 2 with records 26-50 of 242 and returned to page 1. UI permissions were preserved in source but no separate staff session was exercised. No deployment or database mutation was performed.

## Documentation boundary

`DESIGN.md` was already missing before this extension. No global design file or sidecar was created, and no pre-existing design drift was repaired or canonized. The task summary, stage table, and status band remain Bookings-specific choices rather than new global design rules.

## Rental-stage filtering — 2026-10-06

The Bookings toolbar now includes All rental stages, using the exact labels returned by bookingStage. It combines with search, booking status, allocation location and reporting dates, resets to page one on selection, persists in the stage URL parameter, and clears with Clear filters. An active stage uses the existing complete-record search retrieval path and filters before local pagination; the default queue retains server pagination. No status or stage is inferred from scheduled dates. Verified Returned across all branches (191 requests), then Taft (123 requests); every displayed row was Returned. The six stage semantics tests and route lint passed.

The rental-stage dropdown was narrowed to journey steps: document review / awaiting documents, payment review / awaiting payment, ready to confirm, date-change review, awaiting handover, active rental and returned. Draft, Cancelled, Rejected and diagnostic states remain available through the booking-status filter or visible row warnings as appropriate. Date-change review and Awaiting handover map to the existing Reschedule requested and Confirmed stage values; the canonical row calculation is unchanged.
