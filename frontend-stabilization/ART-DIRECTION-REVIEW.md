# Art Direction Review

This review covers visual exploration only for GitHub Issue #63. The frozen
product/UX blueprint was not reopened, and no direction is approved for
implementation by this document.

## Skills loaded

- **frontend-design** — loaded in full and used as the primary art-direction
  authority. Its required two-pass process produced the plan and uniqueness
  review in `art-directions/README.md` before any image generation.
- **ui-ux-pro-max** — loaded in full and used for non-persisted design-system
  exploration, targeted palette/type/pattern searches, responsive guidance, and
  accessibility validation.
- **imagegen** — loaded in full as the supporting raster-production workflow.
  The built-in image-generation mode produced the six PNG artifacts; no CLI,
  API key, or application implementation was used.

## UI/UX Pro Max searches performed

No search used `--persist`. Search output was advisory; mismatches were recorded
and rejected rather than allowed to override the brief.

| Query | Mode/domain | Top match used or disposition | Why it fit / did not fit |
|---|---|---|---|
| `car rental automotive travel premium` | `--design-system --variance 7 --motion 3 --density 3` | Hero-Centric Design + Automotive/Car Dealership palette | A useful single-CTA/photo hierarchy and automotive dark/action contrast. Motion-Driven and Syncopate/Space Mono were rejected as too theatrical and less readable. |
| `car rental local service friendly trustworthy` | `--design-system --variance 6 --motion 2 --density 4` | Funnel (3-Step Conversion) + location-green/action warmth | Progressive disclosure directly supports the first-time-renter promise. Swiss/Inter styling was rejected as generic and insufficiently human. |
| `mobility booking platform modern` | `--design-system --variance 8 --motion 4 --density 5` | Hero + Features + CTA, single-CTA guidance only | The hierarchy and higher variance were useful. Brutalism, visible borders, and amber/blue blocks were rejected because they conflict with the brief. |
| `vehicle booking editorial premium` | `--design-system --variance 7 --motion 3 --density 3` | No visual style used; narrative sequencing only | Liquid Glass and black/gold luxury were direct anti-patterns. The result confirmed the need to create A's editorial character from road photography instead. |
| `car sharing booking interaction` | `--design-system --variance 8 --motion 4 --density 5` | Hero-Centric Design, limited to one-primary-action guidance | Brutalism was again rejected. Outfit/Rubik supported the idea that C could use geometric type, later refined through a dedicated type search. |
| `editorial automotive readable` | `typography` | News Editorial — Newsreader/Roboto; Magazine Style's Public Sans | Newsreader supplied trustworthy editorial personality; Public Sans was selected over Roboto for a less default functional voice. |
| `friendly local service humanist` | `typography` | No top result used | Kids/Education, Soft Rounded, and Friendly SaaS were respectively childish, wellness-like, or SaaS-coded. |
| `modern mobility technical readable` | `typography` | No match used | The returned Korean/Thai/Hebrew language-specific systems did not fit an English Philippine interface; a narrower geometric-interface retry was used. |
| `automotive travel premium` | `color` | Automotive/Car Dealership | Its slate/action-red relationship informed A, but the palette was warmed and desaturated to avoid dealership boilerplate. |
| `local service friendly trustworthy` | `color` | Local Events & Discovery | Warm service energy was useful; literal event orange/map blue was replaced by Canopy Green, cream, and key-tag gold. |
| `mobility platform modern` | `color` | No match used | Podcast, cybersecurity, and Web3 dark palettes were all off-topic and would create a generic tech product. |
| `customer navigation active state` | `ux` | Navigation / Active State | A short underline or track gives clear current-location feedback without adding a navigation container. |
| `mobile booking progress` | `ux` | Feedback / Progress Indicators | Supported a visible current step and `2 of 6` summary, with core action content prioritized on mobile. |
| `error clarity recovery` | `ux` | Feedback / Error Recovery | Required each correction message to state the cause and the exact recovery action; the accessibility result also required non-color-only error communication. |
| `multi-step progress current step` | `ux` | Feedback / Progress Indicators | Supported always-visible journey context while allowing each direction to avoid the generic equal-step component. |
| `editorial photography minimal` | `style` | Minimalism & Swiss Style, only its restraint | Whitespace, grid discipline, and low effects fit A; its enterprise/SaaS association and strict monochrome treatment did not. |
| `warm organic friendly` | `style` | Nature Distilled, only its material warmth | Texture and human warmth helped B. Terracotta/cream AI-default styling and wellness/organic cues were rejected. |
| `functional modern interaction` | `style` | No database match | The search returned zero results; no result was fabricated or persisted. |
| `approachable professional service` | `typography` | Modern Professional, readability principle only | The returned Poppins/Open Sans pairing felt corporate; its hierarchy guidance was retained, not its fonts. |
| `geometric interface versatile` | `typography` | Geometric Modern — Outfit/Work Sans | This became C's type system: distinctive geometric headings with readable, versatile functional copy. |
| `transportation logistics platform` | `color` | Ride Hailing / Transportation | Transit ink and route blue were directly relevant to C; the dark map background was replaced with light Route Fog to stay approachable. |
| `serif warm trustworthy service` | `typography` | SaaS Mobile Boutique's Calistoga component | Calistoga supplied B's human warmth. Inter, uppercase mono labels, and SaaS styling were explicitly not carried forward; Public Sans handles functional text. |
| `microinteractions clean` | `style` retry | Flat Design, result 2 | Flat planes, limited color, and fast 150–200 ms state transitions fit C. The top Motion-Driven result's parallax and animation-heavy recommendations were rejected. |
| `editorial travel premium` | `typography` | News Editorial, result 5 | Confirmed Newsreader as the less fashion-luxury editorial option. Playfair/Inter, Bodoni/Jost, and boutique SaaS stacks were rejected. |

## Direction A — Premium Contemporary Mobility

**Palette.** Night Asphalt `#16232C`; Road Ivory `#F4F2EC`; Tail-light Red
`#C63F35`; Windshield Blue `#A9C9D5`; Concrete Mist `#D8D9D4`; White
`#FFFFFF`.

**Typography.** Newsreader for the wordmark and short display statements;
Public Sans for navigation, guidance, controls, and trip facts.

**Layout.** Cinematic 12-column editorial split on Home; a continuous dark
odometer ribbon followed by asymmetric action/trip information on Booking
Detail. Alignment and whitespace do most grouping work.

**Distinctive idea.** The road horizon becomes the booking-instrument baseline
and later the odometer-style lifecycle ribbon.

**Strengths.** Strongest photography direction; highly legible hierarchy;
clearly automotive without mimicking a dealership; feels polished and credible;
the payment prerequisite is obvious on both screens.

**Weaknesses.** The display serif requires disciplined use to avoid drifting
into generic premium editorial. Photography quality and art direction will be
more demanding in production. The dark lifecycle ribbon needs careful mobile
compression so it does not dominate the action.

**Artifact paths.** `art-directions/DIRECTION-A/home.png` and
`art-directions/DIRECTION-A/booking-action.png`.

## Direction B — Friendly Philippine Rental

**Palette.** Canopy Green `#1F5A4C`; Morning Cream `#FFF8EA`; Key-tag Gold
`#D99528`; Deep Ink `#19312D`; Concrete Mist `#D9DED7`; Correction Red
`#B53B32`.

**Typography.** Calistoga for the wordmark and short headlines; Public Sans
for every functional element.

**Layout.** Handover photograph and conversational introduction share a
service-counter composition; one green booking shelf spans Home. Booking Detail
uses a vertical curved itinerary whose current key-tag marker protrudes into
the unboxed action area.

**Distinctive idea.** A physical rental key tag is abstracted into the one
clipped-corner primary action/current-step shape.

**Strengths.** Most human and most immediately credible as a small Philippine
rental business; best first-time-renter tone; strong local handover image;
requirements and manual review feel reassuring rather than bureaucratic.

**Weaknesses.** Calistoga can become overly folksy if applied beyond short
headlines. Gold must remain functional and sparse. A vertical itinerary consumes
desktop width and must collapse to a current-step summary on mobile.

**Artifact paths.** `art-directions/DIRECTION-B/home.png` and
`art-directions/DIRECTION-B/booking-action.png`.

## Direction C — Modern Mobility Platform

**Palette.** Transit Ink `#17212B`; Mobility Blue `#1457D9`; Signal Mint
`#218C76`; Signal Red `#C43E35`; Route Fog `#F1F4F2`; White `#FFFFFF`.

**Typography.** Outfit for wordmark, navigation, and large state lines; Work
Sans for body text, controls, dates, and vehicle facts.

**Layout.** An asymmetric route-aligned trip console faces a vehicle plane on
Home. Booking Detail uses six unequal rail segments, with Requirements expanded
into the action drawer and locked Payment compressed in place.

**Distinctive idea.** One route coordinate aligns trip input, vehicle
photography, and lifecycle state so technical structure always describes a real
rental journey.

**Strengths.** Fastest-feeling interaction model; clearest path to a denser
Admin system; strong responsive potential because the active segment can become
a mobile drawer; contemporary without glass, neon, or KPI tiles.

**Weaknesses.** Highest risk of drifting toward generic platform UI during
implementation. The Booking action drawer is intentionally one surface but
could become a familiar SaaS card if shadows/borders multiply. Signal Mint with
white text does not meet 4.5:1 and must use Transit Ink text or be reserved for
large/non-text marks.

**Artifact paths.** `art-directions/DIRECTION-C/home.png` and
`art-directions/DIRECTION-C/booking-action.png`.

## Self-critique gate

| Concept | Car-rental / Briah specificity | Boxing / SaaS risk | Type and image contribution | Primary action / journey clarity | Accepted? |
|---|---|---|---|---|---|
| A Home | Vehicle, Antipolo ridge, and requirements-before-payment copy are immediate | One integrated instrument; no card kit | Editorial type and road photograph carry identity | `Find a car` is singular and dominant | Yes |
| A Booking | Vehicle/trip identity and odometer ribbon are specific | Low; content is grouped mostly by space | Vehicle crop supports context without becoming a second hero | Correction, resubmission outcome, and locked Payment are explicit | Yes, after regeneration |
| B Home | Key handover and Antipolo pickup context feel specific to a local operator | Low; one booking shelf and a real numbered sequence | Human photograph and restrained display face do meaningful work | Search action and review-before-payment sequence are immediate | Yes |
| B Booking | Local-service itinerary and key-tag state feel Briah-specific | Low; one journey field, otherwise unboxed | Photo, itinerary, and type share a warm service voice | Requirements is current; cause, recovery, next review, and lock are explicit | Yes, after regeneration |
| C Home | Real car, pickup inputs, Manila/Antipolo route, and payment rule anchor the product | Moderate but controlled; no cards or metrics | Geometric type and route-aligned vehicle are the identity | One search action; lower rail explains sequence | Yes, after regeneration |
| C Booking | Vehicle, trip, and unequal rental-state rail prevent generic workflow reading | Moderate; one action drawer is acceptable, but must not multiply | Image is contextual; typography makes scanning fast | Current segment, reason, recovery, next event, and locked Payment are explicit | Yes |

None of the accepted concepts reads as an insurance portal, bank, ERP,
Bootstrap Admin template, or generic center-aligned SaaS landing page. The
remaining implementation risks are stated above rather than hidden.

## Rejected and regenerated concepts

- **Direction A Booking v1** — rejected because it generated an unrequested
  tourism slogan and a generic circles-and-line stepper. Regenerated with the
  slogan removed and a continuous tick-based odometer ribbon.
- **Direction B Booking v1** — rejected because it added two handwritten
  slogans, a CTA arrow, and an invented year. Regenerated while preserving the
  service itinerary and removing all four violations.
- **Direction C Home v1** — rejected because it highlighted one headline phrase
  in blue, used danger red for a normal future payment step, and introduced an
  unnecessary landmark-like church. Regenerated with uniform headline color,
  neutral future-state color, and a plain Antipolo hillside.

## Accessibility and responsive validation

Measured WCAG contrast ratios for intended normal-text pairs:

| Pair | Ratio |
|---|---:|
| A Night Asphalt / Road Ivory | 14.31:1 |
| A White / Tail-light Red | 5.04:1 |
| A White / Night Asphalt | 16.02:1 |
| B Deep Ink / Morning Cream | 13.08:1 |
| B White / Canopy Green | 8.00:1 |
| B Deep Ink / Key-tag Gold | 5.45:1 |
| B Correction Red / Morning Cream | 5.46:1 |
| C Transit Ink / Route Fog | 14.71:1 |
| C White / Mobility Blue | 6.19:1 |
| C Correction Red / Route Fog | 4.64:1 |

C's White / Signal Mint pair measures 4.14:1 and is therefore prohibited for
normal text. Use Transit Ink on Signal Mint, or reserve mint-on-light treatment
for sufficiently large/bold text and non-text state marks with an accompanying
label.

All directions plan for 44 px minimum customer controls, visible 3 px focus,
non-color-only state cues, 16 px minimum mobile body text, 35–60 character
mobile line lengths, and the frozen customer navigation. At 375 px:

- A turns the odometer into `Requirements — 2 of 6`, followed by a collapsible
  journey summary; the action remains first.
- B collapses the vertical itinerary to its current key-tag marker with previous
  and next stops; the action remains first.
- C turns the active rail segment into the first content drawer and retains a
  compact `2 of 6` rail immediately below.

Future Admin remains medium/high density and scan-first in all three systems;
it shares color, type, icons, and status semantics with the customer product but
does not inherit the customer hero, image scale, or spacious layout.

## Cross-direction comparison

Scores use a relative 1–5 exploration scale, not implementation acceptance.

| Criterion | A | B | C |
|---|---:|---:|---:|
| Visual distinctiveness | 5 | 5 | 4 |
| First-time renter clarity | 5 | 5 | 4 |
| Car-rental relevance | 5 | 5 | 5 |
| Philippine/business relevance | 4 | 5 | 4 |
| Scalability to Admin | 4 | 3 | 5 |
| Accessibility | 5 | 5 | 4 |
| Mobile suitability | 4 | 4 | 5 |
| Implementation feasibility | 4 | 5 | 5 |

Direction A has the strongest editorial polish and image discipline. Direction
B has the most credible Briah/local-service personality and clearest emotional
tone. Direction C offers the best reusable interaction system and Admin path,
but requires the most vigilance against SaaS drift.

## Recommendation

**HYBRID** — use Direction B as the customer-facing foundation, with exact
elements combined as follows:

- retain B's Canopy Green / Morning Cream / Key-tag Gold palette, candid local
  handover photography, plain-language service tone, and clipped current-state
  key-tag marker;
- replace B's Calistoga-heavy display treatment with A's more restrained
  Newsreader + Public Sans hierarchy for broader credibility and longer-term
  scalability;
- use C's unequal route-rail behavior and mobile current-step drawer, recolored
  into B's palette, with B's key-tag shape serving as the one expanded current
  segment;
- carry C's aligned, medium/high-density route/state logic into future Admin,
  while retaining B's human language and brand colors;
- do **not** import A's dark odometer band, C's corporate-blue palette, B's
  display face beyond the wordmark, or more than one signature shape per screen.

This recommendation is for review only. Do not implement it until the six
images are approved.
