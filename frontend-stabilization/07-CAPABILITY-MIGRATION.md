# 07 - Capability Migration

**Status:** Repository evidence populated on 2026-09-13; Lead reconciliation required before freeze.

**Verified baseline:** `stabilization/frontend-rebuild`, HEAD `faed190d9b78bb845e2c89e7160eda90106f741f`; identical to fetched `origin/main` and `origin/stabilization/frontend-rebuild` at discovery time.

The legacy frontend is a capability inventory, not a visual template.

## Classification vocabulary
- **PRESERVE** - capability and broad placement remain valid.
- **CONSOLIDATE** - capability remains but is combined into a clearer experience.
- **RELOCATE** - capability remains but moves to a more understandable context.
- **REPLACE** - old presentation/interaction is replaced while preserving behavior.
- **REMOVE** - presentation/capability is removed; requires explicit justification and verification that no required behavior is lost.

| Capability | Current repository evidence | Target experience | Proposed decision | Discovery result / constraint |
|---|---|---|---|---|
| Vehicle browsing | `/`, `/customer-landing`, and `/vehicles`; `GET /api/vehicles` returns active records, while local mock cards/fallback also exist. | Find a Car | CONSOLIDATE | Feasible frontend-only, but ordinary browse has no period/readiness availability contract and must not claim availability. |
| Smart Vehicle Finder | Form inside `/vehicles`; `POST /api/vehicle-finder` deterministically filters active, maintenance-ready, period-conflict-free, capacity- and budget-qualified vehicles. | Integrated discovery/Find a Car journey while preserving deterministic logic | CONSOLIDATE | Verified. Destination is captured but does not affect ranking. Finder inputs/provenance must survive booking handoff. |
| Vehicle detail | No route; `VehicleCard` shows image/name/category/branch/rate/transmission/seats/fuel and links directly to `/booking`. | Vehicle selection/detail | REPLACE | A detail presentation can be frontend-only, but there is no single-vehicle endpoint; data must come from the existing active-vehicle list unless backend work is separately authorized. |
| Booking creation | `/booking`; `GET /api/booking-master-data`; Customer-only idempotent `POST /api/bookings`. | Reserve/trip-details flow | REPLACE | Preserve required vehicle/branches/times/purpose/service method; delivery needs both locations; seats/destination optional; Finder context is revalidated server-side. |
| Customer profile details during booking | Signed-in name/email/phone display read-only from client principal; Customer Profile is server-backed. | Read-only/implicit where safe; edit via profile when appropriate | RELOCATE | Verified direction. Booking creation uses principal phone; a missing/outdated phone cannot be repaired inline by the booking API. |
| Requirements | Newest booking only on `/customer`; reviews duplicated on `/admin/bookings` and `/admin/customers`; `GET/POST /api/requirements`. | Booking Detail lifecycle | CONSOLIDATE | Verified. Preserve exact set states and per-file replacement/version rules. Customer/Admin documents differ; Staff cannot see documents or review. |
| Payment | Status on `/customer`; submission at `/payment-details`; review at `/admin/payments`; `GET/POST /api/payments`. | Booking Detail after verification | CONSOLIDATE | Verified prerequisite (`Verified` requirements) and manual review. Required 50% amount is **not** available canonically; `required_amount` is nullable and unpopulated by repository logic. |
| Customer dashboard/status | `/customer` combines all bookings, payment, newest-booking requirements, notifications, and an always-empty local past section. | My Bookings + Booking Detail/next action | REPLACE | Frontend consolidation is feasible using existing reads, but no persisted Ready, Settlement, or Completed booking states exist. |
| Notifications | Customer panel in `/customer`; Admin/Staff `/admin/notifications`; recipient-scoped `GET/POST /api/notifications`. | Notification center/icon + routed destinations | RELOCATE | Preserve per-recipient reads, unread state, email preference, and role-specific event types. Existing entity links are coarse because no detail routes exist. |
| Contact | `/contact` renders fixed details and a form whose success is a timer only. | Contact | PRESERVE | Contact information may be presented, but form delivery cannot be preserved honestly: no backend mutation/provider contract exists. Lead must choose removal/external link or authorize backend delivery. |
| Admin booking queue | `/admin/bookings` table and selected-row lifecycle panels; `GET/POST /api/bookings`. | Actionable Booking Queue | REPLACE | Preserve search/branch/status filters and all Owner/Admin lifecycle actions. Export/More filters are nonfunctional. Staff must not see Owner/Admin controls. |
| Admin requirements review | Duplicated in Bookings and Customers; atomic review RPC with document versions and gates. | Admin Booking Detail | CONSOLIDATE where feasible | Verified for Owner/Admin only. Preserve Accepted/Needs Replacement, customer reason, identity, LTO outcome, and resulting-state validation. |
| Admin payment review | Separate `/admin/payments`; version/snapshot-safe manual review. | Admin Booking Detail + queue where useful | CONSOLIDATE | Verified for Owner/Admin only. Preserve proof access, Pending Verification gate, verify/resubmit/pending, reason, and stale/amount conflicts. |
| Assignment / confirmation | Selected Submitted booking on `/admin/bookings`; `assign_booking_vehicle` and `confirm_booking_atomic`. | Admin Booking Detail | CONSOLIDATE | Owner/Admin only. Assignment supports substitution/cross-branch acknowledgement and note; confirmation requires Verified requirements/payment and stale-assignment expectations. Assignment does not enforce maintenance readiness. |
| Rental release / return | Selected Confirmed booking on `/admin/bookings`; release and return RPCs. | Admin Booking Detail | CONSOLIDATE | Owner/Admin only. Preserve odometer/fuel/condition/acknowledgements and optimistic concurrency. Return closes rental only; no settlement/completion mutation exists. |
| Fleet | `/admin/fleet`; canonical snapshot plus master-data and maintenance mutations. | Fleet | PRESERVE/REDESIGN | Derived states verified: Inactive, Rented, Maintenance, Reserved, Available. Owner/Admin only. Do not reinterpret as GPS/live location. |
| Maintenance | `/admin/maintenance` plus create action in Fleet; `GET/POST/PATCH /api/maintenance`. | Maintenance | PRESERVE/REDESIGN | Preserve Open -> Completed/Cancelled only and readiness reasons. Full list/summary/mutations are Owner/Admin-only; Staff can only query one vehicle's readiness API. |
| Decision support | `/admin/decisions`; WMA, vehicle analytics, supply, allocation, and external context APIs. | Decision Support | PRESERVE/REDESIGN | Reads generally allow Staff, but current IA exposes the page only to Owner/Admin. Generation/decisions/context are Owner/Admin-only. Outputs are advisory; approved allocation does not execute a transfer. |
| Reports | `/admin/reports`; date/branch-filtered canonical operational aggregates. | Reports | PRESERVE/REDESIGN | Verified for Owner/Admin and Staff. Preserve 366-day maximum, unknown/insufficient utilization, and operational-only scope. |
| Calendar | `/admin/calendar`; month aggregation of booking, rental, and maintenance events. | Calendar | PRESERVE | Verified read-only for Owner/Admin and Staff. |
| Customers | Static `src/data/admin` customer list/KPIs plus canonical requirement review. | Management/Customers | RELOCATE | Current customer management/spend capability is not canonical and Add customer is nonfunctional. Only requirement review is repository-backed. |
| Branches | `/admin/branches`; canonical list/create/edit/activate/deactivate and assigned vehicle count. | Management/Branches | RELOCATE | Verified Owner/Admin-only master-data behavior. |
| Users/Roles | `/admin/users`; canonical profiles and persisted role updates. | Management/Users & Roles | RELOCATE | Verified Owner/Admin-only. Supports role changes only, not account creation or activation/deactivation. |
| Settings | Unlinked `/admin/settings` with hard-coded values and nonfunctional tabs/buttons. | Management/Settings | PRESERVE | Not a preservable backend capability. No settings query/mutation/schema contract was found; pricing/fees/integration controls must not be treated as canonical. |
| Audit Trail | `/admin/activity`; canonical filtered/paginated append-only events. | Not listed in proposed IA | PRESERVE or RELOCATE pending Lead | Implemented Owner/Admin-only capability. Omitting it would be an unapproved loss. |
| Admin/Staff profile | `/admin/profile`; browser-local data only. | Profile/account | REPLACE or REMOVE pending Lead | Not canonical persistence. A server-backed Admin/Staff profile edit contract is absent; do not imply organization-wide saved data. |
| Backup awareness | Owner/Admin-only `GET /api/backup-status` and `backup_attention` notifications; no direct screen. | Notifications / Settings unspecified | RELOCATE pending Lead | Preserve notification behavior. A dedicated backup surface was not found and should not be invented in this pass. |

## Codex discovery requirement

Codex must enumerate every current user-facing route, primary action, form, mutation, meaningful state, and role restriction, then update this matrix. No `REMOVE` decision is valid solely because a screen looks redundant.

The completed route-level evidence is in `evidence/CURRENT-UI-INVENTORY.md`. Rows marked “pending Lead” are intentionally not migration decisions: the repository either lacks a canonical implementation or the proposed information architecture omits an implemented capability.
