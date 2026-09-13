# Direction E — Premium Familiar Mobility

Direction E is the final customer visual-direction proposal for Briah's Car Rental. It keeps Direction D's approved customer interaction model and adds the photographic confidence, brand presence, and editorial restraint that made Direction A feel more distinctive.

This folder contains exactly three desktop concepts:

- `HOME/home-desktop-1440.png` — 1440 × 960
- `FIND-CAR/find-car-desktop-1440.png` — 1440 × 960
- `REQUIREMENTS/requirements-desktop-1440.png` — 1440 × 960

No mobile, My Booking, Admin, or application implementation is included.

## Art direction

The system is built around one memorable visual idea: Briah's interface behaves like a composed window onto familiar local roads. Natural-light Antipolo photography and a restrained local line illustration provide place and automotive character. Controls remain conventional, quiet, and immediately understandable.

The selected image-to-code combination is:

- **Theme:** Quiet premium neutral
- **Background:** Tactile rice-paper surface with photographic road windows
- **Typography:** Editorial serif plus humanist sans
- **Hero:** Asymmetric image-led composition with restrained text
- **Section system:** Swiss grid discipline with an editorial offset
- **Signature components:** layered image crop frame, off-grid editorial layout, product UI panel stack, and vertical rhythm lines
- **Motion direction for later implementation:** cinematic fade-through for imagery and smooth user-triggered expansion; both must resolve immediately under reduced motion

## Visual system

### Color

- **Briah Evergreen — `#123F3A`:** primary brand structure, primary actions, active controls, and focus-ready emphasis
- **Road Ink — `#182321`:** primary text and high-contrast iconography
- **Calamansi — `#E77A3D`:** small brand and active-navigation accent; never the error color and never a decorative gradient
- **Rice Paper — `#F6F3EC`:** primary background
- **White — `#FFFFFF`:** controls and clean content surfaces
- **Stone — `#D8D5CC`:** quiet dividers and inactive structure
- **Success — `#267A55`:** verified/complete state, always paired with words or an icon
- **Warning — `#A45B13`:** attention state
- **Error — `#B43B3B`:** destructive/error state, intentionally distinct from the evergreen CTA
- **Info — `#2E647B`:** informational state used sparingly rather than as the brand color

### Typography

- **Instrument Sans:** navigation, labels, body copy, controls, vehicle data, progress, and all task content
- **Newsreader:** Briah wordmark, the Home statement, and a restrained high-level heading moment only

The UI uses sentence case, short readable measures, generous line height, and strong but not oversized display hierarchy. Rates use stable, tabular-feeling numerals.

### Spacing and material

- 4/8 px spacing rhythm with approximately 52 px desktop gutters
- 44 px minimum interactive targets in the desktop concepts
- 8–10 px functional corner radius
- Thin dividers and background changes before borders
- One controlled elevation treatment for the integrated Home search rail
- Dashed boundaries only where they explain the document drop/select target
- No gradients, glass surfaces, gold treatment, or repeated ornamental cards

## Screen intent

### Home

Home is fully recomposed. A local road-window photograph occupies the visual field while the search rail bridges editorial copy and the road surface. Pickup area, pickup date, return date, and `Find cars` remain immediately usable. The compact rental explanation stays below the main task and states that payment follows verification.

### Find a Car

The approved marketplace model remains intact: trip strip, category filters, 3-column vehicle grid, prominent rate and model, supported quick facts, branch, quiet evaluated trip-match cue, and one `View car` action. Larger photography and open card construction replace Direction D's blue outlines and uniform component chrome.

### Requirements

The concept shows `Upload documents`, Step 2 of the canonical 4-step task. The rental journey and task progress remain separate. Two functional upload targets name the Valid Government ID and Driver's License, file constraints remain visible, and the explanation preserves verification before payment. A single warm booking-summary plane balances the open task area without nesting cards.

## Image-first generation and inspection

Each screen was generated as a standalone high-fidelity raster reference. Direction A and Direction D were used as separate visual and interaction references; Direction E was generated as a new composition rather than a crop or a code-first reconstruction. The accepted files were inspected at original resolution for copy, hierarchy, typography, spacing, controls, photography, state meaning, and cross-screen consistency, then resampled to exactly 1440 × 960.

Home was regenerated once because the first output used an all-caps eyebrow, conflicting with the sentence-case typography rule and increasing generic-template risk. The accepted regeneration changes only that eyebrow to `Antipolo and beyond`. Find a Car and Requirements passed their first full review and were not regenerated.

## Implementation boundary

These images are visual-review artifacts only. Vehicle photos, dates, rates, references, and the exploratory wordmark/illustration must be bound to approved assets and canonical data during a separately authorized implementation phase. No source, route, component, application CSS, backend, schema, migration, dependency, test, deployment, or production configuration is included.
