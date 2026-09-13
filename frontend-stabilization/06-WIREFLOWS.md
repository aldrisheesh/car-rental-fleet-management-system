# 06 - Wireflows

These are low-fidelity interaction contracts. Visual styling comes later.

## WF-01 - Discover to booking request

```text
[HOME]
  Find a Car
      |
      v
[FIND A CAR]
  dates / passengers / relevant filters
  -> results
      |
      v
[VEHICLE]
  key details + Reserve
      |
      v
[TRIP DETAILS]
  pickup date/time
  return date/time
  pickup/delivery/service information
  review selection
      |
      +-- unauthenticated --> [SIGN IN / CREATE ACCOUNT] --+
      |                                                   |
      +---------------------------------------------------+
                                                          v
                                                [REVIEW / SUBMIT]
                                                          |
                                                          v
                                                [BOOKING DETAIL]
                                                Next: Requirements
```

## WF-02 - Requirements before payment

```text
[BOOKING DETAIL]
  Action required: Submit requirements
          |
          v
[REQUIREMENTS]
  upload/replace required documents
          |
          v
[UNDER REVIEW]
  No action needed
          |
     +----+----------------+
     |                     |
     v                     v
[RESUBMIT]             [VERIFIED]
     |                     |
     +--> submit again     v
                       [PAYMENT NOW AVAILABLE]
```

## WF-03 - Payment and confirmation

```text
[BOOKING DETAIL: PAYMENT REQUIRED]
  minimum required amount when canonical
  accepted baseline channels
  manual verification explanation
          |
          v
[SUBMIT PAYMENT PROOF/REFERENCE]
          |
          v
[PAYMENT UNDER REVIEW]
          |
     +----+----------------+
     |                     |
     v                     v
[RESUBMIT]             [VERIFIED / CONFIRMED AS CANONICAL]
                           |
                           v
                    [PICKUP / PREPARATION INFO]
```

## WF-04 - Admin review

```text
[DASHBOARD: NEEDS ATTENTION]
          |
          v
[BOOKING QUEUE]
          |
          v
[BOOKING DETAIL]
  Customer + trip
  Requirements
  Payment
  Assignment/confirmation
  Rental/return
  Activity
          |
          +--> perform only state-authorized action
```

## WF-05 - Customer booking detail skeleton

```text
+--------------------------------------------------+
| Vehicle / Booking # / Dates          [STATUS]    |
+--------------------------------------------------+
| NEXT STEP / ACTION REQUIRED                      |
| Plain-language explanation                       |
| [Primary action when applicable]                 |
+--------------------------------------------------+
| Progress                                         |
| Booking -> Requirements -> Payment -> Confirm -> |
| Rental -> Return                                 |
+--------------------------------------------------+
| Trip / pickup-return details                     |
+--------------------------------------------------+
| Requirements summary                             |
+--------------------------------------------------+
| Payment summary                                  |
+--------------------------------------------------+
| Rental / return summary                          |
+--------------------------------------------------+
```

## Wireflow validation questions

For each state, a novice tester should answer without coaching:
- What just happened?
- Do I need to do anything?
- What should I click next?
- Why can't I pay yet, if payment is locked?
- How will I know when the booking is confirmed?
