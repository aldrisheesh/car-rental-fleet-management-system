# Requirement Review and Verification Specification

**Status:** Frozen for Baseline Owner/Admin Review  
**Last updated:** 2026-08-31

This document defines deterministic review behavior for the baseline self-drive renter requirement set.

It translates the manuscript/client rule that requirements must be fully verified without unresolved red flags before down payment may proceed.

## 1. Authority

Only `Owner/Admin` may perform requirement review and record requirement-verification outcomes.

`Operations Staff` must not:

- view protected government-ID or driver's-license files;
- record requirement-review outcomes;
- mark a requirement set `Verified`;
- record the manual LTO-check outcome.

Customer/Renter may view their own aggregate status and customer-facing correction reasons but may not make review decisions.

## 2. Review Preconditions

Owner/Admin may review only a requirement set whose aggregate status is:

`Pending Review`

The set must have one current document for each baseline type:

- `Valid Government ID`
- `Driver's License`

If canonical current files are unexpectedly missing, the set must not become `Verified`.

## 3. Required Review Checks

The baseline review consists of these checks.

### A. Valid Government ID Document Check

Owner/Admin determines whether the current government-ID submission is:

- readable enough for manual review;
- recognizable as an identification document;
- not obviously incomplete/corrupted;
- reasonably consistent with the renter identity recorded in the booking/profile.

The system is not performing automated identity authentication.

### B. Driver's License Document Check

Owner/Admin determines whether the current driver's-license submission is:

- readable enough for manual review;
- recognizable as a driver's license;
- not obviously incomplete/corrupted;
- reasonably consistent with the renter identity recorded in the booking/profile;
- not visibly expired based on the information available on the submitted license.

The system must not invent an expiry date if it cannot be read.

### C. Cross-Record Identity Consistency Check

Owner/Admin checks for material identity inconsistency among the available:

- customer profile/renter name;
- government-ID information;
- driver's-license information.

The review does not require exact formatting equality. Minor formatting differences such as capitalization, spacing, initials, or punctuation must not automatically fail the requirement set.

Owner/Admin is the human decision-maker for whether a discrepancy is material.

### D. Manual LTO Verification Check

Owner/Admin performs the external driver's-license check using the business's existing LTO portal/process.

Record one canonical outcome:

- `Not Checked`
- `Clear`
- `Concern`
- `Unavailable`

Meaning:

`Not Checked`
: Owner/Admin has not yet completed the external LTO check.

`Clear`
: Owner/Admin completed the external check and found no unresolved verification concern for the submitted driver's license.

`Concern`
: Owner/Admin completed the external check and identified a concern that prevents verification until resolved.

`Unavailable`
: The external LTO source/check could not be completed because the external service or information was unavailable.

The system does not automate, scrape, or fabricate LTO results.

## 4. Document Review Outcome

For each current baseline document, Owner/Admin records one of:

- `Accepted`
- `Needs Replacement`

`Accepted` means that document passed the applicable document checks for the current review cycle.

`Needs Replacement` means a customer-correctable problem exists with that submitted file.

When `Needs Replacement` is selected, a customer-facing replacement reason is required.

Examples of valid reason categories include:

- unreadable/blurred;
- incomplete/cropped;
- wrong document;
- expired driver's license;
- identity information inconsistent;
- other customer-correctable requirement concern.

Implementation may use concise predefined reason codes plus a short remark, as long as customer-facing output is understandable.

Do not invent automatic computer-vision decisions.

## 5. Aggregate `Verified` Decision

A requirement set may transition:

`Pending Review` → `Verified`

only when all of the following are true:

1. current Valid Government ID outcome = `Accepted`;
2. current Driver's License outcome = `Accepted`;
3. cross-record identity consistency has no unresolved material concern;
4. LTO check outcome = `Clear`;
5. no unresolved Owner/Admin review red flag remains.

The action must be explicit. Satisfying the checks does not automatically change the status.

On verification, record at minimum:

- `reviewed_by` Owner/Admin user ID;
- `reviewed_at` timestamp;
- final aggregate status `Verified`;
- LTO check outcome;
- LTO checked timestamp where applicable.

A final verification remark is optional unless implementation needs it for clarity.

## 6. `Needs Resubmission` Decision

A requirement set may transition:

`Pending Review` → `Needs Resubmission`

when at least one customer-correctable problem prevents verification.

At least one affected current document/type must be identified as requiring replacement, and a customer-facing reason must be recorded.

Examples:

- government ID unreadable;
- driver's license unreadable;
- wrong document uploaded;
- driver's license visibly expired;
- material identity inconsistency that requires corrected/supporting submission;
- LTO `Concern` where corrected renter/license information or a replacement document is required.

Do not use `Needs Resubmission` merely because the LTO service is temporarily unavailable.

Record at minimum:

- reviewer Owner/Admin ID;
- reviewed timestamp;
- affected requirement type(s);
- customer-facing replacement reason(s);
- aggregate status `Needs Resubmission`;
- LTO outcome where it was checked.

## 7. External LTO Unavailability

If all submitted documents appear acceptable but the LTO check outcome is:

`Unavailable`

the requirement set remains:

`Pending Review`

Do not:

- mark it `Verified`;
- mark it `Needs Resubmission` solely for external-service unavailability;
- fabricate a favorable LTO result.

The Owner/Admin may retry the external check later.

Likewise, `Not Checked` cannot satisfy the `Verified` gate.

## 8. Customer Resubmission

When aggregate status is `Needs Resubmission`:

- customer sees the aggregate status;
- customer sees which requirement type(s) require replacement;
- customer sees the customer-facing reason;
- customer may replace only flagged requirement type(s);
- accepted/unflagged current documents remain unchanged.

After all flagged document types have a new current version and the customer explicitly resubmits:

`Needs Resubmission` → `Pending Review`

Clear the active correction flags for the new review cycle while preserving prior review metadata/history as implementation records where practical.

Do not automatically verify the corrected files.

## 9. Review Record Semantics

The implementation must preserve enough canonical metadata to identify:

- who performed the latest Owner/Admin review;
- when it was performed;
- per-document current review outcome;
- customer-facing replacement reason when applicable;
- cross-record identity-consistency result;
- LTO outcome and timestamp;
- aggregate requirement status.

A dedicated review table/history model is permitted and preferred when it cleanly preserves prior review cycles.

This domain-specific history does not freeze the broader system-wide audit-log specification.

## 10. Customer Visibility

Customer/Renter may see:

- aggregate requirement status;
- which of their current requirement types is accepted or needs replacement;
- customer-facing resubmission reason;
- that external verification is still pending when relevant.

Customer must not receive:

- internal-only sensitive reviewer notes if such notes exist;
- another customer's review data;
- privileged Owner/Admin-only data.

## 11. Payment Gate

Payment submission remains blocked unless:

`requirement_status = Verified`

`Pending Review` and `Needs Resubmission` must not enable payment submission.

VS007 does not implement payment submission itself.

## 12. Out of Scope

Do not implement in requirement review:

- automated OCR/AI identity verification;
- automated LTO integration/scraping;
- payment submission or verification;
- booking confirmation;
- final vehicle assignment;
- alternate renter/driver requirement matrices;
- extraordinary reopening after a requirement set is already `Verified`;
- broad audit logging beyond requirement-review metadata.

## 13. Warning to Codex

Do not reduce review to a single unchecked Approve/Reject button.

The system must record the required review inputs that justify `Verified` or `Needs Resubmission`.

Do not automatically infer `Clear` from the existence of a driver's-license upload.

Do not treat external LTO unavailability as customer failure.
