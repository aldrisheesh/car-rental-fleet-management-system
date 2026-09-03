# Contributor Workflow

## Responsibilities

### Lead Developer
- assigns/triages Issues;
- decides canonical behavior;
- approves domain/schema/manuscript-impacting changes;
- controls production deployment/configuration;
- reviews and merges PRs.

### Contributor
- performs assigned discovery;
- creates evidence-backed Finding Issues;
- works only on Lead-confirmed implementation Issues;
- uses ChatGPT for reasoning;
- uses Codex for repository/Git/implementation/verification;
- does not merge.

## Discovery workflow

```text
Assigned validation area
→ ChatGPT + relevant skills
→ browser discovery
→ evidence
→ GitHub Finding Issue
→ Lead triage
```

During discovery:
- no source modifications;
- no migrations;
- no commits;
- no deployment;
- no uncoordinated production mutations.

## Implementation workflow

After the Lead confirms and assigns an Issue:

```text
Assigned GitHub Issue
→ fresh ChatGPT session
→ bounded Codex prompt
→ Codex fetches origin/main
→ Codex creates short-lived branch
→ reproduce
→ implement
→ verify
→ self-review
→ commit
→ push contributor branch
→ open PR into main
→ Lead review
```

## Git is Codex-managed

Contributors should not manually improvise Git operations. Tell Codex the Issue number and let Codex:
- verify repository state;
- fetch current `origin/main`;
- create the branch from current `origin/main`;
- commit focused changes;
- rebase/sync when necessary;
- push only the contributor branch;
- open the PR.

If Codex is on `main`, it must create/switch to the assigned branch before modifying files.

## Branch convention

Prefer Issue-number branches:

- `fix/17-booking-submit`
- `ux/23-requirement-guidance`
- `sec/31-staff-authorization`
- `docs/44-manuscript-alignment`

Branches are short-lived and deleted after merge.

## Pull Requests

Every implementation PR:
- targets `main`;
- links the Issue using `Fixes #<number>` when appropriate;
- uses the repository PR template;
- contains fresh validation evidence;
- is never self-merged.

## Context authority

If a Task conflicts with:
- `CONTEXT.md`;
- `codex-context/`;
- canonical lifecycle rules;
- security/authorization boundaries;
- manuscript traceability;
- the Lead-approved Issue scope;

stop and escalate rather than guessing.

## Production safety

Contributors/Codex must not:
- deploy production;
- alter Cloudflare DNS;
- change Vercel production variables;
- rotate secrets;
- change Supabase Auth configuration;
- run production restore;
- perform unapproved production migrations;
- create uncontrolled production transactional data.

## Skills

Use only when relevant:

Planning/domain:
- `grill-with-docs`
- `grilling`
- `domain-modeling`
- `find-skills`

QA:
- `agent-browser`
- `webapp-testing`
- `web-design-guidelines`

Engineering:
- `diagnosing-bugs`
- `security-best-practices`
- `code-review`
- `verification-before-completion`
