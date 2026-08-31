# Changelog

## 2026-09-01 — Vehicle Release and Rental Start Foundation

Updated the Development Baseline before VS010.

### Frozen / Clarified

- Added `16-rental-release-and-start.md`.
- Frozen booking confirmation and rental start as separate events.
- Frozen Owner/Admin-only final vehicle release for the provisional baseline.
- Frozen canonical rental-transaction foundation linked one-to-one with booking.
- Avoided prematurely freezing a rental lifecycle enum by deriving active rental from `started_at` and `ended_at`.
- Frozen release-time revalidation of Confirmed booking and assigned active vehicle.
- Frozen prevention of duplicate active rental for one booking or vehicle.
- Frozen transactional/concurrency requirement for vehicle release.
- Clarified that release does not mutate vehicle branch or integrate external GPS tools.
- Added provisional turnover snapshot fields for condition/fuel and optional odometer.
- Added `CQ-019` for remaining-balance/security-deposit prerequisites before release.
- Added `CQ-020` for actual Briah odometer/fuel/photo recording convention.
- Reaffirmed `CQ-008` for exact turnover checklist/official rental-start event.

---

## 2026-09-01 — Vehicle Assignment and Booking Confirmation

Frozen Owner/Admin assignment, requested-vs-assigned separation, overlap/conflict checks, and explicit booking confirmation.

---

## 2026-08-31 — Client Clarification Register

Added formal client-validation tracking for safe provisional development.

---

## 2026-08-31 — Requirement Review / Secure Requirements / Payments

Frozen the booking pre-confirmation transaction chain.

---

## 2026-08-29 — Development Baseline v1

Frozen forecasting, recommendation/allocation, maintenance-readiness, and external API rules.

---

## 2026-08-24 — Initial Context Package

Created initial source-of-truth context and open-decision register.
