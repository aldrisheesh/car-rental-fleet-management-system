# Frontend Phase 4 — acceptance and release check

Status: **Implementing — non-mutating checks verified locally; final rehearsal and release pending.**

Checked on 3 October 2026 on `main`, based on commit
`02705878169422ae1d7a01d937a9a9680c99bf95` plus uncommitted Phases 1–4 changes.
This is not a completed defense-readiness sign-off.

## Implemented in this phase

- Added a read-only `defense:decision-support -- --check` preflight. Both check
  and apply validate the saved baseline through the existing reset preview.
  Invalid schema/dependencies/integrity or changed operational records refuse
  acceptance before login, API generation, or database mutations. `--check`
  and `--apply` together are refused.
- Acceptance evidence now records the actual branch, HEAD and dirty-tree flag;
  it no longer mislabels a `main` run as `stabilization/ui-refinement`.
- Reviewed and corrected 13 stale regression assertions: obsolete UI text and
  component placement, multiline exact-booking lookup, guarded location API,
  optional retry key, luggage projection, explicit Finder dates, and the
  report's existing disclaimer. Existing business calculations and authorization
  checks were not relaxed. Added two acceptance-preflight safety tests.
- Updated baseline and DSS walkthrough documentation with the current reset
  limitation and the runner's scope. No manuscript edits were made.

## Verification

| Check | Result | Scope and limits |
| --- | --- | --- |
| Library, defense and fixture regression suite | **369 passed, 0 failed** | `src/lib/*.test.ts`, Supabase environment tests, defense and QA fixture tests; backup-subdirectory tests were not part of this command. |
| TypeScript | Passed | `npx tsc --noEmit`. |
| Production build | Passed | `npm run build`; local output, not deployment. |
| Phase 4 scoped lint | Passed | No errors or warnings in changed Phase 4 tooling/tests. This is not a full-repository lint claim. |
| Whitespace checks | Passed | `git diff --check`. |
| Existing saved-baseline reset preview | **Refused** | September 29 baseline has an incompatible current schema signature. No reset was applied. |
| New acceptance preflight | **Safely refused** | Existing saved baseline cannot pass; no acceptance writes were reached. |
| October 3 baseline preparation preview | Passed | Proposed 231 bookings, 219 rentals, 12 existing vehicles and bounded planning data; local private plan only. |
| October 3 baseline import rehearsal | Passed, rolled back | `prepare --as-of=2026-10-03 --rehearse` completed the transaction and deliberately rolled back all database changes. No Storage writes; `latest.txt` still points to the older baseline. This proves import compatibility, not application lifecycle transitions. |
| Secure requirement PDF | Passed | Synthetic preview booking `…000000000002`; page rendered in desktop and mobile modal. Escape restored focus to the exact preview button. No document decision was saved. |
| Secure payment proof | Passed for opening | Synthetic payment `…000000000006`; detail opens the authorized proof tab and queue shows a PDF iframe. No payment was verified. Browser-native PDF content in that tab was not accessible through the DOM snapshot. |
| DSS desktop/laptop/tablet/mobile | Passed in inspected views | Native dimensions confirmed at 1920×1080, 1366×768, 768×1024 and 390×844. Narrow DSS tables use local `overflow-x: auto` (1000/864-pixel tables inside 348-pixel containers); page width remained 390. These are bounded checks, not an exhaustive accessibility certification. |
| Selected transfer context | Passed for non-mutating review | October 5 recommendation showed horizon 2, target week October 5–11 and its own snapshots. Review transfer moved focus to the selected review. |
| External advisory | Passed for current partial context | Reported closure prominent; route feasibility unavailable and accessibility unknown, with source/time attribution. No unavailable metric was represented as clearance to move. Live provider results may change. |
| No-donor evidence | Passed | Keyboard Enter expanded unresolved gaps; incompatible-surplus and partially coverable shortages had different explanations. |
| Staff restrictions and saved decision logic | Regression tests passed; prior browser coverage retained | Phase 3 staff browser checks remain applicable; this phase did not complete a fresh multi-role lifecycle replay. Approved/Rejected/partial saved states still require the integrated rehearsal. |

The older `defense:verify` was started and stopped after confirming its documented
September 15 manifest is obsolete for the current baseline. It supplies no
acceptance result for this phase.

## Production evidence

The domain `briahcarrental.site` resolves to ready production deployment
`dpl_7RgVgYeogJVyBzvcJnhCtvEcEm6T`, built from `main` at
`02705878169422ae1d7a01d937a9a9680c99bf95`. The Vercel API confirmed that Git
identity. The live DSS still displays the old September 28–October 3 week label
and “Refresh forecast”; the local version displays September 28–October 4 and
“Generate new forecast.” **Phases 1–4 are not deployed.**

The production check was read-only. No forecast, decision, payment or movement
was submitted on production. See
[deployment evidence](frontend-phase4-2026-10-03/deployment-evidence.json).

## Remaining acceptance gate

1. Resolve the pending choice about applying a fresh October 3 synthetic
   baseline. This replaces newer operational test rows; an archive is created,
   but restoration is a technical operation, not an application Undo action.
   Do not change the old baseline's signature to bypass its refusal.
2. In an agreed testing window, apply and verify that baseline, then replay the
   real booking submission → requirements → payment → confirmation/release →
   return interfaces. Verify the stored results, not just pre-seeded states.
3. Replay full/partial approval and rejection, then a separate manual fleet
   movement with affected-request review. Check current readiness, preserved
   vehicle attributes, impacted booking handling and server staff restrictions.
   Exercise the controlled negative DSS scenarios and verify the subsequent
   baseline restore. The acceptance runner is not a substitute for those UI
   journeys and does not lock the entire testing window against teammate work.
4. Supply Ford Everest's missing photo through the existing fleet media
   workflow. The Phase 3 fallback recovery fix is verified; missing media data
   remains unresolved.
5. After acceptance, create the code checkpoint and explicitly release it;
   separately verify the resulting production commit and repeat the smoke
   checks there. Update GUI evidence only after the accepted screens are live.

Approval still records an advisory decision and does not move vehicles.
Synthetic records establish functional behavior in controlled scenarios; they
do not establish real-world forecast accuracy or rental business outcomes.

## Screenshots

- [Desktop transfer review](frontend-phase4-2026-10-03/dss-desktop-review.png)
- [Laptop DSS](frontend-phase4-2026-10-03/dss-laptop.png)
- [Tablet DSS](frontend-phase4-2026-10-03/dss-tablet.png)
- [Mobile DSS tables](frontend-phase4-2026-10-03/dss-mobile-tables.png)
- [Desktop secure document](frontend-phase4-2026-10-03/secure-document-desktop.png)
- [Mobile secure document](frontend-phase4-2026-10-03/secure-document-mobile.png)

Some browser navigation/cleanup operations timed out during responsive capture;
the successful captures above have measured viewport dimensions. A failed
capture was not counted as a passed check. User-created tabs were preserved.
