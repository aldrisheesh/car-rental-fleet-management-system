# Historical forecast comparison

Implemented saved historical horizon-1 predictions beside observed weekly demand and the latest three-week outlook on Demand Forecast. Lines use monotone curves with weekly dots; actual demand is solid and forecasts are dashed. Curves are visual guides, not additional predictions.

Historical predictions must match branch/category and have been saved before the target week began in Manila time, with three earlier Actual inputs. Missing predictions remain blank, including gaps in the dashed line. Tooltips show actual demand, prediction, horizon and issuance timestamp. Synthetic historical runs are explicitly labeled simulated.

Uses the existing forecast API response; no booking records, database data, WMA calculations or saved forecasts were changed or regenerated.

Validation: 11 targeted chart/decision tests passed, TypeScript passed, production build passed. Targeted ESLint had no errors and four existing React effect dependency warnings. Browser verified Sept 7 comparison (Taft Economy actual 1 versus saved simulated forecast 1.7), single-branch filtering, category changes, curves and restored all-branches SUV view.

Screenshot: `output/bookings-concepts/forecast-historical-comparison.jpg`.

Follow-up: added a separate dotted visual connector from the last Actual week to the immediately following latest forecast week. It does not overwrite any historical forecast or contribute to tooltip values; gaps longer than one week are not bridged. Browser verified SUV Sept 21 actual 1 versus historical forecast 0.5 remained distinct while its actual point connects to Sept 28 forecast 0.8. Twelve targeted tests and TypeScript passed; targeted lint retained only the same four existing warnings. Screenshot: `output/bookings-concepts/forecast-dotted-transition.jpg`.
