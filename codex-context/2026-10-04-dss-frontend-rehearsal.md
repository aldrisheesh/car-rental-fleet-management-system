# DSS frontend rehearsal — October 4, 2026

Rehearsed on localhost using the existing synthetic Owner/Admin account and live synthetic dataset. No booking, maintenance, vehicle-location, schema, or baseline snapshot changes were made. This is not real-client demand or predictive-performance evidence.

## Frontend actions and observed outcomes

- Generated a new WMA forecast from Demand Forecast. Latest run changed to October 4, 4:29 PM Manila. Supply completed 36/36 positions.
- Generated allocation recommendations in Fleet Allocation.
- Reviewed MPV shortages: both branches need one unit with zero projected supply, so no compatible surplus can cover them.
- Reviewed Sedan, October 12–18: Taft requires two units with zero projected supply; Antipolo requires zero and has one surplus. Generator recommends one Honda City DEV-CITY-001. One unit remains unmatched by generation.
- Expanded immutable supply/candidate evidence. Candidate idle duration is zero days; formal 14-day idle classification is not required for transfer eligibility.
- Expanded external context. Weather caution, road closure and restricted/not-feasible route classifications are displayed. Distance 33.9 km and travel time 1h15m are available; reference efficiency/fuel estimate are unavailable. These are current conditions, not target-week predictions.
- Acknowledged evidence, rejected the October 12 recommendation, confirmed the decision, then reloaded. Rejected state persists and decision controls are replaced by terminal-state copy.
- Followed Review in Fleet: Honda City remains in Antipolo, with confirmed reservation allocation and available maintenance readiness. No vehicle movement submitted.
- Reviewed utilization September 5–October 4. Honda City: nine rental days / thirty eligible days = 30%, zero idle days. Nissan Urvan: seven/thirty = 23.3%, eighteen idle days. Selection and allocation handoff work.
- Inspected Taft Sedan calculation: oldest-to-newest completed weeks [1,2,1]; 0.2*1 + 0.3*2 + 0.5*1 = 1.3, ceil = two planning units. Recursive forecasts 1.35 and 1.27 also round to two.
- Accuracy finalization button has no outstanding eligible historical records; no new finalization submitted.

Supplementary read-only SQL confirmed latest-run positions: nineteen shortages, five surpluses, twelve balanced. Exclusion traces contain ConfirmedBookingConflict, ActiveRental and MaintenanceNotReady. These counts describe overlapping planning positions, not distinct lost bookings or simultaneously needed cars.

## Verdict and limitations

The existing live dataset already demonstrates shortage, partial coverage, incompatible surplus, unresolved shortage, varied utilization and a human rejection. Adding bookings solely to force a transfer outcome is unnecessary.

This rehearsal includes recent booking-rehearsal extras. It does not certify that resetting the clean baseline reproduces exactly the same eligible candidate or counts. The clean baseline pointer was not changed.

Supply conservatively excludes a vehicle with any confirmed-booking overlap in the target week. Weekly WMA booking counts rounded to vehicle units are study planning requirements, not a concurrency/capacity optimizer. Do not present the shortage as proven lost sales or inevitable unserved customers.

Antipolo Sedan has three zero confirmed-demand input weeks; this is a conspicuous synthetic donor scenario worth reviewing against branch/category attribution before claiming representative business demand.

Follow-up defects/limitations identified:

1. Destination-area road incidents are promoted to definitive route closure/not-feasible labels even though the UI explicitly says the calculated route may not cross the incident. Route-level certainty should be softened or supported by route intersection evidence.
2. Local Vite displays an aborted incoming-request overlay during reload/navigation. Escape dismisses it and screens load, but this should be investigated before a live defense demonstration. Production behavior was not tested here.
3. Changing forecast Branch reset Sedan to the default MPV; the user must reselect the category. Preserve valid category context when changing branch.
4. After rejection, the unmatched-unit message still reports generation coverage (one) while the actual unfulfilled shortage remains two. The table retains shortage two and explains no movement; distinguish proposed coverage from approved/executed coverage more clearly.

No successful approval, partial approval, manual movement, donor-blocking mutation, insufficient-history mutation or production-domain rehearsal is claimed. The completed path is forecast → supply → recommendation → evidence review → rejection → persistence → Fleet unchanged, plus utilization review.

Screenshots: output/dss-rehearsal-2026-10-04/{allocation-overview,allocation-shortage-and-decision,forecast-taft-sedan,utilization-honda-city}.jpg.
