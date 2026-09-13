# Direction D Review

## Skills loaded

- **frontend-design** — loaded fully and used as the primary art-direction authority. It established a subject-specific palette, all-sans task hierarchy, image role, spacing logic, plain-language copy, and anti-template rules before generation.
- **ui-ux-pro-max** — loaded fully and used for design-system structure, density, 375/1440 responsive recomposition, visible labels, 44–48 px controls, non-color state meaning, multi-step progress, error recovery direction, and accessible form structure. The generated glassmorphism/SaaS recommendation was explicitly rejected as incompatible with the frozen Direction D brief.
- **web-design-guidelines** — loaded fully, with the current upstream checklist fetched on 2026-09-13, and used to review labelled controls, semantic action intent, visible focus, image sizing, responsive overflow, form errors, stateful URL direction, and reduced motion.
- **image-to-code** — loaded fully and used for eight standalone image-first references, fresh mobile compositions, original-resolution inspection, anti-nested-box critique, and regeneration of unclear or inconsistent concepts. Its implementation phase was intentionally not used because this session forbids application implementation.
- **imagegen** — loaded fully as the required raster-production workflow. The built-in generator created the source images; only accepted outputs were copied into the workspace and resampled to the named viewport widths.

## Design-system searches performed

The local `ui-ux-pro-max` search tool was used without `--persist`.

1. `"car rental marketplace service app friendly modern" --design-system --variance 5 --motion 3 --density 7 -p "Briah's Car Rental"`
2. `"ecommerce product grid vehicles" --domain ux -n 6`
3. `"booking flow guided steps" --domain ux -n 6`
4. `"identity document upload flow" --domain ux -n 6`
5. `"stepper progress task flow" --domain ux -n 6`
6. `"mobile filtering product grid" --domain ux -n 6`
7. `"accessible forms error recovery" --domain ux -n 6`
8. `"responsive marketplace grid" --domain ux -n 6`
9. Retry: `"product cards scanability" --domain ux -n 6`
10. Retry: `"multi step progress" --domain ux -n 6`
11. Retry: `"file upload error" --domain ux -n 6`

The primary query returned useful typography, contrast, focus, breakpoint, and restrained-motion guidance, but its Glassmorphism style and generic blue/orange SaaS palette were rejected. Searches 2–4 returned no direct matches. Their required single retries are recorded above; the product-card retry also returned no match, so marketplace card decisions come from the frozen brief and the skills' general scanability/accessibility rules rather than a claimed database result. The progress, mobile, error-recovery, responsive, and upload-error searches returned applicable guidance.

## Interaction references used

OOPA informed the interaction pattern for short, explicit task steps, one task per step, visible progress, predictable back navigation, a review step before final submission, and clear post-submit expectations. Direction D does not copy OOPA branding, colors, wording, KYC logic, document rules, or business behavior.

Doon informed the interaction pattern for image-first vehicle browsing, category-led filtering, prominent daily prices, quick vehicle specifications, grid scanability, and one obvious per-vehicle action. Direction D does not copy Doon branding, colors, exact layout, marketplace/host mechanics, ratings, favorites, promotions, urgency, stock messages, discounts, or ecommerce gimmicks.

The result borrows familiarity, not identity or domain logic.

## Visual direction

Direction D uses a light, practical service-product surface with Harbor Navy structure, Bay Blue actions, Leaf Green supporting status, and a small Sunlit Gold brand detail. A Plus Jakarta Sans-like type hierarchy keeps task text immediately readable. The exploratory road-and-sun `B` mark, attainable local vehicle photography, and Antipolo context make the system specific to Briah without repeating Direction A's editorial road/odometer treatment.

Cards are reserved for browse results or meaningful grouped state; open spacing and dividers carry most form and lifecycle hierarchy. Corners are moderate, shadows minimal, icons consistent, and pricing uses strong tabular-style figures. The one memorable brand move is the road-and-sun mark paired with bright local vehicle photography; the rest remains quiet and practical.

## Home review

Home puts pickup area, pickup date, return date, and Search cars immediately after a concise heading. The image supports the task instead of preceding it. The three-step rental explanation is short enough for a new renter and explicitly says that payment details come after Briah verifies requirements.

Desktop uses a horizontal trip strip and a single broad automotive image. Mobile stacks the same inputs, preserves visible labels and large targets, removes photo-overlay wording, and keeps the verification-before-payment statement in the flow. The page feels actionable rather than editorial or campaign-led.

## Find a Car review

Find a Car is the clearest departure from Direction A. A 3-column desktop grid lets a renter compare image, model, daily rate, seats, transmission, fuel, branch, and action in a familiar reading order. Cards remain light and the interface avoids ratings, favorites, crossed-out prices, discounts, urgency, and unsupported stock claims.

`Matches your trip` appears only because the concept explicitly states that trip criteria were checked. The label does not claim a persisted availability state. Mobile replaces the multi-field strip with an Antipolo/date summary and Edit search action, exposes a labelled car-type control and Filters button, and uses one column for readable comparison.

## Requirements review

Requirements correctly maps the frozen workflow to four task stages: Before you start, Upload documents, Review, and Send for verification. A separate renter-details or KYC stage was not invented. The opening screen names exactly the Valid Government ID and Driver's License, explains why they are required, lists JPEG/PNG/PDF and the 10 MB limit, sets replacement expectations, and states that Payment comes only after verification.

The overall rental journey and task wizard use different labels and structures. Desktop can expose all labels; mobile uses `Requirements · 2 of 6` for the journey and `Step 1 of 4` for the current task. The first mobile draft was rejected for nested enclosure; the accepted version uses dividers and open spacing.

## My Booking review

My Booking makes the waiting state unmistakable. `No action needed` and `We're reviewing your requirements` appear before the lifecycle or trip details. `Briah is working on this` says who owns the current work. The copy explains that the renter will either continue to Payment after verification or be asked to replace a flagged document.

Payment is shown as locked with the prerequisite in words. No timing promise, automatic verification, assignment claim, or completion state is invented. The first desktop draft was rejected because its navigation drifted outside the frozen customer IA; the accepted version is consistent with the other screens.

## Responsive review

- **Home:** desktop uses a single-row search strip; mobile uses three stacked labelled inputs and a full-width action.
- **Find a Car:** desktop uses a 3-column grid and full category row; mobile uses trip summary/edit, labelled filtering, and a 1-column list.
- **Requirements:** desktop shows complete journey and wizard labels with a booking summary; mobile removes the secondary panel, shortens both progress systems, and uses open vertical flow.
- **My Booking:** desktop exposes all six lifecycle labels and two lower columns; mobile leads with the waiting message, summarizes previous/current/next stages, and moves trip details below the next-step explanation.

All mobile artifacts are 375 × 810, use readable body scale and large controls, and avoid page-level horizontal overflow. No mobile design uses a sticky action that could cover focused content.

## Accessibility review

- Harbor Navy on Sampaguita White is approximately `11.93:1`, white on Bay Blue approximately `6.02:1`, and Leaf Green on white approximately `4.97:1`.
- Controls are drawn at roughly 44 px minimum on desktop and 48 px on touch layouts.
- Important controls use visible labels; Menu is labelled rather than icon-only.
- Information, current, complete, and locked states pair color with icons and words.
- Requirements inputs retain visible labels and persistent helper text direction; file errors must be inline, announced, and include a retry/replacement path in implementation.
- The focused Start uploading action demonstrates a visible high-contrast focus outline. Implementation must use `:focus-visible` and ensure sticky UI cannot obscure focus.
- Mobile layouts do not rely on hover or horizontal gesture-only behavior.
- Raster concepts establish direction only. Semantic HTML, alt text, explicit image dimensions, autocomplete, input modes, keyboard order, linked error summaries, `aria-live`, URL-backed filters/expanded state, reduced motion, and loading/empty/error behavior remain implementation acceptance work.

## Familiarity / first-time renter review

Direction D answers the renter's questions in order:

1. **What am I doing now?** Search, compare, submit the two requirements, or wait for review.
2. **What do I do next?** Each screen has one dominant action or explicitly says no action is needed.
3. **Why?** Requirements copy explains identity/driver verification and locked Payment explains its prerequisite.
4. **What happens after this?** Home previews the journey, Requirements explains review outcomes, and My Booking names the next two possible paths.
5. **Who is responsible now?** `Briah is working on this` separates a waiting state from an action-required state.

The concepts feel familiar through ordinary search fields, product cards, labelled filters, progress bars, review-before-send behavior, and a consumer lifecycle view. The road-and-sun mark, consistent Bay Blue treatment, Antipolo setting, and Briah-specific task language prevent the result from reading as a copy of another marketplace.

## Self-critique gate

| Gate | Home | Find a Car | Requirements | My Booking |
|---|---|---|---|---|
| Immediately usable | Pass — search leads | Pass — comparison leads | Pass — preparation and next action lead | Pass — waiting state leads |
| First-time next step clear | Pass | Pass | Pass | Pass |
| Familiar without looking copied | Pass | Pass | Pass | Pass |
| Marketplace scanability | Not applicable | Pass — image, rate, specs, action | Not applicable | Not applicable |
| Guided without overwhelm | Pass — three-step preview | Not applicable | Pass after mobile regeneration | Pass |
| Action required vs waiting | Pass | Pass | Pass — action is explicit | Pass — no action needed is explicit |
| Philippine rental-product credibility | Pass | Pass | Pass | Pass |
| Avoids ERP/SaaS styling | Pass | Pass | Pass after mobile regeneration | Pass |
| Avoids editorial over-design | Pass — task precedes image | Pass | Pass | Pass |
| Cross-screen consistency | Pass | Pass | Pass | Pass after desktop regeneration |
| Distinct Briah identity | Pass | Pass | Pass | Pass |

## Comparison with Direction A

| Criterion | Direction A | Direction D |
|---|---|---|
| Usability | Clear but more interpretive; open editorial rows require more reading | Stronger; familiar controls, cards, and status patterns reduce learning cost |
| Immediacy | Photography and editorial hierarchy create atmosphere before some tasks | Stronger; trip search and current action/waiting state lead immediately |
| Visual appeal | Stronger editorial distinctiveness and premium art direction | Clean, bright, friendly, and credible, but intentionally less dramatic |
| Marketplace familiarity | Intentionally avoids product-tile browsing | Stronger; image-first grid, prominent rates, quick specs, and labelled filtering |
| Guided-task clarity | Journey metaphor is elegant but can carry more interpretation | Stronger; explicit task count, current step, next step, review, and submit language |
| Scalability | Proven to extend into Admin through a denser interpretation | Strong customer foundation; familiar components should scale broadly, while Admin still needs a later authorized exploration |
| Implementation complexity | Higher due to editorial layouts, asymmetric rhythm, and context-specific road metaphors | Lower to moderate; conventional responsive grids, forms, summaries, and progress primitives are easier to implement consistently |

Direction A remains more visually distinctive and editorially polished. Direction D is materially better for the Lead's current customer-product goal: first-use comprehension, immediate task entry, marketplace scanning, and guided completion. Its main risk is becoming generic if implementation drops the Briah wordmark, local photography, plain-language sequencing, or disciplined color hierarchy.

## Final recommendation

**DIRECTION D APPROVED WITH MINOR REFINEMENTS**

Direction D should replace Direction A as the customer-facing presentation direction. Minor implementation-stage refinements should validate real logo ownership/brand use, real vehicle image availability, content expansion at 375 px, long branch/model names, the mobile filter sheet, focus/error behavior, and canonical data binding. No application implementation is authorized by this review.
