# Briah ERD transfer guide

Prepared from the audited database schema snapshot on 2 October 2026: **40 public tables, 478 columns, and 85 declared foreign keys**. The externally managed `auth.users` entity is shown only by its referenced key and is not included in the count of public tables. No customer records are included.

## Files

- `Briah-ERD-Manuscript.drawio`: overview and eight functional sections, with native editable entities and connectors.
- `images/`: nine SVG diagrams and high-resolution PNGs corresponding to the grouped file. The overview is a reference map; do not compress it into a small portrait figure and expect every field to remain readable.
- `Briah-ERD-Manuscript-Detail-Panels.drawio` and `print-panels/`: forty compact panels, one main table per panel, with its outgoing relationships. Use these as continued figures where a grouped image becomes too small, especially the booking section. A panel with no connector represents an entity without a declared outgoing foreign key; incoming relationships appear on the child entity's panel.
- `Briah-ERD-Complete-Attributes.drawio`: forty reference pages containing all 478 attributes, verified against the schema snapshot. This is a reference companion to the dictionary, rather than a requirement to add another forty full-attribute figures to the manuscript.
- `index.html`: preview gallery.
- `verification.json`: structural coverage results.

## Suggested manuscript introduction

The entity–relationship diagrams present the implemented database structure of the Briah Car Rental and Fleet Management System. The diagrams show primary keys, foreign keys, and the relationships between entities, while the accompanying data dictionary provides the complete field definitions. The model is divided into functional sections to improve readability. Repeated grey entities identify references to tables documented in another section; they do not represent additional tables. Relationship multiplicities follow the database foreign-key, nullability, and uniqueness constraints.

## Insertion sequence and caption wording

Use the numbering already required by the manuscript. Assign actual figure numbers only during transfer, then update the List of Figures and page references after pagination is stable.

| Order | Diagram | Suggested caption |
|---|---|---|
| 1 | `01-overview.svg` | Entity–relationship diagram — erd overview |
| 2 | `02-fleet-and-identity.svg` | Entity–relationship diagram — fleet and identity |
| 3 | `03-bookings-and-requirements.svg` | Entity–relationship diagram — bookings and requirements |
| 4 | `04-payments-and-retained-quotations.svg` | Entity–relationship diagram — payments and retained quotations |
| 5 | `05-rental-and-maintenance.svg` | Entity–relationship diagram — rental and maintenance |
| 6 | `06-demand-forecasting.svg` | Entity–relationship diagram — demand forecasting |
| 7 | `07-supply-and-allocation.svg` | Entity–relationship diagram — supply and allocation |
| 8 | `08-notifications-and-audit.svg` | Entity–relationship diagram — notifications and audit |
| 9 | `09-recovery-and-public-contact.svg` | Entity–relationship diagram — recovery and public contact |

## Transfer with the updated dictionary

1. Use the updated **Revised Database Schema and Dictionary** tab in the separate manuscript as the dictionary source. Do not copy the older dictionary from the original proposal.
2. Place the ERD introduction and diagrams in the database-design section before the complete data dictionary, following the manuscript's existing figure and table style.
3. Insert PNGs through the document's image controls. Keep the original proportions. Use landscape sections where permitted. If text becomes too small at the required page size, replace the affected grouped image with the matching compact panels as continued figures; do not shrink the complete overview to serve as the only ERD.
4. Keep the grouped section order below when using compact panels. Each panel is named after its main table. All tables appear once as a main entity across the detail collection; grey references may repeat.
5. Retain the complete dictionary's exact table names, field names, types, nullability, and constraints. Grey `(ref)` labels belong only to the ERD and are not part of database table names.
6. Reconcile figure numbers, table numbers, cross-references, List of Figures, List of Tables, and page references after insertion. Review the final exported manuscript at its actual page size to confirm readable text and intact captions.

The official Chapters 1–3 manuscript has not been modified during this ERD preparation. Its final pagination and submission readiness must be checked after transfer.

## Compact-panel grouping

### Fleet and identity

`profiles`, `branches`, `vehicle_categories`, `vehicles`, `vehicle_images`, `vehicle_operational_state_events`.

### Bookings and requirements

`booking_requests`, `booking_creation_idempotency`, `booking_finder_context`, `renter_requirement_sets`, `renter_requirement_documents`, `renter_requirement_reviews`.

### Payments and retained quotations

`payment_methods`, `payments`, `payment_proofs`, `booking_payment_quotes`, `rate_cards`, `booking_rate_quotes`.

### Rental and maintenance

`rental_transactions`, `maintenance_records`.

### Demand forecasting

`forecast_runs`, `forecasts`, `forecast_inputs`, `forecast_demand_coverage`.

### Supply and allocation

`supply_evaluations`, `supply_evaluation_vehicles`, `allocation_recommendation_batches`, `allocation_recommendations`, `allocation_recommendation_candidates`.

### Notifications and audit

`notifications`, `notification_preferences`, `operational_notification_conditions`, `email_deliveries`, `audit_events`.

### Recovery and public contact

`backup_runs`, `backup_artifacts`, `recovery_drills`, `public_contact_settings`, `public_contact_locations`, `contact_inquiries`.

## Notation

- PK: primary key. Multiple PK-labelled attributes collectively form a composite primary key.
- FK: declared foreign key.
- `?` after a type: nullable column.
- Crow's foot: many; circle: zero; bar: one. A non-null child foreign key points to one parent. A nullable child foreign key allows zero or one parent. A parent may have zero children; a unique child foreign key limits the child count to at most one.
- Grey reference boxes identify existing entities shown elsewhere. Unconnected tables are not assigned invented relationships merely because they contain a UUID or a similarly named field.

## Scope of verification

The table and relationship coverage was checked against the audited schema snapshot. All 478 attributes in the complete reference file were matched by table and column name. The compact and grouped detail collections each contain the same 85 declared foreign keys. The grouped and compact panels were rendered through diagrams.net; the provided SVG/PNG files preserve the rendered entity and connector geometry. No application code, database records, or official manuscript content was changed.
