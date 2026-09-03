# Codex Issue Implementation Prompt

Replace `<ISSUE_NUMBER>` and use for a Lead-confirmed Issue.

```text
CONTRIBUTOR MODE.

Implement GitHub Issue #<ISSUE_NUMBER> for the Briah's Car Rental repository.

The Lead Developer is the integration authority.

GIT / GITHUB

Manage Git and GitHub for me.

Before modifying code:
1. inspect Issue #<ISSUE_NUMBER>;
2. inspect only relevant canonical repository context;
3. verify repository/working-tree state;
4. fetch latest origin/main;
5. create a fresh short-lived branch FROM current origin/main using an Issue-number name;
6. verify you are NOT on main before editing.

NEVER push to main.
NEVER merge a Pull Request.
NEVER deploy production.
NEVER change production DNS/environment/secrets.
NEVER perform unrelated cleanup/refactoring.

SCOPE

Implement ONLY the confirmed Issue.

If the Issue conflicts with CONTEXT.md, codex-context, canonical lifecycle/security rules, manuscript traceability, or requires an unapproved domain/schema decision:
STOP and report the conflict.

VERIFICATION

Before claiming completion:
1. reproduce the original issue;
2. implement the smallest correct fix;
3. run focused tests;
4. run focused lint where applicable;
5. run npm run build;
6. browser-retest if user-facing;
7. test allowed/forbidden roles when authorization is relevant;
8. use verification-before-completion;
9. self-review the diff;
10. sync/rebase against current origin/main if main advanced;
11. rerun affected validation after syncing.

PULL REQUEST

After validation:
1. commit focused changes;
2. push ONLY the contributor branch;
3. create a Pull Request targeting main;
4. include `Fixes #<ISSUE_NUMBER>` in the PR body when the Issue should close on merge;
5. fill the repository PR template;
6. include fresh evidence;
7. DO NOT merge;
8. return the PR URL and concise validation summary.

Never expose secrets or private customer document contents.
```
