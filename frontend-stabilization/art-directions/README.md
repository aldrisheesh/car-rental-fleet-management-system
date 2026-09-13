# Briah's Car Rental — Art-Direction Exploration

This folder contains a visual-language exploration for GitHub Issue #63. The
product/UX blueprint is frozen: these concepts do not change workflows,
information architecture, lifecycle rules, permissions, backend contracts, or
persisted states. Earlier visual concepts were treated only as rejection
evidence and were not used as visual references.

Only two representative customer screens are explored per direction:

- Customer Home
- Customer Booking Detail — Action Required

All mock data is illustrative presentation content. The lifecycle remains:
`Booking -> Requirements -> Payment -> Confirmation -> Rental -> Return`.

## Pass 1 — Design plan

### Direction A — Premium Contemporary Mobility

**Visual thesis.** A confident editorial travel product built around the
feeling of leaving Metro Manila at first light. Vehicle photography carries the
emotion; the interface behaves like precise automotive instrumentation without
imitating a dashboard or dealership site.

**Palette.** Night Asphalt `#16232C`; Road Ivory `#F4F2EC`; Tail-light Red
`#C63F35`; Windshield Blue `#A9C9D5`; Concrete Mist `#D8D9D4`; White
`#FFFFFF`.

**Typography.** Newsreader for restrained display headlines and Public Sans
for navigation, controls, prices, and body copy. Newsreader supplies editorial
confidence without the fashion-luxury mannerisms of Bodoni/Playfair; Public
Sans keeps first-time guidance highly legible.

**Spacing and density.** Spacious customer surfaces with a 4/8-point rhythm,
large 64–96 px sectional pauses, and compact 12–16 px spacing only inside trip
controls. Desktop content is left-aligned; short headlines stay under 20ch and
body copy under 70 characters.

**Layout concept.** A 12-column cinematic composition: copy occupies four
columns, a full-height vehicle photograph occupies seven, and a slim route seam
connects the booking control to the lower process explanation. The hero is not
centered and the booking control is one continuous instrument panel, not a row
of cards.

```text
desktop
┌ wordmark ─ Home  Find a Car  My Bookings  Contact ─ account ┐
│ headline + guidance │        Philippine road photograph     │
│                     │         vehicle crossing the seam      │
├ pickup ─ dates ─────────────────────────────── Find a car ──┤
│ Choose a car        Send requirements        Pay after review│
└──────────────────────────────────────────────────────────────┘
```

**Navigation character.** Quiet wordmark, generous horizontal spacing, and a
single short underline for the active destination. The navigation changes from
dark-on-ivory to white-on-photo only where contrast is guaranteed; no glass or
floating nav capsule.

**Button/control character.** Low-radius, wide controls with deliberate
typographic weight and a red primary action. Fields share one baseline and are
separated by whitespace and short dividers only where they encode field
boundaries. Focus uses a 3 px Windshield Blue outer ring.

**Image treatment.** Natural, wide-lens Philippine road photography: a silver
compact SUV on an Antipolo ridge road with the hazy Metro Manila skyline in the
distance. Cool morning light, honest surface texture, no showroom lighting,
speed blur, supercar, or foreign signage.

**Lifecycle/progress treatment.** An **odometer ribbon**: a single dark route
band with six typographic mile marks. The current Requirements mile expands
into the action explanation; Payment is visibly muted and carries a lock plus
plain-language prerequisite. It reads as one trip, not six equal workflow
boxes.

**Future Admin density treatment.** Retain Night Asphalt, Tail-light Red, the
wordmark, and the odometer vocabulary, but replace photography-led composition
with dense 8/12/16 px operational rows, tabular figures, and a narrow dark rail.
Admin is scan-first and medium/high density, never a spacious clone of customer
pages.

**Distinctive visual idea.** The road horizon in the hero continues as the
baseline of the booking instrument and later becomes the lifecycle ribbon.
One meaningful line ties discovery to rental progress.

**Anti-patterns to avoid.** Black/gold luxury, glassmorphism, glossy dealership
renders, giant centered headline, floating card stacks, repeated soft shadows,
futuristic monospace body copy, and ornamental speed lines.

**Why this is Briah-specific.** It pairs attainable fleet photography and
Antipolo-to-Manila travel context with Briah's crucial promise: choose a car,
send requirements, and pay only after review. Premium treatment comes from
editing and restraint rather than an implausible luxury fleet.

### Direction B — Friendly Philippine Rental

**Visual thesis.** A warm, human service experience inspired by a clear,
face-to-face vehicle handover. It should feel like a reliable local team has
already anticipated a first-time renter's questions, while retaining the polish
of a real product.

**Palette.** Canopy Green `#1F5A4C`; Morning Cream `#FFF8EA`; Key-tag Gold
`#D99528`; Deep Ink `#19312D`; Concrete Mist `#D9DED7`; Correction Red
`#B53B32`.

**Typography.** Calistoga for short, friendly display lines and Public Sans for
all functional copy. Calistoga is limited to the wordmark and major headlines;
sentence-case Public Sans prevents the rounded display voice from becoming
childish.

**Spacing and density.** Comfortable medium-low density, 24–48 px grouping,
and deliberately uneven section cadence: compact trip facts beside open
reassurance copy. Controls remain at least 44 px high on mobile.

**Layout concept.** A horizontal service-counter composition rather than a
landing-page stack. A candid handover photograph occupies the first third; a
cream content field holds the plain-language invitation; one green booking
shelf spans the viewport. Supporting process copy sits directly on the page,
not inside three cards.

```text
desktop
┌ wordmark ─ Home  Find a Car  My Bookings  Contact ─ account ┐
│ candid Antipolo handover │ Ready for your first rental?      │
│                          │ calm explanation + one clear CTA   │
├ pickup area ─ pickup date ─ return date ───── Find a car ───┤
│ 1 Choose your car   2 Send requirements   3 Pay after review│
└──────────────────────────────────────────────────────────────┘
```

**Navigation character.** Familiar and conversational: wordmark left, four
plain labels, active destination marked by a short gold key-tag tab. On phones,
a labelled menu preserves the same hierarchy; no icon-only mystery navigation.

**Button/control character.** Tactile green actions with modest 10 px corners;
secondary actions are underlined text. The one recurring clipped corner echoes
a physical rental key tag, but it is reserved for the primary action and
current-status marker rather than applied to every surface.

**Image treatment.** Candid daylight photography of an ordinary Filipino
renter receiving keys beside a clean compact sedan at an Antipolo pickup point.
Natural clothing and streetscape, no posed resort imagery, tourism props,
stereotypes, flags, or jeepney motifs.

**Lifecycle/progress treatment.** A **service itinerary**: one gently curving
green path with six named stops. Completed Booking is a filled stop,
Requirements becomes a gold key-tag marker attached to the correction message,
and future stops fade into the page. On mobile, only `Requirements — step 2 of
6` and the previous/next stop remain visible until the journey summary expands.

**Future Admin density treatment.** Keep green/gold status semantics, humanist
copy, and clipped-corner attention markers; tighten to medium/high density with
clear section bands, compact lists, and precise action queues. Photography is
used only for vehicle/customer context, not as dashboard decoration.

**Distinctive visual idea.** The rental key tag becomes a small functional
shape for the primary action and current journey stop, linking the moment of
handover to the digital flow without literal key illustrations everywhere.

**Anti-patterns to avoid.** Flag palettes, tourism tropes, handwritten fonts,
cartoons, bubbly pills on every element, generic green wellness UI, testimonial
carousels, repeated equal cards, and sentimental marketing copy.

**Why this is Briah-specific.** The visual story is a believable Antipolo
handover by a small local rental team. Its copy answers the questions Briah's
first-time customers actually have and makes the local manual review process
feel reassuring instead of bureaucratic.

### Direction C — Modern Mobility Platform

**Visual thesis.** A fast, systematic rental interface where vehicle,
destination, and next action behave like parts of one route. It is more
technical than A or B, but its technology is visibly about moving a real car,
not managing abstract SaaS records.

**Palette.** Transit Ink `#17212B`; Mobility Blue `#1457D9`; Signal Mint
`#218C76`; Signal Red `#C43E35`; Route Fog `#F1F4F2`; White `#FFFFFF`.

**Typography.** Outfit for large navigation and state headlines; Work Sans for
body, forms, and trip facts. Figures use Work Sans tabular numerals rather than
a decorative monospace.

**Spacing and density.** Medium customer density with a compact 8/12/20 px
control rhythm set against larger 56–72 px page breaks. Higher information
density is concentrated in one route console, leaving the remaining surface
quiet.

**Layout concept.** An asymmetric 5/7 grid. A persistent trip console occupies
the left plane; a cutout vehicle and simplified origin/destination route occupy
the right. Sections snap to the same route coordinates rather than sitting in
independent cards.

```text
desktop
┌ wordmark ─ Home  Find a Car  My Bookings  Contact ─ account ┐
│ Find your route-ready car │  vehicle + Manila—Antipolo line │
│ pickup / dates console    │  fleet photography breaks grid  │
│ Find a car                │                                  │
├──────── Booking → Requirements → Payment → the road ahead ─┤
└──────────────────────────────────────────────────────────────┘
```

**Navigation character.** Compact and anchored to a Transit Ink bar with a
thin Mobility Blue active track. The wordmark and navigation share a baseline;
actions remain labelled and the customer IA is unchanged.

**Button/control character.** Precise 6 px corners, solid blue primary action,
and integrated icon/label pairs from one 1.75 px outline family. Press/selection
changes use color and a 150–200 ms state transition, not lift, glow, or playful
bounce.

**Image treatment.** Clean documentary vehicle photography, isolated through
confident cropping rather than a studio cutout: a white compact crossover in a
real Makati-to-Antipolo travel context. Route graphics align to tires and road
surface, never float as decorative data viz.

**Lifecycle/progress treatment.** A **route rail** with six unequal station
segments. Requirements opens into the active action drawer, while Payment
collapses to a visibly locked segment containing `Unlocks after verification`.
On mobile, the drawer becomes the first content block and a compact `2 of 6`
rail remains directly below it.

**Future Admin density treatment.** Reuse the route rail as a compact booking
state column and the same blue/mint/red semantics in medium/high-density queues.
Use aligned data rails, 32–40 px rows, tabular figures, and split-pane detail;
do not reuse the customer's hero or oversized type.

**Distinctive visual idea.** The same blue route coordinate system aligns the
trip form, vehicle photography, and lifecycle state. The product feels like a
mobility tool because every visual device describes an actual rental journey.

**Anti-patterns to avoid.** Brutalism, visible grid borders, neon-on-black,
banking gradients, command palettes, KPI tiles, bento cards, generic map pins,
monospace labels, excessive motion, and Stripe/Linear mimicry.

**Why this is Briah-specific.** The system is organized around a real
Manila/Antipolo rental route and Briah's requirements-before-payment sequence,
not generic workflow objects. Its technical character supports rapid booking
comprehension while keeping vehicles and local trip facts in view.

## Pass 1 uniqueness review

- **A revised:** the search output suggested black/gold luxury, liquid glass,
  and futuristic mono type. Those choices were removed. The revised identity is
  editorial road photography, an attainable fleet, and an odometer-like ribbon.
- **B revised:** the search output leaned toward Swiss/Inter minimalism or
  child-oriented rounded fonts. Those choices were removed. The revised system
  uses a restrained display face, candid local handover photography, and one
  functional key-tag shape.
- **C revised:** the search output suggested Brutalism, visible borders, dark
  podcast/cyber palettes, and bento grids. Those choices were removed. The
  revised system uses flat route geometry, asymmetric planes, moderate motion,
  and vehicle-aligned coordinates.

The three directions now differ in composition, image role, progress model,
control geometry, density, and emotional register—not only in color.

## Shared customer and future Admin principle

Customer surfaces remain calm, visual, guided, reassuring, and spacious. Future
Admin surfaces will be dense, fast, operational, scan-friendly, and precise.
They will share each selected direction's wordmark, typography family, palette,
icons, state semantics, and one signature structural device, but not identical
layout or density.

Within each direction, the Home and Booking Detail use the same typographic
wordmark treatment, font system, 1.75 px outline icon family, vocabulary, and
state colors. Across directions, those elements intentionally vary to make the
art-direction decision meaningful.

## Concept files

- `DIRECTION-A/home.png`
- `DIRECTION-A/booking-action.png`
- `DIRECTION-B/home.png`
- `DIRECTION-B/booking-action.png`
- `DIRECTION-C/home.png`
- `DIRECTION-C/booking-action.png`

## Final image-generation prompt set

All six artifacts used the built-in image-generation workflow with the
`ui-mockup` use case. Each prompt requested a high-fidelity, front-on 16:10
desktop product screenshot with no browser chrome or device frame, exact Briah
branding, Philippine-only geography, the frozen customer navigation, one
dominant action, 16 px-or-larger body copy, 44 px-or-larger controls, and no
watermark. The output resolved to 1536 x 1024 PNG.

### A Home

> Customer Home for Briah's Car Rental in the Premium Contemporary Mobility
> direction. Asymmetric editorial split on Road Ivory: first-time-renter copy
> at left, a silver attainable compact SUV on an Antipolo ridge road with hazy
> Metro Manila at right, and one continuous Night Asphalt booking instrument
> across the lower hero. Use Newsreader-like display type, Public Sans-like UI
> type, Tail-light Red for the sole `Find a car` action, and three unboxed lines:
> `Choose a car`, `Send requirements`, `Pay after review`. Avoid luxury
> black/gold, glass, dealership imagery, cards, centered templates, slogans,
> foreign locations, arrows, and all-caps labels.

### A Booking Action

> Booking Detail for Toyota Vios, Oct 18–20, Antipolo. Put the action first:
> `Action required: Update your driver's license`, explain that the photo is too
> blurry, ask for all four corners, say what happens after resubmission, and
> state that Payment unlocks only after verification. Show the frozen six-stage
> lifecycle as one Night Asphalt odometer ribbon using ticks, not circles or
> cards; completed Booking has a check, Requirements is an expanded Tail-light
> Red segment with a downward notch, and Payment has a lock. Use one `Replace
> photo` action. The accepted revision removed an invented tourism slogan and
> replaced the first generated generic circles-and-line stepper.

### B Home

> Customer Home for Briah's Car Rental in the Friendly Philippine Rental
> direction. Use a candid daylight key handover between an ordinary Filipino
> renter and local staff beside a compact sedan at a tidy Antipolo pickup point.
> Pair the photograph with `Ready for your first rental?`, direct
> requirements-before-payment guidance, one Canopy Green booking shelf, and a
> single Key-tag Gold clipped-corner `Find a car` action. Use Calistoga-like
> short display lines and Public Sans-like functional type. Avoid flags,
> jeepney/tropical motifs, cartoons, handwriting, green wellness styling,
> testimonials, equal cards, and sentimental slogans.

### B Booking Action

> Booking Detail using a Canopy Green vertical service itinerary with one
> gently curved path. Completed Booking comes first; the current Requirements
> stop is a protruding Key-tag Gold clipped-corner marker labelled `Step 2 of
> 6`; Payment has a lock; Confirmation, Rental, and Return remain quiet. On the
> cream content field, lead with the driver's-license correction, cause, exact
> recovery, next review, and one clipped `Replace photo` action. The accepted
> revision removed two invented handwritten slogans, removed the CTA arrow, and
> changed the generated date to `Oct 18–20` with no invented year.

### C Home

> Customer Home for Briah's Car Rental in the Modern Mobility Platform
> direction. Use an asymmetric route-aligned trip console at left and a white
> compact crossover on a real Metro Manila road with Antipolo hills at right.
> Align pickup area Makati, Oct 18–20 dates, the vehicle tires, and the lower
> `Choose a car` / `Requirements reviewed` / `Payment after approval` sequence
> to one Mobility Blue coordinate. Use Outfit-like display type, Work Sans-like
> UI type, flat planes, precise 6 px corners, and one blue `Find a car` action.
> The accepted revision made the headline uniformly Transit Ink, neutralized
> the future Payment segment, and replaced an unnecessary landmark-like church
> with an ordinary hillside.

### C Booking Action

> Booking Detail using one horizontal route rail with six unequal station
> segments and no circle nodes. Booking is a compact completed segment;
> Requirements is longest, labelled `2 of 6`, and opens into the dominant action
> drawer; Payment is shorter, muted, hatched, locked, and labelled; future stages
> compress progressively. Keep the Toyota Vios and Antipolo trip visible in a
> documentary crop and unboxed fact rows. Lead with the exact driver's-license
> cause, recovery, post-resubmission review, and locked-payment explanation;
> provide one solid-blue `Replace photo` action. Avoid bento/KPI/dashboard
> patterns, neon dark UI, command palettes, generic equal steppers, gradients,
> and Stripe/Linear imitation.
