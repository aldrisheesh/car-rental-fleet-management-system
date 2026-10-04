# Bookings redesign concepts awaiting user choice

Scope: concepts only. No frontend or backend implementation in this round.

Brand: established evergreen sidebar, ivory workspace, white operational panels, restrained semantic colors, serif page title with sans controls and data. Operate mode. Design variance 3, motion 2, density 6; preserve the existing visual world.

## Observed problem

Current queue has four independent states displayed under two compound columns (Request gate and Payment / rental). Identical Verified labels do not identify the domain. The page task rail consumes table width and its counts cover only the current page.

## Options

- A: full-width stage table, one current-stage summary, labeled status disclosure, contextual review link. Most direct improvement and smallest implementation scope.
- B: compact queue and selected-booking inspector. One summary in the list; all four domain states explicit in the inspector. Adds selection and responsive inspector behavior.
- C: task-oriented views and grouped queue. Adds operational filtering; stage filters must apply to the complete dataset before pagination, not only the fetched page.

## Implementation contract for any selection

Preserve booking, document, payment, and rental states independently. A display summary is not a new stored status. Ready to confirm means a Submitted booking with documents AND payment Verified. Confirmed does not mean an active rental. Actual rental records determine active/returned state, not dates alone. Preserve Draft, Cancelled, Rejected, missing evidence, resubmission and inconsistent-record handling even where concepts omit examples.

Keep search, location and booking-status filtering, page sizes 25/50, pagination, mobile view, loading/empty/error states, existing detail access and staff permissions. Contextual actions open authorized existing review pages; confirmation does not happen immediately from the queue. Retain a general Open booking path even when the suggested next step links elsewhere. Avoid global task counts unless actually queried globally.

Generated images are illustrative layout references, not authoritative copy, identifiers, timestamps, counts or transition rules. B invents illustrative history timestamps; do not implement them without actual evidence. A's Ready-to-confirm helper should explicitly say Documents and payment verified. Clear filters appears only with active filters. Final implementation must include all stage exceptions and truthful pagination.

Assets: output/bookings-concepts/version-a-stage-table.png, version-b-list-inspector.png, version-c-task-queue.png. Built-in image generation; current-bookings.jpg is the captured brand reference.
