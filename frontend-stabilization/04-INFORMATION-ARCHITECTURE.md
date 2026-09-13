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
     -> Return / settlement / completion
Contact
Profile
Notifications
```

### Consolidation principle
Vehicle catalog, Finder/recommendation, and booking entry points should feel like one discovery-to-reservation journey. Do not expose multiple competing ways to start the same task unless each has a distinct, user-understandable purpose.

Payment and requirements are contextual to a booking; they should not require the renter to understand them as independent top-level modules.

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
- Settings

### Global utilities
- Notifications
- Profile/account

### Admin booking concept
A booking detail should provide coherent access to the booking's customer/trip context, requirements, payment, vehicle assignment, rental/return state, and relevant activity without requiring unnecessary cross-module hunting.

## Operations Staff

Use the same broad operational mental model but enforce canonical role restrictions. Do not expose controls merely because they exist in Admin screens.

## Route freedom

Existing route names are not automatically requirements. Routes may be consolidated/relocated where the backend and router architecture permit it, provided capability coverage, deep-link safety, authorization, and regression behavior remain correct.
