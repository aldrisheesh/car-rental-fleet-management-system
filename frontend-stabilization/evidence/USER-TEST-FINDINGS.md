# User-Test Findings

**Evidence source:** Team customer-side testing transcript supplied 2026-09-13.  
**Classification:** Discovery observations until individually verified against current `main`/production. This document is not permission to change backend behavior.

## Recurring themes

### 1. Redundant discovery/booking entry points
The team repeatedly questioned the coexistence and purpose of Home search, Vehicles, Finder, Booking, and Start Booking controls. Testers could not consistently explain why a user should choose one path over another.

**UX implication:** Consolidate the discovery-to-reservation mental model.

### 2. Booking form information architecture is unclear
Testers debated vehicle selection, branch, pickup/delivery, return branch/location, trip details, personal details, destination, purpose, and preferred seats. Some information appeared duplicated or changeable when testers expected it to be fixed from earlier selection.

**UX implication:** Re-derive fields from canonical backend requirements, group them by user task, and avoid redundant entry.

### 3. Post-booking next step is unclear
After booking, testers expected the customer to proceed to requirements. Instead, the experience appeared to emphasize dashboard/payment status, causing confusion.

**UX implication:** Booking Detail must explicitly present the next canonical step.

### 4. Requirements-before-payment is not sufficiently communicated
The team explicitly reconstructed the intended sequence during testing: booking -> requirements -> Admin review -> payment -> confirmation.

**UX implication:** Represent prerequisites as a guided lifecycle and lock/explain future actions.

### 5. Admin notification/queue timing and visibility appeared confusing
The transcript reports a new-booking notification while the corresponding booking was not visible where the tester expected it. The team debated whether Admin should be notified only after requirements submission.

**Classification note:** This may include a functional/business-rule issue, not merely UX. Verify canonical notification event behavior before changing anything.

### 6. Admin booking tables/details are difficult to interpret
Testers questioned unlabeled/unclear IDs, column meaning, clickability, and how to reach the information needed for review.

**UX implication:** Use human-recognizable primary information and obvious row/detail actions.

### 7. Customer dashboard fragments booking information
Testers expected current booking, past bookings, requirements, payment information, and status to be coherent rather than scattered.

**UX implication:** My Bookings + Booking Detail should become the customer's lifecycle source of truth.

### 8. Navigation is inconsistent across public/customer/admin contexts
The team discussed moving/removing top navigation items, using notification icons, and differing Admin/customer shells.

**UX implication:** Freeze role-specific information architecture before implementation.

### 9. Some controls may appear interactive without reliable behavior
The transcript questions search behavior, contact delivery, footer links/information, and other clickable elements.

**Classification note:** Verify each as an Observation; reproducible failures become Findings.

### 10. Visual system lacks coherence
Testers described the UI as dark, inconsistent, difficult to interpret, and changed substantially as backend work accumulated.

**UX implication:** Establish a new visual grammar after workflow/wireflow approval rather than restyling legacy screens one by one.

## Decision derived from testing

Legacy frontend screenshots should be used for capability coverage and defect evidence, **not** as the primary visual reference for replacement designs.
