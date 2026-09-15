# Direction A Validation Concepts

This folder extends the approved **Direction A — Premium Contemporary Mobility** visual grammar across exactly four validation concepts. It does not change the frozen workflow, information architecture, lifecycle, backend contracts, or role rules, and it is not frontend implementation.

## Visual system

- **Palette:** Night Asphalt `#16232C`, Road Ivory `#F4F2EC`, Tail-light Red `#C63F35`, Windshield Blue `#A9C9D5`, Concrete Mist `#D8D9D4`, and white. Coral remains a brand action color; informational waiting, warning, success, and error states use independent semantic treatments.
- **Typography:** a Newsreader-like editorial serif is reserved for short customer display lines, vehicle identity, and major Admin headings. A Public Sans-like face carries navigation, controls, operational copy, and tabular facts.
- **Customer density:** calm, visual, guided, spacious, and reassuring. Large vehicle photographs and open comparison rows replace an ecommerce grid.
- **Admin density:** precise, compact, scan-first, and minimally photographic. A narrow dark navigation rail, restrained dividers, aligned rows, and a single vertical attention/booking route replace a KPI-card wall.
- **Signature structure:** the Direction A road/odometer metaphor becomes an editorial comparison baseline, a compact customer journey strip, an Admin attention route, and an operational booking spine.
- **Interaction direction:** 44 px minimum controls, one visually dominant action per decision point, a 3 px Windshield Blue focus treatment, labelled icon controls, and no critical hover-only action.

## Concept inventory

### Customer — Find a Car / results

- `CUSTOMER-FIND-CAR/find-car-desktop-1440.png` — 1440 × 960
- `CUSTOMER-FIND-CAR/find-car-mobile-375.png` — 375 × 814

The canonical Finder context is visible before the results. Each recommendation uses a large documentary vehicle image, open specifications, supported rate information, explicit evaluated-trip fit, and one selection action. The mobile composition restacks the trip criteria and vehicle content rather than shrinking the desktop columns.

### Customer — Booking Detail / Waiting

- `CUSTOMER-WAITING/booking-waiting-desktop-1440.png` — 1440 × 960
- `CUSTOMER-WAITING/booking-waiting-mobile-375.png` — 375 × 656

`No action needed` is the first and strongest message. Informational blue separates waiting from coral action-required states. The copy names the documents under review, the Briah team’s task, the next possible outcomes, the supported Notifications update path, and the prerequisite that keeps Payment locked. Mobile removes repeated vehicle photography and puts current-state comprehension first.

### Admin — Dashboard

- `ADMIN-DASHBOARD/dashboard-desktop-1440.png` — 1440 × 960
- `ADMIN-DASHBOARD/dashboard-tablet-768.png` — 768 × 1152

One vertical coral route organizes the current work queues: booking review, payment verification, and readiness attention. Today’s pickups/returns and current fleet facts remain secondary. The tablet layout replaces the sidebar with a labelled top bar and presents the attention route before the two-column daily/fleet summary.

### Admin — Booking Detail

- `ADMIN-BOOKING-DETAIL/booking-detail-desktop-1440.png` — 1440 × 960

A sticky unboxed context summary, operational route spine, compact current review section, one role-safe action zone, and an activity rail create density without stacked-card ERP chrome. Payment, assignment, and rental controls explain their canonical prerequisites. The Owner/Admin action panel also states how the same view changes for Operations Staff.

## Image-first production and critique

The approved Direction A Home and Booking Action PNGs were used as style references. Each requested viewport was generated as a standalone raster composition and inspected at original resolution for copy, typography, spacing, action hierarchy, semantic state, imagery, responsive priority, and template risk. Responsive views were freshly generated rather than cropped. Accepted images were then resampled only to the requested viewport width.

Rejected generations are not stored in this folder. The accepted set incorporates these corrections:

- Find a Car removed a non-evaluated browse row with a misleading selection action, then replaced an invented suitability reason with a canonical Finder reason and changed the optional category criterion to `Any category`.
- Waiting mobile replaced a green completion mark on locked Payment with a neutral lock.
- Admin Dashboard removed locations outside the allowed Philippine examples.
- Admin Booking Detail removed `Settings` and customer navigation from the Admin shell.

## Boundary

All people, dates, booking references, vehicle examples, rates, and counts are illustrative visual-validation content. Implementation must bind them to canonical data and preserve loading, empty, error, stale, and unavailable states. No source, route, component, CSS application file, backend, schema, migration, dependency, test, deployment, or production configuration is included here.
