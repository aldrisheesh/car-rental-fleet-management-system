# Open Decisions

**Status:** Active  
**Last updated:** 2026-08-29

Codex must not invent answers to these items.

The forecasting, recommendation, and primary/fallback API decisions previously listed here were resolved in Development Baseline v1 and moved into their authoritative specification files.

## Roles / Permissions

1. **Exact Operations Staff editable reservation fields**
   - The defended use case allows Staff to encode “permitted reservation details” and update “permitted booking information,” but does not enumerate the exact fields.

## Workflow / Status

2. Exact booking/reservation statuses and allowed transitions.
3. Exact requirement-verification statuses and resubmission transitions.
4. Exact payment statuses and transitions.
5. Exact rental lifecycle statuses/transitions.
6. Exact vehicle operational statuses/transitions.
7. Exact maintenance lifecycle statuses/transitions. The maintenance-readiness gate itself is already frozen in `04-data-and-business-rules.md`.
8. Cancellation/rejection/reopening behavior, including the exact handling of pre-active customer cancellation and any payment consequence represented in-system.

## Requirements / Uploads

9. Exact required documents for each renter/driver scenario.
10. Accepted upload file types.
11. Maximum upload size/count.
12. Document replacement/resubmission behavior.
13. Retention/deletion rules for sensitive uploads.

## Fuel / Vehicle Reference Data

14. Final source priority when both manufacturer and Owner/Admin-provided fuel-efficiency values exist.
15. Who may update reference fuel-efficiency values and through which administrative workflow.
16. Whether owner-provided fuel-efficiency values require a source/reference note.

## Allocation Persistence Detail

17. Exact item-level persistence for cases where the system recommends multiple candidate vehicles but Owner/Admin approves fewer transfer units.
   - Example options to decide later: `approved_for_transfer` boolean or a candidate `selection_status` enum.
   - Do not invent this schema field/status until formally selected.

## APIs / Context

18. Weather/context refresh timing.
19. API caching duration and invalidation rules.
20. Deployed-account quota/rate-limit policy and operational credential-management details.
21. Exact authorized manual road/context verification/update workflow.

## Notifications / Audit

22. Exact notification triggers and timing.
23. Delivery channels for each notification type.
24. Exact auditable-event list.
25. Audit-log retention/access behavior if needed.

## Evaluation / Documentation (Does Not Block Core Development)

26. Remaining evaluation-plan details that are intentionally being deferred while development begins.
27. Final synchronization of use-case/activity diagrams and generated TOC/list numbering after implementation behavior stabilizes.
