# Vertical Slice 004 — Customer Profile Persistence

**Status:** Approved for implementation  
**Objective:** Make the authenticated Customer/Renter profile fully canonical and Supabase-backed by persisting the remaining stable contact/address fields and removing localStorage as profile truth.

## Purpose

VS002 established Supabase Auth identity and canonical profile fields for:

- full name;
- email;
- phone number;
- role;
- account status.

The existing customer profile UI still stores address information in browser localStorage.

VS004 completes the stable customer profile boundary before booking persistence begins.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/04-data-and-business-rules.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## In Scope

### Canonical Profile Fields

Persist the following stable Customer/Renter profile fields in Supabase:

- `full_name`
- `phone_number`
- street address / house-street-subdivision field used by the defended UI
- `barangay`
- `city_municipality`
- `province`
- `postal_code`

Email remains derived from/authenticated with Supabase Auth and the established profile representation.

Use an additive migration to extend `public.profiles` for the missing address fields.

### Customer Profile Read

The authenticated customer profile page must load its profile from the trusted backend/database rather than localStorage.

The authenticated user must only receive their own profile.

Do not accept a client-supplied user ID as the ownership authority.

### Customer Profile Update

Allow Customer/Renter to update only their own ordinary profile/contact fields:

- `full_name`
- `phone_number`
- address fields listed above.

Continue prohibiting self-modification of:

- `user_type`
- `account_status`
- canonical user ID.

Email editing is not required in this slice.

### Server Boundary

Extend or adapt the existing authenticated profile API/server boundary.

Derive the target profile from the authenticated principal.

Do not create a generic arbitrary-user profile mutation endpoint.

### RLS / Database Permissions

Update database grants/policies additively as required so authenticated customers can safely work with their permitted own-profile fields.

Preserve the VS001/VS002 protections against role/account-state modification.

Owner/Admin customer-management functionality is not part of this slice.

### Frontend Integration

Preserve the existing defended customer profile page.

Replace localStorage-backed profile reads/writes with canonical backend behavior.

After a successful save, the UI must reflect the persisted server response.

A reload/new browser session must restore the same profile data from Supabase.

### Legacy Local Storage

`briahs-customer-profile` and related customer-profile localStorage data must no longer be treated as canonical truth.

Remove or isolate obsolete profile-localStorage behavior where safe.

Do not perform broad unrelated compatibility cleanup.

No automatic migration of arbitrary browser-local profile data into Supabase is required.

## Validation

Validate at minimum:

1. authenticated Customer/Renter can load their own persisted profile;
2. customer can update permitted contact/address fields;
3. changes survive reload/new session;
4. customer cannot modify `user_type`;
5. customer cannot modify `account_status`;
6. customer cannot update another user's profile by supplying another ID;
7. unauthenticated profile access is rejected;
8. existing VS002 auth tests still pass;
9. lint/type/build validation passes;
10. linked Supabase migration/provider checks pass where configured.

Report provider checks as PASS / FAIL / BLOCKED.

## Explicitly Out of Scope

Do not implement:

- booking persistence;
- booking statuses;
- customer document uploads;
- driver's-license/ID handling;
- payment information;
- Owner/Admin customer-management CRUD;
- customer deletion;
- account suspension;
- email-change workflow;
- password-reset redesign;
- rental history;
- recommendation logic;
- notifications;
- Storage.

## Definition of Done

VS004 is complete when:

- all stable fields displayed by the existing customer profile form are Supabase-backed;
- localStorage is no longer canonical customer-profile persistence;
- profile reads and updates derive ownership from authenticated identity;
- customers cannot modify protected authorization fields;
- persisted profile changes survive reload/session changes;
- existing frontend presentation is preserved;
- no booking/document/payment behavior is introduced.

## Stop Rule

Stop after customer profile persistence is complete.

Do not begin booking persistence or VS005.