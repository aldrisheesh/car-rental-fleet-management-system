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

1. Open **Admin → Decision Support**. Begin with the **Auditable decision trace**. Explain that it shows the complete path from recorded demand to an Owner/Admin decision.
2. In **Demand outlook**, select one branch and category. Show the three complete input weeks, the fixed `0.20 / 0.30 / 0.50` WMA contributions, the decimal forecast demand and the rounded-up vehicle requirement.
3. In **Supply analysis** and **Branch balance**, show how the requirement is compared with vehicles that remain available after booking, rental, active-state and maintenance checks.
4. In **Transfer recommendations**, show the destination shortage, source surplus, recommended quantity and ranked eligible vehicles. Point out the separate unresolved-shortage explanations where no defensible transfer can be produced.
5. Open one recommendation and show **Current route context**. Explain that current weather, road, route accessibility, distance, travel time and estimated fuel support the Owner/Admin's approval or rejection. They do not alter the WMA forecast, predict the target week's conditions or move a vehicle automatically.
6. Approve a quantity smaller than or equal to the recommendation, or reject it. Show that the decision is saved while the vehicle's branch remains unchanged.

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
