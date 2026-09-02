# MIC-023 — Route Accessibility Adds a Safe Unknown State

**Date:** 2026-09-02
**Classification:** IMPLEMENTATION IMPROVEMENT
**Implementation status:** Implemented in VS023

## Manuscript state
The current Route Accessibility vocabulary lists:
- Accessible
- Limited
- Closed/Restricted

## Implemented state
VS023 additionally uses:
- Unknown

when route/incident evidence is unavailable or insufficient.

## Reason
Without Unknown, provider failure or insufficient context would force the system to classify missing evidence as Accessible, which would be an unjustified favorable assumption.

## Manuscript action
Update the final Route Accessibility classification/data-dictionary wording to include Unknown/Unavailable as a safe missing-information state.

## Status
READY FOR MANUSCRIPT REVISION.
