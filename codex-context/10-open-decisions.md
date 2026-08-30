# Open Decisions

**Status:** Active  
**Last updated:** 2026-08-31

Codex must not invent answers to these items.

The foundational booking, requirement-verification, payment-verification, and baseline secure renter-document upload rules are now frozen in `03-workflows-and-status-rules.md` and `11-requirements-and-secure-storage.md`.

## Roles / Permissions

1. **Exact Operations Staff editable reservation fields**
   - Staff may encode/update only permitted reservation information, but the exact fields remain unresolved.
   - Staff must not be given requirement-document access, requirement verification, payment verification, final booking confirmation, or vehicle-assignment authority.

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

8. Exact additional document requirements for alternate renter/driver scenarios beyond the baseline self-drive renter.
   - The baseline self-drive renter requires `Valid Government ID` and `Driver's License`.
   - A separate customer-uploaded LTO portal screenshot is not a baseline requirement.
9. Long-term retention/deletion duration for sensitive renter-document uploads.
   - No automatic time-based deletion is allowed until this is frozen.
10. Exceptional reopening/replacement behavior after a requirement set has already been `Verified`.
11. Whether future client validation requires additional named supporting-document categories such as proof of billing, authorization letter, or selfie with ID as mandatory in a specific scenario.

## Payment Detail

12. Exact proof-of-payment upload constraints and accepted file types.
13. Exact payment-proof replacement/resubmission mechanics.
   - `Needs Resubmission` is frozen; file/reference replacement behavior remains open.
14. Exact representation of down-payment amount, remaining balance, additional charges, refunds, and final settlement where persisted transactional fields are required.
15. Exact cancellation-related payment/refund handling.

## Fuel / Vehicle Reference Data

16. Final source priority when both manufacturer and Owner/Admin-provided fuel-efficiency values exist.
17. Who may update reference fuel-efficiency values and through which administrative workflow.
18. Whether owner-provided fuel-efficiency values require a source/reference note.

## Allocation Persistence Detail

19. Exact item-level persistence when multiple candidate vehicles are recommended but Owner/Admin approves fewer transfer units.
   - Do not invent an `approved_for_transfer` field or candidate selection-status enum until formally selected.

## APIs / Context

20. Weather/context refresh timing.
21. API caching duration and invalidation rules.
22. Deployed-account quota/rate-limit policy and operational credential-management details.
23. Exact authorized manual road/context verification/update workflow.

## Notifications / Audit

24. Exact notification triggers and timing.
25. Delivery channels for each notification type.
26. Exact auditable-event list.
27. Audit-log retention/access behavior if needed.

## Evaluation / Documentation (Does Not Block Core Development)

28. Remaining evaluation-plan details intentionally deferred while development begins.
29. Final synchronization of use-case/activity diagrams and generated TOC/list numbering after implementation behavior stabilizes.
