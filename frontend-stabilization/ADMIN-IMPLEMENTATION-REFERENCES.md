# Admin Implementation References

## Source authority

This document is the implementation-grade Admin/Operations presentation contract for GitHub Issue #63. It completes references only; it does not authorize application-source work.

Authority is ordered as follows:

1. Current server/API/RPC/RBAC behavior on fetched `origin/main` (`faed190d9b78bb845e2c89e7160eda90106f741f`).
2. `08-BACKEND-CONTRACTS.md`, `07-CAPABILITY-MIGRATION.md`, and the current UI inventory.
3. Frozen workflow, lifecycle, IA, and screen specifications.
4. `DIRECTION-E-DESIGN-SYSTEM.md` and `DIRECTION-E-VISUAL-FREEZE.md` for shared product-family rules.
5. `ADMIN-SCREEN-REFERENCE-MATRIX.md` for surface disposition.
6. The accepted PNGs listed below for composition, hierarchy, density, and responsive intent.

When a specimen value in an image conflicts with live canonical data, live data wins. Names, references, dates, plates, counts, amounts, and timestamps in the PNGs demonstrate hierarchy only; they are not fixtures or policy.

## Shared Direction E system

- Instrument Sans is the Admin UI face. Newsreader is limited to the small operator wordmark; it is not used for page headings, tables, queues, filters, forms, status, or data.
- Shared tokens remain Evergreen `#123F3A`, Road Ink `#182321`, muted text `#52635F`, Rice Paper `#F6F3EC`, white surface, soft neutral `#EFEDE6`, Stone border `#D8D5CC`, and focus `#0B6158`.
- Semantic states remain success `#267A55`, warning `#A45B13`, error `#B43B3B`, information `#2E647B`, and locked `#52635F`. Every state combines words with an icon or other non-color cue.
- The 4 px base/8 px dominant spacing system, 8 px controls, 10 px grouped surfaces, quiet 1 px dividers, and restrained elevation remain shared.
- Buttons remain rectangular, verb-specific, and role/state safe. Navigation uses links; mutations use buttons. Primary actions are Evergreen, not red or gradient.
- Focus uses a clearly visible 2–3 px `:focus-visible` ring with offset. Minimum pointer target is 44 × 44 px.
- Location is labelled operational data, never decorative identity. Vehicle imagery is not part of routine Admin operations.
- Copy is active, direct, and canonical. It does not expose AI/ML, claim automation, invent availability, or turn a request into a confirmed/completed booking.

## Admin-specific visual principles

1. **Attention before metrics.** A queue names work, reason, state, count, and destination before any summary count.
2. **Rows before cards.** Tables and aligned lists carry operational comparison. A bordered surface corresponds to one conceptual or interactive group, not every datum.
3. **One current action zone.** Detail pages foreground the next valid action; future stages appear as state and prerequisites, not disabled button walls.
4. **Status is compact evidence.** Use sentence-case words and one icon. Avoid a colored pill in every cell.
5. **IDs are secondary.** Customer, vehicle, plate, schedule, and branch lead. References remain copyable supporting text.
6. **Derived means derived.** Fleet readiness and fleet state disclose their calculation basis and never appear as new persisted lifecycle values.
7. **Unknown is designed.** Nullable amount, insufficient history, partial external context, and unavailable utilization remain explicit.
8. **No decorative analytics.** A chart appears only when canonical data, exact values, a text alternative, and a useful comparison justify it. This reference set needs no chart.
9. **Role differences change hierarchy.** Staff pages remove inaccessible destinations and mutations; they do not render buttons that fail on submit.
10. **Dense, not cramped.** Desktop rows target 48–56 px, control rows 44–48 px, section gaps 24–32 px, and main gutters 32–40 px. Body text remains at least 14 px on dense desktop and 16 px on touch layouts.

## Role model

### Owner/Admin

Permitted mutation surfaces:

- requirement review and current-document access;
- payment proof access and manual review;
- vehicle assignment/change and booking confirmation;
- rental release and physical return recording;
- fleet/master-data vehicle and branch operations;
- maintenance create, complete, and cancel;
- forecast and supply generation, allocation recommendation decisions, and eligible operational-context requests;
- persisted user-role changes.

Owner/Admin also reads Audit Trail and backup status. A visible action still requires its canonical record state, current snapshot/version, and prerequisites.

### Operations Staff

Permitted reads:

- Dashboard;
- Bookings and safe booking/rental projection;
- requirement and payment summary states attached to booking reads;
- Calendar;
- recipient-scoped Notifications;
- operational Reports.

Read-only differences:

- Booking Detail uses a visible read-only explanation and contains no review, proof, assignment, confirmation, release, or return control.
- Staff does not see requirement documents, payment records/proofs, operational context, Audit Trail, Fleet, Maintenance, Branches, Users & Roles, backup, or Decision Support in the current route model.
- Read-only content is normal-contrast text, not a disabled form. Inaccessible actions are absent.

## Existing references reused

None.

The earlier Direction A dashboard, booking-detail, and decision-support images were inspected as prior evidence and rejected as implementation references. They were too serif-heavy/expansive for operations, compressed state/action logic, and—in Decision Support—contained fabricated geography and analytics.

## New references generated

Raster files are high-resolution renderings of target breakpoints. Desktop references target a 1440 px layout even when the generator export is 1536×1024 or 1487×1058; tablet references target the 768 px composition even when exported at a higher pixel density.

| Path | Screen | Role | Capability / canonical state | Primary task | Supported actions | Unsupported behavior excluded |
|---|---|---|---|---|---|---|
| `implementation-references/admin/DASHBOARD/dashboard-owner-desktop-1440.png` | Dashboard desktop | Owner/Admin | Composed current attention plus dashboard/calendar/review data | Find work needing action now | Open authorized queue/calendar/activity destinations | KPI wall, global search, Settings, Customers, fake trends |
| `implementation-references/admin/DASHBOARD/dashboard-staff-tablet-768.png` | Dashboard tablet | Operations Staff | Staff-safe current snapshot and linked reads | Reach bookings, calendar, or an eligible notification | Open bookings, calendar, notification, read-only detail | Requirement/payment/fleet review queues and Owner controls |
| `implementation-references/admin/BOOKINGS/bookings-desktop-1440.png` | Rental requests list | Owner/Admin and Staff | Six valid specimen lifecycle combinations | Scan customer, vehicle, schedule, request/review/payment/rental state | Search/filter current data; open detail | Export, More filters, bulk mutation, Completed/Settled states |
| `implementation-references/admin/BOOKING-DETAIL/booking-detail-owner-desktop-1440.png` | Booking Detail desktop | Owner/Admin | Submitted; requirements Pending Review; payment locked; assignment available | Review current prerequisite while retaining full booking context | Review requirements; assign active/conflict-free vehicle | Readiness claim, false payment event, reject/cancel, settlement |
| `implementation-references/admin/BOOKING-DETAIL/booking-detail-staff-desktop-1440.png` | Booking Detail desktop | Operations Staff | Same booking projected read-only | Understand lifecycle and selection context | Back to bookings only | Documents, proof, operational context, Audit, mutations |
| `implementation-references/admin/BOOKING-DETAIL/booking-detail-owner-tablet-768.png` | Booking Detail tablet | Owner/Admin | Same canonical state, narrow recomposition | Complete current task without horizontal table compression | Review requirements; assign vehicle | Desktop shrink, hidden focus, sticky overlap, false gate order |
| `implementation-references/admin/REQUIREMENTS-REVIEW/requirements-review-owner-desktop-1440.png` | Requirements Review | Owner/Admin | Pending Review; one Accepted draft and one Needs Replacement draft | Inspect current versions and record a safe manual outcome | Open signed preview; request resubmission; save pending | OCR, extracted identity data, Staff review, third document, storage path |
| `implementation-references/admin/PAYMENT-REVIEW/payment-review-owner-desktop-1440.png` | Payment Review | Owner/Admin | Pending Verification; `required_amount` unavailable | Compare submitted proof/reference/amount and record manual review | Open signed proof; verify; request resubmission; leave pending | Calculated required amount/bill/balance; gateway or auto-approval |
| `implementation-references/admin/FLEET/fleet-owner-desktop-1440.png` | Fleet with vehicle disclosure | Owner/Admin | Derived fleet state and maintenance readiness | Compare current use/readiness and open vehicle work | Add vehicle; open detail; change branch; start/view maintenance | Marketplace grid, GPS, delete, persisted Ready state |
| `implementation-references/admin/MAINTENANCE/maintenance-owner-desktop-1440.png` | Maintenance | Owner/Admin | Readiness attention and selected Open record | Resolve canonical service attention | Create Open record; open vehicle; complete/cancel Open record | Scheduled/In Progress/Overdue record states, mechanic assignment, totals |
| `implementation-references/admin/USERS/users-roles-owner-desktop-1440.png` | Users & Roles | Owner/Admin | Canonical accounts and selected role mutation | Review and change one canonical role | Search/filter; edit/save role; reload stale data | Create/delete/invite, account activation, custom permission editor |
| `implementation-references/admin/REPORTS/reports-desktop-1440.png` | Operational Reports | Owner/Admin and Staff | One valid ≤366-day range; reconciled specimen counts; unavailable utilization row | Read operational activity and data quality | Apply/reset canonical range and branch filters; retry error | Revenue, profit, payment, settlement, export, predictions |
| `implementation-references/admin/DECISION-SUPPORT/decision-support-owner-desktop-1440.png` | Decision Support | Owner/Admin | Insufficient history; no compatible supply snapshot or recommendation | Decide whether evidence is sufficient to proceed | Generate forecast | AI claim, fake forecast chart, context request without eligible review, autonomous movement |
| `implementation-references/admin/AUDIT/audit-trail-owner-desktop-1440.png` | Audit Trail | Owner/Admin | Append-only paginated event projection | Trace who did what, where, and when | Apply/clear supported filters; paginate; disclose details | Edit/delete/export, full-text search, Staff access, role-invalid actors |

## Deep visual extraction

### Dashboard

- **Purpose / primary question:** route attention before passive summary: “What needs your attention now?”
- **Roles / canonical state:** Owner desktop composes authorized requirement, payment, booking, readiness, calendar, and activity sources. Staff tablet limits queues to Bookings, Calendar, and eligible Notifications; shared dashboard counts remain current-state data.
- **Hierarchy:** 32 px sans title → attention queue → today's schedule/current snapshot → recent activity/bookings. Counts never outrank queue labels or actions.
- **Spacing / grid:** 236 px desktop sidebar; 40 px content gutter; queue rows about 64–72 px; lower 7/5 split. Tablet uses 24 px gutters, one primary column, then a readable 2-up summary when space permits.
- **List/status behavior:** icon + task + reason + count + one link. Warning is reserved for work; neutral/info handles observation. No status-cloud or KPI tiles.
- **Controls/actions:** destinations are semantic links. Owner may reach review/fleet/audit surfaces; Staff destinations are role-safe. The first desktop queue link demonstrates the focus ring; implementation applies it to every control.
- **Filtering:** none on Dashboard. Filtering belongs to destination queues.
- **Loading/empty/error:** reserve queue-row geometry; partial endpoint failure stays local to its region; an empty queue says no current work and retains navigation; retry only the failed source.
- **Responsive:** tablet replaces sidebar with one labelled menu and stacks schedule metadata. Never horizontally scroll the entire page.
- **Reusable components:** `AdminShell`, `AdminSidebar`, `CompactAdminHeader`, `AttentionQueue`, `AttentionRow`, `TodaySchedule`, `OperationalSnapshot`, `ActivityList`.
- **Dependencies:** `/api/admin-dashboard`; Owner-only `/api/requirements`, `/api/payments`, `/api/maintenance`; shared `/api/bookings`, `/api/admin-calendar`; recipient `/api/notifications`. Multi-source composition must tolerate partial failure.

### Bookings / Rental Requests list

- **Purpose / primary question:** identify the request whose current state or schedule needs inspection.
- **Role / state:** Owner and Staff receive the same list/read summaries. Detail behavior changes by role. The six specimen sequences are deliberately valid; implementation derives combinations from actual fields.
- **Hierarchy / type:** 32 px title; 14–16 px labels and row identity; 12–13 px references/support. Names and vehicles lead, references follow.
- **Grid / spacing:** one nine-column table with 16 px cell padding and ~64 px rows; schedule and state columns use tabular figures. The table is not placed inside nested cards.
- **Status treatment:** small icon and plain text. Request, Requirements, Payment, and Rental remain separate domains. `Returned` is derived from `ended_at`; it is not a Completed booking status.
- **Control/action hierarchy:** one `Open detail` link per row. No bulk lifecycle mutation or row-menu clutter.
- **Filtering/search:** presentation-level search across loaded ID/customer/vehicle/plate plus supported status and branch filters. Keep state in URL where feasible. Remove nonfunctional Export/More filters.
- **Loading/empty/error:** skeleton rows preserve headers; empty identifies active filters and offers Clear filters; load failure supplies Retry without silently showing mock data.
- **Responsive:** at narrow widths, transform each record into a flat disclosure row: customer/vehicle and next schedule first, four domain states in a labelled definition list, then Open detail. A genuinely tabular desktop region may horizontally scroll only inside a labelled wrapper.
- **Reusable components:** `OperationalTable`, `BookingIdentityCell`, `ScheduleCell`, `DomainStatus`, `TableFilterBar`.
- **Dependencies:** `GET /api/bookings`; no new list endpoint is assumed.

### Admin Booking Detail

- **Purpose / primary question:** establish one operational source of truth and show the single valid next action without hiding later prerequisites.
- **Roles / state:** Owner reference is Submitted + Pending Review + Not Submitted payment + no assignment. Staff reference is the same record projected read-only. Tablet retains Owner actions.
- **Hierarchy:** sticky context header → current-action band → ordered request flow → context/activity rails. Reference ID stays secondary. Owner desktop uses 3 columns (approximately 3/6/3); Staff uses balanced 4/4/4 reading columns because there is no action panel.
- **Typography / spacing:** 32 px sans title, 20 px section labels, 14–16 px body; 24 px panel padding; 16 px row internals; dividers instead of six large modules.
- **Status/action behavior:** Requirements is current; Payment is locked by Requirements; Assignment is independently available; Confirmation is gated by assignment and both reviews; Rental release/return follows Confirmation. Locked items are text/icons, not inert CTA buttons.
- **Role behavior:** Staff sees summary states and canonical Finder context but no document, payment, context, audit, or mutation access. Owner does not see Staff-specific explanatory chrome.
- **Filtering/search:** none. Deep link must encode booking identity; Back restores list scroll and filters.
- **Loading/empty/error:** load the context header and action area together; a missing booking is a not-found state with Back to bookings; 409/stale mutations retain input and require reload; prerequisite failures explain the exact gate.
- **Responsive:** at 768 px, task first, context disclosure second, vertical flow third, collapsed activity last. No whole-page horizontal scrolling or sticky bar covering focus.
- **Reusable components:** `BookingContextHeader`, `CurrentActionPanel`, `BookingFacts`, `BookingFlow`, `LockedStage`, `ActivityRail`, `ReadOnlyRoleNotice`, `FinderContextSummary`.
- **Dependencies:** `GET/POST /api/bookings`; requirement/payment summaries; Owner review APIs; lifecycle RPC snapshots. Activity may use timestamps already returned by booking/review/payment records; do not invent a booking-specific audit feed the API cannot filter.

### Requirements Review

- **Purpose / primary question:** determine whether the two current document versions meet the manual review gates and record a safe customer outcome.
- **Role / state:** Owner/Admin only; Pending Review. Staff has no workspace and no document access.
- **Hierarchy / grid:** booking context → 8-column document list / 4-column sticky outcome form. Exactly two document rows. Current version and signed-open action remain visible without exposing file content.
- **Type / spacing:** 30–32 px title; 18–20 px section headings; 14 px table/form copy; 16–20 px row/form gaps; 48 px inputs.
- **Status/control behavior:** draft outcome is explicitly draft until save. Needs Replacement reveals the required customer-facing reason. Current example makes Request resubmission primary; Verify is unavailable with its complete gate explained.
- **Actions:** secure open, save pending, request resubmission, cancel. A verification state may replace the primary action only when both files Accepted, Identity Consistent, and LTO Clear.
- **Filtering:** queue filtering belongs to the entry surface; detail has none.
- **Loading/empty/error:** signed-link failure is local to the file row; stale version returns 409 and requires reload; missing current file blocks review with a specific message; unsaved draft warns on navigation.
- **Responsive:** stack documents before outcome controls; sticky form becomes normal flow; secure-open stays a 44 px labelled control.
- **Reusable components:** `RequirementDocumentRow`, `SecureFileLink`, `ReviewOutcomeField`, `ReviewGateNotice`, `ReviewActionBar`.
- **Dependencies:** `/api/requirements`; current document IDs/versions; five-minute signed URLs; `record_renter_requirement_review`.

### Payment Review

- **Purpose / primary question:** manually verify the current proof, reference, and submitted amount without inventing billing semantics.
- **Role / state:** Owner/Admin only; Pending Verification. Staff has no queue or detail.
- **Hierarchy / grid:** 4-column queue / 8-column detail; booking context precedes payment facts; proof row and nullable-amount notice precede actions.
- **Type / spacing:** tabular currency/reference/timestamps; 14–16 px facts; 48 px controls; dense 64–72 px queue rows.
- **Status/action behavior:** Pending Verification is text plus clock. Verify is primary; Needs resubmission is secondary and requires a customer-facing reason; Leave pending is tertiary.
- **Critical exclusion:** `required_amount` null produces the explicit unavailable notice. The client never calculates a total, 50% value, balance, or sufficiency.
- **Filtering:** search current customer/reference/vehicle and payment status over authorized data.
- **Loading/empty/error:** no auto-select while loading; no payments gets a true empty queue; signed-link failure stays local; stale proof/amount/reference 409 retains reason and requires reload.
- **Responsive:** queue becomes a selectable list above detail; actions stack; proof metadata wraps without hiding version.
- **Reusable components:** `PaymentQueue`, `PaymentFacts`, `SecureProofRow`, `NullableAmountNotice`, `PaymentReviewActions`.
- **Dependencies:** `/api/payments`; current proof version; submitted amount/reference snapshots; signed private proof URL.

### Fleet / Vehicle disclosure

- **Purpose / primary question:** compare vehicle identity, current use, derived fleet state, and readiness reason, then open the appropriate maintenance/master-data action.
- **Role / state:** Owner/Admin only. Staff has no canonical fleet-list access.
- **Hierarchy / grid:** toolbar → 9/3 table/detail split. The selected vehicle row anchors the disclosure panel. Identity and plate precede derived state.
- **Table behavior:** columns remain consistent: vehicle, category, branch, derived state, readiness, allocation, action. Derived precedence is Inactive → Rented → Maintenance → Reserved → Available.
- **Status treatment:** `Ready — derived` and `Not ready — derived` always include the explanatory calculation note. Do not persist or mutate Ready.
- **Actions:** add vehicle, open details, view/start maintenance, change branch. No delete, live map, or unrestricted profile editor.
- **Filtering:** current list search plus derived state and branch. Filter selection is textually exposed and URL-addressable where practical.
- **Loading/empty/error:** reserve table geometry; a missing readiness result says Unknown and gives Retry; empty filters offer Clear; no fallback mock fleet.
- **Responsive:** priority card/disclosure rows show vehicle/plate, state/readiness, current use, then Open details. The detail rail becomes a sheet or inline disclosure with focus return.
- **Reusable components:** `FleetTable`, `FleetState`, `MaintenanceReadiness`, `VehicleDisclosure`, `CurrentAllocation`.
- **Dependencies:** `/api/admin-fleet`; `/api/master-data`; `/api/maintenance`; canonical readiness calculator.

### Maintenance

- **Purpose / primary question:** identify readiness blockers/due evidence and manage one canonical Open record.
- **Role / state:** Owner/Admin only; selected record Open. Staff's single-vehicle readiness query does not justify this screen.
- **Hierarchy / grid:** attention list first → Open work/history list at 7 columns → selected record at 5 columns. No metric strip.
- **List behavior:** reason and due evidence are separate. `Overdue` may describe due evidence only when the readiness calculation proves it; it is not a record status.
- **Status/actions:** record statuses are Open, Completed, Cancelled. Only Open presents Complete and Cancel; both need confirmation. Create always starts Open.
- **Filtering:** Open work and History are explicit list views, with vehicle/service filtering added only from loaded canonical fields.
- **Loading/empty/error:** independent attention/record loaders; empty states for no attention, no open work, and no history; active-rental conflict stays a warning and is not silently resolved.
- **Responsive:** attention rows stack before work list; selected record opens inline/sheet; destructive Cancel remains spatially separate.
- **Reusable components:** `MaintenanceAttentionList`, `MaintenanceTable`, `MaintenanceRecordPanel`, `DueEvidence`, `ActiveRentalConflictNotice`.
- **Dependencies:** `/api/maintenance`, `/api/vehicles`, readiness summary; atomic create/transition RPC behavior.

### Users & Roles and Branches variation

- **Purpose / primary question:** inspect a canonical management record and perform the one supported mutation.
- **Role/state:** Owner/Admin only. Users permits role change; Branches permits create/edit/activate/deactivate.
- **Hierarchy / grid:** short role/contract explanation → 8/4 management list and selected edit panel. The Users reference is the representative layout.
- **Table/control behavior:** visible Search and Role filter; normal text for role/status; one Edit role link. The role select contains exactly the three canonical roles.
- **Critical exclusions:** no account create/delete/invite/status mutation, custom permission matrix, or self-protection assumption.
- **Branches adaptation:** replace role explainer with branch field guidance; columns become branch name, address/contact fields available in the contract, active state, assigned vehicle count, and action. Deactivate is a state change with confirmation, not delete.
- **Loading/empty/error:** load error with Retry; stale save prevents submission until reload; empty list describes the absence without an Add user action.
- **Responsive:** list rows become definition lists; editor becomes a focus-managed sheet; Save remains visible without covering focused fields.
- **Reusable components:** `ManagementList`, `RecordEditor`, `RoleSelect`, `StaleRecordNotice`; branch-specific fields compose rather than fork the shell.
- **Dependencies:** `/api/admin-users`; `/api/master-data?resource=branches`; vehicle resource for assigned counts.

### Operational Reports

- **Purpose / primary question:** summarize canonical operational activity for one time range and disclose data quality.
- **Role/state:** Owner/Admin and Staff read-only; ≤366 inclusive Manila-day range.
- **Hierarchy:** filters → one open summary strip → booking/maintenance tables → utilization and branch/category tables → scope/state notes.
- **Typography/grid:** tabular numerals; 14 px dense table copy; 5 equal summary columns; 7/5 lower comparison. No chart is needed because exact comparison is clearer in tables.
- **Status/data treatment:** booking statuses remain canonical; returns are rental records, not Completed bookings. Null utilization uses em dash plus `Unable to determine` and insufficiency reason.
- **Actions/filters:** Apply range, Reset to 30 days, branch select, Retry. No export.
- **Loading/empty/error:** each table reserves rows; empty says no records in range; error names the failed report and offers Retry. The raster footer is a state key, not simultaneous production UI.
- **Responsive:** summary becomes a 2-column definition list; each report table prioritizes identity and totals, with labelled local table overflow only where unavoidable.
- **Reusable components:** `ReportFilterBar`, `OperationalSummary`, `ReportTable`, `DataQualityState`, `ReportScopeNotice`.
- **Dependencies:** `/api/admin-reports`; vehicle analytics projection. No payment/revenue source.

### Decision Support

- **Purpose / primary question:** determine whether forecast/supply evidence is sufficient before a human records advice.
- **Role/state:** Owner/Admin route; insufficient history, no compatible supply, no recommendation, no eligible external-context review.
- **Hierarchy / grid:** advisory boundary → 8-column three-stage sequence → 4-column interpretation/source rail. Step numbers communicate a real dependency sequence.
- **Status treatment:** Insufficient, Waiting, Unavailable, and No recommendation are explicit words with neutral/warning cues. No confidence percentage or promotional score.
- **Actions:** Generate forecast only. Supply and allocation actions are absent until prerequisites exist. External-context action is absent when no eligible booking/allocation context is selected.
- **Evidence:** WMA, three historical weeks, forecast horizons, qualification coverage, supply inputs, and missing candidate ranking are visible. Advice never becomes an order.
- **Loading/empty/error:** independent stage loaders; insufficient is distinct from load error; provider partial/unavailable stays advisory; 409/idempotency mismatch asks for reload/reselection.
- **Responsive:** sequence remains vertical; interpretation moves below its relevant stage; wide evidence tables recompose into pair/coverage/result rows.
- **Reusable components:** `AdvisoryBoundary`, `DecisionStage`, `EvidenceList`, `InsufficientDataState`, `OperationalInterpretation`, `ContextAvailability`.
- **Dependencies:** `/api/forecasts`, `/api/supply-evaluations`, `/api/vehicle-analytics`, `/api/allocation-recommendations`; `/api/operational-context` only with eligible context.

### Audit Trail

- **Purpose / primary question:** identify actor, action, entity, details, and Manila timestamp in immutable evidence.
- **Role/state:** Owner/Admin only; append-only page 1 specimen.
- **Hierarchy/grid:** read-only boundary → supported filters → result count/page → single table → pagination and immutability note.
- **Table behavior:** timestamps use tabular figures; actor name and canonical role share a cell; domain/action and entity/reference are paired; disclosure chevron reveals read-only structured details.
- **Actions/filters:** Domain, Actor type, From, To, Apply, Clear, pagination, details disclosure. No edit/delete/export/full-text search.
- **Role accuracy:** Owner/Admin performs protected mutations; Customer/Renter may submit their own requests/documents/proofs; System may create automated notification/reminder events. Staff is not shown performing denied mutations.
- **Loading/empty/error:** skeleton rows preserve columns; no events states the active filter; error offers Retry without dropping filter state.
- **Responsive:** filters move to a sheet or stacked toolbar; event rows become actor/action/entity/timestamp disclosure records. Pagination remains 44 px.
- **Reusable components:** `AuditFilterBar`, `AuditTable`, `AuditActor`, `AuditEventDisclosure`, `Pagination`.
- **Dependencies:** `/api/audit-events`; server-validated domain/actor/date/page/limit.

### Design-system-only surfaces

- **Admin shell/navigation:** use the shell geometry visible across every image. Owner groups Dashboard/Decision Support/Reports, core operations, and lower-frequency management. Staff has only its five authorized destinations. On narrow screens use one labelled disclosure, not horizontal nav plus a competing drawer.
- **Calendar:** month header, previous/next controls, and read-only event list/grid consume `/api/admin-calendar`. At 768 px switch from month grid to date-grouped agenda rows; preserve Manila time and event type text.
- **Branches:** apply the representative management-list pattern described above.
- **Notifications:** use a recipient-scoped chronological list with unread text/icon/weight, Mark read, and real coarse destination. Staff receives only eligible event types. Preference state does not imply provider delivery.

## Admin navigation model

### Owner/Admin desktop

```text
Admin Operations
├── Dashboard
├── Bookings
├── Fleet
├── Calendar
├── Maintenance
├── Decision Support
├── Reports
├── Users & Roles
├── Branches
└── Audit Trail

Utilities: Notifications, account identity, sign out
```

Payment Review and Requirements Review are contextual queue/detail workspaces, not required permanent sidebar destinations. Vehicle Detail is a Fleet disclosure. Backup awareness stays in Notifications/Dashboard. Customers, Settings, global search, and editable Admin Profile are absent.

### Operations Staff desktop

```text
Staff Operations
├── Dashboard
├── Bookings
├── Calendar
├── Notifications
└── Reports

Utility: account identity, sign out
```

The current route model does not expose Decision Support to Staff even though some underlying read endpoints accept Staff. This set follows current navigation authorization and records the mismatch as an implementation question.

## Shared component map

This map identifies visual primitives, not a required file architecture:

| Primitive | Used by | Contract |
|---|---|---|
| `AdminShell` / `AdminSidebar` | All Admin screens | Role-scoped persistent navigation, skip link, main landmark, utilities |
| `CompactAdminHeader` | All | Breadcrumb/current location, notifications where eligible, account menu |
| `AttentionQueue` | Dashboard, maintenance | Task/reason/count/destination rows; no metric-card semantics |
| `OperationalTable` | Bookings, fleet, reports, audit, management | Semantic table, sortable headers where supported, reserved loading rows, narrow disclosure variant |
| `DomainStatus` | All state-heavy screens | Canonical words + icon + optional reason; color is secondary |
| `BookingContextHeader` | Booking, requirements, payment | Customer/vehicle/schedule/branch first; reference secondary |
| `CurrentActionPanel` | Booking Detail | One current valid action and concise prerequisite copy |
| `ReviewPanel` | Requirements, payment | Visible labels, inline reason/error, stale snapshot handling, explicit action hierarchy |
| `SecureFileRow` | Requirements, payment | Current version metadata and signed-open control; no storage path |
| `VehicleDisclosure` | Fleet, maintenance | Identity, current use, derived readiness, supported action links |
| `DecisionStage` | Decision Support | Dependency state, evidence, valid action, insufficiency/error distinction |
| `ReadOnlyRoleNotice` | Staff detail, reports, audit | Explains scope without making content look disabled |
| `EmptyErrorLoadingState` | All async regions | Local state, preserved geometry, valid recovery, restrained live announcement |

## Role-safe action mapping

| Action | Owner/Admin | Operations Staff | Presentation rule |
|---|---|---|---|
| Open booking | Yes | Yes | Destination renders role-specific detail |
| Review requirement documents | Yes, Pending Review/current versions | No | Workspace/control absent for Staff; status summary remains |
| Open payment proof / review payment | Yes, current Pending Verification | No | Queue/destination absent for Staff |
| Assign/change vehicle | Yes, Submitted and current candidate checks | No | Staff sees `Not assigned` only |
| Confirm booking | Yes, assignment + Verified reviews + current snapshots | No | Show prerequisite text until enabled; no Staff button |
| Release vehicle / record return | Yes, Confirmed/current rental gates | No | Render only for eligible Owner state |
| View/manage Fleet | Yes | No full list | Staff shell omits destination |
| View/manage Maintenance | Yes | No full list | Staff shell omits destination |
| Read Reports/Calendar | Yes | Yes | Read-only for both |
| Generate/decide Decision Support | Yes | No current route access | Staff shell omits destination |
| Manage Branches/Users | Yes | No | Owner-only navigation and API |
| Read Audit/backup | Yes | No | Owner-only; backup has no page |
| Mark own notification read | Yes | Yes | Recipient-scoped only |

## Responsive implementation notes

- Validate at 375, 768, 1024, 1440, and 200% zoom even though Admin is desktop-first.
- At ≥1024 px, use the 236–248 px persistent sidebar, 32–40 px content gutters, and up to 12 content columns.
- At ~768 px, replace the sidebar with one labelled menu disclosure. Do not also retain a same-level horizontal module strip.
- Recompose wide operational tables into prioritized record disclosures. Preserve labels for states; do not rely on column position after stacking.
- If a table is genuinely comparative and retained, constrain horizontal scrolling to that labelled region, keep the first identity column visible where feasible, and expose a keyboard-operable affordance.
- Sticky context/action regions must reserve space and use `scroll-padding`/`scroll-margin` so focused controls are not obscured.
- Drawers/sheets restore focus to the trigger, close on Escape, set `aria-expanded`/`aria-controls`, contain overscroll, and prevent background interaction only while modal.
- Use `min-width: 0`, wrapping, and `overflow-wrap: anywhere` for references, emails, plates, filenames, and long reasons. Do not clip essential state.
- Touch layouts keep 16 px entry text and 44 px targets. Summary counts use tabular numerals.

## Accessibility implementation notes

The current Web Interface Guidelines were fetched on 2026-09-13 and applied to the raster acceptance review. The images specify visual behavior; implementation must supply semantics.

- Use semantic headings, nav/main landmarks, skip link, forms, buttons, links, lists, and tables before ARIA.
- Every field has a persistent label. Associate helper/error text with `aria-describedby`; use `aria-invalid`; preserve values. Multi-error forms focus a linked error summary or first invalid field.
- Icon-only utilities need accessible names. Decorative icons beside equivalent text are `aria-hidden`.
- Apply a visible `:focus-visible` ring to every interactive element. Never remove outline without replacement. Sticky UI cannot cover focus.
- Use `<button>` for mutations and `<a>`/router links for navigation. Row selection cannot rely on a clickable `<tr>` or `<div>` alone.
- Sortable headers use buttons and `aria-sort`. Pagination exposes current page. Table disclosures are keyboard reachable.
- Status never relies on color. Read-only is distinct from disabled. Disabled actions use native semantics only when the role is authorized and the current state may later enable them.
- Async updates use one contextual `aria-live="polite"` region; urgent blocking errors use an alert. Toasts do not replace inline review/form state.
- Dates/currency/numbers use `Intl.DateTimeFormat`/`Intl.NumberFormat`, Manila business-time rules, and tabular figures. Do not hard-code production display strings from the images.
- Private file links open only after a successful signed-URL request; external-window behavior is announced. Do not expose storage paths.
- Confirm or provide undo for destructive transitions such as maintenance cancellation and branch deactivation.
- Honor reduced motion; animate opacity/transform only; no `transition: all`. The reference set requires no autoplay or decorative motion.
- Maintain WCAG AA contrast: normal text ≥4.5:1 and meaningful non-text boundaries ≥3:1. The frozen Direction E token pairs already document measured compliant text combinations.
- At 200% zoom, essential content must reflow without horizontal page scrolling or clipped fixed-height rows.

## Image production record

- Mode: built-in image generation; use case `ui-mockup`.
- Style reference: frozen Direction E customer rental-request image for initial family alignment, then the accepted Admin Dashboard for cross-screen consistency.
- Shared final prompt contract: fresh standalone shippable web screen; target breakpoint named; Instrument Sans; Direction E Evergreen/neutral token roles; light operational shell; compact scan rhythm; readable exact labels; canonical state/action/RBAC constraints; no dark chrome, generic KPI wall, nested cards, gratuitous chart, photography, gradient, excessive pills, unsupported data/action, or watermark.
- Screen-specific final prompt constraints are captured in the New references and Deep visual extraction sections. Those constraints—not incidental specimen values—are the prompt set to reuse for any future regeneration.

Regeneration log:

- Bookings was regenerated twice: first for noncanonical `self-drive/with driver` service labels; then for impossible combinations such as Confirmed with pending reviews. The accepted image contains six explicitly valid combinations.
- Owner Booking Detail was regenerated three times: first to separate assignment from confirmation; next to remove readiness-positive assignment language and a premature payment event; finally to constrain activity to exactly two supported requirements.
- Staff Booking Detail was regenerated once to replace invented channel/source/campaign fields with canonical Finder context.
- Tablet Booking Detail was regenerated once to remove an invented third document and clarify that requirement review does not block assignment.
- Requirements Review was regenerated once to remove invented front/back document instructions.
- Users & Roles was regenerated once to correct Staff access and remove implied Settings authority.
- Reports was regenerated once so summary, status, and branch/category specimen totals reconcile.
- Decision Support was regenerated once to remove an operational-context retry when no eligible review exists.
- Audit Trail was regenerated once to remove role-invalid Staff mutations and a false persisted Available-state mutation.
- Dashboard, Payment Review, Fleet, and Maintenance passed their first generation gate.

## Open implementation questions

1. **Detail routes:** Booking Detail, Requirements Review, and vehicle disclosure are not currently deep-linkable routes. Choose stable frontend route shapes without changing APIs or domain behavior.
2. **Dashboard composition:** the single dashboard response does not contain requirement/payment queues or today's calendar rows. Owner Dashboard must compose existing authorized endpoints with local partial-failure handling; Staff must not call or expose Owner-only sources.
3. **Booking activity:** there is no entity-filtered Audit endpoint for a booking. Compose only deterministically available booking/review/payment timestamps in detail, or link to the general Owner Audit Trail; do not fabricate a complete activity feed.
4. **Decision Support Staff mismatch:** several read APIs accept Staff, but current route authorization/navigation excludes the page. This reference set follows the route/RBAC presentation baseline. Expanding Staff navigation needs explicit Lead direction.
5. **Admin profile:** the current form is browser-local and is excluded. Decide whether the account utility remains identity/sign-out only until a server-backed Admin profile contract is authorized.
6. **Customers:** there is no canonical customer management/list API. The unsupported route must not survive as static/demo data; requirement review is already consolidated.
7. **Reference export dimensions:** treat 1440/768 in filenames as intended layout breakpoints. Implement from proportions/tokens, not native PNG pixel dimensions.

## Implementation readiness

**ADMIN REFERENCES COMPLETE WITH MINOR IMPLEMENTATION QUESTIONS**

The questions above concern frontend route/composition decisions and known unsupported legacy surfaces. They do not require guessing about visual hierarchy, responsive behavior, role-safe controls, or canonical domain states, and they do not authorize source work in this session.
