# Customer pickup and delivery

Client Interview 2 confirms either delivery or customer pickup. Backend booking creation/edit endpoints already accept both, but the customer form forced delivery in draft editing, session restoration and submission.

Added two accessible radio choices styled with the existing evergreen/ivory form palette. Pickup shows the canonical pickup/return operating areas, with the exact meeting point to be confirmed by the team. It exposes no private garage address. Delivery retains address autocomplete, manual entry and same/alternate collection addresses.

Service choice now survives editing/session restoration, participates in change detection, and drives submission and review summaries. Pickup sends null delivery/collection addresses even if the customer typed addresses before switching services. Delivery requires its applicable address fields. Admin detail labels and customer booking service text now distinguish pickup consistently; vehicle details invite either service.

No database schema, pricing policy, DSS demand calculation or baseline records were changed. No test booking was submitted; the customer UI was checked through review using the authorized UAT customer account.

Verification: 23 service/handoff/Finder tests pass, TypeScript passes, targeted lint has no errors and one existing booking effect dependency warning. Production build passes. Design detector found no findings in the changed booking route or added service CSS; global stylesheet findings concern existing unrelated rules.

Desktop browser verification: pickup reaches review with no delivery address; delivery refuses a blank address, accepts a manual public landmark address, and retains it in review. Screenshots in output/bookings-concepts: customer-pickup-option.jpg, customer-delivery-option.jpg, customer-pickup-review.jpg.
