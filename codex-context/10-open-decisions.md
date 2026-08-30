# Open Decisions

**Status:** Active  
**Last updated:** 2026-08-31

Codex must not invent answers to these items.

The foundational booking, baseline renter-document submission, and baseline Owner/Admin requirement-review rules are frozen in:

- `03-workflows-and-status-rules.md`
- `11-requirements-and-secure-storage.md`
- `12-requirement-review-and-verification.md`

Client-specific operational details that require direct confirmation from Briah's are tracked separately in:

- `14-client-clarification-register.md`

## Decision Handling

An unresolved item falls into one of two categories:

1. **Blocking engineering/business decision**
   - A safe implementation cannot proceed without freezing the behavior.
   - Keep it in this file and resolve it before the dependent slice.

2. **Client-specific clarification with a safe provisional design**
   - Record it in `14-client-clarification-register.md`.
   - A vertical-slice contract may explicitly authorize a conservative/configurable temporary assumption.
   - The assumption must not be represented as client-confirmed truth.

## Roles / Permissions

1. **Exact Operations Staff editable reservation fields**
   - Client confirmation is required.
   - Tracked as `CQ-016`.
   - Until confirmed, use least privilege.
   - Staff must not receive raw requirement-document access, requirement verification, payment verification, final booking confirmation, or vehicle-assignment authority.

## Workflow / Status

2. Exact rental lifecycle statuses and allowed transitions.
3. Exact vehicle operational statuses and allowed transitions.
   - Client terminology/flow is tracked as `CQ-009`.
4. Exact maintenance lifecycle statuses and allowed transitions.
   - Client process is tracked as `CQ-015`.
5. Detailed cancellation/rejection/reopening behavior and consequences.
6. Exact vehicle-release/turnover transition that begins active rental.
   - Tracked as `CQ-008`.
7. Exact return/settlement transition rules that end the rental lifecycle.
   - Tracked as `CQ-014`.

## Requirements / Uploads

8. Exact additional document requirements for alternate renter/driver scenarios beyond the baseline self-drive renter.
   - Tracked as `CQ-005` and `CQ-006`.
9. Long-term retention/deletion duration for sensitive renter-document uploads.
10. Exceptional reopening/replacement behavior after a requirement set has already been `Verified`.
11. Whether future client validation requires additional named supporting-document categories as mandatory in a specific alternate scenario.
   - Tracked as `CQ-005`.

## Payment Detail

12. Exact proof-of-payment upload constraints and accepted file types.
13. Exact payment-proof replacement/resubmission mechanics.
14. Exact monetary representation for down payment, remaining balance, security deposit, additional charges, refunds, and final settlement.
   - Client operational details are tracked as `CQ-001`, `CQ-002`, `CQ-003`, `CQ-012`, `CQ-013`, and `CQ-014`.
15. Exact cancellation-related payment/refund handling.
16. Final production payment-method/account configuration.
   - Tracked as `CQ-004`.

## Rental / Charges

17. Exact rental-extension workflow and approval rules.
   - Tracked as `CQ-010`.
18. Exact late-return penalty trigger/calculation.
   - Tracked as `CQ-011`.
19. Exact damage-charge/penalty matrix.
   - Tracked as `CQ-012`.
20. Exact fuel-return shortage/charge policy.
   - Tracked as `CQ-013`.

## Fuel / Vehicle Reference Data

21. Final source priority when both manufacturer and Owner/Admin-provided fuel-efficiency values exist.
22. Who may update reference fuel-efficiency values and through which administrative workflow.
23. Whether owner-provided fuel-efficiency values require a source/reference note.

## Allocation Persistence Detail

24. Exact item-level persistence when multiple candidate vehicles are recommended but Owner/Admin approves fewer transfer units.

## APIs / Context

25. Weather/context refresh timing.
26. API caching duration and invalidation rules.
27. Deployed-account quota/rate-limit policy and operational credential-management details.
28. Exact authorized manual road/context verification/update workflow.

## Notifications / Audit

29. Exact notification triggers and timing.
30. Delivery channels for each notification type.
31. Exact auditable-event list beyond the domain-specific review metadata already required for requirement verification.
32. Audit-log retention/access behavior if needed.

## Evaluation / Documentation (Does Not Block Core Development)

33. Remaining evaluation-plan details intentionally deferred while development begins.
34. Final synchronization of use-case/activity diagrams and generated TOC/list numbering after implementation behavior stabilizes.
