# Payment queue pagination and sticky review

Implemented on the local main working tree; not deployed.

- Queue displays 10 payments per page with result range, page count, and Previous/Next buttons.
- Search and status changes return to page 1. Review selection resolves within the visible page; focused payment links retain their existing behavior.
- Desktop review panel sticks 16px below the 76px header. Long proof/details content scrolls inside the panel while its review actions remain visible.
- Layouts at or below 1100px retain the normal stacked review panel.

## Verification

- TypeScript check and production build passed.
- 18 relevant payment/admin tests passed.
- Scoped ESLint: no errors; one pre-existing `proof` effect-dependency warning.
- Browser: 238 records render 10 rows, page 1 of 24; Next shows 11–20 and page 2.
- Verified filter resets to page 1 of 23. Searching Felix gives 11 matches; final page shows one row and disables Next.
- At 1920×1080 with document scrolled 424px, review top remained 92px below a header ending at 77px.
- At 1366×768, review remained within viewport (bottom 752px), with internally scrollable content and no horizontal overflow.
- At 390×844, review position is static with no horizontal overflow.
- Browser viewport override reset after verification. No payment review actions submitted.

Screenshot: [Desktop payment queue](frontend-payment-queue-2026-10-03/payments-desktop.png)
