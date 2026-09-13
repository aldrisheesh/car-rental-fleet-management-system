# 03 - Lifecycle States

This document defines UX-level representations. Codex must map them to verified canonical backend states rather than creating new persisted statuses merely for presentation.

## Customer booking UX states

### A. Booking request submitted / requirements needed
**Meaning:** Booking request exists; requirements are not yet ready for review.  
**Primary message:** `Next step: Submit your rental requirements.`  
**Primary action:** Submit requirements.  
**Payment:** Locked/unavailable with explanation.

### B. Requirements under review
**Meaning:** Requirements have been submitted and await authorized review.  
**Primary message:** `We're reviewing your requirements.`  
**Action:** Normally none; show what happens next.

### C. Requirements need resubmission
**Meaning:** One or more requirements require correction/replacement.  
**Primary message:** `Action required: Update your requirements.`  
**Primary action:** Resubmit affected requirement(s).  
**Must show:** Safe customer-facing reason(s) provided by canonical backend.

### D. Requirements verified / payment needed
**Meaning:** Customer may proceed to payment submission.  
**Primary message:** `Requirements verified. Submit the required down payment.`  
**Primary action:** Submit payment proof/reference.

### E. Payment under review
**Meaning:** Payment proof/reference awaits authorized verification.  
**Primary message:** `We're verifying your payment.`

### F. Payment needs resubmission
**Meaning:** Submitted payment information cannot be accepted in its current form.  
**Primary message:** `Action required: Resubmit payment information.`  
**Primary action:** Resubmit using canonical payment workflow.

### G. Booking confirmed / preparation
**Meaning:** Booking is confirmed under canonical state and vehicle preparation/assignment is proceeding as applicable.  
**Primary message:** `Your booking is confirmed.`  
**Show:** pickup/delivery details and next milestone when available.

### H. Ready for pickup/delivery
**Meaning:** Rental is approaching turnover.  
**Primary message:** Clear time/location/service-method information.

### I. Active rental
**Meaning:** Vehicle has been released and rental is active.  
**Primary message:** `Your rental is active.`  
**Show:** return date/time and relevant non-sensitive rental details.

### J. Return due / overdue awareness
**Meaning:** Return milestone requires attention according to canonical rental/reminder state.  
**Do not:** invent penalty amounts from incomplete policy evidence.

### K. Returned / settlement pending
**Meaning:** Vehicle is physically returned but settlement/inspection may still require completion.

### L. Completed
**Meaning:** Rental lifecycle is closed.  
**Presentation:** Historical record; no false next action.

## Progress representation

A customer-facing progress component may group backend detail into understandable milestones:

`Booking -> Requirements -> Payment -> Confirmation -> Rental -> Return`

This grouping is presentation-only. It must not redefine persisted domain states.

## State UI rules

- Never expose a future action as enabled before its canonical prerequisite.
- Locked steps must explain why they are locked.
- Waiting states explicitly say `No action needed` when true.
- Error/retry states must preserve valid progress where possible.
- Status labels and primary messages must agree.
