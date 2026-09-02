# VS023 Manuscript Traceability

**Status:** Frozen
**Last updated:** 2026-09-02

Supports the latest manuscript's Context Classification and Normalization Rules:

Weather:
Normal / Caution / Severe / Unavailable

Road Condition:
Open / Caution / Closed/Impassable / Unknown

Route Feasibility:
Feasible / Feasible with Caution / Not Feasible / Unavailable

Route Accessibility:
Accessible / Limited / Closed/Restricted, with a safe internal Unknown when reliable information is unavailable.

External/manual context remains advisory and may not independently create shortages/surpluses, select/transfer vehicles, or override availability/maintenance readiness.

Authorized manual information must be identified separately from API-derived information. If no reliable API/manual information exists, use Unavailable/Unknown.

Potential manuscript update:
if Route Accessibility `Unknown` becomes part of the final public data model, create/update an MIC entry and revise the data dictionary.

No provider changes are authorized.
