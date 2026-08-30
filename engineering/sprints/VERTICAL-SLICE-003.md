# Vertical Slice 003 — Branch and Vehicle Persistence

**Status:** Approved for implementation  
**Objective:** Replace the current mock/static branch and vehicle master-data behavior with canonical Supabase-backed persistence while preserving the defended frontend and avoiding unresolved operational lifecycle rules.

## Purpose

Vertical Slice 001 established the Supabase persistence foundation and created the foundational tables:

- `branches`
- `vehicle_categories`
- `vehicles`

Vertical Slice 002 established canonical authentication, application identity, and coarse role authorization.

The next smallest coherent capability is to make branch and vehicle master data genuinely persistent and Owner/Admin-managed.

This slice establishes canonical CRUD/read behavior for branch, vehicle-category, and vehicle reference data without implementing booking, rental, maintenance, utilization, forecasting, or branch-allocation workflows.

## Relevant Context

Read:

- `codex-context/01-system-ground-truth.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/09-implementation-constraints.md`
- `codex-context/10-open-decisions.md`

Read the completed prior slice contracts only as needed:

- `engineering/sprints/VERTICAL-SLICE-001.md`
- `engineering/sprints/VERTICAL-SLICE-002.md`

Do not infer operational status transitions or later business logic from current mock fleet data.

## Capability Boundary

VS003 concerns **master/reference data only**.

It answers:

- What branches exist?
- What vehicle categories exist?
- What vehicles exist?
- Which branch is a vehicle currently assigned to as master data?
- What stable reference attributes are recorded for a vehicle?

It does **not** answer:

- whether a vehicle is currently rented;
- whether a vehicle is currently under maintenance;
- whether a vehicle is eligible for recommendation;
- whether a vehicle is idle;
- whether a vehicle should be transferred;
- whether a vehicle is available for a booking;
- whether maintenance is due;
- whether a branch has shortage or surplus.

Those belong to later slices.

## Canonical Persistence

Supabase/PostgreSQL is the canonical persisted source for:

- branches;
- vehicle categories;
- vehicles.

Existing frontend/mock structures may be used as migration or presentation references but are not schema authority.

Do not preserve mock-only fields merely because they already exist in the UI if they conflict with the approved data model.

## In Scope

### 1. Branch Read Integration

Replace mock/static branch reads in the relevant defended branch-management and fleet interfaces with canonical database-backed reads.

Branch records currently include the VS001 foundation fields:

- `id`
- `name`
- `address`
- `is_active`
- `created_at`
- `updated_at`

Use additive migrations if additional stable branch fields are clearly required by the existing defended interface and supported by the frozen specification.

Do not invent operational branch metrics in this slice.

### 2. Branch Management

Owner/Admin may:

- view branches;
- create a branch;
- update stable branch master data;
- activate/deactivate a branch where supported by the existing `is_active` field.

Branch changes must persist to Supabase.

Operations Staff must not receive branch-management mutation privileges.

Customer/Renter must not receive branch-management mutation privileges.

Do not hard-delete branch records that may become referenced operational records unless the current schema and use case make deletion demonstrably safe.

Prefer activation/deactivation over destructive deletion.

### 3. Vehicle Category Read Integration

Replace mock/static vehicle-category reads in relevant interfaces with canonical persisted category data.

Existing fields include:

- `id`
- `name`
- `description`
- `is_active`
- `created_at`
- `updated_at`

Owner/Admin may manage stable category master data where required by the current defended interface.

Do not implement forecasting-category aggregation logic in this slice.

### 4. Vehicle Read Integration

Replace mock/static vehicle master-data reads in the relevant fleet-management interfaces with canonical persisted vehicle reads.

Existing VS001 vehicle fields include:

- `id`
- `name`
- `category_id`
- `branch_id`
- `license_plate`
- `transmission`
- `fuel_type`
- `seat_capacity`
- `daily_rate`
- `reference_fuel_efficiency_km_per_liter`
- `image_url`
- `is_active`
- `created_at`
- `updated_at`

Use joined branch/category information as needed for presentation.

Do not duplicate branch or category names into the vehicle table when the existing foreign keys are sufficient.

### 5. Vehicle Management

Owner/Admin may persist stable vehicle master-data changes.

At minimum, where supported by the defended interface, allow Owner/Admin to:

- create a vehicle;
- edit vehicle master/reference attributes;
- assign/change the vehicle's current master branch;
- assign/change vehicle category;
- activate/deactivate a vehicle.

Do not implement rental availability or maintenance readiness as an editable master-data status.

Do not invent a final vehicle operational-status state machine in this slice.

### 6. Stable Validation

Enforce reasonable stable validation for master data, including where applicable:

- required vehicle name;
- valid branch reference;
- valid category reference;
- unique non-empty license plate when supplied;
- positive seat capacity when supplied;
- non-negative daily rental rate when supplied;
- positive reference fuel-efficiency value when supplied.

Normalize empty optional text values consistently.

Do not introduce unsupported business thresholds.

### 7. Server-Side Authorization

All Owner/Admin branch/category/vehicle mutations must be authorized at a trusted server boundary using the VS002 canonical principal.

Do not rely solely on:

- hidden buttons;
- client role state;
- route visibility;
- the unsigned client-view cookie.

Operations Staff must not be able to perform vehicle, branch, or category mutations through direct API/server requests.

Customer/Renter must not be able to perform those mutations.

### 8. Database Access / RLS

Add additive migrations as needed to establish appropriate access policies.

Required principles:

- Owner/Admin can perform required branch/category/vehicle management through trusted server-side paths.
- Operations Staff does not gain management rights.
- Customer/Renter does not gain management rights.
- authenticated customer-facing vehicle browsing may read only the reference data needed for customer-facing vehicle discovery if already required by the defended frontend.
- do not expose privileged mutation access directly to arbitrary authenticated clients merely because server functions exist.

The existing service-role/server boundary may be used where consistent with the established architecture, but authorization must occur before privileged database mutation.

Do not weaken RLS globally.

### 9. Customer-Facing Vehicle Reference Reads

Where the existing customer-facing frontend already displays vehicle information, it may begin reading canonical vehicle/category/branch reference data from Supabase if doing so does not require implementing later recommendation or booking logic.

Customer-facing reads may expose ordinary vehicle reference information appropriate for browsing, such as:

- vehicle name;
- category;
- branch;
- transmission;
- fuel type;
- seat capacity;
- daily rate;
- public vehicle image/reference;
- active/inactive filtering as appropriate.

Do not expose administrative-only operational fields or future sensitive data.

### 10. Existing Frontend Preservation

Preserve the defended presentation and route organization.

Do not redesign the fleet or branch interfaces.

The goal is to replace their backing master data, not recreate their UI.

If some screen contains mock-only derived metrics that depend on future rental, maintenance, or booking data, keep those portions isolated/mock-backed for now rather than inventing backend calculations.

Clearly avoid presenting mock-derived operational metrics as if they are canonical database values.

## Data Seeding / Migration Strategy

The current frontend contains existing sample/demo vehicle and branch data.

Codex must inspect the actual mock dataset before deciding whether to seed it.

Preferred rule:

- preserve the already-established real branch seed data where appropriate;
- seed only data necessary to keep the defended prototype usable during development;
- distinguish development/sample seed data from real operational client data;
- do not silently treat prototype data as verified real business records.

If existing UI assets or vehicle records are needed for continuity, use a deterministic development seed/migration strategy rather than client-side localStorage as canonical persistence.

Do not commit sensitive or personal client data.

## Vehicle Image Scope

VS003 may preserve existing public/static vehicle image references.

Do not introduce Supabase Storage upload workflows in this slice.

Vehicle-image uploading, replacement, storage policy, or asset-management workflows are out of scope unless already technically unavoidable.

## Reference Fuel Efficiency

The existing vehicle field:

`reference_fuel_efficiency_km_per_liter`

may be persisted and edited by Owner/Admin as stable reference data.

However:

- do not calculate estimated trip fuel consumption yet;
- do not invent source-priority rules;
- do not claim it represents measured real-world fuel efficiency;
- do not implement automated fuel-efficiency retrieval.

The open source-priority/source-note decisions in `04-data-and-business-rules.md` remain unresolved.

## Explicitly Out of Scope

Do not implement:

- booking persistence;
- booking conflicts;
- booking availability calculations;
- requirement/document handling;
- payments;
- rental lifecycle;
- return/settlement workflow;
- vehicle operational status state machine;
- maintenance records or maintenance readiness;
- current odometer lifecycle beyond any already-approved stable field;
- utilization;
- idle detection;
- projected supply;
- shortage/surplus;
- WMA forecasting;
- customer recommendation logic;
- branch allocation recommendation;
- branch-transfer workflow;
- context-aware APIs;
- notifications;
- audit logging;
- Storage uploads;
- realtime synchronization unless minimally required by existing framework behavior;
- destructive migration of unresolved mock operational data.

## Authorization Matrix

### Owner/Admin

May:

- view all branch/category/vehicle master data;
- create/update allowed branch master data;
- create/update allowed vehicle-category master data;
- create/update allowed vehicle master data;
- activate/deactivate applicable master records;
- assign a vehicle's current master branch/category.

### Operations Staff

May not:

- create/edit/delete branches;
- create/edit/delete vehicle categories;
- create/edit/delete vehicles;
- change vehicle branch assignment;
- change vehicle reference data.

Any read access should be limited to what later reservation coordination actually requires and should not be expanded merely for convenience.

### Customer/Renter

May:

- read applicable active public vehicle reference data used by existing customer-facing browsing.

May not:

- mutate branch/category/vehicle master data;
- view administrative-only management surfaces solely because read APIs exist.

## Error Handling

Handle at least:

- invalid input;
- duplicate license plate;
- invalid branch/category relation;
- unauthorized mutation;
- missing record;
- provider/database failure.

Do not expose raw database errors, SQL, or privileged provider details to users.

## Testing Requirements

Add targeted tests where practical for:

- master-data validation;
- authorization of Owner/Admin mutations;
- rejection of Operations Staff mutations;
- rejection of Customer/Renter mutations;
- active/public read behavior;
- invalid foreign-key/reference input;
- duplicate license-plate handling.

Provider-backed validation should verify, when feasible:

1. branch records are read from Supabase;
2. Owner/Admin can create/update a development branch record;
3. Operations Staff cannot perform branch mutation;
4. Customer/Renter cannot perform branch mutation;
5. vehicle categories are read from Supabase;
6. Owner/Admin can create/update a development vehicle record;
7. invalid branch/category references are rejected;
8. duplicate license plate is rejected;
9. customer-facing active vehicle reads work where integrated;
10. persisted changes survive application reload/restart and are not sourced from localStorage/mock state.

Use disposable test records and clean them up where practical.

Do not commit real credentials or sensitive data.

## Validation

Run repository-supported equivalents of:

- targeted VS003 tests;
- existing auth tests;
- lint;
- TypeScript validation if available;
- production build;
- linked Supabase migration validation;
- provider-backed CRUD checks where configured.

Report checks honestly as:

- PASS
- FAIL
- BLOCKED

Do not fabricate provider results.

## Definition of Done

VS003 is complete when:

- branch master data is canonically persisted;
- vehicle-category master data is canonically persisted;
- vehicle master data is canonically persisted;
- relevant defended frontend screens read canonical persisted data;
- Owner/Admin mutations persist through trusted server boundaries;
- Operations Staff and Customer/Renter cannot perform administrative master-data mutations;
- vehicle branch/category relationships use canonical foreign keys;
- customer-facing vehicle reference reads are canonical where included;
- existing mock operational calculations remain isolated rather than being falsely converted into authoritative backend values;
- no unresolved vehicle/rental/maintenance lifecycle was invented;
- existing visual design is substantially preserved;
- validation results are reported accurately.

## Stop Rule

Do not begin booking persistence, maintenance, rental lifecycle, forecasting, recommendation logic, branch allocation, document storage, payments, notifications, or any later vertical slice after completing VS003.