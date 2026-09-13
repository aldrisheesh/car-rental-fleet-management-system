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

## Accessibility
- semantic HTML and accessible Radix usage;
- visible focus;
- keyboard reachable actions;
- labels/instructions not conveyed by placeholder alone;
- errors associated with fields;
- status not conveyed by color alone;
- sufficient target sizes;
- respect reduced-motion preferences where motion is used.
