# Decision-support demo history

The mock-defense database includes a controlled historical fixture labelled
`Demo decision-support fixture`. It contains 26 completed Manila reporting
weeks (March 16–September 9, 2026), varied confirmed demand, completed rental
transactions, and historical vehicle-state coverage.

It is intentionally transparent: the records are synthetic and are for
demonstration and testing only. The fixture does not modify or remove existing
records, and its insert guards make it safe to run again.

The current scenario provides a useful allocation test:

- Antipolo sedans: forecast demand of 1 unit with 2 active vehicles.
- Taft sedans: forecast demand of 2.2 units, rounded to 3, with no local
  sedan fleet.

Generate or inspect the forecast run with idempotency key
`demo-decision-support-history-v1`, then evaluate supply for the two
horizon-one sedan forecasts to demonstrate the source-surplus and
destination-shortage workflow.
