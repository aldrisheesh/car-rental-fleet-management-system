# Open Decisions

**Status:** Active  
**Last updated:** 2026-09-01

Codex must not invent answers to these items.

Client-specific operational details with safe provisional behavior are tracked in `14-client-clarification-register.md`.

## Roles

1. Exact Operations Staff editable/action scope — `CQ-016`.

## Lifecycle

2. Full rental lifecycle enum beyond canonical start/end timestamps.
3. Full vehicle operational state machine — `CQ-009`.
4. Final Briah maintenance workflow/status terminology and return-to-service authority — `CQ-015`.
5. Cancellation/rejection/reopening consequences.

## Maintenance

The baseline maintenance-record/readiness foundation is frozen in `18-maintenance-monitoring-and-readiness.md`.

Still client-dependent:

6. Exact Briah maintenance lifecycle terminology — `CQ-015`.
7. Whether a post-maintenance inspection/approval is mandatory before return to service — `CQ-015`.
8. Exact Operations Staff maintenance permissions — `CQ-015`, `CQ-016`.

## Utilization / Idle

The baseline utilization/idle calculation rules are frozen in `19-vehicle-utilization-and-idle-detection.md`.

Still open/client-data dependent:

9. Trustworthy historical operational-availability baseline for pre-existing/never-rented client vehicles — `CQ-023`.
10. Whether Briah can provide historical inactive/availability intervals for pre-system periods.
11. Final report/export presentation format for utilization/idle analytics.

## Return / Settlement

12. Exact return inspection checklist — `CQ-021`.
13. Physical return vs financial closure — `CQ-022`.
14. Final settlement/completion gate — `CQ-014`.
15. Security-deposit deduction/refund — `CQ-002`.
16. Remaining-balance settlement — `CQ-003`.
17. Late-return calculation — `CQ-011`.
18. Damage charge matrix — `CQ-012`.
19. Fuel shortage/return policy — `CQ-013`.

## Assignment / Release

20. Permanent substitution policy — `CQ-007`.
21. Cross-branch movement — `CQ-017`.
22. Turnaround buffer — `CQ-018`.
23. Exact turnover checklist/start event — `CQ-008`.
24. Pre-release financial gate — `CQ-019`.
25. Odometer/fuel capture convention — `CQ-020`.

## Requirements

26. Alternate renter/driver requirements — `CQ-005`, `CQ-006`.
27. Long-term sensitive-file retention.
28. Exceptional verified-requirement reopening.

## Payments

29. Exact 50% charge-base composition — `CQ-001`.
30. Production payment methods/accounts — `CQ-004`.
31. Cancellation refund/payment consequences.

## Rental Extension

32. Extension request/approval workflow — `CQ-010`.

## Fuel / Vehicle Reference Data

33. Fuel-efficiency source priority.
34. Fuel-efficiency update authority.
35. Fuel-efficiency source-note rule.

## Allocation

36. Item-level approved-transfer persistence.

## APIs / Context

37. Context refresh timing.
38. API caching/invalidation.
39. Quota/rate-limit/credential operational policy.
40. Manual road/context update workflow.

## Notifications / Audit

41. Notification triggers/timing.
42. Delivery channels.
43. Broader auditable-event list.
44. Audit retention/access.

## Evaluation / Documentation

45. Remaining evaluation details.
46. Final use-case/activity-diagram and TOC synchronization.
