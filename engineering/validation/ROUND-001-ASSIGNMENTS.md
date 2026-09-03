# Final Validation Round 001

**Mode:** Discovery only  
**Code changes:** Forbidden

## Contributor A — Customer/Renter

Inspect:
- public homepage/navigation;
- signup/login/logout;
- Customer Dashboard;
- profile/account;
- Vehicles;
- Smart Vehicle Finder;
- Booking;
- Requirements;
- Payment;
- Customer Notifications.

Avoid stateful production actions unless the Lead explicitly coordinates them.

## Contributor B — Owner/Admin

Inspect:
- Dashboard;
- Bookings;
- Customers;
- Payments;
- Fleet Management;
- Calendar;
- Maintenance;
- Notifications;
- Reports & Analytics;
- Decision Support;
- Audit Trail;
- Users & Roles;
- Branches.

Do not fabricate data to populate empty screens.

## Contributor C — Operations Staff + authorization

Inspect:
- Dashboard;
- Bookings;
- Calendar;
- Notifications;
- Reports & Analytics.

Perform safe negative authorization checks against known Owner/Admin-only routes. No exploit development, brute force, destructive testing, or role mutation.

## Deliverable

Create GitHub Finding Issues using the repository Issue Form. One distinct problem per Issue.

The Lead Developer performs triage and assigns confirmed implementation work.
