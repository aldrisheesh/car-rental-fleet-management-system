# Changelog

## 2026-08-31 — Client Clarification Register

Added a formal workflow for continuing development while preserving unresolved client-specific operational questions.

### Added

- `14-client-clarification-register.md`
- Initial client-validation questions covering:
  - 50% down-payment calculation basis;
  - security deposit;
  - remaining-balance timing;
  - production payment methods;
  - additional/red-flag renter requirements;
  - renter/driver differences;
  - requested vs assigned vehicle substitution;
  - vehicle release/turnover;
  - vehicle operational statuses;
  - rental extensions;
  - late-return penalties;
  - damage charges;
  - fuel-return policy;
  - final settlement/completion;
  - maintenance workflow;
  - Operations Staff editable reservation fields.

### Clarified

- Client-specific unknowns with safe provisional designs do not automatically block all development.
- Temporary assumptions must be conservative, isolated/configurable where practical, and clearly distinguished from client-confirmed rules.
- Security, authorization, irreversible architecture, and core state-machine decisions still require explicit freezing when no safe provisional design exists.
- `10-open-decisions.md` now cross-references client-dependent questions in the clarification register.

---

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
