# Admin Slice 2 Review

## Commit reviewed

- Branch: `stabilization/frontend-rebuild`
- Implementation commit: `5f5fdfabe866a076d8dd51f7d615ff853d9ced83`
- Accepted Admin Slice 1 baseline: `c31d927b5056ccfe7be675ff20aee0a600e774f7`
- `HEAD` matched the implementation commit at pre-flight.
- `origin/main` was `faed190d9b78bb845e2c89e7160eda90106f741f` after fetch and matched the remote `main` ref.
- Worktree was clean before this review document was created.

## Scope

Review-only comparison of the Admin / Operations Slice 2 implementation against the frozen Direction E system, the Admin reference matrix, the Admin implementation references, and the accepted Slice 1 verification. The review was stopped immediately after a confirmed defect was established, as required by the review workflow.

Reviewed before stopping:

- pre-flight branch, commit, remote, and worktree state;
- required design and implementation contracts;
- original-resolution Fleet, Maintenance, Users & Roles, Reports, Decision Support, and Audit Trail references;
- complete Slice 2 file list and diff scope;
- new Slice 2 static presentation test;
- Branches source, canonical master-data API, and the accepted Branches management contract.

The remaining surfaces and verification suites were not executed after the confirmed defect was found.

## Fleet

Not reviewed to completion. Original-resolution Fleet reference inspection was completed, but source/API, derived-readiness, mutation, responsive, accessibility, and test verification were stopped before this surface was audited.

## Maintenance

Not reviewed to completion. Original-resolution Maintenance reference inspection was completed, but source/API, exact-record, transition, conflict, responsive, accessibility, and test verification were stopped before this surface was audited.

## Branches

The canonical branch and assigned-vehicle presentation was inspected. The Branches route reads branches and vehicles through the canonical master-data client and derives assigned-vehicle counts through `buildAdminBranchRows`. No unsupported staffing, revenue, geofencing, or delivery-radius concepts were observed in the inspected source.

A confirmed defect was found in the supported deactivation mutation; see Findings / observations.

## Users / Roles

Not reviewed to completion. Original-resolution Users & Roles reference inspection was completed, but source/API, role mutation, server authorization, responsive, accessibility, and test verification were stopped before this surface was audited.

## Reports

Not reviewed to completion. Original-resolution Reports reference inspection was completed, but current reports API truthfulness, date handling, error/empty behavior, responsive, accessibility, and test verification were stopped before this surface was audited.

## Decision Support

Not reviewed to completion. Original-resolution Decision Support reference inspection was completed, but forecast/supply/analytics/recommendation/context source truthfulness, advisory claims, uncertainty states, RBAC, responsive behavior, accessibility, and tests were stopped before this surface was audited.

## Decision Support RBAC status

Not classified. The current endpoint-versus-route intent conflict was not re-checked after the confirmed defect stopped the review.

## Audit Trail

Not reviewed to completion. Original-resolution Audit Trail reference inspection was completed, but API read-only behavior, supported filters, immutable-event presentation, Owner/Admin boundary, responsive behavior, accessibility, and tests were stopped before this surface was audited.

## Exact entity binding

Not reviewed to completion. Branch mutation identity was explicit (`branch.id`) in the inspected path; Fleet, Maintenance, Users/Roles, and Decision Support binding checks were not completed.

## Role / RBAC

Not reviewed to completion. The inspected Branches route has a client-side Owner/Admin route gate and the canonical master-data API requires `Owner/Admin`; full Owner/Admin, Operations Staff, Customer/Renter, and anonymous coverage was not completed.

## Visual fidelity

Original-resolution references were inspected for Fleet, Maintenance, Users & Roles, Reports, Decision Support, and Audit Trail. Implementation comparison was stopped before a complete fidelity determination. No acceptance judgment is made for the unreviewed surfaces.

## Responsive verification

Not performed. No headed browser verification was claimed, and source-level responsive review was stopped after the confirmed defect.

## Accessibility

Not reviewed to completion. The confirmed Branches defect also violates the accepted destructive-action safety contract; full focus, semantic, feedback, target-size, disclosure, and reduced-motion review was stopped.

## Admin Slice 1 regression

Not re-run. The accepted Slice 1 verification was read as the regression baseline; no Slice 1 regression spot-check was completed after the Slice 2 defect stopped the review.

## Customer regression

Not re-run. Customer scope was not reopened or spot-checked after the Slice 2 defect stopped the review.

## Tests/build

Not run after the defect was confirmed, in accordance with the stop workflow.

- New Slice 2 static test was inspected but not executed.
- Fleet/vehicle, maintenance, branch/master-data, user/role, report, Decision Support/forecasting, Audit Trail, authorization, Admin Slice 1, and customer regression suites were not run.
- Scoped ESLint, Prettier, build, and `git diff --check` were not run for this review.

## Findings / observations

### Confirmed defect — branch deactivation has no confirmation or undo path

Expected behavior is established by the accepted contract:

- `frontend-stabilization/ADMIN-IMPLEMENTATION-REFERENCES.md:209` requires branch deactivation to be a state change “with confirmation, not delete.”
- `frontend-stabilization/ADMIN-IMPLEMENTATION-REFERENCES.md:362` requires confirmation or undo for destructive transitions, including branch deactivation.
- `frontend-stabilization/DIRECTION-E-DESIGN-SYSTEM.md:236` requires confirmation or an undo opportunity for destructive actions.

The incorrect implementation is demonstrated at the reviewed commit:

- `src/routes/admin.branches.tsx:160-187` implements `toggleBranch` and immediately calls `saveMasterData` with `isActive: !branch.is_active`.
- `src/routes/admin.branches.tsx:308` and `:324` pass that mutation directly to the desktop and narrow disclosure controls.
- `src/routes/admin.branches.tsx:425-431` and `:492-498` label the direct mutation `Deactivate` without opening a confirmation dialog or providing an undo path.

Therefore, activating Deactivate immediately sends the canonical PATCH for the selected branch. This is a confirmed management-safety defect and blocks acceptance. No source fix was made.

### Review workflow observation

The review was intentionally stopped at the first confirmed defect. “Not reviewed to completion” entries above are scope status, not additional findings or implied defects.

## Review result

ADMIN SLICE 2 NEEDS FIXES

