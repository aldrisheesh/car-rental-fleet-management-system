# Changelog

## 2026-08-31 — Requirement Review and Verification

Updated the Development Baseline before VS007.

### Frozen / Clarified

- Frozen Owner/Admin-only requirement-review authority.
- Defined baseline review checks for:
  - government-ID readability/identity consistency;
  - driver's-license readability/identity consistency/visible expiry;
  - cross-record identity consistency;
  - manual external LTO verification.
- Frozen LTO outcomes:
  - `Not Checked`
  - `Clear`
  - `Concern`
  - `Unavailable`
- Frozen per-document review outcomes:
  - `Accepted`
  - `Needs Replacement`
- Frozen deterministic `Verified` gate requiring both documents accepted, no unresolved identity concern, and LTO = `Clear`.
- Frozen `Needs Resubmission` behavior with required affected-document flags and customer-facing reasons.
- Clarified that temporary LTO unavailability leaves the set `Pending Review`.
- Frozen customer replacement to only flagged document types while `Needs Resubmission`.
- Reaffirmed payment remains blocked until requirement status = `Verified`.
- Added `12-requirement-review-and-verification.md`.

---

## 2026-08-31 — Baseline Requirement Submission and Secure Storage

- Frozen baseline self-drive renter requirements to Valid Government ID and Driver's License.
- Removed customer-uploaded LTO screenshot as a baseline requirement.
- Frozen JPEG/JPG, PNG, PDF and 10 MiB/file.
- Frozen private Storage, protected access, and versioned replacement.
- Frozen `Not Submitted → Pending Review`.
- Deferred long-term retention/deletion duration.

---

## 2026-08-29 — Development Baseline v1

- Frozen qualifying demand, utilization, idle detection, maintenance readiness, WMA/MAPE, recommendation/allocation, and external API provider/fallback rules.

---

## 2026-08-24 — Initial Context Package

- Added scope, roles, implementation constraints, and initial open-decision register.
