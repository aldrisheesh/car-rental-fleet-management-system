# Contributing to Briah's Car Rental

The repository is in Final System Validation and Stabilization.

## Canonical workflow

GitHub Issues track Findings and confirmed work. Pull Requests integrate code.

A Finding is not permission to fix it. Wait for Lead triage and assignment.

## Git

Routine contributor Git/GitHub operations should be handled by Codex using the approved contributor prompt.

Conceptually:

```text
origin/main
→ short-lived Issue branch
→ focused commits
→ PR into main
→ Lead review/merge
```

Never push directly to `main`. Never merge your own PR.

## Scope

Do not:
- perform unrelated refactors;
- redefine canonical concepts;
- alter lifecycle/security semantics without approval;
- create migrations unless the Issue explicitly authorizes schema changes;
- modify manuscript unless assigned;
- deploy production;
- change production configuration/secrets/DNS.

## Verification

Every implementation PR requires fresh evidence, relevant tests, build validation, and browser/authorization verification when applicable.

## AI

ChatGPT helps reason about assignments and context. Codex handles repository inspection, Git, implementation, testing, commits, pushes, and PR preparation.

AI guidance never overrides canonical repository context or Lead authority.
