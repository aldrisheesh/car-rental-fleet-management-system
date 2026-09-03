# Final System Validation & Stabilization

**Status:** Active after VS030  
**Feature development:** Frozen  
**Production:** https://briahscarrental.site  
**Integration branch:** `main`  
**Merge authority:** Lead Developer only

## Control model

GitHub is the canonical work-tracking and integration layer.

```text
Discovery
→ GitHub Finding Issue
→ Lead triage
→ Confirmed/assigned Issue
→ ChatGPT planning
→ Codex manages branch/Git/implementation
→ Pull Request
→ CI + Preview validation
→ Lead review
→ Lead merge
→ Issue closes
```

Contributors discover and execute. The Lead Developer assigns canonical behavior, priority, implementation authority, production authority, and merge approval.

## Severity

- **P0:** critical blocker
- **P1:** materially incorrect business/security/data behavior
- **P2:** UX/workflow/accessibility problem
- **P3:** visual/polish problem
- **P4:** documentation/manuscript mismatch

Contributor severity is a suggestion until Lead triage.

## Discovery vs implementation

A Finding is not permission to fix.

Round 1 is discovery-only. Contributors create structured GitHub Finding Issues. The Lead decides whether each Finding is expected behavior, duplicate, documentation-only, blocked by a domain/client decision, or confirmed implementation work.

## Production

Production is evidence, not a sandbox.

Read-only discovery may run in parallel. Stateful workflows that create or mutate canonical production data require Lead coordination.

## Git

Contributors should understand the branch → commit → PR model, but Codex should perform routine Git/GitHub operations for assigned implementation work.

No contributor or contributor Codex session may push to or merge `main`.
