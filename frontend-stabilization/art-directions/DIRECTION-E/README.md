# Direction E — Premium Familiar Mobility

Direction E is the proposed freeze candidate for Briah's Car Rental's customer-facing visual system. It combines premium restraint, meaningful vehicle photography, familiar marketplace browsing, and guided task flows inside a location-neutral rental-product shell.

This folder contains exactly three final desktop references:

- `HOME/home-desktop-1440.png` — 1440 × 960
- `FIND-CAR/find-car-desktop-1440.png` — 1440 × 960
- `REQUIREMENTS/requirements-desktop-1440.png` — 1440 × 960

No mobile, Admin, application implementation, or new product behavior is included.

## Art direction

The memorable device is a composed window onto driving: attainable vehicle photography, generous negative space, and a disciplined editorial/sans hierarchy. The photographic context may feel Philippine, but it must not identify a permanent city, branch, landmark, or local slogan.

The selected image-to-code combination is:

- **Theme:** quiet premium neutral
- **Background:** rice-paper field with controlled automotive photography
- **Typography:** restrained editorial serif plus humanist sans
- **Hero:** asymmetric image-led composition with task-first content
- **Section system:** Swiss grid discipline with a small editorial offset
- **Signature components:** layered automotive frame, open editorial alignment, integrated search rail, and restrained vertical rhythm
- **Motion direction for later implementation:** cinematic image fade-through and user-triggered expansion only; both resolve immediately under reduced motion

## Reusable shell

Direction E separates three layers:

1. **Business identity:** operator name, approved logo, approved brand colors, and legitimate contact information. The current concept uses Briah's Car Rental.
2. **Operational data:** branch, pickup/return location, vehicle, dates, rates, and booking reference. `Antipolo branch` may appear where it is a real example value.
3. **System visual language:** layout, typography, controls, navigation, spacing, lifecycle, status, and guided flows. This layer is location-neutral.

Operator identity may be replaced at the presentation level without redesigning the shell. This is a design boundary, not multi-tenancy, white-label infrastructure, or a theme-management feature.

## Final screen intent

### Home

Home foregrounds the working task `Find the right car for your trip`. Its guided form uses only recommendation criteria that affect current matching: rental start, rental end, passengers, maximum total base-rental budget, and optional vehicle preference. `Show cars that fit` is primary; `Browse all cars` preserves the direct-browse path. The compact four-step explanation ends with `Pay after verification`.

Pickup area is intentionally absent from the Finder entry because it is not a canonical Finder criterion. Optional destination is also omitted from this compact entry because it is captured by the backend but does not affect baseline eligibility or ranking.

### Find a Car

The results screen keeps the approved marketplace model: trip context, category controls, Filters, a three-column image-first grid, prominent rate, vehicle identity, seats, transmission, fuel, operational branch data, and one `View car` action per vehicle.

`Cars that fit your trip` is used only for evaluated Finder results. Each example card exposes one quiet, canonical reason such as `Available for your selected dates`, `Seats your group of 5`, or `Within your maximum base-rental budget`. No score, AI label, or unsupported availability claim is present.

### Requirements

The Requirements screen preserves the approved rental journey and task progress without redesign. The booking summary uses a vehicle image, booking facts, restrained surface treatment, and whitespace. `Pickup: Antipolo branch` remains only as example booking data; all city artwork and slogans are removed.

## Visual rules

Do:

- treat branch and location as data;
- allow the operator logo and name to be replaced at presentation level;
- use automotive and rental visual language;
- use vehicle imagery meaningfully;
- keep the product shell credible for a similar rental operator.

Do not:

- bake city names into decorative headings;
- create permanent skyline or landmark illustrations;
- use a location slogan as core UI identity;
- expose `Smart Vehicle Finder`, AI, ML, or match percentages to customers;
- add fake ratings, urgency, scarcity, discounts, or unsupported availability.

## Image-first production

Each screen was generated and inspected as a standalone high-fidelity raster reference. Home was regenerated to integrate the canonical recommendation path. Find a Car and Requirements were minimally regenerated to remove permanent Antipolo identity while preserving the approved composition and flows. The accepted outputs were inspected at original resolution for text, hierarchy, spacing, controls, imagery, state treatment, and cross-screen consistency, then normalized to exactly 1440 × 960.

See `../../DIRECTION-E-FINAL-REVIEW.md` for the final review and `../../DIRECTION-E-DESIGN-SYSTEM.md` for the proposed implementation contract.

## Implementation boundary

These files are design references only. No source, route, component, application style, API, backend, schema, migration, dependency, test, deployment, or production configuration is included.
