# Changelog

## 2026-09-01 — Rental Return and Closure Foundation

Updated the Development Baseline before VS011.

### Frozen / Clarified

- Added `17-rental-return-and-closure.md`.
- Frozen explicit Owner/Admin vehicle-return action.
- Frozen `ended_at` as canonical actual return time.
- Continued avoiding a broad rental lifecycle enum.
- Frozen return snapshot foundation:
  - optional return odometer;
  - provisional fuel level;
  - condition summary;
  - observed damage/condition notes;
  - optional remarks.
- Frozen return odometer >= release odometer when both exist.
- Frozen informational late-return derivation without monetary penalty calculation.
- Separated physical return from unresolved financial settlement.
- Clarified that ending rental does not automatically set final vehicle status or maintenance readiness.
- Added `CQ-021` exact return inspection checklist.
- Added `CQ-022` physical return vs financial closure.

---

## 2026-09-01 — Vehicle Release and Rental Start Foundation

Frozen canonical rental start and turnover snapshot.

---

## 2026-09-01 — Vehicle Assignment and Booking Confirmation

Frozen assignment and explicit confirmation.

---

## 2026-08-31 — Pre-rental Transaction Chain

Frozen secure requirements, requirement review, payment submission, and payment verification.
