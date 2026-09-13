# Direction D — Familiar Philippine Rental Platform

Direction D is a customer-only visual and interaction exploration for Briah's Car Rental. It keeps the frozen product workflow, lifecycle, information architecture, permissions, and backend contracts intact while testing a more familiar, practical rental-platform presentation than Direction A.

This folder contains exactly four concepts, each with a fresh desktop and mobile composition. The mobile images are not crops or scaled desktop boards.

## Design intent

- Make the rental task visible before marketing.
- Use familiar marketplace scanning for vehicle discovery.
- Use short, explicit task wizards for complex submissions.
- Keep the six-stage rental journey separate from task-level progress.
- State whether the renter must act or wait before showing secondary detail.
- Use Philippine locations and attainable local vehicle examples without copying another company's brand or business model.

## Visual system

- **Palette:** Sampaguita White `#F8F8F4`, Harbor Navy `#17354D`, Bay Blue `#176B87`, Leaf Green `#2E7D62`, Sunlit Gold `#F4B740`, white, and cool gray dividers near `#DCE3E5`.
- **Typography:** a Plus Jakarta Sans-like modern sans-serif carries the complete interface. No serif display face competes with customer tasks.
- **Brand marker:** an exploratory road-and-sun `B` mark provides a local mobility cue without adopting OOPA, Doon, or marketplace color DNA.
- **Controls:** familiar labelled inputs and buttons, 12–16 px radii, hairline borders, minimal elevation, practical outline icons, and one primary action per decision point.
- **Photography:** strong natural-light images of attainable vehicles in Antipolo context. Photography supports the task rather than turning the page into a cinematic editorial layout.
- **Density:** medium/high for vehicle browsing, medium for guided tasks, and open low/medium density for lifecycle explanation.
- **Motion direction:** low/moderate. Only user-triggered expansion, loading, and state transitions are appropriate; reduced-motion must produce the final static state immediately.

## Concept inventory

### Customer — Home / Search

- `HOME/home-desktop-1440.png` — 1440 × 960
- `HOME/home-mobile-375.png` — 375 × 810

The trip search is the first task after navigation. Pickup area and dates use visible labels, the Search cars action dominates, and the three-step explanation states that payment follows requirements verification. Mobile stacks the fields and keeps them touch-sized instead of squeezing the desktop strip.

### Customer — Find a Car

- `FIND-CAR/find-car-desktop-1440.png` — 1440 × 960
- `FIND-CAR/find-car-mobile-375.png` — 375 × 810

The desktop uses a 3-column image-first grid with prominent daily rates, vehicle name, seats, transmission, fuel, branch, and one View car action. `Matches your trip` appears only in the explicitly evaluated trip context. Mobile turns the trip strip into a summary/edit pattern, uses labelled filtering, and changes the grid to a readable single-column list.

### Customer — Requirements

- `REQUIREMENTS/requirements-desktop-1440.png` — 1440 × 960
- `REQUIREMENTS/requirements-mobile-375.png` — 375 × 810

The task maps the canonical behavior to four stages: Before you start, Upload documents, Review, and Send for verification. It names exactly Valid Government ID and Driver's License, the supported file rules, why Briah needs them, replacement behavior, and the requirement that verification precedes payment. The overall rental journey remains a separate contextual component.

### Customer — My Booking / lifecycle

- `MY-BOOKING/my-booking-desktop-1440.png` — 1440 × 960
- `MY-BOOKING/my-booking-mobile-375.png` — 375 × 810

The concept depicts Requirements under review. `No action needed` is the first message, `Briah is working on this` names the responsible party, and the next possible outcomes are explained. Payment remains locked. Desktop shows all six journey labels; mobile prioritizes the current stage and uses previous/next text with an expandable full-journey control.

## Image-first prompt set

The built-in image generator produced one standalone reference for each viewport. Every prompt required the shared Direction D palette, Plus Jakarta Sans-like hierarchy, road-and-sun Briah wordmark, outline icons, restrained borders/radii, attainable Philippine vehicles, readable exact task copy, and the frozen customer IA. Screen-specific prompts then required:

1. **Home:** task-first trip inputs, Antipolo and October dates, Search cars, and three plain rental steps.
2. **Find a Car:** evaluated Antipolo trip context, 3-column desktop/1-column mobile browsing, local vehicles, supported quick specs, prominent rates, and no persuasion mechanics.
3. **Requirements:** the two canonical documents, supported file rules, a four-step task wizard, separate overall journey context, review-before-send behavior, and payment only after verification.
4. **My Booking:** Requirements under review, no action needed, Briah's current work, Payment locked, six lifecycle stages, next outcomes, and trip facts.

Each mobile prompt explicitly requested a fresh responsive recomposition rather than a crop. Accepted images were inspected at original resolution and then resampled to the required viewport width.

## Regeneration record

- **Requirements mobile:** regenerated because the first composition enclosed the booking context, journey, wizard, and document rows in nested cards. The accepted version uses open spacing and dividers, retaining only one functional information surface.
- **My Booking desktop:** regenerated because the first composition drifted to `Vehicles`, `Branches`, and `Help`. The accepted version restores the frozen `Home`, `Find a Car`, `My Bookings`, and `Contact` navigation.

Rejected generations are not stored here.

## Boundary

These images are visual validation artifacts, not application implementation. Names, dates, references, photographs, and rates are illustrative content that implementation must bind to canonical data. No source, component, route, application CSS, backend, schema, migration, dependency, test, deployment, or production configuration is included.
