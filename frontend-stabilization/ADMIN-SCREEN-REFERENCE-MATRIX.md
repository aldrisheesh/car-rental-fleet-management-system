# Admin Screen Reference Matrix

**Status:** Admin/Operations reference-planning authority for GitHub Issue #63

**Branch:** `stabilization/frontend-rebuild`

**Evidence date:** 2026-09-13
**Scope:** Reference completion only. This matrix does not authorize application-source, API, schema, or RBAC changes.

## Source boundary

The matrix was reconciled against fetched `origin/main` (`faed190d9b78bb845e2c89e7160eda90106f741f`), the working branch, current Admin/Staff routes, server APIs and RPC-backed behavior, the frontend-stabilization frozen documents, and the current UI inventory. The legacy frontend is capability evidence, not a visual template.

Canonical roles are exactly `Owner/Admin`, `Operations Staff`, and `Customer/Renter`. An active principal is required. Server authorization remains authoritative even when a legacy route guard or control is broader.

## Disposition vocabulary

- **A. EXISTING ACCEPTED REFERENCE** — an existing Admin image is sufficiently current and implementation-grade.
- **B. NEW IMAGE REQUIRED** — implementation would otherwise require material visual or interaction guessing.
- **C. DESIGN-SYSTEM-ONLY — no separate image required** — a shared accepted pattern plus the implementation notes fully specifies the surface.
- **D. NOT CANONICALLY SUPPORTED** — the current repository has no truthful server-backed surface or action to present.
- **E. DUPLICATE / CONSOLIDATED** — the capability remains, but is represented inside another canonical surface rather than as another page image.

## Matrix

| # | Current route / capability | Target surface | Owner/Admin capability | Operations Staff capability | Canonical backend source | Visual-reference disposition |
|---:|---|---|---|---|---|---|
| 1 | `/admin` shell, sidebar, compact navigation, account utility | Persistent `AdminShell` and role-scoped operational navigation | All supported Admin destinations; notifications and account menu | Dashboard, Bookings, Calendar, Notifications, Reports; no hidden-route mutation shortcuts | Auth principal from `/api/auth/session`; `canAccessAdminPath`; each destination's server guard | **C** — shell, navigation, focus, responsive disclosure, and active-state rules are shared across all new images |
| 2 | `/admin` dashboard | Attention-first Operations Dashboard | Open canonical requirement, payment, submitted-booking, calendar, and readiness work where the corresponding API permits access | Open booking detail, Calendar, Reports, and recipient notifications; requirement/payment/readiness management is absent, not disabled | `/api/admin-dashboard`; composable Owner-only `/api/requirements`, `/api/payments`, `/api/maintenance`; shared `/api/bookings` and `/api/admin-calendar` | **B** — Owner desktop 1440 and Staff tablet 768 references |
| 3 | `/admin/bookings` queue | Bookings / Rental Requests list | Read all bookings and requirement/payment summary states; open detail | Same booking read projection and summary states; open read-only detail | `GET /api/bookings` | **B** — new 1440 operational-table reference; role-neutral list with role-specific destination behavior |
| 4 | Selected row inside `/admin/bookings`; no detail route today | Deep-linkable Admin Booking Detail | Assign/change vehicle, confirm, release, return, and open the authorized review workspaces when state permits | Read booking, Finder context, requirement/payment summary states, and safe rental timestamps only; no documents, payment records, operational context, or mutations | `GET/POST /api/bookings`; booking lifecycle RPCs; `/api/requirements`; `/api/payments`; Owner-only `/api/operational-context` | **B** — separate Owner desktop, Staff desktop, and Owner narrow/tablet references because action hierarchy materially changes |
| 5 | Requirement review duplicated in `/admin/bookings` and `/admin/customers` | Requirements Review workspace linked from booking context and attention queues | Open current signed documents; record Accepted/Needs Replacement outcomes, safe customer reasons, identity consistency, LTO outcome, and resulting review state | May read the requirement-set status for a known booking; documents and review controls are absent | `GET/POST /api/requirements`; `record_renter_requirement_review`; private signed document URLs | **B** — Owner desktop reference; Staff difference is documented in Staff Booking Detail, not duplicated as a false review page |
| 6 | `/admin/payments` | Payment Review queue/detail workspace linked from booking context | Open current proof; verify, request resubmission with reason, or leave pending using current submission snapshots | No payment list, proof, or review access; no Payment Review destination | `GET/POST /api/payments`; `review_payment_atomic`; private signed proof URL | **B** — Owner desktop reference only |
| 7 | `/admin/calendar` | Operational Calendar | Read month reservations, pickups, returns, maintenance, and due events | Same read-only calendar | `GET /api/admin-calendar?month=YYYY-MM` | **C** — established month/list pattern; responsive and state behavior documented without a separate image |
| 8 | `/admin/fleet` | Fleet / Vehicles operational list | Read fleet snapshot; add a vehicle; update canonical branch; open supported vehicle/maintenance context | No fleet-list API or route access | `GET /api/admin-fleet`; Owner-only `/api/master-data`; `/api/maintenance` | **B** — new 1440 scan-first table/list reference |
| 9 | Fleet cards/table; no dedicated route | Vehicle operational detail disclosure | Read identity, branch/category, derived fleet state, readiness reasons, allocation/rental context; use only existing vehicle/maintenance mutations | No canonical full-vehicle detail access; single-vehicle readiness query is not a general Fleet surface | `/api/admin-fleet`; `/api/master-data`; `/api/maintenance?vehicleId=…`; booking/rental snapshot contained by fleet contract | **E** — consolidated as a row disclosure/detail panel within the Fleet reference; no invented standalone route |
| 10 | `/admin/maintenance`; create also appears in Fleet | Maintenance list, attention, and record workflow | Read full records/readiness; create Open record; complete or cancel Open records | No maintenance list or mutations; a known vehicle readiness query alone does not justify a Staff screen | `GET/POST/PATCH /api/maintenance`; canonical readiness calculation and maintenance RPCs | **B** — new 1440 maintenance reference; Fleet's create shortcut links here rather than duplicating the form |
| 11 | `/admin/decisions` | Decision Support advisory workspace | Read and generate forecasts/supply/allocation; record advisory allocation decision; request external context | Although several read APIs allow Staff, current canonical route access does not expose this destination; no Staff reference is authorized | `/api/forecasts`; `/api/supply-evaluations`; `/api/vehicle-analytics`; `/api/allocation-recommendations`; Owner-only `/api/operational-context` | **B** — fresh 1440 reference using canonical insufficiency/advisory states, not fabricated analytics |
| 12 | `/admin/reports` | Operational Reports | Read date/branch-filtered reports | Same read-only reports | `GET /api/admin-reports` and canonical vehicle-analytics data; maximum inclusive range 366 days | **B** — new 1440 reference; operational tables and supported totals only, no revenue/export invention |
| 13 | `/admin/customers` static customer cards plus canonical requirement review | No standalone Customer Management surface in the stabilized baseline | No canonical customer-list/add/edit API; requirement review survives elsewhere | No route access and no customer-management API | None for customer management; only `/api/requirements` is canonical | **D** — exclude fabricated profiles, spend, KPIs, and Add customer; preserve requirement review in row 5 |
| 14 | `/admin/branches` | Branches management list | Read/create/edit/activate/deactivate canonical branches and view assigned-vehicle count | No route or master-data access | Owner-only `GET/POST/PATCH /api/master-data?resource=branches` plus vehicle resource for counts | **C** — use the representative management-list pattern defined by Users & Roles, with branch-specific field/action variations documented |
| 15 | `/admin/users` | Users & Roles management list | Read canonical accounts and change a persisted role | No route or API access | Owner-only `GET/PATCH /api/admin-users` | **B** — representative 1440 management-list image; no create, delete, activate/deactivate, or invented permission editor |
| 16 | `/admin/activity` | Audit Trail | Read/filter/paginate append-only events | No route or API access | Owner-only `GET /api/audit-events` | **B** — new 1440 immutable operational-table reference |
| 17 | `/admin/notifications`; shared `NotificationsPanel` | Operational Notification Center | Read own items, mark owned item read; receive role-eligible operational events | Same recipient-scoped behavior, with Staff-eligible event types only | `GET/POST /api/notifications` | **C** — shared list/empty/error pattern and destination mapping; no separate image required |
| 18 | `/admin/profile` browser-local form | Canonical Admin/Staff profile editing | Authenticated identity may be shown, but local-only edits cannot be presented as durable server data | Same limitation; Staff identity fields are locally read-only but not canonical persistence | No Admin/Staff profile API; only session principal is canonical | **D** — exclude editable Admin Profile until a server-backed contract exists; account menu may show principal name/role |
| 19 | Unlinked `/admin/settings` | No Settings destination | Hard-coded business, fee, integration, and security controls are unsupported | No access | No API/schema-backed settings contract | **D** — exclude Settings and all functioning-looking settings controls |
| 20 | Owner-only `/api/backup-status`; backup notifications | Backup attention inside Notifications / Dashboard only when an actual recipient event exists | Read API exists, but no dedicated screen or user mutation exists | No backup-status API access; only role-eligible notifications | Owner-only `GET /api/backup-status`; `backup_attention` notification | **E** — no invented backup page; consolidate awareness into Notifications and a truthful attention row when data is available |
| 21 | Vehicle categories through master data; no category route | Category choices within Fleet vehicle forms and report filters | Read/create/update API exists, but current UI does not establish a standalone management destination | No access | Owner-only `/api/master-data?resource=categories` | **E** — consolidate into Fleet-supported forms/filter data; no generic master-data tab screen |
| 22 | Nonfunctional global Admin search field / command hint | Surface-local search and filters only | Use only implemented client-side or server-supported filtering on the current dataset | Same on Staff-visible surfaces | Booking local filtering; Audit query filters; Reports query range/branch; Users/Branches/Fleet current list filters | **D** — exclude a global search/command palette until navigation and search behavior exist |

## Totals

| Classification | Count |
|---|---:|
| A. Existing accepted reference | 0 |
| B. New image required | 11 |
| C. Design-system-only | 4 |
| D. Not canonically supported | 4 |
| E. Duplicate / consolidated | 3 |
| **Total surfaces/capabilities** | **22** |

## Prior Admin concept disposition

The existing Direction A dashboard, booking-detail, and decision-support concepts are retained only in Git history/art-direction evidence. None is accepted as an implementation reference:

- Dashboard uses Home-scale serif hierarchy and an overlarge decorative greeting; its work queues include specimen states not available from the single dashboard response and do not model Staff's reduced destinations.
- Booking Detail makes an internal-style reference prominent, compresses review decisions into one dark panel, and does not provide the distinct Staff source-of-truth hierarchy now required.
- Decision Support contains fabricated Auckland/Christchurch/Wellington analytics and resembles a generic analytics dashboard rather than the current WMA/supply/allocation workflow.

## Required output set implied by the matrix

The 11 **B** rows require 14 standalone files because Dashboard and Booking Detail need responsive/role variants:

1. Dashboard — Owner desktop 1440.
2. Dashboard — Staff tablet 768.
3. Bookings / Rental Requests — desktop 1440.
4. Booking Detail — Owner desktop 1440.
5. Booking Detail — Staff desktop 1440.
6. Booking Detail — Owner tablet/narrow 768.
7. Requirements Review — Owner desktop 1440.
8. Payment Review — Owner desktop 1440.
9. Fleet — Owner desktop 1440, including vehicle detail disclosure.
10. Maintenance — Owner desktop 1440.
11. Users & Roles — Owner desktop 1440 representative management-list pattern.
12. Reports — Owner/Staff read-only desktop 1440.
13. Decision Support — Owner desktop 1440.
14. Audit Trail — Owner desktop 1440.

No Customer-facing image and no application source is in scope.
