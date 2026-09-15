# 04 - Information Architecture

## Public / Customer

### Primary navigation
- Home
- Find a Car
- My Bookings (authenticated)
- Contact
- Notifications (icon/center when authenticated)
- Profile/account control

### Conceptual hierarchy

```text
Home
Find a Car
  -> Results / recommendations
     -> Vehicle detail
        -> Reserve / trip details
           -> Authenticate if required
              -> Submit booking
My Bookings
  -> Booking detail
     -> Overview / next action
     -> Requirements
     -> Payment
     -> Rental / pickup-return information
     -> Return record
Contact
Profile
Notifications
```

### Consolidation principle
Vehicle catalog, Finder/recommendation, and booking entry points should feel like one discovery-to-reservation journey. Do not expose multiple competing ways to start the same task unless each has a distinct, user-understandable purpose.

Payment and requirements are contextual to a booking; they should not require the renter to understand them as independent top-level modules.

### Contact boundary
Contact is informational in the stabilized baseline unless a verified delivery backend is separately authorized. Do not retain or recreate a form that reports a successful submission without a canonical delivery path. Supported external contact actions such as `mailto:` or `tel:` may be used only when their destination data is verified.

## Admin / Owner

### Primary operational navigation
- Dashboard
- Bookings
- Fleet
- Calendar
- Maintenance
- Decision Support
- Reports

### Management / lower-frequency administration
- Customers
- Branches
- Users & Roles
- Audit Trail

### Non-canonical settings boundary
Do not present `Settings` as a management destination until a server-backed settings contract exists. Existing hard-coded settings controls are capability evidence and must be removed from the replacement navigation.

### Global utilities
- Notifications
- Profile/account

### Admin booking concept
A booking detail should provide coherent access to the booking's customer/trip context, requirements, payment, vehicle assignment, rental/return state, and relevant activity without requiring unnecessary cross-module hunting.

### Canonical-data-only administration
Customer and profile surfaces must display only canonical authenticated or server-backed data. Static/demo-only customer fields, local profile values, and functioning-looking controls without a canonical contract must not be migrated into the stabilized frontend.

### Responsive navigation
Customer navigation must keep no more than the essential top-level destinations visible on a phone and use labelled controls, not icon-only navigation. Admin may adapt from a persistent sidebar on large screens to a labelled compact navigation pattern on narrow screens; it must not mix competing primary navigation patterns at the same hierarchy level. Deep booking links must restore the relevant booking and keep the back path predictable.

## Operations Staff

Use the same broad operational mental model but enforce canonical role restrictions. Do not expose controls merely because they exist in Admin screens. Where the role has legitimate visibility but lacks mutation authority, prefer an explanatory read-only presentation rather than a control that will be rejected by the server.

## Route freedom

Existing route names are not automatically requirements. Routes may be consolidated/relocated where the backend and router architecture permit it, provided capability coverage, deep-link safety, authorization, and regression behavior remain correct.
