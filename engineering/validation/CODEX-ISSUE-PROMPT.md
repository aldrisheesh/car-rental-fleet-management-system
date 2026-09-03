# Codex Issue Implementation Prompt

Replace <ISSUE_NUMBER>.

CONTRIBUTOR MODE.

Implement GitHub Issue #<ISSUE_NUMBER> for Briah's Car Rental.

The Lead Developer is the integration authority.

Read the assigned contributor quality-lane instructions first.

Manage Git/GitHub:
1. inspect Issue;
2. inspect relevant canonical context;
3. verify repository state;
4. fetch latest origin/main;
5. create a fresh short-lived Issue-number branch FROM origin/main;
6. verify you are NOT on main before editing.

Never push to main.
Never merge a PR.
Never deploy production.
Never change production DNS/environment/secrets.
Never perform unrelated cleanup/refactoring.

Implement only the confirmed Issue. If root cause belongs to another quality lane, or an unapproved domain/schema/production decision is required, STOP and report the mismatch.

Before completion:
- reproduce;
- implement smallest correct fix;
- focused tests;
- focused lint where applicable;
- npm run build;
- browser retest if relevant;
- allowed/forbidden role checks if relevant;
- verification-before-completion;
- self-review;
- sync/rebase if main advanced;
- rerun affected validation.

Then commit, push only the contributor branch, create PR targeting main, include Fixes #<ISSUE_NUMBER> when appropriate, fill PR template, include evidence, and DO NOT merge.
