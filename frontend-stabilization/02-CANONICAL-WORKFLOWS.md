# 02 - Canonical Workflows

## Customer rental journey

The frontend should communicate this conceptual journey:

`Discover -> Select -> Plan -> Request -> Requirements -> Verification -> Payment -> Confirmation -> Preparation/Assignment -> Pickup/Delivery -> Active Rental -> Return/Inspection -> Settlement -> Completed`

### Detailed customer flow

1. **Discover** - customer searches/browses suitable vehicles.
2. **Select** - customer reviews a vehicle/recommendation.
3. **Plan** - customer provides the rental period and relevant trip/service details.
4. **Authenticate** - if required, sign in/create an account while preserving the intended booking context.
5. **Request** - submit the booking request through the canonical booking creation path.
6. **Requirements** - submit required renter documents/information.
7. **Verification** - authorized personnel review requirements. Additional/replacement documents may be requested.
8. **Payment** - only after requirements are verified, customer submits the required payment proof/reference under the canonical manual-verification workflow.
9. **Confirmation** - authorized personnel verify payment and complete the applicable confirmation/assignment steps.
10. **Preparation/Assignment** - vehicle is prepared/assigned according to canonical operational rules.
11. **Pickup/Delivery** - vehicle turnover occurs through the agreed service method.
12. **Active Rental** - customer can understand current rental status and relevant return information.
13. **Return/Inspection** - vehicle is returned and inspected.
14. **Settlement** - applicable remaining settlement/charges are handled according to canonical implemented behavior.
15. **Completed** - rental becomes historical/completed.

## Critical business sequence

**Requirements verification precedes payment.** The interface must not imply that a customer should pay before requirements are verified.

The confirmed baseline down payment is a minimum of 50% of the applicable total bill where the canonical payment workflow applies. Do not invent unresolved cancellation/refund or late-fee algorithms.

## Admin operational journey

`Needs attention -> Review booking/customer context -> Review requirements -> Review payment -> Confirm/assign -> Prepare/release -> Monitor active rental -> Return/settlement -> Close`

The Admin UI should prioritize work requiring human attention rather than exposing raw database structure.

## Decision-support journey

Forecasting, utilization, idle-vehicle detection, allocation recommendations, maintenance readiness, and external context are decision support. They must remain advisory where the canonical implementation defines them as advisory. The UI must not imply autonomous allocation or guaranteed prediction.

## Workflow exclusions

The frontend rewrite must not invent:
- automatic payment-gateway approval;
- live GPS tracking;
- automatic branch transfer;
- AI/ML prediction where the system uses WMA/rule-based logic;
- unresolved restricted-area rules;
- unresolved complete late-return fee logic;
- unapproved tie-up fleet behavior.
