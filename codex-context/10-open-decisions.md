# Open Decisions

**Status:** Active  
**Last updated:** 2026-08-31

Codex must not invent answers to these items.

The foundational booking, baseline renter-document submission, and baseline Owner/Admin requirement-review rules are now frozen in:

- `03-workflows-and-status-rules.md`
- `11-requirements-and-secure-storage.md`
- `12-requirement-review-and-verification.md`

## Roles / Permissions

1. **Exact Operations Staff editable reservation fields**
   - Staff may encode/update only permitted reservation information, but the exact fields remain unresolved.
   - Staff must not receive raw requirement-document access, requirement verification, payment verification, final booking confirmation, or vehicle-assignment authority.

## Workflow / Status

2. Exact rental lifecycle statuses and allowed transitions.
3. Exact vehicle operational statuses and allowed transitions.
4. Exact maintenance lifecycle statuses and allowed transitions.
5. Detailed cancellation/rejection/reopening behavior and consequences.
6. Exact vehicle-release/turnover transition that begins active rental.
7. Exact return/settlement transition rules that end the rental lifecycle.

## Requirements / Uploads

8. Exact additional document requirements for alternate renter/driver scenarios beyond the baseline self-drive renter.
9. Long-term retention/deletion duration for sensitive renter-document uploads.
10. Exceptional reopening/replacement behavior after a requirement set has already been `Verified`.
11. Whether future client validation requires additional named supporting-document categories as mandatory in a specific alternate scenario.

## Payment Detail

12. Exact proof-of-payment upload constraints and accepted file types.
13. Exact payment-proof replacement/resubmission mechanics.
14. Exact representation of down-payment amount, remaining balance, additional charges, refunds, and final settlement where persisted transactional fields are required.
15. Exact cancellation-related payment/refund handling.

## Fuel / Vehicle Reference Data

16. Final source priority when both manufacturer and Owner/Admin-provided fuel-efficiency values exist.
17. Who may update reference fuel-efficiency values and through which administrative workflow.
18. Whether owner-provided fuel-efficiency values require a source/reference note.

## Allocation Persistence Detail

19. Exact item-level persistence when multiple candidate vehicles are recommended but Owner/Admin approves fewer transfer units.

## APIs / Context

20. Weather/context refresh timing.
21. API caching duration and invalidation rules.
22. Deployed-account quota/rate-limit policy and operational credential-management details.
23. Exact authorized manual road/context verification/update workflow.

## Notifications / Audit

24. Exact notification triggers and timing.
25. Delivery channels for each notification type.
26. Exact auditable-event list beyond the domain-specific review metadata already required for requirement verification.
27. Audit-log retention/access behavior if needed.

## Evaluation / Documentation (Does Not Block Core Development)

28. Remaining evaluation-plan details intentionally deferred while development begins.
29. Final synchronization of use-case/activity diagrams and generated TOC/list numbering after implementation behavior stabilizes.
