# Implementation Constraints for Codex

**Status:** Baseline Frozen  
**Last updated:** 2026-08-24

## Existing Application

The repository already contains a substantial defended frontend implemented with React/TypeScript and TanStack Start-related tooling.

The current application includes significant UI/routes/workflows, but operational data is largely represented by mock/static TypeScript data.

## Primary Implementation Principle

**Build underneath the defended frontend rather than unnecessarily redesigning it.**

Preserve existing UI/UX and route behavior where they remain consistent with the finalized specifications.

## Planned Technical Direction

The current manuscript/implementation direction uses:

- React + TypeScript
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- Radix/shadcn-style UI components
- PostgreSQL/Supabase
- Supabase Auth
- Supabase Storage
- server-side business logic
- role-based access control

## Codex Guardrails

Codex should:

- read this documentation before implementing a module
- treat frozen specification documents as authoritative
- preserve the defended scope
- replace mock operational data incrementally
- keep business logic separate from presentation logic
- validate server-side mutations
- enforce authorization server-side
- use database/storage access controls appropriate to the finalized RBAC
- preserve customer own-record isolation
- protect IDs/licenses/payment proofs
- avoid unnecessary framework rewrites
- avoid adding out-of-scope features
- keep recommendations explainable and advisory
- keep critical operational actions human-controlled
- surface ambiguities instead of guessing

## Existing Mock Data Warning

Current repository mock/sample data, status enums, dashboard values, and UI behavior are implementation scaffolding, not automatically the business source of truth.

When they conflict with a Frozen specification, update the implementation to follow the specification.

## No Premature Scope Expansion

Do not add:

- live GPS
- payment gateway automation
- ML/AI decision models
- automatic dispatch
- advanced route optimization

unless a later approved specification explicitly changes scope.
