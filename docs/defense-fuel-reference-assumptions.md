# Synthetic fleet fuel reference assumptions

The twelve active demonstration vehicles have researcher-selected reference fuel efficiencies recorded in `scripts/defense/fuel-reference-data.json`. These values are synthetic planning inputs, not manufacturer ratings, road-test results, or measured fleet consumption.

The reference estimate is route distance in kilometres divided by vehicle reference efficiency in kilometres per litre. It does not account explicitly for vehicle load, idling, driving style or changes in road conditions. It is not a fuel price or expense calculation. Missing route distance or missing/invalid efficiency remains unavailable; the application does not invent a fallback number.

For the October 5 Economy transfer review, the frontend showed the Mitsubishi Mirage at 16.0 km/L and a 27.3 km route, producing approximately 1.7 L. Distance and travel time can change when live route conditions are refreshed.

The original active fleet had no reference efficiencies. The targeted repair fills only missing values on the twelve existing synthetic vehicles, preserves non-empty values, and archives the previous fields before applying changes:

```sh
node --env-file=.env.local --experimental-strip-types scripts/defense/fuel-reference-data.ts
node --env-file=.env.local --experimental-strip-types scripts/defense/fuel-reference-data.ts --apply
```

For real business use, the administrator should enter documented vehicle-specific reference values through Fleet management. The demo values must be replaced before presenting estimates as real fleet planning evidence.
