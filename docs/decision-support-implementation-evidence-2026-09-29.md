# Decision-support implementation evidence — 29 September 2026

Branch: `stabilization/ui-refinement`

This record covers the first focused implementation slice for Phase 3. It does not declare the whole system defense-ready.

## Implemented contracts

- Three-period WMA remains fixed at 0.50, 0.30 and 0.20 with three recursive weekly horizons and auditable stored inputs.
- The Decision Support screen now exposes an auditable horizon-1 calculation for the selected branch/category: the three stored input weeks, demand values, weights, weighted contributions, summed forecast demand, and the rounded-up vehicle requirement. It states that the result estimates weekly booking demand and that fleet movement remains an Owner/Admin-reviewed advisory decision.
- Forecast accuracy now selects the latest temporally eligible horizon-1 forecast separately for each branch, vehicle category and target week. Zero actual demand stays recorded but is excluded from percentage-error division. The response reports the overall MAPE, per-series MAPE and eligible sample counts.
- Owner/Admin can refresh forecasts, finalize completed forecasts against actual demand, and refresh current supply from the Decision Support page.
- A forecast generation attempt with no branch/category pair having three complete weeks returns an explicit insufficient-history error instead of persisting an empty run and silently displaying an older result as current.
- Current supply actions exclude elapsed target weeks. Recommendation display is bound to the exact latest supply-evaluation IDs and newest matching recommendation batch; older immutable batches remain historical evidence.
- Candidate revalidation checks active state, branch/category, confirmed booking overlap, rental overlap, current maintenance readiness and newly scheduled maintenance due before the target week ends.
- Allocation generation now explains every uncovered shortage as one of four auditable outcomes: no compatible surplus in the same category/week/horizon, no currently eligible candidates, too few eligible candidates for the full shortage, or compatible capacity already consumed by another shortage in the same batch.
- The API and the Decision Support screen expose those unresolved units and reasons instead of presenting all empty recommendation states as the same condition. Forecast-generation errors also remain visible when an older persisted forecast is still on screen.
- A read-only recommendation request now reconstructs the allocation summary from the latest forecast, latest supply snapshots and freshly revalidated candidates. Unresolved-shortage evidence therefore survives a page reload without requiring a new recommendation batch.
- The page waits for that read before considering automatic generation and will not create another batch when a current recommendation batch already exists.
- A six-step decision trace now connects demand history, WMA forecasting, supply readiness, fleet matching, external operational context and the final human decision. The context wording explicitly identifies weather, road, route, distance, travel-time and fuel evidence as review inputs that do not modify the WMA forecast or approve a transfer automatically.
- The production allocation route now uses the same tested allocation core as the unit suite; the former duplicate server implementation was removed.
- Approval remains advisory. The existing approve, lower-quantity approve and reject paths record a decision without changing a vehicle's branch.
- External weather, road, route and fuel context remains supplementary. The UI exposes provider, check time, partial/unavailable states and limitations.

## Verification performed

- Decision-support unit set: **59 passed, 0 failed** after adding the visible WMA calculation contract, reconstructable allocation summaries, unresolved-shortage classifications and UI-source assertions.
- Defense baseline/verifier unit set: **19 passed, 0 failed**.
- Production build: **passed**.
- Local Owner/Admin browser check: refresh forecast, finalization count and refresh supply controls rendered; only one newest exact recommendation batch was shown; candidate rationale and advisory approve/reject controls rendered; operational context completed with provider timestamps and explicit unavailable fields.
- Read-only configured Supabase check: the newest persisted run had 36 positions covering horizons 1–3; every position had a supply snapshot; the data contained both shortages and surpluses and pending advisory recommendations.
- Authenticated live route rehearsal on the resettable September 29 baseline: a fresh run persisted 36 forecast positions and 36 supply evaluations, producing 11 shortage positions, 3 surplus positions, and 1 recommendation with 2 ranked candidates. An approval for 1 unit persisted successfully and changed 0 vehicle branches, confirming the decision remains advisory. Review-time external context returned `partial`: Open-Meteo weather and TomTom traffic were available, Geoapify resolved the destination, and unavailable route/origin results remained explicitly unavailable. The generated operational rows were removed by a successful baseline reset, and the following dry-run reported no differences.
- Read-only UI-data verification found 12 current horizon-1 forecasts. Every forecast carried exactly 3 stored inputs; all 12 weighted-contribution sums matched their stored decimal forecast, and all 12 planning requirements matched the ceiling of that decimal value.
- Controlled authenticated negative-case rehearsal on the resettable baseline: the initial run produced 1 recommendation with 2 ranked vehicles. Both vehicles were then given temporary blocking `In Progress` maintenance records. A second API generation produced 0 recommendations, classified 3 shortage positions as `NoEligibleCandidates`, and retained 8 independent `NoCompatibleSurplus` explanations. The temporary records were deleted, the saved baseline was reapplied, and the following dry-run reported no differences.
- Authenticated browser reload verification: the Decision Support page rendered the six-step trace, WMA evidence, 36 current supply snapshots, 1 recommendation and 10 unresolved positions. Reloading retained those values. The allocation-batch count remained unchanged at 2 before and after the verification reload, proving the page did not create a duplicate batch.
- Repeatable Phase 3 acceptance rehearsal: all 17 controlled checks passed. The run covered 36 explainable forecasts, 164 eligible MAPE samples with 88 zero-actual exclusions, 36 supply snapshots, a recommendation with 2 candidates, 8 no-donor explanations, full/lower/rejected decisions, partial external context, maintenance-driven exclusion, recalculation and an HTTP 409 insufficient-history response. Vehicle branches remained unchanged throughout. See `docs/phase-3-acceptance-matrix.md` and the machine-readable record under `docs/evidence/`.
- The Reports screen now exposes a selected-period decision-support section that binds the latest WMA run to its latest supply evaluations and newest exact matching allocation batch. The live September 1–29 baseline reconciled 36 forecast positions, 36 supply evaluations, 11 shortage positions, 3 surplus positions and 1 current recommendation. It also reports period-specific MAPE sample counts and zero-actual exclusions. See `docs/phase-4-decision-support-report-evidence.md`.
- The repository now produces a Vercel Nitro server build and includes a secret-protected daily cron route for pickup, return, overdue, maintenance and low-availability processing. Automated reminder, operational-notification and email-delivery tests pass. Production deployment, controlled recipient delivery evidence, custom-domain DNS and the still-unapproved payment-reminder rule remain open. See `docs/phase-4-reminder-deployment-readiness.md`.

## Remaining evidence and blockers

- The resettable baseline now intentionally uses an `In Progress` blocking Mirage maintenance case; the old frozen September 15 manifest that expected M03 as `Open` is historical and must not be used to assess this baseline.
- Repeat the successful live route rehearsal from the Decision Support UI near the defense date and preserve screenshots of the forecast inputs, supply calculation, ranked candidates, saved human decision, and partial/unavailable external-context states.
- Preserve final defense screenshots for the already verified negative paths: no compatible donor, no eligible candidates after a newly maintenance-blocked candidate, and the explicit insufficient-history message. The logic and authenticated API paths are covered; the remaining work is presentation evidence from the Decision Support screen.
- Project type-checking is clean after correcting the booking-draft literal inference. The full production build passes.
