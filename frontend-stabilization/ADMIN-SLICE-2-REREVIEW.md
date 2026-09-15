# Admin Slice 2 Re-review

## Commits reviewed

- Branch: `stabilization/frontend-rebuild`.
- Accepted Admin Slice 1 baseline: `c31d927b5056ccfe7be675ff20aee0a600e774f7`.
- Admin Slice 2 implementation: `5f5fdfabe866a076d8dd51f7d615ff853d9ced83`.
- First Admin Slice 2 review: `602b9b1f120324af80a477fded74f53d042ffe97`.
- Branch deactivation fix: `ec86794186b1ac75a08a62d06eef5e003677f4b2`.
- Current `HEAD` and `origin/stabilization/frontend-rebuild` matched `ec86794186b1ac75a08a62d06eef5e003677f4b2` after `git fetch origin --prune`.
- `origin/main` was unchanged at `faed190d9b78bb845e2c89e7160eda90106f741f`.
- The working tree was clean before this review document was created. No application source, backend, schema, RBAC, business rule, deployment, or merge change was made.

The four required review skills were loaded fully. The current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) source was fetched before the UI review.

The review was stopped at the first new confirmed defect, as required by the review workflow.

## Branch deactivation regression

Static source verification passed for both the desktop branch row and the narrow disclosure. Headed browser and test execution were not performed after the stop condition.

- Both `BranchRow` and `BranchDisclosure` pass the exact row branch and the clicked button to `requestBranchToggle` (`src/routes/admin.branches.tsx:481-609`).
- Selecting `Deactivate` for an active branch stores that exact branch in `deactivationBranch` and opens the `AlertDialog`; it does not call the mutation (`src/routes/admin.branches.tsx:206-218`).
- The dialog names the exact branch with `Deactivate {branch.name}?` (`src/routes/admin.branches.tsx:423-451`).
- Cancel, Escape, and close clear the dialog state without calling `toggleBranch`; only the explicit confirmation action calls `confirmBranchDeactivation` (`src/routes/admin.branches.tsx:423-476`).
- Confirmation is bound to the captured `branch.id`; `saveMasterData` therefore sends the exact branch ID (`src/routes/admin.branches.tsx:220-233`, `175-187`).
- Duplicate confirmation is guarded by `deactivationSubmissionRef` and the confirm control is disabled while saving.
- The branch list is updated only after `saveMasterData` succeeds. A failed mutation leaves the dialog and visible branch state in place and reports the error.
- Dialog close restores focus to the original trigger, with the search control as a fallback (`src/routes/admin.branches.tsx:429-440`).
- Activation remains direct and canonical for inactive branches, using the same exact-ID PATCH path. No DELETE path was added.

## Fleet

Review stopped on this surface when a confirmed mutation/data-integrity defect was established. Initial static inspection did confirm that Fleet reads through the canonical `/api/admin-fleet` response and that fleet state/readiness is derived by `buildAdminFleet` / `getFleetVehicleStatus`. `Ready — derived` is presented with an explicit non-persisted explanation and no client-side Ready write was found (`src/lib/admin-fleet.ts:110-165`, `src/routes/admin.fleet.tsx:693-707`).

The complete Fleet API, mutation, responsive, accessibility, and test verification was not completed.

## Maintenance

Not reviewed to completion. The route and `/api/maintenance` source were inspected before the stop condition, including canonical Open → Completed/Cancelled transitions, readiness-summary reads, exact maintenance IDs in PATCH payloads, and the absence of DELETE/predictive-health mutations. No final acceptance judgment is claimed because the required full comparison, runtime verification, and test suite were not continued after the Fleet defect.

## Branches

The canonical branch list and assigned-vehicle count path were inspected. `buildAdminBranchRows` counts vehicles by canonical `branch_id`, and the management route uses Owner/Admin client gating with Owner/Admin server authorization through `/api/master-data`. No staffing, hours, geofencing, delivery-radius, or revenue concepts were observed. The deactivation regression is recorded above.

The full Branches test/runtime pass was not run after the Fleet stop condition; no additional Branches acceptance judgment is claimed.

## Users / Roles

Not reviewed to completion. The current source exposes canonical profile identity and the fixed three-role PATCH path, while `/api/admin-users` requires Owner/Admin. Full UI/API, stale-state, responsive, accessibility, and regression verification was stopped before this section was completed.

## Reports

Not reviewed to completion. The current route reads `/api/admin-reports`, but the complete reports API truthfulness, Manila date-range, empty/error, responsive, accessibility, and test verification was stopped before this surface was audited.

## Decision Support

Not reviewed to completion. The route source references `/api/forecasts`, `/api/supply-evaluations`, `/api/vehicle-analytics`, `/api/allocation-recommendations`, and operational context. Initial inspection showed advisory/insufficiency language and no autonomous-optimization wording in the visible route, but the full supporting-factor, uncertainty, error-state, mutation, and API contract audit was stopped.

## Decision Support RBAC status

**C. AUTHORIZATION / ARCHITECTURE CONFLICT**

The current route explicitly redirects Operations Staff away from Decision Support while the repository’s decision-support read endpoints accept Staff. The route comment itself records that the stronger Owner/Admin UI boundary is waiting on resolution of the endpoint-versus-route discrepancy (`src/routes/admin.decisions.tsx:40-48`). The accepted Admin reference also records this as an open implementation question. This was not altered; it requires Lead resolution.

## Audit Trail

Not reviewed to completion. The route and API source indicate Owner/Admin-only GET access, supported domain/actor/date/page filters, read-only event rendering, and no PATCH/DELETE client path. Full canonical summary, Manila bounds, disclosure, responsive, accessibility, and test verification was stopped.

## Exact entity binding

The inspected Fleet branch mutation uses the explicit `vehicle.id`, and the inspected maintenance and branch deactivation mutations use explicit record IDs. A complete audit of every management and Decision Support surface was not completed after the stop condition.

## Role / RBAC

The inspected server boundaries require Owner/Admin for Fleet, Maintenance, Master Data, Users/Roles, and Audit Trail; Reports remains authenticated Owner/Admin or Staff; the Decision Support route remains Owner/Admin-only while its read-endpoint discrepancy is classified above. Full Owner/Admin, Operations Staff, Customer/Renter, and anonymous route/API coverage was not completed after the confirmed defect.

## Visual fidelity

The accepted Direction E documents and Admin references were read. Initial source inspection shows the Admin shell using the light Direction E token roles and Instrument Sans, with table/disclosure patterns in the reviewed routes. Complete visual comparison for Fleet, Maintenance, Users/Roles, Reports, Decision Support, and Audit Trail was stopped before a fidelity judgment; no headed screenshot comparison is claimed.

## Responsive verification

No headed browser verification was performed after the stop condition, and no headed result is claimed. Static source contains desktop table and narrow disclosure branches for the inspected management routes, but the required 1440, 1024, and 768 behavior—including forms, filters, Decision Support, and Audit Trail—was not verified to completion.

## Accessibility

Static branch-dialog checks passed for semantic destructive confirmation, keyboard-operable AlertDialog controls, visible focus styling, duplicate-submit blocking, and focus return. The shared Admin shell includes a skip link, landmarks, labelled mobile navigation, and global `:focus-visible` treatment. Full accessibility review of all Slice 2 surfaces, including target sizes, error summaries, table/disclosure semantics, reduced motion, and focus obstruction, was stopped.

## Admin Slice 1 regression

Not re-run. The accepted Slice 1 final verification was read as the regression baseline, but shell, Dashboard, Bookings, Booking Detail, Requirements Review, Payment Review, Staff read-only behavior, focus-visible behavior, and exact booking binding were not spot-checked after the Fleet stop.

## Customer regression

Not re-run. The accepted Customer verification records were read as context only. Header, Home/Finder, My Bookings, lifecycle detail, and notification routing were not reopened after the Fleet stop.

## Tests/build

No tests, full relevant library suite, scoped ESLint, Prettier check, build, `git diff --check`, or headed browser run was performed after the confirmed defect. No test/build pass is claimed for this re-review. The expected 266 / 266 or higher result was therefore not established.

## Findings / observations

### Confirmed defect — Fleet branch assignment clears unrelated canonical vehicle fields

Classification: **Confirmed defect**

Expected behavior is established by the Fleet contract: Fleet supports a canonical branch update, and readiness uses canonical vehicle condition and odometer data (`08-BACKEND-CONTRACTS.md:173-180`; `ADMIN-IMPLEMENTATION-REFERENCES.md:96`, `313`).

Demonstrated implementation:

- `src/routes/admin.fleet.tsx:236-260` sends a vehicle PATCH with `name`, `branchId`, `categoryId`, `licensePlate`, `transmission`, `seatCapacity`, `dailyRate`, and `isActive`, but does not send `fuelType`, `referenceFuelEfficiency`, `imageUrl`, `currentOdometerKm`, or `conditionBlocksRentalUse`.
- `src/lib/master-data-client.ts:26-43` sends any body containing `id` as a PATCH.
- `src/routes/api.master-data.ts:109-138` reconstructs the complete vehicle update row. Every omitted field is written as a default: `fuel_type`, `reference_fuel_efficiency_km_per_liter`, `image_url`, and `current_odometer_km` become `null`, while `condition_blocks_rental_use` becomes `false`.
- The mutation targets the exact vehicle ID, but exact-ID binding does not prevent the unrelated-field overwrite.

Therefore, changing a vehicle’s branch can erase canonical vehicle metadata and readiness inputs. Clearing current odometer or condition-blocking data can change the derived maintenance/readiness result and downstream operational decisions. This is a supported Owner/Admin mutation with destructive side effects and blocks acceptance. No source fix was made.

### Review workflow observation

The review was intentionally stopped at the first confirmed defect. Sections marked not reviewed to completion are scope status, not additional findings or implied defects.

## Review result

ADMIN SLICE 2 NEEDS FIXES
