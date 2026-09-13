# Direction E Design System

**Status:** Proposed customer-facing freeze candidate
**Direction:** Premium Familiar Mobility
**Scope:** Presentation and interaction contract for later authorized implementation; no application implementation is included here.

## 1. Product character

Direction E should feel calm, trustworthy, practical, and quietly premium. It belongs to an automotive rental product: real vehicles, trip facts, clear rates, grounded actions, and a legible rental lifecycle.

The system earns confidence through proportion, typography, photography, whitespace, and truthful guidance. It does not borrow luxury clichés, generic SaaS chrome, or ecommerce persuasion mechanics.

The one expressive move is the photographic vehicle/road window. Controls and task flows remain familiar, restrained, and implementation-clear.

### Customer request terminology

Before canonical confirmation, use `Rental request`, `Request submitted`, `Your rental request`, or `Continue your request`. The existence of the canonical booking/request record must not be presented as a completed or confirmed booking.

After canonical confirmation, use `Booking confirmed` or `Confirmed booking`. Confirmation remains a later customer milestone after requirements verification and payment review.

The full customer-facing presentation is:

`Find a car → choose vehicle / trip → submit rental request → complete requirements → Briah reviews requirements → requirements verified → submit required payment → payment review → booking confirmation → rental → return`

This is a presentation contract only. It does not change when the backend creates the canonical booking/request record.

### Homepage progressive disclosure

Primary discovery asks for the minimum trip context first: `Rental start` and `Rental end`. Pickup area/branch may join this first step only if a future Lead-approved canonical contract makes it required; it is not a current Finder criterion.

Passengers, maximum total base-rental budget, and vehicle preference belong to optional refinement on Find a Car/results where the canonical Finder supports them. They must not be required in the Home hero before a customer can see vehicles.

### Customer reference identifiers

Internal-looking booking/request references must not dominate customer task screens. The Requirements summary prioritizes vehicle, rental dates, pickup/return location where useful, and current request stage. A canonically useful customer reference may appear only in low-priority `Booking details` or help/support context.

### Recommendation terminology

Customer-facing language names the outcome: `Find the right car for your trip`, `Cars that fit your trip`, `Narrow your results`, and `Help me find a better fit`.

Technical/manuscript terminology may remain `Smart Vehicle Finder` or `Customer-Side Vehicle Recommendation`. Do not expose AI, intelligence, algorithm, engine, or match-percentage language to customers.

### Direct browse behavior

Do not place a detached `Browse all cars` link beneath the Home hero CTA. Direct fleet browsing remains discoverable through the primary navigation item `Find a Car` and may also appear later as a composed `Browse vehicles` or `View all vehicles` action where it does not compete with `Find cars`.

### Journey terminology

The customer-facing macro journey is fixed:

`Request → Requirements → Payment → Confirmation → Rental → Return`

The completed first-stage copy is `Request submitted`. It never means `Booking confirmed`.

## 2. Branding boundaries

Keep these layers separate:

- **Operator identity:** approved operator name, logo, brand colors, and legitimate business contact information. Briah's Car Rental is the current operator.
- **Operational data:** branch, pickup/return location, destination, vehicle, dates, rate, and booking reference.
- **Product shell:** navigation, grid, typography, controls, search, lifecycle, status, spacing, and guided flows.

The operator identity must be replaceable at the presentation level without redesigning the product shell. Preserve official logo proportions, clear space, and approved colors. Do not infer a runtime theme editor, multi-tenancy, white-label platform, or new management feature from this rule.

## 3. Typography

### Families

- **Instrument Sans:** all interface text, navigation, labels, fields, buttons, body copy, rates, vehicle facts, progress, status, errors, and summaries.
- **Newsreader:** operator wordmark where no approved logo is supplied, Home task heading, and rare high-level customer page headings only.
- **Fallbacks:** `Instrument Sans, Inter, system-ui, sans-serif` and `Newsreader, Georgia, serif`.

Confirm font licensing and loading before implementation. Use `font-display: swap` and preload only truly critical weights.

### Desktop scale

| Role | Size / line height | Weight | Notes |
|---|---:|---:|---|
| Home display | 72 / 76 px | 600 serif | 1–3 lines, balanced wrap, max ~15 characters per line in the final composition |
| Task page title | 44 / 50 px | 600 serif | Never an oversized decorative billboard |
| Section heading | 30 / 38 px | 600 serif or 650 sans | Serif only when the section benefits from editorial emphasis |
| Card identity | 19 / 25 px | 650 sans | Clamp to 2 lines |
| Rate | 28 / 32 px | 700 sans | Tabular numerals |
| Body large | 20 / 30 px | 400 sans | Short customer guidance |
| Body | 16 / 24 px | 400 sans | Default minimum |
| Label | 14 / 20 px | 550 sans | Sentence case; always visible |
| Supporting | 13 / 19 px | 400 sans | Never use for essential instructions if contrast/space is marginal |

Use sentence case, active voice, plain verbs, and typographic ellipsis `…`. Keep body measures below 75 characters and use `text-wrap: balance` or `text-wrap: pretty` for headings. Use `font-variant-numeric: tabular-nums` for rates, dates in comparisons, counts, and totals.

## 4. Color tokens

| Token | Value | Role |
|---|---|---|
| `brand-primary` | `#123F3A` | Primary actions, active structure, operator brand anchor |
| `text-primary` | `#182321` | Headings, body, meaningful icons |
| `text-muted` | `#52635F` | Supporting text on light surfaces |
| `brand-accent` | `#E77A3D` | Short active underline or decorative line only |
| `background` | `#F6F3EC` | Main page field |
| `surface` | `#FFFFFF` | Inputs, navigation, high-clarity content |
| `surface-soft` | `#EFEDE6` | Restrained summary or selected-filter surface |
| `border` | `#D8D5CC` | Quiet dividers and non-semantic boundaries |
| `focus` | `#0B6158` | Focus ring on light surfaces |
| `overlay` | `rgba(24, 35, 33, 0.56)` | Dialog/sheet scrim; verify composed contrast |

Measured reference pairs:

- Evergreen on white: approximately 11.68:1.
- Road Ink on Rice Paper: approximately 14.56:1.
- Muted text on Rice Paper: approximately 5.73:1.
- Calamansi on Rice Paper: approximately 2.61:1; it cannot carry text, state, or control-boundary meaning.
- Stone on white is structural only and cannot be the sole state/control indicator.

Consume these through semantic tokens. Do not scatter raw hex values through components.

## 5. Semantic colors

| State | Token | Value | White contrast | Required companion |
|---|---|---:|---:|---|
| Success/verified | `state-success` | `#267A55` | ~5.25:1 | Check icon and status words |
| Warning/attention | `state-warning` | `#A45B13` | ~5.14:1 | Warning icon and action/reason text |
| Error/destructive | `state-error` | `#B43B3B` | ~5.79:1 | Error icon and recovery copy |
| Information | `state-info` | `#2E647B` | ~6.51:1 | Info icon or explicit label |
| Locked | `state-locked` | `#52635F` | ~5.98:1 | Lock icon and `Locked`/reason text |

Color never acts alone. Tinted backgrounds may use low-opacity versions of the state color only when foreground contrast remains valid. Brand accent and error must never share a meaning.

## 6. Spacing

Use a 4 px base with an 8 px dominant rhythm:

| Token | Value | Typical use |
|---|---:|---|
| `space-1` | 4 px | Icon optical correction |
| `space-2` | 8 px | Tight icon/text gap |
| `space-3` | 12 px | Compact control internals |
| `space-4` | 16 px | Default component gap |
| `space-5` | 20 px | Card text padding |
| `space-6` | 24 px | Form and card grouping |
| `space-8` | 32 px | Subsection separation |
| `space-10` | 40 px | Page-heading rhythm |
| `space-12` | 48 px | Desktop section gap |
| `space-16` | 64 px | Major section gap |
| `space-20` | 80 px | Marketing/Home breathing room only |

Do not compress task screens to match a marketing density or inflate task headings/spacing for decoration.

## 7. Layout/grid

- Desktop reference canvas: 1440 px wide.
- Maximum content width: 1344 px, centered.
- Desktop gutters: 48 px at ≥1280 px.
- 12-column desktop grid with 24 px gutters.
- Tablet gutters: 32 px; use 8 columns.
- Mobile gutters: 20 px at 375 px; use 4 columns.
- Keep long-form content to 60–75 characters per line.
- Customer task content remains left aligned. Center alignment is reserved for a short, genuine empty state.

Home uses an asymmetric copy/photo split and a search rail that visually bridges the two. Find a Car uses a three-column desktop grid. Requirements uses an open 8/4 task/summary split. Prefer CSS grid/flex layout over JavaScript measurement; prevent unintended horizontal scrolling.

## 8. Containers/surfaces

- Default page: open Rice Paper field.
- Navigation and inputs: white for clarity.
- Booking summary: one soft surface plane, not a stack of cards.
- Vehicle cards: one functional unit with image, facts, reason, and action.
- Information callout: one low-contrast tinted surface with icon, heading, and concise copy.
- Use background shift, alignment, or divider before adding a bordered container.

Never place a card inside a rounded section card inside a page card. Each container must correspond to one interaction or conceptual group.

## 9. Border/radius rules

- Divider: 1 px `border`.
- Standard input/button radius: 8 px.
- Vehicle card and summary radius: 10 px.
- Dialog/sheet radius: 12 px where the platform permits.
- Do not use pill geometry for ordinary rectangular actions or fields.
- Dashed border is reserved for a genuine file drop/select target.
- Selected states need more than a border: add text/icon or a clear filled surface.

## 10. Shadows/elevation

Use one restrained elevation family:

- `elevation-0`: none for open content and most cards.
- `elevation-1`: `0 8px 24px rgba(24, 35, 33, 0.08)` for the integrated Home search rail and floating/sticky controls.
- `elevation-2`: `0 18px 48px rgba(24, 35, 33, 0.14)` for modal/dialog surfaces only.

Borders, surface contrast, and whitespace should do most structural work. Never apply the same shadow to every section.

## 11. Buttons

### Primary

- Solid Evergreen background with white text.
- Minimum height 48 px; minimum target 44 × 44 px.
- 16–24 px horizontal padding depending on label length.
- Specific verb phrase: `Find cars`, `View car`, `Review documents`.
- Hover darkens the fill; active changes fill/elevation without changing bounds.

### Secondary

- Text link or white button with a clear 1 px boundary.
- Must remain visibly subordinate to the primary action.
- Navigation actions use links; mutations/actions use buttons.

### Destructive

- Error color only for a genuine destructive action.
- Require confirmation or an undo opportunity as appropriate.
- Never style ordinary back/cancel actions as destructive.

All buttons need disabled semantics, a visible focus ring, and progress feedback only after work starts. Do not use icon-only controls without an accessible name.

## 12. Inputs

- Persistent visible label above every field; placeholders are examples, never labels.
- Minimum 48 px control height; 16 px input text to avoid mobile zoom.
- Default background white, 1 px boundary, Road Ink text.
- `:focus-visible` uses a 2–3 px focus ring with offset; compound groups use `:focus-within`.
- Errors appear beside the field with error icon, plain-language correction, `aria-invalid`, and programmatic association.
- Preserve entered values after an error.
- Use correct types/input modes, meaningful names, and suitable autocomplete. Never block paste.

For Finder: use date-time controls for start/end, integer input for passengers, decimal/currency-aware input for maximum total base-rental budget, and a canonical active-category select for optional preference.

## 13. Search controls

Home begins guided discovery with `Find the right car for your trip` and one dominant `Find cars` action. Its compact search rail contains only:

- Rental start — required.
- Rental end — required and after start.

Do not include pickup area as a Finder criterion. Destination may appear only in an expanded/full Finder with the explicit note that it is captured for requirements and does not change baseline recommendations. Do not hide this limitation in a tooltip.

On Find a Car/results, optional refinement may expose canonically supported passenger count, maximum total base-rental budget, and active vehicle category/preference. Use outcome-oriented invitations such as `Narrow your results` or `Help me find a better fit`. These refinements may invoke the canonical recommendation capability, but the Home hero must not feel like a questionnaire.

Show a compact trip/refinement summary and `Change trip` where the Finder is active. Store filter/search state in the URL where feasible so refresh, back, and deep links remain predictable. Results must preserve direct browsing and never relax hard criteria silently.

## 14. Navigation

- Order: operator identity, Home, Find a Car, My Bookings, Contact, account/sign-in action.
- Desktop header target height: 76–88 px.
- Active page uses weight plus a short Calamansi underline; the underline is not the only active cue.
- Links remain semantic links and support standard browser navigation behavior.
- Include a skip link to main content.
- On mobile, use a labelled menu button and one clear disclosure surface; preserve logical focus order and return focus on close.
- Sticky navigation must reserve layout space and never obscure focused content.

## 15. Icons

- Use one outlined SVG family with consistent 1.75–2 px stroke.
- Sizes: 16 px supporting, 20 px inline, 24 px control, 32 px process emphasis.
- Icon and text align optically, not mechanically.
- Decorative icons next to equivalent text are `aria-hidden`.
- Standalone meaningful icons need a text alternative; icon buttons need an accessible name and relevant expanded/pressed state.
- Do not use emoji as structural icons.

## 16. Vehicle imagery

- Vehicle photography is functional product information and the main expressive material.
- Show the whole or meaningfully cropped vehicle with consistent scale and angle across comparable cards.
- Prefer attainable fleet vehicles, natural daylight, honest materials, and neutral road/fleet settings.
- Desktop card media uses one stable wide ratio; mobile may move toward 16:9 for readability.
- Use `object-fit: cover`, explicit width/height or `aspect-ratio`, and reserve space to prevent layout shift.
- Above-fold critical media gets appropriate priority; below-fold fleet images load lazily.
- Alt text names the vehicle when the image conveys its identity; purely repeated decorative imagery uses empty alt text.
- Do not use identifiable city landmarks, skyline treatments, unrelated luxury cars, advertising-style speed effects, or inconsistent stock-photo worlds.

## 17. Vehicle browsing cards

Desktop scan order:

1. vehicle image;
2. vehicle identity;
3. prominent canonical rate when available;
4. one traceable fit reason only in evaluated Finder context;
5. seats, transmission, fuel;
6. branch/location as operational data;
7. one `View car` or `Select car` action.

Use a three-column desktop, two-column tablet, and one-column mobile grid. Keep image proportions, action position, and fact order consistent. Long names/branches wrap or clamp safely; flex children use `min-width: 0`.

Unknown rate, branch, image, transmission, or fuel must have a truthful designed fallback; do not invent values. `Available` language is forbidden in ordinary browse results unless current canonical period/readiness evaluation proves it.

## 18. Recommendation/match reasons

The customer-facing system names the outcome, not the mechanism:

- `Find the right car for your trip`
- `Show cars that fit`
- `Cars that fit your trip`

Only current canonical evaluation output may justify a fit. Allowed reason strings/types are:

- `Available for your selected dates`
- `Seats your group of {passengerCount}`
- `Within your maximum base-rental budget`
- `Maintenance-ready`
- `Matches your {category} preference`
- `Suitable alternative to your {category} preference`

The UI may render a subset for scanability, but must not rewrite a reason into a stronger claim. Keep full `Why this fits` details available on vehicle detail/selection where useful. Canonical result ordering may be used without a promotional `#1` badge; internal rank/provenance does not require a customer-visible score.

Never show a match percentage, AI endorsement, unexplained `best match`, or availability outside a current evaluation. State that results are not a reservation where selection/booking context could otherwise imply a hold.

## 19. Lifecycle component

Customer lifecycle order is fixed:

`Request → Requirements → Payment → Confirmation → Rental → Return`

- Render as an ordered list/stepper with complete, current, locked, and pending semantics.
- The completed first stage reads `Request submitted`; it must never read `Booking completed` or imply `Booking confirmed`.
- Each stage has a text label; complete/current/locked adds icon and/or explicit state copy.
- Current step uses `aria-current="step"` in implementation.
- Locked Payment must explain that requirements verification comes first.
- Lifecycle is informative, not clickable navigation unless a route is actually available.
- On narrow screens, show the current stage, adjacent context, and an accessible full-list disclosure; never create horizontal page overflow.

## 20. Task-level wizard/progress

Requirements task order is fixed:

`Before you start → Upload documents → Review → Send for verification`

Keep it visually and semantically separate from the overall rental lifecycle. Show `Step 2 of 4` or equivalent text. Preserve completed input when navigating back. Warn before discarding unsaved files/data. Do not mark a step complete before its actual action succeeds.

Desktop may show all four stages on one line. Mobile uses a compact current-step summary plus a disclosure/list; labels must not shrink below legibility or clip.

## 21. Status treatment

Status is a compact label with:

- canonical plain-language name;
- semantic icon where helpful;
- semantic text/background color;
- optional short reason/action.

Status must never be a decorative pill collection. Use sentence case. Do not map unrelated domain states to one generic color/name. Unknown/unavailable remains explicit rather than appearing neutral-successful.

Booking, requirements, payment, rental, maintenance, and advisory states keep their own canonical vocabulary and transitions.

## 22. Requirements/upload patterns

Exactly two canonical customer requirements are represented in the current contract:

- Valid Government ID.
- Driver's License.

Each upload row contains requirement name, persistent format/size guidance, current file/state, and one labelled file action. Accept JPEG, PNG, or PDF up to 10 MiB, but the server remains authoritative and validates magic bytes.

Use dashed boundaries only for the functional file target. Support keyboard file selection and a non-drag alternative. Show file name, size, progress, success, and a clear replacement/resubmission reason when applicable. Do not expose private storage paths. Preserve the rule that only current document versions count.

Customer can upload/submit/resubmit their own requirements. Owner/Admin review authority must not leak into this customer pattern.

## 23. Customer request summary

Use one restrained summary surface containing:

- vehicle image and identity;
- rental dates;
- pickup/return branch/location when canonical;
- canonical rate/total only when available and trustworthy;
- current request stage;
- one link to request/booking details when a route exists.

Facts are aligned in one scan path with quiet dividers. Location appears as a labelled value, not background artwork. On mobile, the summary follows the primary task unless persistent context is needed; it must not push the current action below avoidable decoration.

Do not place an internal-looking reference ID in the primary summary hierarchy. If canonically useful to the customer, keep it inside low-priority details or support context.

## 24. Loading states

- Preserve layout geometry with restrained skeletons for cards/images and reserved media ratios.
- Search submit changes to `Finding cars…` only after the request begins and exposes polite status text.
- Keep a previous valid result set visible during a non-destructive refresh when truthful, with a clear updating state.
- Spinner-only full pages are a last resort.
- Do not announce every skeleton; one contextual live status is enough.
- Respect reduced motion; static placeholders are sufficient.

## 25. Empty states

Differentiate:

- **No fleet data:** explain that vehicles cannot be shown and offer a valid retry/contact path.
- **No browse filter results:** name the active filter and offer `Clear filters`.
- **No eligible Finder results:** use the canonical no-match message/factors and offer an explicit criterion edit or direct browse path.
- **No bookings/documents:** explain the state and provide the next valid action.

Never show a blank grid or a mood-only illustration. Do not silently broaden dates, capacity, budget, or availability constraints.

## 26. Error states

- Field errors appear inline and say how to fix the value.
- Multi-error submissions add a focusable error summary linked to invalid fields, while retaining inline errors.
- API failure names the failed action and gives a safe retry; it does not claim no vehicles exist.
- File errors identify format, size, or upload failure without losing other completed work.
- Stale Finder selection explains that the vehicle no longer meets the requirements and asks the customer to refresh results.
- Async error announcements use an appropriate live region without stealing focus unnecessarily.

Errors do not apologize vaguely, blame the user, or expose internal diagnostics.

## 27. Success states

- Confirm the completed action in context with success icon and words.
- After Finder evaluation, move or announce focus to the results heading without unexpected scroll trapping.
- After file selection, confirm the selected file but do not imply submission/verification.
- After requirements submission, say that documents were sent for verification; do not imply approval.
- After payment proof submission, say it is awaiting manual verification; do not imply automatic confirmation.
- Preserve the next valid action or waiting expectation.

## 28. Responsive rules

Validate at 375, 768, 1024, and 1440 px plus 200% zoom.

### Home

- Desktop: asymmetric copy/photo field with integrated search rail.
- Tablet: copy and image remain distinct; Finder becomes a two-column form and action spans the row.
- Mobile: headline 42–48 px, single-column labelled date fields, full-width primary action, and photography below or behind no essential text. Direct browsing remains available through navigation rather than a detached hero link.
- Four rental steps become a compact vertical ordered list; do not squeeze four labels into one clipped row.

### Find a Car

- 3 columns desktop, 2 tablet, 1 mobile.
- Trip summary wraps into a grid; filters use a labelled drawer/sheet at narrow widths.
- Category controls wrap or use an accessible disclosure; never clip hidden values.
- Filter state remains visible and URL-addressable where feasible.

### Requirements

- Desktop: 8/4 task/summary split.
- Tablet/mobile: task first, summary second; primary action remains easy to reach.
- Lifecycle and task progress recompose rather than horizontally scrolling the page.
- Fixed/sticky actions reserve safe-area and content inset; keyboard focus stays visible.

## 29. Accessibility rules

- Meet WCAG AA: 4.5:1 normal text, 3:1 large text and meaningful non-text UI boundaries.
- Use semantic HTML before ARIA; headings remain hierarchical and the page includes a skip link.
- Every control has a persistent accessible label; icon-only controls have accessible names.
- All actions are keyboard reachable in logical visual order with visible `:focus-visible` treatment.
- Sticky headers, sheets, and action bars cannot obscure focused elements.
- Minimum pointer target is 44 × 44 px with adequate separation.
- Status, current step, errors, and selection never rely on color alone.
- Meaningful images have appropriate alt text and explicit dimensions; decorative imagery is hidden/empty-alt.
- Async results, uploads, validation, and success use restrained live announcements.
- Support text resize/zoom without loss, clipping, or horizontal page scroll.
- Do not disable zoom, block paste, force drag/swipe, or require hover.
- Native dates, currency, and numbers use locale-aware formatting such as `Intl.DateTimeFormat` and `Intl.NumberFormat`.

## 30. Motion rules

- Motion responds to a user action or clarifies a state change.
- Fast feedback: 140–180 ms; standard disclosure: 200–240 ms; large overlay: up to 320 ms.
- Animate opacity and transform; never `transition: all` or animate layout dimensions when avoidable.
- Keep animations interruptible and preserve spatial continuity.
- No autoplay carousel, parallax dependency, looping badge, or decorative scroll choreography.
- Under `prefers-reduced-motion: reduce`, remove nonessential transitions and render final states immediately.
- Button press/hover must not shift surrounding layout.

## 31. Location-neutral presentation rules

Do:

- treat branch, pickup location, return location, and destination as operational data;
- permit approved operator logo/name/color/contact replacement at presentation level;
- use automotive, driving, rental, document, and lifecycle imagery/icons;
- use vehicles meaningfully as the primary visual subject;
- keep shared layouts and components credible outside one city;
- label any location value by its actual role.

Do not:

- bake city names into decorative headings or system copy;
- create permanent city skyline, landmark, church, or map illustrations;
- hard-code location silhouettes into reusable components;
- use a location slogan as core UI identity;
- select a photographic landmark that visually locks the shell to one branch/city;
- turn the presentation rule into multi-tenancy, white-label infrastructure, or a theme-management feature.

## 32. Anti-patterns / forbidden drift

The following are explicitly forbidden:

- city-specific permanent artwork;
- city-specific decorative slogans;
- generic SaaS card proliferation;
- arbitrary gradient CTAs;
- unsupported recommendation percentages;
- unsupported availability claims;
- Smart/AI terminology in customer-facing UI;
- fake ratings;
- fake urgency, scarcity, countdowns, or discounts;
- repetitive bordered containers;
- oversized decorative headings on task screens;
- cards nested inside cards or giant rounded wrappers around sections;
- black/gold luxury clichés, glassmorphism, glow, or decorative gradients;
- favorites unless the capability is implemented;
- arbitrary `Best match` badges or unexplained rank promotion;
- location criteria the Finder does not evaluate;
- silent relaxation of dates, capacity, budget, readiness, or availability;
- payment-before-verification, automatic approval, instant confirmation, or automatic payment-verification language;
- `Booking completed` or `Booking confirmed` before the canonical confirmation stage;
- prominent internal/reference IDs on primary customer task screens;
- a detached `Browse all cars` link beneath the Home hero CTA;
- emoji controls, unlabeled icon buttons, placeholder-only fields, hidden focus rings, or color-only state;
- inconsistent vehicle image ratios, invented rates/facts, or unlicensed production photography;
- decorative micro-labels, all-caps eyebrows, technical system jargon, or filler metadata;
- implementation changes that reopen the frozen workflow, lifecycle, roles, backend contracts, schema, allocation, forecasting, provider architecture, or maintenance/readiness rules.
