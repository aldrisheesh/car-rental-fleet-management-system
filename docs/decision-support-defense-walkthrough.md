# Decision Support defense walkthrough

Use the Owner/Admin account and the resettable synthetic defense baseline. State clearly that all displayed records are realistic synthetic data prepared for controlled evaluation.

**October 3 acceptance prerequisite:** the old saved baseline is incompatible
with the current schema. Review [the baseline procedure](defense-baseline.md)
before resetting. `npm run defense:decision-support -- --check` performs a
read-only preflight and refuses an incompatible or drifted baseline before
authentication or test writes. `--apply` also requires that preflight to pass.
The acceptance report identifies the actual Git branch, commit, and dirty-tree
status. Its reported base URL is the tested server, not proof that production
contains local uncommitted changes. This runner changes synthetic planning and
maintenance records; its cleanup still requires the separately authorized
baseline reset. It does not exercise the complete customer booking UI or a
manual fleet movement.

## Prepare the baseline

```bash
npm run defense:baseline -- reset --apply
npm run defense:baseline -- reset
```

Continue only when the dry-run output contains `"differences": []`.

## Five-minute main walkthrough

1. Open **Admin → Decision Support → Demand Forecast**. Explain the path from recorded booking demand to supply comparison and an Owner/Admin decision.
2. Select one branch and category. Show **How this forecast was calculated**: three complete input weeks, the fixed `0.20 / 0.30 / 0.50` WMA contributions, decimal forecast demand and rounded-up vehicle requirement.
3. Choose **View allocation** on the target week. In **Fleet Allocation → Branch balance**, compare the requirement with saved projected supply after booking, rental and maintenance exclusions. Any confirmed booking overlapping the week excludes that vehicle for the weekly planning calculation; this is not a simultaneous-rental capacity optimizer.
4. In **Recommendations**, show destination shortage, source surplus, recommended quantity and candidate vehicles. In **Unresolved shortages**, distinguish generation matches from pending, approved and rejected quantities. Approval does not resolve the saved supply shortage or establish a completed movement.
5. Show **Recommendation review → External advisory** and expand source/route evidence. Current weather, road, route accessibility, distance, travel time and estimated fuel support human review. Unavailable evidence stays unavailable. A destination-area closure means the planned route requires verification, not proof that the route is blocked. These advisories do not alter WMA demand or predict target-week conditions.
6. Approve a quantity smaller than or equal to the recommendation, or reject it. Show that the decision is saved while the vehicle's branch remains unchanged.
7. Open **Vehicle Utilization** to explain recent rental activity and idle signals; distinguish candidate eligibility from the formal idle classification.

October 4 frontend hardening evidence is recorded in [the local rehearsal report](../codex-context/2026-10-04-dss-defense-hardening.md). The live rehearsal dataset contains booking extras; exact candidate/count reproduction from a clean reset has not been certified by that rehearsal.

## Negative scenarios to explain

- **No compatible donor:** the baseline contains shortage positions whose category, target week and forecast horizon have no matching surplus. The screen labels these `NoCompatibleSurplus` in plain language.
- **No eligible candidate:** during the controlled rehearsal, temporarily blocking both ranked donor vehicles with `In Progress` maintenance reduced recommendations from 1 to 0 and produced 3 `NoEligibleCandidates` positions. Reset immediately after this rehearsal.
- **Insufficient history:** forecast generation refuses to persist an empty run when no branch/category pair has three complete weeks. The previous valid result may remain visible, but the current failure message stays visible and must be explained as a data sufficiency safeguard.
- **Partial external context:** unavailable providers or fields remain marked unavailable with provider, check-time and limitation evidence. The allocation decision remains available for human review.

## Statements to use during questions

- The WMA forecasts weekly booking demand; it is not an automatic fleet-transfer command.
- Supply uses current operational eligibility and therefore can change after a booking, rental or maintenance event.
- External factors are considered at review time by the Owner/Admin. Current conditions are not presented as future weather or traffic predictions.
- Recommendations are advisory and auditable. Approval records the human decision without automatically changing vehicle branches.
- The defense dataset is synthetic, reproducible and restorable; it is not represented as client transaction history.

## Restore after every rehearsal

```bash
npm run defense:baseline -- reset --apply
npm run defense:baseline -- reset
```

The second command must again report `"differences": []`.

## October 4 successful manual transfer rehearsal

The successful positive path was completed through the frontend using a supplemental reservation-free Toyota Vios (`DEV-VIOS-002`). Fleet now contains 13 synthetic vehicles. For October 12–18 Sedan planning, the Owner/Admin approved one Antipolo → Taft unit, separately moved the donor in Fleet, then refreshed supply: Taft projected supply rose from 0 to 1 and shortage fell from 2 to 1. Existing customer trips were preserved, and the approval remains in history after refresh. This live supplemental scenario has not been incorporated into the saved reset baseline. See [the evidence and remaining presentation observations](../codex-context/2026-10-04-dss-successful-transfer.md).
