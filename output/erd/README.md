# Briah Car Rental ERD review package

Based on the database snapshot audited on 2 October 2026: 40 public tables, 478 public columns, 85 foreign-key relationships. `auth.users` appears only as an external referenced entity.

Open `index.html` for a zoomable overview and eight complete detail diagrams. The full physical diagram is also provided for tracing all relationships. SVG files remain sharp when zoomed and can be imported into diagrams.net as images. DOT files are editable diagram source.

Each detail diagram shows all columns of its assigned tables and every outgoing FK. Grey reference boxes repeat the target keys of tables documented in other diagrams. No table is cut across image slices.

Multiplicity is derived from FK nullability and single-column uniqueness: a child references 1 parent, or 0..1 if its FK is nullable; a parent can have 0..N children, or 0..1 where that FK is unique. Composite uniqueness does not imply uniqueness of an individual FK. Mandatory child existence cannot be inferred from a FK. These are implemented database constraints, not invented business requirements.

Retained `rate_cards` and `booking_rate_quotes` are shown because they remain in the physical database; this does not imply the active booking workflow uses them. This package has not been inserted into the official manuscript. Choose readable detail diagrams rather than shrinking the overview to one portrait page.
