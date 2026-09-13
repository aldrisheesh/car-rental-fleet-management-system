# 09 - Design System Direction

**Status:** Principles only until representative concepts are approved. Do not lock colors/typography from legacy UI by default.

## Desired character
- clear;
- calm;
- trustworthy;
- modern but not experimental;
- operationally professional;
- approachable to first-time renters;
- dense enough for Admin work without becoming visually noisy.

## Deliberate visual direction
Use a daylight operations palette rooted in road-sign legibility rather than a generic dark SaaS dashboard: warm off-white surfaces, charcoal text, a restrained deep-blue primary, and semantic green/amber/red states with text and icons. The memorable device is the customer lifecycle rail—an ordered, plain-language route through the rental—not decorative gradients, glass panels, or repeated KPI cards. Admin density comes from aligned rows, quiet dividers, and a clear attention queue.

Use one humanist sans-serif family for interface and body copy; reserve tabular numerals for prices, dates, counts, and operational tables. Use sentence case, active verbs, and plain renter language. Avoid all-caps eyebrows, decorative monospace labels, emoji controls, generic gradient washes, and a uniform rounded-card treatment.

## Hierarchy
Use typography, spacing, grouping, and contrast to make the next action and current state obvious. Avoid excessive card nesting, competing accent treatments, and dashboard decoration without information value.

## Components to standardize
- application shells/navigation;
- page header;
- primary/secondary/destructive buttons;
- form fields and validation;
- date/time controls;
- select/combobox;
- vehicle cards;
- booking cards/rows;
- status badges;
- lifecycle progress/stepper;
- action-required callout;
- empty/loading/error/success states;
- dialogs/drawers;
- tables and responsive alternatives;
- notification center;
- KPI/summary cards only where metrics are canonical;
- charts with explanatory labels/empty states.

## Visual concept gate
Before implementing the full system, approve representative designs for:
1. Home / Find a Car;
2. Vehicle/Reserve;
3. Customer Booking Detail - action required;
4. Customer Booking Detail - waiting/confirmed;
5. Admin Dashboard;
6. Admin Booking Detail;
7. Decision Support.

These establish the visual grammar. Do not generate a polished mockup for every legacy route before implementation.

## Responsive expectations
- Core customer flow must work comfortably on phone, tablet, and desktop.
- Admin should support tablet/desktop strongly and remain usable at narrow widths where practical.
- No horizontal overflow for primary customer tasks.
- Tables require a deliberate narrow-screen strategy.
- Use mobile-first breakpoints at approximately 375, 768, 1024, and 1440 px. Preserve readable measures (about 35–60 characters on mobile and 60–75 on desktop), 16 px minimum mobile body text, adaptive gutters, and a 4/8 px spacing rhythm.
- Customer primary action and current state remain visible before secondary detail on small screens. Fixed headers, bottom actions, dialogs, and sheets must reserve content inset and safe-area space; focused controls must never be obscured.
- Use one primary action per screen/state; secondary and destructive actions must be visually and spatially subordinate.

## Accessibility
- semantic HTML and accessible Radix usage;
- visible focus;
- keyboard reachable actions;
- labels/instructions not conveyed by placeholder alone;
- errors associated with fields;
- status not conveyed by color alone;
- sufficient target sizes;
- respect reduced-motion preferences where motion is used.
- Use semantic controls before ARIA; provide a skip link, sequential heading structure, visible `:focus-visible` indicators, logical keyboard order, labelled icon controls, and polite live announcements for asynchronous status changes.
- Meet 4.5:1 normal-text contrast and never convey status through color alone. Pointer targets must be at least 44 by 44 px with adequate separation. Do not disable zoom, block paste, or rely on hover/gesture-only actions.
- Motion must explain a user-caused change, be interruptible, use transform/opacity only, and have a reduced-motion equivalent. Avoid nonessential scroll reveals and autoplay movement.
