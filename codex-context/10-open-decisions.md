# Open Decisions

**Status:** Active  
**Last updated:** 2026-08-31

Codex must not invent answers to these items.

The foundational booking, requirement-verification, and payment-verification status semantics are now frozen in `03-workflows-and-status-rules.md`.

## Roles / Permissions

1. **Exact Operations Staff editable reservation fields**
   - Staff may encode/update only permitted reservation information, but the exact fields remain unresolved.
   - Staff must not be given payment-verification, final booking-confirmation, or vehicle-assignment authority.

## Workflow / Status

2. Exact rental lifecycle statuses and allowed transitions.
3. Exact vehicle operational statuses and allowed transitions.
4. Exact maintenance lifecycle statuses and allowed transitions. Maintenance readiness itself is frozen in `04-data-and-business-rules.md`.
5. Detailed cancellation/rejection/reopening behavior and consequences.
   - `Rejected` and `Cancelled` are frozen booking states.
   - Eligibility, reasons, reopening/reconsideration, overrides, and payment/refund consequences remain open.
6. Exact vehicle-release/turnover transition that begins active rental.
7. Exact return/settlement transition rules that end the rental lifecycle.

## Requirements / Uploads

8. Exact required documents for each renter/driver scenario.
9. Accepted upload file types.
10. Maximum upload size/count.
11. Exact document replacement/resubmission mechanics.
    - `Needs Resubmission` is frozen; file-level replacement/version behavior remains open.
12. Retention/deletion rules for sensitive uploads.

## Payment Detail

13. Exact proof-of-payment upload constraints and accepted file types.
14. Exact payment-proof replacement/resubmission mechanics.
    - `Needs Resubmission` is frozen; file/reference replacement behavior remains open.
15. Exact representation of down-payment amount, remaining balance, additional charges, refunds, and final settlement where persisted transactional fields are required.
16. Exact cancellation-related payment/refund handling.

## Fuel / Vehicle Reference Data

17. Final source priority when both manufacturer and Owner/Admin-provided fuel-efficiency values exist.
18. Who may update reference fuel-efficiency values and through which administrative workflow.
19. Whether owner-provided fuel-efficiency values require a source/reference note.

## Allocation Persistence Detail

20. Exact item-level persistence when multiple candidate vehicles are recommended but Owner/Admin approves fewer transfer units.
   - Do not invent an `approved_for_transfer` field or candidate selection-status enum until formally selected.

## APIs / Context

21. Weather/context refresh timing.
22. API caching duration and invalidation rules.
23. Deployed-account quota/rate-limit policy and operational credential-management details.
24. Exact authorized manual road/context verification/update workflow.

## Notifications / Audit

25. Exact notification triggers and timing.
26. Delivery channels for each notification type.
27. Exact auditable-event list.
28. Audit-log retention/access behavior if needed.

## Evaluation / Documentation (Does Not Block Core Development)

29. Remaining evaluation-plan details intentionally deferred while development begins.
30. Final synchronization of use-case/activity diagrams and generated TOC/list numbering after implementation behavior stabilizes.
