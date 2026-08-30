# Vertical Slice 001 — Supabase Backend Foundation

**Status:** Approved for implementation  
**Objective:** Establish the minimum Supabase persistence foundation required for later backend slices without changing existing product behavior or inventing unresolved workflow rules.

## Purpose

The current application contains a substantial defended frontend and primarily mock/static operational data. This slice introduces the backend infrastructure needed to migrate those features incrementally to canonical persisted data.

## Goal

After this slice:

- the application has supported Supabase client infrastructure;
- server and browser access are clearly separated;
- required environment variables are validated;
- a Supabase migration structure exists;
- foundational stable entities have an initial schema;
- Row Level Security is enabled on persisted application tables;
- the project can verify backend connectivity;
- existing frontend behavior continues to work unchanged.

## Relevant Context

Read:

- `codex-context/01-system-ground-truth.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/09-implementation-constraints.md`
- `codex-context/10-open-decisions.md`

Do not infer unresolved rules from mock data.

## In Scope

1. Add the supported Supabase JavaScript/TypeScript dependency.
2. Establish reusable Supabase client infrastructure appropriate to the current TanStack Start architecture:
   - browser/client-safe access;
   - trusted server-side access;
   - no service-role secret in browser code.
3. Establish validated environment configuration.
4. Add a `supabase/` migration structure suitable for version-controlled schema changes.
5. Create an initial migration for stable foundational entities only:
   - application user/profile foundation as required by Supabase Auth integration;
   - branches;
   - vehicle categories;
   - vehicles.
6. Use keys, foreign keys, nullability, uniqueness, timestamps, and constraints supported by the frozen business/data specification.
7. Enable RLS on application tables.
8. Add only the minimal initial RLS necessary for a secure foundation. Do not invent unresolved Operations Staff permissions.
9. Establish a database type-generation/consumption location or documented workflow appropriate to the repository.
10. Add a minimal server-side backend connectivity/health mechanism suitable for local development.
11. Add targeted automated tests where practical for environment/configuration or pure infrastructure helpers.
12. Preserve the existing frontend and existing mock-data-backed screens.

## Explicitly Out of Scope

Do not implement:

- real customer registration/login flows;
- final RBAC behavior;
- booking persistence;
- requirement uploads;
- Supabase Storage;
- payment persistence or verification;
- rental lifecycle;
- maintenance lifecycle;
- notifications;
- audit logging;
- forecasting;
- vehicle recommendation;
- branch allocation;
- external context APIs;
- realtime;
- replacement of existing mock UI data;
- any unresolved status enum or transition;
- any feature redesign.

## Architecture Rules

- Build underneath the existing frontend.
- Do not rewrite the application architecture unnecessarily.
- Browser code must never receive privileged Supabase credentials.
- Server-side mutations and privileged data access must remain at trusted boundaries.
- RLS is defense in depth, not a replacement for server authorization.
- Mock/static data is scaffolding, not schema authority.
- Do not convert unresolved manuscript decisions into database constraints.
- Prefer additive and reversible migrations.

## Repository Inspection Required

Before editing, inspect:

- current `package.json`;
- TanStack Start/server entry configuration;
- existing auth mock/helpers;
- existing vehicle and branch mock structures;
- current TypeScript path/import conventions;
- existing deployment configuration.

If the current architecture makes any planned item inappropriate, stop and report the blocker instead of forcing a generic Supabase pattern into the repository.

## Validation

Run the repository-supported equivalents of:

- dependency installation;
- lint;
- TypeScript/build validation;
- production build;
- any targeted tests added by the slice.

If local Supabase CLI/provider credentials are unavailable, do not fabricate migration execution or provider-validation results. Report them as not run or blocked.

## Definition of Done

The slice is complete when:

- Supabase infrastructure is integrated without exposing privileged secrets;
- foundational migration files are version-controlled;
- foundational tables are protected by RLS;
- environment handling fails clearly when required configuration is missing;
- the existing frontend still builds;
- no unresolved business workflow was invented;
- no mock UI data was prematurely replaced;
- validation results are reported accurately.

## Stop Rule

Do not begin authentication, booking, vehicle persistence integration, or any later slice after completing VS001.