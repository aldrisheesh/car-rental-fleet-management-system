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
**Meaning:** Booking is canonically confirmed. Assignment may be known; preparation is not a persisted backend state.
**Primary message:** `Your booking is confirmed.`  
**Show:** only canonically available assignment, pickup/delivery, and scheduled details. If preparation is discussed, present it as an operational expectation rather than a completed status.

### H. Pickup/delivery information available (derived only)
**Meaning:** Scheduled turnover details can be shown from the booking/rental data. This is not a persisted `Ready` state.
**Primary message:** Clear scheduled time, location, and service method; do not claim the vehicle is ready unless a canonical field supports it.

### I. Active rental
**Meaning:** Vehicle has been released and rental is active.  
**Primary message:** `Your rental is active.`  
**Show:** return date/time and relevant non-sensitive rental details.

### J. Return due / overdue awareness
**Meaning:** Return milestone requires attention according to canonical rental/reminder state.  
**Do not:** invent penalty amounts from incomplete policy evidence.

### K. Returned (derived from rental end time)
**Meaning:** The rental transaction has an `ended_at` value. This does not establish settlement, inspection completion, or booking completion.
**Primary message:** `Your return has been recorded.` Show only safe, canonical return facts.

### L. Settlement / completed
**Status:** Not currently representable as a canonical or safely derived customer lifecycle state.
**Rule:** Do not display a settlement-pending or completed milestone, completion date, charge total, or finality claim until a Lead-approved canonical source exists.

## Progress representation

A customer-facing progress component may group backend detail into understandable milestones:

`Booking -> Requirements -> Payment -> Confirmation -> Rental -> Return`

This grouping is presentation-only. It must not redefine persisted domain states.

## State UI rules

- Never expose a future action as enabled before its canonical prerequisite.
- Locked steps must explain why they are locked.
- Waiting states explicitly say `No action needed` when true.
- Waiting states name the business action in progress and retain the last completed milestone.
- Error/retry states must preserve valid progress where possible.
- Status labels and primary messages must agree.
