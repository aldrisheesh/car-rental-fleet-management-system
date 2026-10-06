# DSS nontechnical-admin usability rehearsal

Date: October 5, 2026. Local frontend: http://127.0.0.1:3000. Account: Avery Santos, Owner/Admin.

## Method and limits

This was a simulated cognitive walkthrough through the actual frontend, using visible controls and guidance. It was not a study with a nontechnical participant. No participant success rates, timings, quotations, or satisfaction scores are claimed. Observed interface facts are separated below from predicted comprehension risks.

The rehearsal used the existing synthetic records. It did not regenerate forecasts, approve/reject transfers, move vehicles, or change operational records. Those write flows were exercised in the earlier frontend E2E report. Only filters, disclosures, reporting dates, and navigation were changed here. No product code was changed during this rehearsal.

## Tasks walked through

| Task | Observed outcome | Usability assessment |
| --- | --- | --- |
| Find a vehicle with no recent rentals | Utilization identified two synthetic MPVs with no recorded rentals. With Sedan and Oct 1–5 selected, it identified DEV-VIOS-002. | Clear main conclusion and vehicle rows. |
| Decide whether no activity means available | The summary explicitly cautioned that no recent activity does not mean availability. View vehicle opened the matching Fleet record. | Good safeguard and direct next action. |
| Change reporting dates | Opened Reporting period, set From to Oct 1, and applied. The displayed range and activity rows updated to Oct 1–5. | Familiar controls; outcome visible. |
| Return after checking a vehicle | Return to utilization review retained Sedan, Oct 1–5, and DEV-VIOS-002. | Clear return path. |
| Plan for a future week | Forecast showed Taft, MPV, Oct 19–25: estimated demand 0.74 and one vehicle to plan for. | Rounding is explained, but headline incorrectly calls the future selection “this week.” |
| Understand forecast trust information | Opened performance and exclusions: MAPE 38.3%, 142 eligible observations, 119 zero-actual exclusions; synthetic-data limitation was present. | Correct scope disclosures, but interpretation still needs plainer wording. |
| Understand a shortage without a transfer | Sedan, Oct 19–25: Taft needs/has 1; Antipolo needs 1/has 0. Visible text said no other branch had spare vehicles. | Shortage itself is understandable. Disabled action explanation is less discoverable. |
| Revisit an earlier decision | MPV history showed approved one vehicle at 12:46 PM and rejected at 12:43 PM, both Antipolo → Taft. | History lacks enough detail to explain or follow up on a decision. |

## Findings, in priority order

### 1. Forecast performance needs an interpretation, not just MAPE

**Observed:** “Mean Absolute Percentage Error (MAPE)” and “38.3%” appear with a general caveat. Expanded exclusions explain series, horizons, and zero-actual weeks, but do not directly say whether a lower percentage is better or that this is an error percentage rather than accuracy.

**Predicted risk:** A first-time admin could read 38.3% as forecast accuracy, or mistake synthetic performance for evidence of real-world reliability.

**Recommended change:** Label it “Average forecast error.” Add: “Lower is better. This compares earlier one-week forecasts with recorded demand; it is not an accuracy score.” Keep the technical name, exact scope, exclusions, and synthetic-data notice in the supporting disclosure. Do not translate this into a 61.7% accuracy claim.

### 2. Previous transfer decisions need a useful detail view

**Observed:** The two MPV history entries show route, decision, time, and approved quantity. Neither exposes a review link, vehicle, decision reason, or follow-up status. The approval text also reads “1 vehicles approved.”

**Predicted risk:** An admin returning later cannot use this section alone to identify the approved vehicle or understand why a transfer was rejected. The history is especially important because approval does not move a vehicle.

**Recommended change:** Provide read-only decision details with the recorded vehicle/candidate, approved quantity, reason/notes, decision time, and relevant Fleet link. Distinguish recorded approval from actual branch movement; do not infer completed movement merely from approval. Fix singular/plural wording.

### 3. Future selections must not say “this week”

**Observed:** Selecting Oct 19–25 on October 5 still displays “Plan for 1 MPV this week.” The controls and selected table row show the correct dates.

**Predicted risk:** A user scanning the headline could prepare vehicles for the wrong week.

**Recommended change:** Use “Plan for 1 MPV for Oct 19–25” or “for the selected week,” with the actual dates nearby. Preserve the rounded demand and planning-only caveat.

### 4. Put the disabled transfer action's explanation beside it

**Observed:** For the Sedan shortage, Find transfer options is disabled. The visible shortage text correctly says no other branch has spare vehicles. “Analysis options” contains the more specific explanation that the current analysis has no surplus to compare.

**Predicted risk:** A user can understand the shortage but still wonder whether the disabled button is broken or needs another step.

**Recommended change:** Place “No branch has a spare sedan to transfer in this saved plan” beside the disabled button. Make the next action explicit: review upcoming returns/bookings; update availability after those records change. Keep the saved-analysis distinction and avoid promising a transfer will become available.

### 5. Simplify utilization's supporting language

**Observed:** DEV-VIOS-002 shows no rental activity in Oct 1–5, last recorded rental Sep 25, Not Idle, idle baseline Oct 4, and one idle day. Its utilization percentage is Unavailable because historical active-state coverage is incomplete. The methodology correctly defines last rental as a start date, and idle as time since the applicable return/activation baseline, but uses phrases such as “eligible operational days” and “Partial/Insufficient Historical Eligibility Data.”

**Predicted risk:** The dates can look contradictory, and Unavailable can look like an application error.

**Recommended change:** Rename the table date to “Last rental started.” Explain idle in everyday terms using the actual baseline source when known: “The idle count starts from the last return or activation, not the rental's start date.” Replace the coverage status with “Some past vehicle-status records are missing,” followed by “Rental days are shown, but there is not enough history to calculate a reliable percentage.” Keep the exact calculation available in a technical disclosure.

## What already works well

- The headline answers the immediate planning question before the supporting tables.
- Branch/category/date controls use familiar labels.
- The four-column allocation table makes required, available, and shortage quantities easy to compare.
- No-transfer text explains the actual no-spare-vehicle circumstance.
- Advisory-only and approval-does-not-move warnings prevent overinterpreting recommendations.
- Utilization distinguishes recorded activity from availability, with a direct matching-vehicle link and a clear return path.
- Technical evidence is available without dominating the main page.

## Real participant test script

Run this with an admin who has not seen the redesign. Do not explain the controls or terminology first. Ask them to think aloud; record whether they finish without assistance, the wrong turns, and what they believe the result means. Use synthetic records and do not make real operational changes.

1. “You are preparing MPVs for Oct 19–25. Find how many Taft should plan for. Tell me which dates your answer covers.”
2. “The forecast estimate is less than one. Why is the plan asking for one vehicle?”
3. “Can you tell how trustworthy this forecast is? What does the percentage mean?”
4. “Antipolo may need another sedan. Find whether another branch can help and tell me what you would do next.”
5. “Find an earlier approved transfer. Which vehicle was approved, and has the system actually moved it?”
6. “Find a sedan that had no rental activity during Oct 1–5. Does that alone mean you can rent it out or transfer it?”
7. “Check that vehicle's record, then return to your report.”
8. “Explain why that vehicle is marked Not Idle and why its utilization percentage is unavailable.”

Before calling the DSS self-explanatory, confirm that the participant identifies the selected week, interprets error rather than accuracy, distinguishes approval from movement and activity from availability, and reaches the appropriate next check without coaching. Fix observed failures and repeat the affected tasks; do not declare usability proven from this simulated rehearsal.

## Evidence

- [Forecast disclosures](../output/dss-usability-2026-10-05/forecast.png)
- [Allocation history](../output/dss-usability-2026-10-05/allocation-history.png)
- [Allocation shortage](../output/dss-usability-2026-10-05/allocation-shortage.png)
- [Utilization explanations](../output/dss-usability-2026-10-05/utilization.png)
- [Earlier frontend E2E report](2026-10-05-dss-redesign-frontend-e2e.md)

Conclusion: the principal navigation and operational summaries are usable in the walkthrough. Five focused clarity improvements should precede calling the DSS ready for an unfamiliar nontechnical admin. Actual participant testing remains necessary.

## Follow-up implementation: October 5

All five findings were addressed locally after the user requested fixes:

- Forecast headlines now say “for the selected week” and display the actual date range. Performance is labelled “Average forecast error” with lower-is-better and not-an-accuracy-score guidance; MAPE's methodology remains available.
- Each saved decision has a read-only disclosure with its planning dates, recorded reason, approved quantity, saved candidates and Fleet links. Candidate records are explicitly not proof of individual approval or movement. The existing data records quantity approval rather than a final vehicle assignment, so no such assignment is invented. Fleet links return to allocation, and singular quantities use “vehicle.”
- Generation-block guidance appears immediately beneath the disabled action. Shortage guidance names the no-spare-vehicle circumstance and next checks. A selected category with enough vehicles receives a scoped no-transfer-needed explanation rather than a global shortage message.
- Utilization uses “Last rental started,” “Idle count starts from,” and plain descriptions of missing past records. Idle explanations distinguish the return/activation count from rental start dates and no activity in the report.

Verification: 11 existing allocation/utilization tests passed, TypeScript passed, and ESLint passed for the changed components/helpers. Frontend checks verified Oct 19–25 dates, forecast-error copy, Sedan shortage guidance, approved/rejected history details, the matching Fleet candidate and return path, and utilization's incomplete-history explanation. Expanded history was inspected at desktop and 390px widths; the narrow viewport had no document overflow and was reset afterward. No forecasts, decisions, vehicle locations, or database records were modified for these checks. Actual participant testing is still outstanding.

Updated screenshots: [Decision history](../output/dss-usability-fixes-2026-10-05/decision-history.png), [narrow layout](../output/dss-usability-fixes-2026-10-05/decision-history-mobile.png), [forecast](../output/dss-usability-fixes-2026-10-05/forecast.png), [utilization](../output/dss-usability-fixes-2026-10-05/utilization.png).
