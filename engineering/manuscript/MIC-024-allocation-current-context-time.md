# MIC-024 — Allocation Context Uses Current Review-Time Conditions

**Date:** 2026-09-02
**Classification:** RESEARCHER-DESIGNED DECISION / MANUSCRIPT GAP RESOLUTION
**Implementation status:** Planned for VS024

## Manuscript state
R11 and the allocation use case require contextual review, but the allocation recommendation has a target week rather than an exact vehicle-transfer date/time.

## Planned implementation
For branch-allocation review, time-sensitive weather/traffic/road context is labeled as current context at the time Owner/Admin reviews the recommendation.

Stable route distance and candidate reference fuel estimates remain route/candidate advisory facts.

## Reason
Treating the target forecast-week start as the exact transfer time would introduce false precision and could present unsupported future traffic/weather information.

## Manuscript action
Document that time-sensitive context shown during allocation review reflects the current context check unless an exact planned transfer time is introduced later.

## Status
PLANNED — verify after VS024 implementation.
