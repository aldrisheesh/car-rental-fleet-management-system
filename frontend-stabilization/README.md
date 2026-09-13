# Frontend Stabilization Specification

**Status:** Draft baseline for Lead review  
**Governance:** GitHub Issue #63 — Frontend Stabilization Rewrite — First-Time Renter Guided Experience  
**Working branch:** `stabilization/frontend-rebuild`  
**Phase:** Final System Validation -> Stabilization -> Mock Defense Readiness

## Purpose

This directory defines the product, UX, information-architecture, interaction, and presentation baseline for the final frontend stabilization of the car-rental management system.

The existing frontend is evidence of implemented capabilities and known usability problems. **It is not the visual or information-architecture baseline for the replacement frontend.**

The replacement frontend must preserve canonical backend behavior, business rules, authorization boundaries, domain logic, and implemented capabilities unless a separately Lead-authorized Finding requires otherwise.

## North-star principle

> Design for a first-time renter with zero prior knowledge of car-rental workflows. At every point, the user must understand what they are doing, what they need to do next, and what will happen afterward.

## Authority and conflict rules

For domain/business behavior, use client evidence, approved Lead/MIC decisions, and verified implementation. For frontend presentation and interaction, this specification governs once approved by the Lead.

If this specification conflicts with legacy frontend presentation/navigation, this specification governs the replacement frontend.

If it appears to conflict with canonical backend/domain behavior, **STOP**. Record the conflict and route it to the Lead. Do not silently change schema, lifecycle, authorization, or business rules to make a design easier to implement.

## Scope boundary

This is a stabilization rewrite, not a new feature phase. It may replace navigation, page composition, labels, components, visual design, progressive disclosure, and responsive behavior. It must not casually introduce new business features, algorithms, provider architecture, schema, or lifecycle rules.

## Workflow

1. Work only on `stabilization/frontend-rebuild`, which was created from `main` for Issue #63.
2. Verify branch/baseline state against `origin/main` before discovery.
3. Extract current implementation capabilities and contracts from the checked-out stabilization branch and compare against `origin/main` where needed.
4. Record usability evidence from user testing.
5. Freeze canonical customer/admin journeys and lifecycle states.
6. Freeze information architecture and P0 wireflows.
7. Validate backend feasibility.
8. Approve a small representative visual direction.
9. Implement against existing backend contracts.
10. Run controlled E2E and regression validation.
11. Open a PR from `stabilization/frontend-rebuild` to `main`; merge only after Lead review.

## Freeze rule

Files `01` through `08` become **FRONTEND REBUILD BASELINE - FROZEN** only after explicit Lead approval. After freeze, preference-only changes do not reopen architecture. Concrete usability, accessibility, functional, reliability/security, or traceability defects may reopen a bounded decision through normal QA governance.

## GitHub governance

- Umbrella issue: **#63 — Frontend Stabilization Rewrite — First-Time Renter Guided Experience**.
- Authorized working branch: **`stabilization/frontend-rebuild`**.
- Do not commit frontend-stabilization work directly to `main`.
- Do not create a replacement feature phase (for example VS031) for this effort.
- Discovery is documentation-only until the Lead explicitly authorizes implementation.
- If the desired UX requires a protected backend/domain change, record and report the conflict instead of implementing it silently.
