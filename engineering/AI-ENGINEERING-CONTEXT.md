# car-rental-fleet-management-system — AI Engineering Context

**Status:** Active Engineering Rules  
**Purpose:** Permanent implementation rules for AI-assisted development of the Briah's Car Rental and Fleet Management System.

This document defines the recurring engineering rules that apply to every vertical slice. Individual `VERTICAL-SLICE-XXX.md` files define only the capability-specific implementation contract.

---

## 1. Development Workflow

Development follows a controlled hybrid workflow:

1. ChatGPT defines and reviews the next vertical slice.
2. The approved slice is saved under `engineering/sprints/`.
3. Codex implements only that approved slice.
4. Codex validates the implementation and pushes it to GitHub.
5. ChatGPT reviews the resulting GitHub commit against the approved slice and project context.
6. If defects are found, Codex receives a narrow correction prompt.
7. ChatGPT re-reviews the correction.
8. The slice is marked complete only after review approval.
9. A new Codex session should normally be used for the next vertical slice.

Do not automatically continue into the next slice.

---

## 2. Authority Order

When determining intended system behavior, use this authority order:

1. defended manuscript scope and objectives;
2. current `codex-context/` Development Baseline;
3. approved current vertical-slice contract;
4. established implementation from completed slices;
5. existing prototype/mock behavior.

The existing frontend is important evidence of defended presentation and workflow intent, but mock behavior is not automatically business truth.

If these sources materially conflict and the current slice does not resolve the conflict, stop and report the issue.

Do not silently choose or invent a new rule.

---

## 3. Open Decisions and Client Clarifications

Anything explicitly identified as unresolved in:

`codex-context/10-open-decisions.md`

must remain unresolved unless the current approved slice explicitly freezes that decision or explicitly authorizes a safe provisional implementation.

Client-specific operational details requiring direct confirmation from Briah's are tracked in:

`codex-context/14-client-clarification-register.md`

When a client-specific detail is missing:

- do not silently present an assumption as client-confirmed truth;
- if a safe, conservative, configurable/isolated provisional behavior is explicitly authorized by the current slice, development may continue;
- record or preserve the applicable `CQ-###` clarification;
- if the uncertainty affects security, authorization, irreversible architecture, or a core state machine and no safe provisional design exists, treat it as blocking.

Do not infer missing business rules from:

- mock data;
- UI labels;
- placeholder status values;
- localStorage structures;
- sample calculations;
- previous prototype behavior.

---

## 4. Existing Frontend

The existing frontend represents substantial defended work.

Prefer building underneath and integrating with it rather than rewriting it.

Preserve where practical:

- visual identity;
- layouts;
- routes;
- existing role-facing screens;
- established interaction patterns.

A backend slice is not permission to redesign unrelated UI.

UI changes are allowed when necessary to connect the approved capability correctly.

---

## 5. Vertical-Slice Scope

Implement only the currently approved:

`engineering/sprints/VERTICAL-SLICE-XXX.md`

Do not:

- implement future slices;
- perform unrelated refactors;
- redesign unrelated features;
- create speculative infrastructure;
- broaden permissions for convenience;
- solve unresolved requirements unless explicitly authorized.

If a small supporting change is technically required, keep it minimal and explain it in the final implementation report.

---

## 6. Repository Inspection

Do not perform a broad repository audit for every slice.

Read:

- this file;
- the current vertical-slice contract;
- only the `codex-context` files explicitly named by that slice;
- only repository areas relevant to implementing that capability.

Inspect additional files only when a concrete dependency or blocker requires them.

Do not reread previous vertical-slice documents unless the current slice explicitly requires them or a concrete implementation issue makes them necessary.

The existing code is the implementation record of completed slices.

---

## 7. Canonical Backend

Supabase/PostgreSQL is the canonical persistence platform for backend records established by approved slices.

Prototype sources such as static arrays, localStorage, mock TypeScript objects, and hard-coded demo records must not become canonical simply because they existed before backend implementation.

Replace mock persistence incrementally as each approved slice establishes canonical backend behavior.

Do not prematurely migrate unrelated mock features.

---

## 8. Database Migrations

Database schema changes must be version-controlled.

Once a migration has been applied to the shared development Supabase project, treat it as migration history.

Do not rewrite applied migrations.

Use new additive migrations for subsequent schema changes.

Prefer explicit constraints, foreign keys, appropriate nullability, database-controlled defaults, and reversible/additive evolution where practical.

Do not encode unresolved business rules into schema constraints unless the current slice explicitly freezes the rule.

Provider-backed validation may create disposable data, but cleanup must happen inside validation tooling/session cleanup or explicit development cleanup commands. Never commit provider/test-fixture cleanup as a production Supabase migration. Production migrations must represent durable schema, constraints, functions, policies, grants, or intentional production data transformations.

---

## 9. Authentication and Roles

Supabase Auth is the canonical authentication provider.

Canonical application roles are exactly:

- `Owner/Admin`
- `Operations Staff`
- `Customer/Renter`

Do not introduce alternative persisted role names.

`auth.users.id` is the canonical authenticated identity.

Application authorization must resolve trusted application role/state from canonical server/database data.

Never authorize privileged behavior solely from localStorage, client state, client-readable cookies, raw signup metadata, request-supplied role values, hidden UI controls, or route names.

Public self-registration creates `Customer/Renter` only.

Internal roles must not be publicly self-assignable.

---

## 10. Authorization

Authorization for protected data and mutations must occur at a trusted server boundary.

UI hiding and route presentation are supplementary controls, not authorization.

Use least privilege.

Do not broaden Operations Staff permissions beyond the frozen role specification.

Where exact Staff behavior remains unresolved, preserve the restriction rather than guessing.

RLS is defense in depth and must not be weakened merely to simplify frontend integration.

---

## 11. Credentials and Secrets

Never commit, print, or expose database passwords, service-role keys, access tokens, refresh tokens, SMTP credentials, API secrets, `.env` contents, or private customer documents.

The Supabase service-role credential must remain server-only.

Browser-reachable modules must never import or expose privileged server credentials.

---

## 12. Server Trust Boundary

Security-sensitive operations must execute through trusted server-side code.

Validate authenticated identity, role, account state where applicable, request input, and ownership/authorization as required by the slice.

Do not trust client-supplied identifiers or state when the server can derive them from the authenticated principal.

---

## 13. Canonical IDs

Once a record is persisted, use its canonical database identifier.

Do not create a separate client-generated identifier and treat it as canonical unless the approved data model explicitly requires one.

After creation, frontend state should use the persisted record returned by the backend.

Avoid UI/database identity divergence.

---

## 14. Error Handling

Do not silently swallow persistence, authorization, or provider failures when they affect user-visible state.

A failed mutation must not leave the UI presenting an unpersisted successful state.

Use controlled user-facing errors.

Do not expose raw SQL, stack traces, database internals, provider secrets, or sensitive authorization details.

---

## 15. Mock Operational Data

Some operational prototype data will remain until its dedicated slice is implemented.

Keep such behavior isolated.

Do not represent mock-derived operational information as canonical backend truth.

Do not infer final lifecycle semantics from prototype values.

---

## 16. External Services

External APIs and services must follow the provider/fallback strategy frozen in `codex-context`.

Do not add providers merely because they are technically convenient.

If a provider is unavailable during development, use only an approved fallback/manual/unavailable behavior.

Never silently fabricate external data.

---

## 17. Testing

Each slice should add targeted tests appropriate to the capability.

Prefer focused tests over broad unrelated test expansion.

Where applicable, validate authorization boundaries, input validation, persistence behavior, ownership isolation, error handling, and critical deterministic business rules.

Existing tests from completed slices must continue passing.

---

## 18. Provider Validation

When a slice depends on the linked development Supabase project or another external provider, perform provider-backed validation where the configured environment permits it.

Report each relevant validation as `PASS`, `FAIL`, or `BLOCKED`.

Never fabricate provider validation.

Temporary test data should be clearly non-production and cleaned up through validation tooling/session cleanup or explicit development cleanup commands.

---

## 19. Development/Test Data

Development seed or test records must be distinguishable from verified operational client data.

Do not commit sensitive personal information.

Do not silently represent prototype/sample records as real historical business data.

---

## 20. Generated and Framework Files

Respect the repository's framework conventions.

Generated files such as TanStack route trees may change when required by normal framework tooling.

Do not manually restructure generated artifacts unnecessarily.

Avoid framework rewrites unless explicitly approved.

---

## 21. Validation Before Completion

Run the validation appropriate to the current slice.

Typically this includes relevant equivalents of targeted tests, existing regression tests, lint, TypeScript validation where configured, production build, and migration/provider checks where applicable.

Report actual results only.

A pre-existing unrelated warning may be reported without expanding scope unless it blocks the approved slice.

---

## 22. Git and Review Evidence

GitHub is the primary implementation review artifact.

After completing a slice:

1. commit the implementation;
2. push it to the current development branch;
3. report the commit SHA;
4. provide only a concise implementation/validation summary.

Do not create large review archives unless explicitly requested.

ChatGPT will inspect the actual GitHub commit independently.

---

## 23. Codex Session Discipline

Use a fresh Codex session for each new vertical slice whenever practical.

Within one slice, the same session may be reused for narrow corrections after ChatGPT review.

Once a slice is approved, end/archive that Codex session and begin the next slice in a fresh session.

---

## 24. Token and Context Discipline

Minimize unnecessary context consumption.

Do not repeatedly reread the entire repository or all `codex-context` files, reproduce large source files in reports, generate broad architecture summaries after implementation, explain unrelated code, or plan future slices.

The current slice should contain enough explicit direction to implement the capability.

If additional context is genuinely necessary, inspect only the specific source required.

---

## 25. Completion Report

After implementation, return only what the current Codex prompt requests.

Unless otherwise specified, keep the report to:

1. commit SHA;
2. concise changed-file summary;
3. capability implemented;
4. validation results;
5. provider-backed validation where applicable;
6. blockers/deviations.

Do not generate a long engineering review.

---

## 26. Stop Rule

After completing the approved vertical slice:

**STOP.**

Do not begin another slice, implement adjacent features, clean unrelated technical debt, revise the manuscript, or modify `codex-context` unless explicitly authorized.

Wait for ChatGPT review and the next approved contract.
