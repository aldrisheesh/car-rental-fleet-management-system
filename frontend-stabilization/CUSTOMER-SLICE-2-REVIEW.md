# Customer Slice 2 Review

## Commit reviewed

- Branch: `stabilization/frontend-rebuild`
- Implementation commit: `56c73c7f7491b95d687c791bfb34113046112c6c`
- Comparison base: `cca6b1c7094f6cc141d3ae57c90cf760186ccfef`
- `origin/stabilization/frontend-rebuild`: matched the implementation commit.
- `origin/main`: `faed190d9b78bb845e2c89e7160eda90106f741f`, matching the Slice 1 final verification record.
- Pre-flight working tree: clean before this review document was created.

## Scope

Review-only verification of Customer Slice 2 under GitHub Issue #63. The accepted Direction E documents and all 14 accepted Slice 2 implementation-reference rasters were read/inspected at their native resolutions. The complete source diff from the Slice 1 acceptance commit was inventoried.

The review was stopped when the changed customer notification deep-link behavior produced a confirmed defect. No application source, backend, schema, business rule, Admin surface, or deployment was changed.

## Exact booking binding

Partial review only. The lifecycle utility’s payment lookup filters by the supplied `booking_id`, but the complete My Bookings/detail composition audit was not completed because the notification deep-link defect triggered the required stop condition.

## My Bookings

Not completed after the stop condition. No acceptance result is claimed.

## Payment gating

Not completed after the stop condition. No acceptance result is claimed.

## Payment amount handling

Not completed after the stop condition. No acceptance result is claimed.

## Payment submission / review / resubmission

Not completed after the stop condition. No acceptance result is claimed.

## Confirmation

Not completed after the stop condition. No acceptance result is claimed.

## Active rental

Not completed after the stop condition. No acceptance result is claimed.

## Return recorded

Not completed after the stop condition. No acceptance result is claimed.

## Notification deep links

**Confirmed defect.** Booking-specific customer lifecycle notifications do not consistently deep-link to the exact owning booking.

Expected behavior: a customer notification for Requirements, Payment, Rental, or Booking activity must open the exact `/bookings/:bookingId` route for the intended booking; invalid or missing identity must fail safely.

Demonstrated implementation:

- `supabase/migrations/20260902000000_canonical_in_app_notifications.sql:172-196` persists Requirements notifications with `related_entity_type = 'requirements'` and the requirement-set ID.
- `supabase/migrations/20260902000000_canonical_in_app_notifications.sql:239-264` persists customer Payment notifications with `related_entity_type = 'payment'` and the payment ID.
- `src/lib/notifications.ts:77-95` calls `bookingPath()` only when `relatedEntityType === "booking"`; all other customer notifications return `/customer`.
- `src/components/notifications/NotificationsPanel.tsx:313-364` uses that destination for the customer-facing `View details` link.
- The canonical notification unit test at `src/lib/notifications.test.ts:149-164` currently codifies Payment → `/customer`, which does not satisfy the exact-booking acceptance contract.

Result: Requirements and Payment notifications land on the customer-global route rather than the intended booking detail. The route cannot derive the exact booking from the stored child-entity ID in the current client mapping, so the customer can be sent to the wrong context and must infer which booking needs attention.

Recipient scoping and mark-read behavior were not broadened beyond this finding.

## Visual fidelity

Not completed after the stop condition. The accepted rasters were inspected, but live implementation comparison was not completed.

## Responsive verification

Not completed after the stop condition. No headed browser result is claimed.

## Accessibility

Not completed after the stop condition. No complete accessibility result is claimed.

## Slice 1 regression

Not completed after the stop condition. The Slice 1 final verification record was read for the regression baseline, but no new regression spot-check was completed in this pass.

## Tests/build

Pre-flight completed: `git fetch origin`; branch, commit, remote tracking, clean working tree, and recorded `origin/main` were verified.

Per the review workflow, tests, scoped lint/format, build, and headed-browser verification were not continued after the confirmed defect was established. No test/build pass is claimed for this review.

## Findings / observations

- **Confirmed defect:** changed customer notification routing sends Requirements, Payment, and other non-`booking` lifecycle notifications to `/customer` instead of the exact owning `/bookings/:bookingId` route. See Notification deep links above.
- **Observation:** the existing notification test asserts the current global Payment destination and therefore does not cover the required exact-booking behavior.
- No other findings are classified because the review stopped immediately after the confirmed defect, as required.

## Review result

SLICE 2 NEEDS FIXES
