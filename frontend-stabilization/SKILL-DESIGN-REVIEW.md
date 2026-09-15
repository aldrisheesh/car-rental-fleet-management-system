# Skill Design Review

## Skills loaded

| Name | Exact local path | Source / repository | Full instructions read | External-action instruction |
|---|---|---|---|---|
| frontend-design | `/Users/aldrich/.codex/skills/frontend-design/SKILL.md` | [anthropics/skills — frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Confirmed. | No script, shell command, download, or remote action requested. |
| web-design-guidelines | `/Users/aldrich/.codex/skills/web-design-guidelines/SKILL.md` | [vercel-labs/agent-skills — web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Confirmed. The required fresh rules were also fetched from its declared command source. | Required a fresh read-only remote guideline fetch. |
| ui-ux-pro-max | `/Users/aldrich/.codex/skills/ui-ux-pro-max/SKILL.md` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Confirmed, including the referenced local guidance files. | Only read-only local guidance search was used; no persistence, installers, credentials, environment inspection, or project writes. |

## Relevant guidance extracted

- **A — Skill-guideline improvement:** Make the rental journey distinctive to its subject: use a calm, road-sign-legible visual grammar and an ordered lifecycle rail instead of generic dark/glass dashboards, decorative gradients, excessive KPI cards, or template-like all-caps labels.
- **A — Skill-guideline improvement:** Give each state one primary action or an explicit `No action needed` message. Status color/badges support but cannot replace explanation.
- **A — Skill-guideline improvement:** Use semantic controls, visible focus, logical keyboard order, labels/autocomplete, inline errors plus a focusable error summary, live status announcements, adequate contrast/targets, reduced motion, and no hover/gesture-only critical interaction.
- **A — Skill-guideline improvement:** Use mobile-first layouts, adaptive navigation, readable type/measure, safe fixed-action insets, and deliberate narrow-screen table strategies.
- **A — Skill-guideline improvement:** Keep charts/data accessible with legends, text summaries, keyboard/tap access to values, locale-aware formatting, and explicit loading/empty/error states.

## Blueprint strengths

- **C — Canonical workflow requirement:** Requirements-before-payment is explicit across principles, workflows, states, and acceptance criteria.
- **C — Canonical workflow requirement:** Customer Booking Detail is positioned as the single lifecycle source of truth rather than forcing customers across disconnected modules.
- **B — Repository/backend constraint:** The blueprint protects RBAC, manual payment review, advisory decision support, and backend truth over visual convenience.
- **A — Skill-guideline improvement:** One dominant action, progressive disclosure, plain language, and mobile-first comprehension provide a strong novice-oriented base.

## Blueprint weaknesses

| Classification | Observation and review outcome |
|---|---|
| E — Manuscript mismatch | Earlier lifecycle wording implied ready/preparation, settlement pending, and completed as customer states although no canonical persisted state supports them. |
| D — Implementation gap | The client-confirmed 50% minimum down-payment policy exists, but the backend does not reliably provide a canonical computed `required_amount` for every applicable booking. |
| E — Manuscript mismatch | Earlier Admin IA retained Settings despite no backing contract and omitted the implemented Owner/Admin Audit Trail. |
| A — Skill-guideline improvement | Feedback, focus recovery, responsive table handling, data accessibility, and waiting-state language were too general to create a consistent implementation standard. |
| D — Implementation defect candidate | Operations Staff can currently encounter Owner/Admin lifecycle controls that server authorization rejects. |
| B — Repository/backend constraint | The defense flow cannot truthfully claim persisted preparation/completion states that do not exist canonically. |

## Required changes

- **E — Manuscript mismatch:** Use the revised lifecycle semantics: preparation/ready is not persisted, returned is derived from rental end data, and settlement/completion is unavailable until canonically supported.
- **D — Implementation gap:** Preserve the client-confirmed 50% minimum policy, but display a peso amount only when a trustworthy canonical `required_amount` exists. Do not independently calculate a customer-facing amount from incomplete settlement semantics.
- **E — Manuscript mismatch:** Keep Audit Trail in Owner/Admin management IA. Remove functioning-looking Settings from the stabilized navigation until a server-backed contract exists.
- **A — Skill-guideline improvement:** Treat the added accessibility, feedback, responsive, one-primary-action, and action-vs-waiting requirements as acceptance gates rather than optional polish.
- **D — Implementation defect candidate:** Suppress unauthorized lifecycle controls and provide an explanatory read-only view for Operations Staff where visibility is legitimate but mutation authority is absent.
- **B — Repository/backend constraint:** Limit the customer lifecycle to truthful canonical/derived facts through Returned; do not represent settlement/completion as implemented.

## Optional improvements

- **A — Skill-guideline improvement:** Add a visible per-booking notification destination once booking detail routes exist; retain coarse links only as migration fallback.
- **A — Skill-guideline improvement:** Prefer a customer-friendly progress rail with labels/explanations over a percentage indicator.
- **A — Skill-guideline improvement:** In Admin Dashboard, show a small linked attention queue above summary metrics and disclose metric time basis/unknown state.
- **A — Skill-guideline improvement:** Use a representative visual-concept review to validate the daylight-operations direction before coding every route.

## Backend constraints affecting design

- **B — Repository/backend constraint:** Persisted booking states are limited and do not include ready, preparation, settlement, or completed booking states.
- **B — Repository/backend constraint:** Requirements must be verified before payment submission; payment verification remains manual.
- **B — Repository/backend constraint:** Public browse activity does not itself prove requested-period availability or maintenance readiness. Finder eligibility is the canonical source for the criteria it verifies.
- **B — Repository/backend constraint:** Sensitive review and lifecycle mutations are Owner/Admin-only. Operations Staff must not receive controls merely because an Admin screen has them.
- **B — Repository/backend constraint:** Assignment does not itself prove maintenance readiness; presentation must not claim otherwise.
- **B — Repository/backend constraint:** Reports are operational and decision support is advisory; neither supports invented revenue, transfer, live-GPS, or AI claims.

## Implementation defect candidates affecting design

- **D — Implementation defect candidate:** Operations Staff can currently see booking actions rejected by server authorization.
- **D — Implementation defect candidate:** Customer requirements are bound to the newest booking rather than a selected/deep-linked booking.
- **D — Implementation defect candidate:** Public browse can present active vehicles as available without canonical date/readiness checks and can fall back to mock fleet data after failure.
- **D — Implementation defect candidate:** Customer payment has weak loading/error/empty treatment and can expose bookings not yet eligible to pay.
- **D — Implementation defect candidate:** Admin attention rows/counts can be display-only; payment review auto-selection has weak empty/error handling.
- **D — Implementation defect candidate:** Contact can report fabricated sent success; Customers, Admin Profile, and Settings include non-canonical/static or nonfunctional data/actions.

## Manuscript mismatches affecting design

- **E — Manuscript mismatch:** Earlier lifecycle descriptions implied ready/preparation, settlement, and completed customer states unsupported by the current contract.
- **E — Manuscript mismatch:** Admin IA previously named Settings but omitted Audit Trail.
- **E — Manuscript mismatch:** Manuscript/business-process language may describe settlement-oriented outcomes that the stabilized frontend cannot claim as implemented without canonical state support.

## Domain/client ambiguities affecting design

- **F — Domain/client ambiguity:** Cancellation/refund exceptions, late-return fee boundaries, delivery fulfillment details, inspection completion, and final settlement semantics remain incomplete.
- The **50% minimum down-payment rule itself is not ambiguous**: it is client-confirmed. The unresolved issue is implementation of a trustworthy computed amount.

## Lead decisions resolved

The Lead reconciliation is recorded in `LEAD-RECONCILIATION.md`:

- preserve the client-confirmed 50% minimum policy but show a peso amount only when canonical;
- freeze the customer post-return experience at `Returned`;
- make Contact informational unless a verified delivery backend is separately authorized;
- remove Settings from stabilized navigation and retain Audit Trail;
- keep Customers/Profile canonical-data-only;
- render Operations Staff read-only where existing RBAC permits visibility but denies mutation;
- do not equate active inventory with requested-period availability.

## Traceability of blueprint changes

| Document changed | Previous concept | Revised concept | Reason | Source of reason |
|---|---|---|---|---|
| `01-DESIGN-PRINCIPLES.md` | General actionable-status/accessibility statements | Explicit action-vs-waiting, honest milestones, responsive workflow preservation, and accessible recovery principles | Removes ambiguity for novice states and cross-device implementation | combination |
| `03-LIFECYCLE-STATES.md` | Ready/preparation, settlement pending, and completed described as states | Preparation/ready is non-persisted; returned is derived; settlement/completed unavailable; 50% policy is stated without invented amount | Canonical/backend truth plus client-confirmed payment rule | combination |
| `04-INFORMATION-ARCHITECTURE.md` | Settings in management IA; Audit omitted; settlement/completion wording in customer hierarchy | Audit retained; Settings excluded; post-return hierarchy ends at return record; Contact and canonical-data-only boundaries added | Lead reconciliation + repository evidence | combination |
| `05-SCREEN-SPECIFICATIONS.md` | Broad payment wording, contact form possibility, Settings in secondary list | 50% policy without invented amount; informational Contact; Settings excluded; canonical-only customer/profile rule | Lead reconciliation + repository evidence | combination |
| `06-WIREFLOWS.md` | Payment/preparation wording implied certainty | Canonical amount condition and scheduled-turnover wording; lifecycle truth test added | Repository evidence + canonical workflow |
| `09-DESIGN-SYSTEM.md` | General desired character and accessibility list | Product-specific daylight-operations direction plus measurable responsive/a11y guidance | Skills + project philosophy |
| `10-ACCEPTANCE-CRITERIA.md` | Broad mobile/keyboard checks and unsupported completion implication | Truthful return endpoint plus explicit responsive/focus/form/state-feedback gates | Skills + backend constraints |

## Final freeze recommendation

READY TO FREEZE

The Skill review identified valid corrections, and the remaining Lead decisions have now been resolved in `LEAD-RECONCILIATION.md`. The frontend stabilization baseline is frozen for visual design and implementation under Issue #63, subject to protected backend/domain boundaries and normal Finding/triage rules for implementation defects.
