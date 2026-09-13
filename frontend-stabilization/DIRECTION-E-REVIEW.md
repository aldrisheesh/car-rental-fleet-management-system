# Direction E Review

## Skills loaded

- **frontend-design** — loaded fully and used as the primary art-direction authority. It drove the subject-specific road-window idea, restrained display typography, local photographic character, plain-language copy, and removal of template signals.
- **ui-ux-pro-max** — loaded fully and used for the token system, 4/8 px rhythm, contrast hierarchy, 44 px targets, consistent icon treatment, marketplace scanability, explicit progress, labelled upload controls, and responsive implementation direction. Its generated glassmorphism and black/gold recommendations were rejected because they conflict with the frozen brief.
- **web-design-guidelines** — loaded fully; the latest upstream checklist was fetched on 2026-09-13 and used to review visible labels, action specificity, focus direction, semantic state cues, image sizing direction, heading hierarchy, and reduced-motion expectations.
- **image-to-code** — loaded fully and used for image-first generation, standalone per-screen references, original-resolution analysis, consistent extraction of typography/spacing/component logic, and the anti-nested-box and anti-template critique gates. Its implementation phase was intentionally not used because application implementation is forbidden.
- **imagegen** — loaded fully as the raster-production workflow. The built-in generator produced the concepts; only accepted outputs were copied into the workspace and normalized to the required 1440 × 960 size.

## What was preserved from Direction D

- Familiar primary navigation and customer vocabulary
- Task-first search with pickup area, pickup date, return date, and one clear action
- Marketplace-style Find a Car trip strip, categories, 3-column grid, prominent rates, supported vehicle facts, branch, and one action per car
- Quiet `Matches your trip` language only in an explicitly evaluated trip context
- Separate rental-journey and task-level progress systems
- The exact Requirements task sequence: Before you start, Upload documents, Review, Send for verification
- Valid Government ID and Driver's License requirements with visible file rules
- Requirements verification before payment
- Clear current, complete, and locked states using text and iconography rather than color alone
- First-time-renter clarity and implementation-feasible desktop patterns

## What was borrowed from Direction A

- A more confident editorial opening
- Photography as a defining product material rather than a decorative banner
- Antipolo road, terrain, and local-place character
- Stronger image-to-content proportions
- More sophisticated negative space and asymmetric composition
- A restrained serif/sans relationship for brand and high-level emphasis
- A warmer, more tactile neutral surface system

Direction E does not restore Direction A's more interpretive browsing rows or allow editorial styling to obscure the approved marketplace and guided-task patterns.

## Premium visual principles

1. Spend visual boldness on local automotive photography and composition, not on control decoration.
2. Keep controls familiar; make them premium through proportion, type, spacing, and material restraint.
3. Use one strong Briah primary and one small energetic accent; do not spread brand color across every boundary.
4. Prefer open alignment, dividers, and background shifts to repeated outlined cards.
5. Keep the vehicle and the next action visually primary on task screens.
6. Use the local line illustration only as a secondary place marker, never as filler.
7. Preserve semantic clarity: active, complete, locked, warning, and error states always include words or icons.

## Color system

| Role | Token | Use |
|---|---|---|
| Brand primary | Briah Evergreen `#123F3A` | Primary actions, active structure, meaningful emphasis |
| Main text | Road Ink `#182321` | Headings, body, meaningful icons |
| Brand accent | Calamansi `#E77A3D` | Fine active underline, short rules, local illustration detail |
| Background | Rice Paper `#F6F3EC` | Page field and photographic blend |
| Surface | White `#FFFFFF` | Inputs and clean content surfaces |
| Divider | Stone `#D8D5CC` | Low-emphasis separators |
| Success | `#267A55` | Complete/verified with icon and words |
| Warning | `#A45B13` | Attention required |
| Error | `#B43B3B` | Errors/destructive actions; separate from CTA |
| Info | `#2E647B` | Supporting information only |

Evergreen replaces Direction D's broad blue coverage. Calamansi is intentionally a line-level accent, not a button gradient or status color. The implementation must validate all text/background pairs to WCAG AA; the visual concepts specify the intended hierarchy rather than substituting for measured code-level contrast tests.

## Typography system

- **Instrument Sans** is the primary modern humanist sans for navigation, task copy, filters, controls, vehicle facts, prices, progress, and summaries.
- **Newsreader** appears only in the Briah wordmark, the Home headline, and a restrained page-heading moment. It supplies human travel/editorial character without taking over operational content.
- Home headline: approximately 72–80 px at 1440 px, 2–3 lines, compact measure.
- Task page title: approximately 44–52 px with nearby sans context.
- Section heading: approximately 28–34 px.
- Body/control text: approximately 16–20 px with comfortable line height.
- Labels and metadata remain sentence case and no smaller than the hierarchy can reliably support in implementation.

## Home review

Home makes the strongest first impression of the three concepts. The road-window composition combines the interface with a believable Antipolo driving scene instead of placing a generic banner behind a search widget. The search rail crosses the visual seam between copy and photography, making the rental action part of the composition and keeping all required fields immediately visible.

The headline is specific to local driving rather than generic software value language. The photo uses an attainable MPV and daylight road texture, while the brief rental explanation stays concise and below the main action. Brand identity comes from evergreen typography, the fine Calamansi line, local subject matter, and the Antipolo illustration—not from excessive color or ornamental effects.

**Gate result:** premium, usable, local, memorable, and not reasonably mistaken for SaaS, banking, HR, insurance, or an ecommerce template.

## Find a Car review

Find a Car retains Direction D's familiar marketplace scan order while removing much of its visual weight. The trip strip uses dividers instead of a large blue outline. Categories read as one coherent control row; inactive options remain open and the active category uses a quiet tinted state. Each vehicle module leads with a larger consistent photograph, then model, rate, supported quick facts, branch, and one action.

The rate/model pairing is more distinctive, yet comparison remains fast. The match state is a small check and phrase aligned away from the primary identity. The repeated vehicle modules use white surface contrast and subtle separation rather than heavy card borders or ecommerce badges. Consistent Antipolo photography creates a credible local fleet rather than a mixed stock-photo gallery.

**Gate result:** marketplace familiarity is preserved; premium character increases without reducing scan speed.

## Requirements review

Requirements keeps the canonical structure legible while reducing software-form enclosure. The overall rental journey is a single open progress line. The 4-step task progress is visually separate and labels all stages. `Upload documents` is clearly current; completed and locked states include icons and words.

The two upload rows use borders only for the functional file target and use horizontal rhythm for grouping. Rules remain persistently visible. The explanation panel states review-before-payment in plain language, and `Review documents` is the sole dominant action. The booking summary uses one warm plane with vehicle, dates, branch, and reference rather than a stack of nested cards.

**Gate result:** calm, high-trust, familiar onboarding with clearer hierarchy and less form-template chrome than Direction D.

## Generic-template risk review

| Risk | Result |
|---|---|
| Too much blue | Pass — blue is no longer the brand field; info blue is reserved semantically |
| Gradient buttons | Pass — primary actions are solid evergreen |
| Repetitive outlines | Pass — dividers, open alignment, and surface shifts carry most structure |
| Too many cards | Pass — only vehicle modules, functional upload targets, and one summary plane are grouped |
| Generic software typography | Pass — humanist sans plus restrained editorial serif creates a specific rental/travel voice |
| Generic travel-site hero | Pass — asymmetric road-window framing and bridging search rail are specific and task-led |
| Ecommerce-template marketplace | Pass — no ratings, favorites, discounts, urgency, crossed-out prices, or badge clutter |
| Luxury cliché | Pass — no black/gold, glass, hyper-luxury vehicle, or dramatic concept-ad grading |
| Banking/HR/insurance/SaaS ambiguity | Pass — local vehicle imagery, trip fields, rental language, vehicle facts, and booking lifecycle make the domain unmistakable |

## Comparison with Direction D

| Criterion | Direction D | Direction E | Result |
|---|---|---|---|
| Premium feel | Functional and credible, but uniform blue controls and outlines read as product-template chrome | Photography, proportion, surface restraint, and type create material confidence | Direction E stronger |
| Usability | Strong, familiar, immediately understandable | Preserves the same interaction hierarchy and dominant actions | Equivalent; Direction E does not trade clarity for style |
| Brand distinctiveness | Road-and-sun mark and Antipolo imagery help, but blue-heavy execution remains generic | Evergreen/Calamansi system, road-window composition, and local illustration form a coherent Briah world | Direction E stronger |
| Marketplace familiarity | Strong 3-column grid, categories, facts, and actions | Same model with quieter category/card chrome and stronger photo/rate hierarchy | Direction E stronger |
| Guided-task clarity | Explicit and complete, but nested blue-outlined panels feel software-like | Same stages and rules with open progress, functional grouping, and one summary plane | Direction E stronger |
| Implementation feasibility | Low-to-moderate complexity | Moderate complexity; grid, controls, progress, and summary remain conventional, while photography and responsive art direction require disciplined assets | Direction D slightly simpler; Direction E remains feasible |

Direction E is the stronger customer-facing visual system. It retains Direction D's interaction advantage while closing the premium, photographic, and brand-distinctiveness gap identified by the Lead.

## Recommendation

**DIRECTION E APPROVED WITH MINOR REFINEMENTS**

The three concepts are strong enough to replace Direction D as the customer visual direction for the reviewed screens. Before expansion, minor refinement should validate the final owned Briah logo/wordmark, production vehicle photography availability and licensing, exact font licensing/loading, measured contrast in implementation, long model/branch text, real file-control states, and responsive recomposition at 375/768/1024 px. These are controlled production refinements, not reasons to reopen the customer journey or Direction E's visual premise.
