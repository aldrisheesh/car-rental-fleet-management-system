# Successful DSS transfer rehearsal — October 4, 2026

The Owner/Admin positive path was exercised through the local frontend. No direct API or database write was used to create the donor, approve the recommendation, or change the allocation location.

## Controlled scenario

Created one supplemental vehicle through **Fleet → Add vehicle**:

- Toyota Vios, `DEV-VIOS-002`, Sedan, initially Antipolo, Rizal.
- Five seats, two large bags, Automatic, Petrol; PHP 1,800 daily rate.
- Current odometer 18,000 km; reference efficiency 14 km/L.
- Available, maintenance-ready, no booking or rental assignments.

This grows the synthetic fleet from 12 to 13 vehicles. Existing customer bookings, rentals and maintenance records remain intact. This is a supplemental live rehearsal scenario, not a certification that the saved reset baseline includes it.

## Frontend sequence

1. Search the donor plate in Fleet and verify Available / no active rental or confirmed reservation.
2. Navigate via Decision Support → Fleet Allocation. Select Sedan and refresh supply.
3. The generated batch assigned this donor to **October 12–18, 2026**, Horizon 3. (Generation covers the whole run and prevents recommending the same donor twice across weeks.)
4. Review saved balances: Taft required 2, projected supply 0, shortage 2; Antipolo required 0, projected supply 2, surplus 2. One eligible candidate, `DEV-VIOS-002`, supports a one-unit recommendation.
5. Review current external advisories: drizzle caution and a nearby reported closure; actual route exposure requires verification. Current review-time conditions are not a forecast for October 12. This is a synthetic record-movement rehearsal, not a claim that a physical vehicle was driven or a route independently cleared.
6. Acknowledge advisory limitations; approve quantity 1 and confirm the decision. Saved recommendation: `6bb34dab-03be-4889-b41b-898a9077a7da`.
7. Follow **Review in Fleet**. Verify the donor still belongs to Antipolo after approval. Approval alone neither moves the vehicle nor updates projected supply.
8. Change Allocation location to Taft. Fleet confirms “Toyota Vios allocation location updated”; selected branch and register both show Taft.
9. Follow **Return to allocation review** and refresh supply. Taft projected supply increased from 0 to 1; its shortage fell from 2 to 1. Antipolo projected supply/surplus fell from 2 to 1. All 36 current forecast positions were evaluated; controls returned to their enabled state.
10. Expand Recorded decision history: the one-unit approval remains saved alongside the earlier rejected decision. The new analysis has no safe donor for the remaining shortage.

## Evidence

Screenshots: `output/dss-successful-transfer-2026-10-04/`.

- `01-available-donor.jpg`: reservation-free donor in Antipolo.
- `02-shortage-and-recommendation.jpg`: shortage and proposed one-unit transfer.
- `03-approved-decision.jpg`: saved approval and review-time advisory flags.
- `04-approved-but-not-moved.jpg`: donor remains in Antipolo after approval.
- `05-fleet-move-saved.jpg`: successful location update to Taft.
- `06-shortage-reduced.jpg`: refreshed required units 2, projected supply 1, shortage 1.

The live donor remains active in Taft so the result can be inspected. No baseline reset or snapshot overwrite was performed.

## Additional observations

During review, candidate fuel details correctly showed 14 km/L and approximately 2.5 L for 34.8 km, while aggregate route metrics said fuel/reference efficiency unavailable. Also, before the post-move supply refresh, the GET summary recomputed candidate availability and said “Generation proposed 0” alongside the saved one-unit approval. These are presentation consistency follow-ups; they did not block the approval or Fleet movement. Do not describe this rehearsal as proof that every DSS presentation detail is flawless.
