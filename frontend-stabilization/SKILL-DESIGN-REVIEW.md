# Skill Design Review

## Skills loaded

| Name | Exact local path | Source / repository | Full instructions read | External-action instruction |
|---|---|---|---|---|
| frontend-design | `/Users/aldrich/.codex/skills/frontend-design/SKILL.md` | [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Confirmed. | No script, shell command, download, or remote action requested. |
| web-design-guidelines | `/Users/aldrich/.codex/skills/web-design-guidelines/SKILL.md` | [vercel-labs/agent-skills — web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Confirmed. The required fresh rules were also fetched from its declared [command source](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). | Requires a fresh remote guideline fetch before a review. Completed read-only; no repository files were changed by it. |
| ui-ux-pro-max | `/Users/aldrich/.codex/skills/ui-ux-pro-max/SKILL.md` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Confirmed, including `references/quick-reference.md` and the native-only `references/pro-rules.md` scope notice. | Offers a local Python search and optional persistence. The script was inspected before use. Only read-only local searches ran, without `--persist`, remote fetching, installers, credentials, environment inspection, or project writes. |

## Relevant guidance extracted

- **A — Skill-guideline improvement:** Make the rental journey distinctive to its subject: use a calm, road-sign-legible visual grammar and an ordered lifecycle rail, rather than generic dark/glass dashboards, KPI-card grids, gradients, decorative motion, or all-caps template labels. Use plain, active, consistent customer vocabulary.
- **A — Skill-guideline improvement:** Give each state one primary action or an explicit `No action needed` message; status color/badges support but cannot replace the explanation. Make errors, empty states, loading, and success moments give a concrete next step.
- **A — Skill-guideline improvement:** Use semantic controls, visible focus, logical keyboard order, labels and autocomplete, inline field errors plus a focusable error summary, live status announcements, adequate contrast/targets, reduced motion, and no hover/gesture-only critical interaction.
- **A — Skill-guideline improvement:** Use mobile-first layouts, adaptive navigation, readable type and measure, safe fixed-action insets, and a deliberate mobile table strategy. Preserve workflow context rather than shrinking desktop layouts.
- **A — Skill-guideline improvement:** Keep charts/data accessible with legends, text summaries, keyboard/tap access to values, locale-aware formatting, and explicit loading/empty/error states. Use tabular numerals in operational comparisons.

## Blueprint strengths

- **C — Canonical workflow requirement:** The requirements-before-payment gate is explicit across principles, workflows, states, and acceptance criteria.
- **C — Canonical workflow requirement:** The customer Booking Detail is correctly positioned as a single lifecycle source of truth, replacing disconnected customer modules.
- **B — Repository/backend constraint:** The blueprint already protects RBAC, manual payment review, advisory decision support, and backend truth over visual convenience.
- **A — Skill-guideline improvement:** The existing commitments to one dominant action, progressive disclosure, plain language, and mobile-first comprehension give the rewrite a strong novice-oriented base.

## Blueprint weaknesses

| Classification | Observation and review outcome |
|---|---|
| E — Manuscript mismatch | The original lifecycle treated ready/preparation, settlement pending, and completed as customer states although no canonical persisted state supports them; return only supplies a rental end time. |
| F — Domain/client ambiguity | The manuscript stated a 50% down-payment minimum although `payments.required_amount` is nullable and repository logic does not populate it. |
| E — Manuscript mismatch | Admin IA retained Settings despite no backing contract and omitted the implemented Owner/Admin Audit Trail. |
| A — Skill-guideline improvement | Feedback, focus recovery, responsive table handling, data accessibility, and meaningful waiting-state language were too general to create a consistent implementation standard. |
| D — Implementation defect candidate | The proposed admin model did not explicitly prevent an Operations Staff view from rendering Owner/Admin actions that the server rejects. |
| B — Repository/backend constraint | The P0 defense criterion implied preparation/completion even though neither can be truthfully demonstrated as a canonical lifecycle outcome. |

## Required changes

- **E — Manuscript mismatch:** Freeze only the revised lifecycle semantics: preparation/ready is never persisted, returned is a derived rental-end milestone, and settlement/completion is unavailable until canonically supported.
- **F — Domain/client ambiguity:** Remove 50% amount copy and calculation from customer/payment requirements unless a canonical `required_amount` is available; obtain a Lead/client rule before introducing a final amount instruction.
- **E — Manuscript mismatch:** Keep Audit Trail in the Owner/Admin management IA. Do not retain a functioning-looking Settings destination without a server-backed contract.
- **A — Skill-guideline improvement:** Implement the added cross-screen accessibility, feedback, responsive, one-primary-action, and action-vs-waiting requirements as acceptance gates, not optional polish.
- **D — Implementation defect candidate:** Ensure role restrictions suppress unavailable lifecycle controls and provide an explanatory read-only state for Operations Staff.
- **B — Repository/backend constraint:** Limit the P0 demo to canonical/derived facts through returned rental; do not represent settlement/completion as implemented.

## Optional improvements

- **A — Skill-guideline improvement:** Add a visible, per-booking notification destination once detail routes exist; retain coarse links only as a migration fallback.
- **A — Skill-guideline improvement:** Prefer a customer-friendly progress rail with labels and explanations over a percentage indicator. Keep future milestones visible but locked with their prerequisite.
- **A — Skill-guideline improvement:** In the Admin dashboard, show a small linked attention queue above summaries and disclose a metric's time basis/unknown state.
- **A — Skill-guideline improvement:** Use a representative visual-concept review to validate the daylight operations direction before coding every route.

## Backend constraints affecting design

- **B — Repository/backend constraint:** Persisted booking states are only `Submitted`, `Confirmed`, `Rejected`, and `Cancelled`; no persisted ready, preparation, settlement, or completed booking state exists.
- **B — Repository/backend constraint:** Requirements must be `Verified` before payment submission; payment verification is manual.
- **B — Repository/backend constraint:** Public vehicle browse means active vehicles, not period-available/maintenance-ready vehicles. Only the Finder supplies canonical eligibility for its criteria.
- **B — Repository/backend constraint:** Sensitive review and lifecycle mutations are Owner/Admin-only. Operations Staff cannot inspect requirement documents, payments, assignment/confirmation, release/return, or relevant admin mutations.
- **B — Repository/backend constraint:** Assignment does not enforce maintenance readiness; presentation must not claim that it does.
- **B — Repository/backend constraint:** Reports are operational and decision support is advisory; neither supports invented revenue, transfer, live-GPS, or AI claims.

## Implementation defect candidates affecting design

- **D — Implementation defect candidate:** Operations Staff can currently see booking actions rejected by server authorization.
- **D — Implementation defect candidate:** Customer requirements are bound to the newest booking rather than a selected/deep-linked booking.
- **D — Implementation defect candidate:** Public browse marks active vehicles as available and falls back silently to mock fleet data after failure.
- **D — Implementation defect candidate:** Customer payment lacks explicit loading/error/empty states and can list bookings that cannot pay yet.
- **D — Implementation defect candidate:** Admin attention rows/counts are display-only; payment review auto-selects the first record with weak empty/error treatment.
- **D — Implementation defect candidate:** Contact reports a fabricated sent result; Customers, Admin Profile, and Settings present non-canonical/static or nonfunctional data/actions.

## Manuscript mismatches affecting design

- **E — Manuscript mismatch:** Original `03`, `05`, `06`, and `10` implied a ready/preparation, settlement, and completed customer journey unsupported by the contract. Revised documents now separate confirmed facts, derived return facts, and unavailable milestones.
- **E — Manuscript mismatch:** The original payment language could be read as requiring a 50% amount despite missing canonical data. Revised documents condition amount presentation on `required_amount`.
- **E — Manuscript mismatch:** The original Admin IA named Settings but omitted Audit Trail. Revised IA retains Audit Trail and explicitly excludes non-canonical Settings.

## Domain/client ambiguities affecting design

- **F — Domain/client ambiguity:** The authoritative down-payment amount/derivation is unresolved; legacy 50% language cannot be treated as canonical.
- **F — Domain/client ambiguity:** Security-deposit/refund, cancellation/refund, late-return fees, delivery fulfillment, inspection, and settlement rules lack complete canonical support.
- **G — Lead decision required:** Decide whether these policies require an approved backend/domain change, approved externally maintained copy, or deliberate omission from the stabilized flow.

## Lead decisions required

- **G — Lead decision required:** Resolve the payment amount rule and source before a customer-facing required-payment total can be displayed or enforced.
- **G — Lead decision required:** Decide the supported post-return customer promise: retain only `Returned`, or authorize canonical settlement/completion modelling in a separate protected-boundary change.
- **G — Lead decision required:** Decide whether the non-canonical Contact form is removed, replaced by an honest external contact path, or receives separately authorized delivery architecture.
- **G — Lead decision required:** Explicitly disposition static/non-canonical Customers, local Admin Profile, and Settings rather than migrating them as operational capabilities.
- **G — Lead decision required:** Confirm whether Operations Staff should receive an intentionally read-only booking detail (recommended, within existing RBAC) and whether read-only Decision Support should be exposed to that role; no new mutations are proposed.

## Traceability of blueprint changes

| Document changed | Previous concept | Revised concept | Reason | Source of reason |
|---|---|---|---|---|
| `01-DESIGN-PRINCIPLES.md` | General actionable-status/accessibility statements | Explicit action-vs-waiting, honest milestones, responsive workflow preservation, and accessible recovery principles | Removes ambiguity for novice states and cross-device implementation | combination |
| `03-LIFECYCLE-STATES.md` | Ready/preparation, settlement pending, and completed described as states | Preparation/ready is derived-only; returned is derived from `ended_at`; settlement/completed unavailable | No matching canonical lifecycle fields | repository evidence + canonical workflow |
| `04-INFORMATION-ARCHITECTURE.md` | Settings in management IA; Audit omitted; adaptive navigation unspecified | Audit Trail retained, non-canonical Settings excluded, responsive/deep-link navigation rules added | Preserve implemented capability; prevent fake management UI; improve discoverability | combination |
| `05-SCREEN-SPECIFICATIONS.md` | Browse availability claim, broad next-action rules, payment amount, dashboard/table detail under-specified | Finder-only eligibility wording; explicit action/wait panel; amount only when canonical; linked attention queue; role-safe detail; cross-screen feedback/data rules | Avoid false claims and convert Skill guidance into buildable requirements | combination |
| `06-WIREFLOWS.md` | Payment amount and preparation wording implied certainty | Canonical amount condition and confirmed/scheduled turnover wording; lifecycle truth test added | Maintain canonical sequence without invented state | repository evidence + canonical workflow |
| `09-DESIGN-SYSTEM.md` | General desired character and accessibility list | Product-specific daylight operations direction, typography/anti-patterns, breakpoint, safe-area, semantic interaction/motion rules | Avoid generic AI styling and establish measurable responsive/a11y guidance | combination |
| `10-ACCEPTANCE-CRITERIA.md` | Completion in P0 defense flow; broad mobile/keyboard checks | Truthful end point at return plus explicit responsive, focus, form, target-size, and state-feedback gates | Make quality and backend constraints testable | combination |

## Final freeze recommendation

NOT READY TO FREEZE

The documentation corrections are ready for Lead review, but the payment rule, post-return outcome, non-canonical surfaces, and Contact disposition require the listed Lead decisions before the frontend baseline can freeze.
