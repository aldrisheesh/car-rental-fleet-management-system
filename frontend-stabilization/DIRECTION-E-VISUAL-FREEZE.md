# Direction E Visual Freeze

## Status

**FROZEN FOR CUSTOMER IMPLEMENTATION**

Freeze date: 2026-09-13  
GitHub issue: #63  
Branch: `stabilization/frontend-rebuild`

## Approved direction

**Direction E — Premium Familiar Mobility** is the approved customer-facing direction. It combines premium attainable-vehicle photography, restrained serif display typography, highly readable sans-serif task typography, a refined evergreen/neutral palette, familiar marketplace behavior, guided requirements, progressive disclosure, and a location-neutral reusable product shell.

This record closes art-direction exploration. It does not create Direction F or reopen Directions A or D.

## Approved interaction model

- **Minimum-friction Home search:** start with `Rental start`, `Rental end`, and one `Find cars` action.
- **Progressive Finder refinement:** passengers, maximum total base-rental budget, and vehicle preference are introduced on Find a Car/results when the customer asks to narrow results.
- **Marketplace-style vehicle browsing:** image-first grid, prominent rate, vehicle identity, relevant specifications, operational branch/location, one `View car` action, and only a supported Finder reason in evaluated context.
- **Rental request terminology:** pre-confirmation actions and records use `Rental request`, `Send your rental request`, and `Request submitted`; they do not claim a confirmed booking.
- **Guided Requirements:** `Before you start → Upload documents → Review → Send for verification`.
- **Requirements before payment:** Briah reviews the submitted documents before payment becomes available. Booking confirmation remains later, after the required payment review.
- **Macro lifecycle:** `Request → Requirements → Payment → Confirmation → Rental → Return`.
- **Action vs waiting:** action-required states name the task and show the valid action; waiting states name what is being reviewed and avoid false calls to action; locked states name their prerequisite.

## Final homepage decision

The final Home reference preserves the approved premium vehicle-led hero, the heading `Find the right car for your trip`, a compact `How renting works` sequence, and optional Finder refinement after initial discovery.

The primary search contains only:

- `Rental start`;
- `Rental end`;
- `Find cars`.

Pickup area/branch is not included. Evidence verified on 2026-09-13: `src/lib/vehicle-finder.ts` defines the canonical `VehicleFinderInput` as requested start/end, passenger count, maximum budget, optional preferred category, and optional destination. It has no pickup-area or branch input. `findVehicles()` does not filter or rank by branch; `branchName` is returned only as vehicle metadata. `src/routes/api.vehicle-finder.ts` validates this same contract. Branch becomes required later for rental-request creation, not for a valid Finder result.

The hint `Want a better fit? Narrow by passengers, budget, and vehicle preference in your results.` is integrated as quiet helper copy inside the search surface. It is not a link or competing CTA. The panel remains compact, and there is no detached `Browse all cars` action beneath `Find cars`; direct browsing remains available through primary navigation.

Homepage flow copy is fixed:

1. Find a car
2. Send your rental request
3. Submit your requirements
4. Pay after verification

Supporting copy must make clear that Briah reviews requirements before payment and confirms the booking only after the required review process.

## Final Find a Car decision

The approved marketplace composition is unchanged: image-first grid; familiar category/filter behavior; prominent canonical rate; vehicle identity; relevant specifications; branch/location as operational data; one `View car` action; and one reason actually produced by the current Finder logic.

`Cars that fit your trip` is reserved for evaluated Finder results. Passengers, maximum total base-rental budget, and vehicle preference belong in optional results refinement rather than mandatory Home friction. Direct browsing remains available. No new Find a Car visual was required for this freeze.

## Final Requirements decision

The approved Requirements reference is final. Its macro journey is `Request → Requirements → Payment → Confirmation → Rental → Return`; the completed first stage reads `Request submitted`; Requirements is current; Payment is visibly later and locked; Confirmation remains future.

The task flow remains `Before you start → Upload documents → Review → Send for verification`. The screen prioritizes required documents, upload state, what happens after submission, and requirements review before payment. It does not change the underlying business workflow.

The identifier `CR-2026-104` is absent from the main task hierarchy. If a canonical customer reference remains useful, it may appear only in low-priority `Booking details` or support/lookup context. No new Requirements visual was required for this freeze.

## Location-neutral shell

Location is operational data, not decorative identity. Branch, pickup, return, or destination values may appear when they are real labelled data—for example, `Pickup: Antipolo branch`. Permanent city artwork, skyline drawings, landmarks, location slogans, handwriting, and branch-specific decorative photography are forbidden.

This is a presentation boundary only. It does not authorize multi-tenancy, white-label architecture, runtime theming, or new management features.

## Customer-side Finder terminology

Customer UI uses `Find the right car for your trip`, `Cars that fit your trip`, and `Narrow your results`. `Smart Vehicle Finder` and `Customer-Side Vehicle Recommendation` remain technical/manuscript terms only.

Customer UI must not use AI, AI-powered, smart algorithm, recommendation engine, match percentages, unexplained best-match claims, or recommendation reasons not produced by the current canonical Finder.

## Implementation guardrails

- Implement the references and `DIRECTION-E-DESIGN-SYSTEM.md` faithfully; do not redesign the direction or return to the old frontend structure.
- Preserve requirements-before-payment, request-before-confirmation wording, direct browse, progressive refinement, and role boundaries.
- Use canonical data for rate, availability, branch, lifecycle state, document status, and recommendation explanations.
- Preserve familiar semantic controls, visible labels, keyboard focus, 44 × 44 px targets, non-color state cues, restrained surfaces, and responsive recomposition.
- Keep vehicle photography licensed, consistently framed, and free of permanent location identity.
- Do not introduce fake ratings, scarcity, urgency, unsupported availability, unsupported percentages, or customer-facing technical Finder terminology.

## Remaining implementation-time validation

Implementation must still verify:

- actual responsive behavior;
- keyboard navigation;
- focus order;
- screen reader semantics;
- loading, error, and empty states;
- real canonical data lengths;
- 375 px mobile;
- 768 px tablet;
- 1440 px desktop;
- actual Finder reason mapping;
- role-safe behavior;
- browser workflow.

Also validate text resize/200% zoom, reduced motion, browser-native date behavior, safe-area handling, asset licensing, and stale-result revalidation where applicable.

## Freeze boundary

**Visual implementation may now begin.**

This freeze does **not** authorize changes to:

- business rules;
- schema;
- authorization;
- backend architecture;
- payment semantics;
- lifecycle persistence;
- recommendation algorithm.

No application implementation is included in this freeze commit. A separately authorized customer vertical-slice phase is required before source changes begin.
