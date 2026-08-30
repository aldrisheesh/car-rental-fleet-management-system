# Vertical Slice 002 — Identity, Authentication, and Role Foundation

**Status:** Approved for implementation  
**Objective:** Replace the current mock identity assumptions with canonical Supabase Auth-backed identity, session handling, and coarse role authorization while preserving the existing defended frontend and avoiding unresolved business-workflow permissions.

## Purpose

Vertical Slice 001 established the Supabase backend foundation, foundational persistence schema, secure profile defaults, RLS baseline, and hosted development project integration.

The next smallest capability is to establish a canonical authenticated identity layer that later slices can rely on for customer-owned data, Owner/Admin operations, Operations Staff access, secure uploads, and server-side authorization.

This slice must prove that:

- users can authenticate through Supabase Auth;
- application sessions survive normal browser/server navigation;
- authenticated application identity is resolved from the trusted Supabase session and canonical profile row;
- the three defended roles have stable canonical identifiers;
- privileged routes cannot be accessed merely by manipulating frontend state;
- customers cannot self-promote or alter protected role/account state;
- unresolved booking/workflow permissions remain unresolved.

## Relevant Context

Read:

- `codex-context/01-system-ground-truth.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/09-implementation-constraints.md`
- `codex-context/10-open-decisions.md`

Read VS001 only as needed for the established Supabase infrastructure:

- `engineering/sprints/VERTICAL-SLICE-001.md`

Do not infer unresolved permissions or workflow transitions from existing mock UI behavior.

## Canonical Identity Model

The application has exactly three canonical application roles:

- `Owner/Admin`
- `Operations Staff`
- `Customer/Renter`

These values are authorization-sensitive application data.

Do not introduce alternate persisted spellings such as:

- `Admin`
- `Owner`
- `Staff`
- `Customer`
- `Customers / Renters`
- `Renter`

unless an explicit mapping is required temporarily when adapting legacy frontend mock values. Persisted canonical values must remain the three values above.

### Authentication Identity

Supabase Auth `auth.users.id` is the canonical authenticated user identifier.

`public.profiles.id` remains a one-to-one foreign key to `auth.users.id`.

The authenticated user's application role and application account state must be obtained from trusted database/profile state, not from:

- client-supplied role values;
- route parameters;
- localStorage role flags;
- query strings;
- user-editable signup metadata;
- hidden form fields;
- existing mock role selectors.

### New Public Registration

Ordinary public self-registration creates a:

`Customer/Renter`

account only.

Public registration must not provide a mechanism for a user to register themselves as:

- `Owner/Admin`
- `Operations Staff`

Creation/provisioning of internal roles is not part of public registration.

### Internal Role Provisioning

The full administrative workflow for creating or managing internal Owner/Admin and Operations Staff accounts is **not part of VS002** unless a minimal development/bootstrap mechanism is required to validate role authorization.

If a bootstrap mechanism is necessary for development/testing:

- it must be server/database-controlled;
- it must not be exposed as public self-service functionality;
- it must not trust ordinary client metadata;
- it must be documented as development/bootstrap behavior rather than the final internal-user management workflow.

Do not implement a broad staff-management module in this slice.

## Account State

Authentication state and application account state are separate concepts.

Supabase Auth determines whether a valid authentication session exists.

`profiles.account_status` represents application-level account state.

For VS002, the current safe default remains:

`Active`

Do not invent a complete account-status lifecycle.

Do not add statuses such as `Suspended`, `Disabled`, `Pending`, `Banned`, or others unless already required by a frozen specification.

The authorization layer must be structured so that account state can be enforced later without requiring a redesign.

If VS002 enforces account state, only the currently defined `Active` state may be treated as enabled. Do not invent transitions or administrative account-management behavior.

## In Scope

### 1. Supabase Auth Integration

Implement the minimum supported authentication foundation for the current TanStack Start architecture using the existing Supabase project.

Support:

- Customer/Renter registration;
- email/password login;
- logout;
- session restoration;
- authenticated identity resolution;
- appropriate handling of unauthenticated sessions.

Preserve any existing defended login/register presentation where practical rather than redesigning it unnecessarily.

### 2. Server-Aware Session Architecture

Establish session handling appropriate to TanStack Start and Supabase Auth.

The implementation must not rely exclusively on a browser-only Supabase session for authorization.

Provide a trusted server-side mechanism for resolving the authenticated Supabase user and corresponding canonical application profile.

Prefer centralized reusable helpers rather than duplicating auth checks throughout route files.

### 3. Canonical Application Principal

Establish a reusable representation for the current authenticated application principal containing only information necessary for authorization and identity, such as:

- authenticated user ID;
- email where applicable;
- canonical application role;
- application account status.

Do not treat raw user metadata as authoritative for role authorization.

### 4. Coarse Role Authorization

Implement reusable authorization helpers for:

- authenticated user;
- `Customer/Renter`;
- `Operations Staff`;
- `Owner/Admin`.

Authorization must be enforced at trusted server boundaries where protected server data/actions are involved.

Frontend route guards or UI visibility may supplement server enforcement but must not be the sole authorization mechanism.

### 5. Route Protection Foundation

Protect the existing major role-oriented application areas at a coarse level where the mapping is already unambiguous.

At minimum:

- clearly administrative-only areas must require `Owner/Admin`;
- clearly customer-only authenticated areas must require `Customer/Renter`;
- unauthenticated users must not access authenticated-only areas.

Operations Staff access must remain limited to functionality explicitly frozen in `codex-context/02-roles-and-permissions.md`.

Do not invent the unresolved exact Staff-editable booking fields.

If existing route organization makes precise Staff route exposure impossible without implementing later booking rules, protect conservatively and document the limitation rather than expanding Staff privileges.

### 6. Existing Mock Authentication Removal/Isolation

Inspect existing mock authentication, role toggles, route bypasses, hard-coded identities, and role state.

Replace or isolate mock identity behavior where necessary so that actual application authorization no longer depends on it.

Do not remove unrelated mock operational data.

Existing mock booking, vehicle, dashboard, recommendation, payment, rental, and report data may remain in place.

### 7. Profile Self-Service Boundary

Customer/Renter may retain the ability to update ordinary self-profile fields already permitted by VS001, such as:

- `full_name`;
- `phone_number`.

The implementation must preserve the existing prohibition against customer modification of:

- `user_type`;
- `account_status`.

Do not build a complete profile-management feature unless minimally necessary to prove the boundary.

### 8. Authentication Error Handling

Provide clear handling for relevant authentication outcomes such as:

- invalid credentials;
- registration failure;
- missing/expired session;
- unauthorized role;
- unavailable backend/auth provider.

Do not expose sensitive provider internals or credentials in user-facing errors.

### 9. Database / RLS Changes

Add new additive migrations only where required for VS002.

Do not rewrite already-applied VS001 migrations.

Any new policy or helper function must preserve:

- customer own-record isolation;
- non-client-writable role/account state;
- least privilege;
- future compatibility with the frozen role model.

Do not implement booking, payment, rental, document, or other business-domain RLS in this slice.

## Explicitly Out of Scope

Do not implement:

- booking persistence;
- booking status transitions;
- exact Operations Staff editable reservation fields;
- requirement verification;
- requirement/document uploads;
- Supabase Storage;
- payment proof or payment verification;
- rental lifecycle;
- vehicle operational status lifecycle;
- maintenance lifecycle;
- notification delivery;
- audit logging;
- forecasting;
- customer vehicle recommendation logic;
- branch allocation recommendation logic;
- external context APIs;
- staff/customer management CRUD modules;
- password-reset customization beyond what is minimally required by the existing auth UI;
- internal-user invitation workflow unless specifically required as a minimal bootstrap mechanism;
- social/OAuth login;
- MFA;
- advanced session/device management;
- account suspension lifecycle;
- role-management UI.

## Security Requirements

### Role Authority

Application authorization must use canonical trusted profile state.

Never authorize based solely on:

- browser-local role state;
- frontend context state;
- raw signup metadata;
- user-supplied role input;
- URL structure;
- hidden UI controls.

### Customer Registration

Public registration always results in:

`Customer/Renter`

The existing VS001 database default must remain a defense layer.

### Privileged Credentials

The Supabase service-role credential must remain server-only.

Do not import privileged Supabase helpers into browser-reachable modules.

### Session Validation

Do not trust a client-claimed user ID without validating the actual authenticated session.

### Server Authorization

Protected server loaders, functions, API handlers, or mutations introduced in this slice must perform authorization server-side.

### RLS

RLS remains defense in depth.

Do not weaken existing RLS merely to make frontend integration easier.

## Existing Frontend Preservation

The repository already contains significant defended routes and UI.

Preserve:

- visual design;
- major route organization;
- existing defended role-facing screens;
- unrelated mock operational behavior.

Adapt existing login/register/auth UI to the canonical backend where practical.

Do not use VS002 as an opportunity for a broad UI redesign.

## Repository Inspection Required

Before editing, inspect only the areas relevant to VS002, including:

- existing login/register/auth routes or components;
- route layout/protection patterns;
- existing mock user/role state;
- `src/lib/supabase/*`;
- TanStack Start server/client boundaries;
- root/router context;
- existing admin/customer route structure;
- any existing redirects after login/logout;
- current environment configuration;
- current Supabase migrations.

Do not perform another broad repository audit.

If the current routing architecture requires an auth approach different from an assumed generic TanStack pattern, adapt to the actual repository rather than rewriting the application.

## Minimum Role Behavior to Prove

### Unauthenticated User

May:

- access public routes;
- register;
- log in.

Must not:

- access authenticated administrative or customer account areas.

### Customer/Renter

May:

- authenticate;
- access customer-facing authenticated areas;
- read own profile;
- update permitted own profile fields.

Must not:

- access Owner/Admin-only routes;
- access internal Operations Staff functionality;
- change own role;
- change own protected account state.

### Operations Staff

At this slice level, prove only the role identity/authorization foundation.

Do not implement unresolved booking field permissions.

Operations Staff must not automatically inherit Owner/Admin access.

### Owner/Admin

May pass coarse Owner/Admin authorization checks.

VS002 does not yet implement all Owner/Admin business capabilities; it only establishes the identity boundary that later slices use.

## Testing Requirements

Add targeted automated tests where practical for pure authorization/session helpers.

Provider-backed validation should include, when feasible:

1. public registration creates a Customer/Renter profile;
2. attempting to supply privileged role metadata does not create a privileged profile;
3. Customer/Renter login succeeds with valid credentials;
4. logout invalidates the application session;
5. session restoration works across normal navigation/reload;
6. unauthenticated protected-route access is rejected or redirected;
7. Customer/Renter cannot access an Owner/Admin-protected server boundary;
8. Customer/Renter cannot change `user_type`;
9. Customer/Renter cannot change `account_status`;
10. permitted self-profile update still works;
11. an Owner/Admin test/bootstrap account passes Owner/Admin authorization;
12. an Operations Staff test/bootstrap account does not pass Owner/Admin authorization.

Do not commit test credentials or real user passwords.

Temporary provider test users may be deleted after validation where practical.

## Validation

Run repository-supported equivalents of:

- dependency validation;
- targeted authentication/authorization tests;
- lint;
- TypeScript validation if available;
- production build;
- provider-backed authentication checks where configured.

Report provider tests honestly as:

- PASS;
- FAIL;
- BLOCKED.

Do not fabricate Supabase Auth results.

## Definition of Done

VS002 is complete when:

- Supabase Auth is the canonical source of authentication identity;
- public registration creates Customer/Renter only;
- login/logout/session restoration function through the real auth provider;
- application role is resolved from trusted canonical profile state;
- reusable server-side auth/role helpers exist;
- major role-oriented protected areas have coarse access enforcement;
- Owner/Admin and Operations Staff are not self-registerable public roles;
- Customer/Renter cannot self-promote;
- privileged credentials remain server-only;
- unresolved Operations Staff booking permissions remain unresolved;
- existing frontend remains substantially preserved;
- validation results are reported accurately.

## Stop Rule

Do not begin booking persistence, document storage, business workflow transitions, vehicle persistence integration, forecasting, recommendations, payments, rentals, maintenance, notifications, or any later vertical slice after completing VS002.