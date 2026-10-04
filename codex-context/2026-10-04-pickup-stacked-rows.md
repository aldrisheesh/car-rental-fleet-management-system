# Customer prepayment pickup & return — stacked rows

The user selected concept C for the existing customer prepayment Pickup & return section. `QuoteHandover` now renders pickup and return as two grid rows: a small outline icon, the label/date/time, and the address/instructions/Maps link. Hairline horizontal separators and a vertical divider before location details match the approved composition and the incumbent restrained ivory/forest-green system. The section keeps its Newsreader heading and Inter body text, using the existing foreground, primary, muted-foreground and border tokens rather than introducing a palette.

At 640px and below, the schedule and location stack into one content column beside a small icon rail; the vertical divider disappears. Lucide CarFront, RotateCcw and ExternalLink provide the existing outline icon language. These standard icons are simpler than the illustrative icons in the generated concept, while preserving its hierarchy.

The same saved addresses, instructions and Maps destinations remain available. Date and time appear on separate lines in Asia/Manila. Delivery retains its existing arrangement layout. Shared pickup quote/payment views reuse this component. This is a local presentation extension, with no database or booking/payment behavior change and no approved durable design-system change; DESIGN.md and system files were not modified for this handoff.

Visual evidence reviewed:

- Approved concept: `/Users/aldrich/.codex/generated_images/01a0e868-701e-7e93-b892-ebc9db76e32a/exec-2b9c93ea-f600-4ad1-90bc-b1ef64263c04.png`
- Desktop implementation: `output/bookings-concepts/pickup-stacked-rows-desktop.jpg`
- Mobile implementation: `output/bookings-concepts/pickup-stacked-rows-mobile.jpg`

Implementation QA reports TypeScript and targeted ESLint passing. The design detector reports no findings in the changed blocks; prior findings elsewhere in the stylesheet remain outside this scope. This handoff independently reviewed the component, local CSS, PRODUCT.md and the desktop/mobile evidence; it did not rerun those automated checks or exercise payment submission. The rendered evidence supports the layout and visual match, rather than a pixel-identical reproduction of generated artwork.

## Approved extension: Delivery & return

The user subsequently approved reusing these stacked rows for Delivery & return. The extracted `src/components/customer/HandoverRow.tsx` now supplies the common schedule, address, optional instructions and Maps link for both options. `QuoteHandover` in `src/routes/bookings.$bookingId.tsx` uses it for pickup/delivery and return, including customer payment submission/resubmission and payment review. Both options reuse the incumbent row styles; this extension adds no CSS or durable design-system changes.

`locationLabel` names each row for assistive technology and gives its Maps link a contextual accessible name that announces the new tab. Instructions render only when provided. Delivery uses `pickup_location`; its return row uses `dropoff_location`, falling back to the delivery address. Dates and times remain formatted in Asia/Manila.

Implementation QA reports TypeScript and targeted ESLint passing, an empty detector result, and no overflow at a 390px mobile viewport. Evidence: `output/bookings-concepts/delivery-stacked-rows-desktop.jpg` and `output/bookings-concepts/delivery-stacked-rows-mobile.jpg`. This documentation pass verified the shared component and payment submission/review call sites against PRODUCT.md; it did not rerun QA or exercise payment submission. Only this handoff section was added; DESIGN.md and other files were not changed by this documentation pass.
