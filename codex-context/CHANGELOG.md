# Changelog

## 2026-09-01 — Vehicle Assignment and Booking Confirmation

Updated the Development Baseline before VS009.

### Frozen / Clarified

- Added `15-vehicle-assignment-and-booking-confirmation.md`.
- Frozen Owner/Admin-only final assignment/confirmation.
- Preserved requested vs assigned vehicle separation.
- Frozen active-vehicle + overlapping-confirmed-booking assignment checks.
- Frozen half-open booking intervals without an invented turnaround buffer.
- Frozen transactional `Submitted -> Confirmed` gate requiring Verified requirements, Verified payment, valid assigned vehicle, no overlap, and explicit Owner/Admin action.
- Clarified that Confirmed is not rental start.
- Added `CQ-017` for cross-branch assignment/repositioning.
- Added `CQ-018` for vehicle turnaround/preparation buffer.
- Kept `CQ-007` substitution behavior provisional.
- Prohibited automatic vehicle master-branch mutation from booking assignment.

---

## 2026-08-31 — Client Clarification Register

Added formal client-validation tracking for operational unknowns that can safely use provisional behavior.

---

## 2026-08-31 — Requirement Review and Verification

Frozen Owner/Admin requirement review and verification gates.

---

## 2026-08-31 — Baseline Requirement Submission and Secure Storage

Frozen baseline renter requirements and secure private Storage.
