# Direction E — Premium Familiar Mobility

Direction E is frozen for customer implementation as Briah's Car Rental's customer-facing visual system. It combines premium restraint, meaningful vehicle photography, familiar marketplace browsing, and guided task flows inside a location-neutral rental-product shell.

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
2. **Operational data:** branch, pickup/return location, vehicle, dates, rates, and a support/reference identifier where it is genuinely useful. `Antipolo branch` may appear where it is a real example value; internal-looking identifiers do not belong in the primary customer task hierarchy.
3. **System visual language:** layout, typography, controls, navigation, spacing, lifecycle, status, and guided flows. This layer is location-neutral.

Operator identity may be replaced at the presentation level without redesigning the shell. This is a design boundary, not multi-tenancy, white-label infrastructure, or a theme-management feature.

## Final screen intent

### Home

Home foregrounds the working task `Find the right car for your trip`. Its first interaction asks only for rental start and rental end, then uses one dominant `Find cars` action. Passenger count, maximum total base-rental budget, and vehicle preference remain available as optional refinement on Find a Car/results. Quiet helper copy is integrated into the compact search surface, making that capability discoverable without becoming a detached line, a second CTA, or a questionnaire.

Pickup area is intentionally absent because it is not a canonical Finder criterion. Optional destination is also omitted because it is captured by the backend but does not affect baseline eligibility or ranking. Direct browsing remains available through the header's `Find a Car` navigation item; no detached browse link competes beneath the hero CTA.

The compact explanation uses `Find a car → Send your rental request → Submit your requirements → Pay after verification` and states that booking confirmation follows payment review.

### Find a Car

The results screen keeps the approved marketplace model: trip context, category controls, Filters, a three-column image-first grid, prominent rate, vehicle identity, seats, transmission, fuel, operational branch data, and one `View car` action per vehicle.

`Cars that fit your trip` is used only for evaluated Finder results. Each example card exposes one quiet, canonical reason such as `Available for your selected dates`, `Seats your group of 5`, or `Within your maximum base-rental budget`. No score, AI label, or unsupported availability claim is present.

This existing reference remains unchanged in the final refinement because it already shows the supported optional criteria and a clear `Filters` entry without forcing them into Home.

### Requirements

The Requirements screen preserves the approved task flow without redesign. Its macro journey now reads `Request → Requirements → Payment → Confirmation → Rental → Return`; the first stage says `Request submitted`, Requirements is current, and Payment is visibly locked. The request summary prioritizes vehicle, dates, operational pickup, and current stage. The former prominent reference ID is absent and may exist only in low-priority details/support context if canonically useful.

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

Each screen was generated and inspected as a standalone high-fidelity raster reference. In the final visual-freeze pass, Home alone was regenerated from its approved Direction E reference to integrate the optional-refinement hint, inspected at original resolution, and normalized to exactly 1440 × 960. Requirements and Find a Car were deliberately retained because they already satisfy the frozen task/lifecycle and optional-refinement models. No mobile or Admin artifact was generated.

See `../../DIRECTION-E-FINAL-REFINEMENTS.md` for the Lead-approved correction record, `../../DIRECTION-E-DESIGN-SYSTEM.md` for the authoritative implementation contract, and `../../DIRECTION-E-VISUAL-FREEZE.md` for the freeze record.

## Implementation boundary

These files are design references only. No source, route, component, application style, API, backend, schema, migration, dependency, test, deployment, or production configuration is included.
