# Vertical Slice 007 — Requirement Review and Verification

**Status:** Approved for implementation  
**Objective:** Implement the Owner/Admin requirement-review workflow for submitted renter requirements, including protected document review, deterministic verification gates, customer-correctable resubmission decisions, manual LTO-check recording, and customer resubmission—without implementing payment.

## Purpose

VS006 established:

- booking-linked requirement sets;
- private renter-document storage;
- Valid Government ID and Driver's License uploads;
- secure document metadata/versioning;
- Customer/Renter own-document access;
- Owner/Admin protected-read foundation;
- `Not Submitted → Pending Review`.

VS007 completes the baseline requirement-verification workflow.

It must establish:

- Owner/Admin review of `Pending Review` requirement sets;
- document-level review outcomes;
- cross-record identity-consistency review;
- manual LTO-check outcome recording;
- deterministic `Verified` eligibility;
- `Needs Resubmission` decisions with customer-facing reasons;
- controlled Customer/Renter replacement of only flagged documents;
- explicit customer resubmission to `Pending Review`.

Payment remains unavailable until requirements are `Verified`.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/11-requirements-and-secure-storage.md`
- `codex-context/12-requirement-review-and-verification.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Authorization

### Owner/Admin

May:

- list requirement sets requiring review;
- view protected current renter documents;
- inspect applicable customer/booking identity information;
- record document review outcomes;
- record cross-record identity-consistency outcome;
- record manual LTO-check outcome;
- transition `Pending Review → Needs Resubmission`;
- transition `Pending Review → Verified`.

### Customer/Renter

May:

- view own aggregate requirement status;
- view own current document outcomes;
- view customer-facing replacement reasons;
- replace only requirement types currently flagged for replacement while status is `Needs Resubmission`;
- explicitly resubmit corrected requirements.

May not:

- mark a document `Accepted`;
- clear a replacement flag;
- record LTO outcomes;
- mark requirements `Verified`;
- access another customer's review.

### Operations Staff

May not:

- access protected renter documents;
- perform requirement review;
- view sensitive review information;
- change requirement status.

If reservation coordination already displays an aggregate non-sensitive requirement status, that may remain visible.

## Review Preconditions

Owner/Admin review actions apply only when:

`requirement_status = Pending Review`

A reviewable set must have current versions of:

- Valid Government ID;
- Driver's License.

Do not permit `Verified` when either canonical current document is missing.

## Document Review Outcomes

For each current baseline document, support:

- `Accepted`
- `Needs Replacement`

### Valid Government ID

Owner/Admin reviews whether the current document is sufficiently:

- readable;
- recognizable as an identification document;
- complete enough for manual review;
- consistent with the renter identity available to the system.

### Driver's License

Owner/Admin reviews whether the current document is sufficiently:

- readable;
- recognizable as a driver's license;
- complete enough for manual review;
- consistent with the renter identity;
- not visibly expired.

Do not implement OCR, automated identity matching, image recognition, or automated expiry extraction.

These remain human review decisions.

## Replacement Reasons

When Owner/Admin marks a document:

`Needs Replacement`

require a customer-facing reason.

Support concise reasons equivalent to:

- unreadable / blurred;
- incomplete / cropped;
- wrong document;
- expired driver's license;
- identity information inconsistent;
- other customer-correctable concern.

An `Other` reason must include a short customer-facing remark.

Do not expose internal-only notes to the customer if implementation introduces them.

## Cross-Record Identity Consistency

Record an explicit Owner/Admin review result for material identity consistency among available:

- customer profile/renter identity;
- government ID;
- driver's license.

Use a small canonical result such as:

- `Consistent`
- `Concern`

Do not require exact string equality.

Minor differences in:

- capitalization;
- punctuation;
- spacing;
- initials;

must not automatically fail verification.

This is a human review judgment.

## Manual LTO Check

Record exactly one canonical LTO outcome:

- `Not Checked`
- `Clear`
- `Concern`
- `Unavailable`

Meaning is defined by `12-requirement-review-and-verification.md`.

The system must not:

- automate the LTO portal;
- scrape the LTO portal;
- infer `Clear` from the driver's-license upload;
- fabricate an LTO result.

Where useful, provide Owner/Admin a clearly labeled external/manual verification step, but do not integrate an undocumented LTO API.

Record an LTO checked timestamp when an actual check outcome is entered.

## Verified Gate

Permit:

`Pending Review → Verified`

only when all are true:

1. Valid Government ID = `Accepted`;
2. Driver's License = `Accepted`;
3. identity consistency = `Consistent`;
4. LTO outcome = `Clear`;
5. both current required documents still exist;
6. Owner/Admin explicitly performs the verification action.

The server/database boundary must enforce this gate.

Do not rely solely on a disabled/enabled frontend button.

Verification must not happen automatically when the final check becomes favorable.

## Needs Resubmission Gate

Permit:

`Pending Review → Needs Resubmission`

only when at least one customer-correctable problem has been identified.

At minimum:

- one requirement type must be marked `Needs Replacement`;
- each flagged type must have a customer-facing reason.

Record:

- reviewer Owner/Admin ID;
- review timestamp;
- affected requirement type(s);
- replacement reason(s);
- LTO outcome where applicable;
- aggregate status.

Do not use `Needs Resubmission` solely because:

`LTO = Unavailable`

External verification unavailability leaves the requirement set `Pending Review`.

## Pending External Verification

If:

- both documents are acceptable;
- identity consistency has no unresolved concern;
- LTO outcome is `Not Checked` or `Unavailable`;

the requirement set remains:

`Pending Review`

Owner/Admin must be able to return later and complete/retry the LTO check.

Do not require customer resubmission for an external-service availability problem.

## Review Persistence

Persist enough canonical review metadata to reconstruct the latest review decision.

Prefer a review-cycle/history model if it fits the existing schema cleanly.

At minimum preserve:

- requirement-set ID;
- reviewer Owner/Admin ID;
- reviewed timestamp;
- current-document review outcome for both baseline types;
- replacement reasons where applicable;
- identity-consistency result;
- LTO outcome;
- LTO checked timestamp where applicable;
- resulting aggregate status.

Do not overwrite historical review information in a way that makes previous `Needs Resubmission` cycles impossible to understand.

A dedicated requirement-review table and child/document-review records are acceptable.

Do not implement a broad system-wide audit framework in this slice.

## Customer Resubmission

Extend the VS006 customer requirement workflow for:

`Needs Resubmission`

Customer must see:

- aggregate `Needs Resubmission`;
- affected requirement type(s);
- customer-facing reason for each affected type.

Customer may replace only flagged requirement types.

Accepted/unflagged current documents must remain unchanged.

After every flagged requirement type has a newer current version than the version reviewed/flagged, enable an explicit:

`Resubmit for Review`

action.

On successful resubmission:

`Needs Resubmission → Pending Review`

Do not automatically verify corrected documents.

The next Owner/Admin review evaluates the new current versions.

## Review-Cycle Safety

When Owner/Admin reviews a specific document version, preserve which version was reviewed.

If the customer replaces a flagged document, the old review outcome must not automatically apply to the new version.

A replacement document starts unreviewed for the next review cycle.

Do not allow stale `Accepted` or `Needs Replacement` outcomes from a superseded version to satisfy a later verification gate.

## Customer Visibility

Customer may see:

- requirement status;
- current uploaded filenames/metadata already permitted by VS006;
- accepted/needs-replacement state where appropriate;
- customer-facing correction reasons;
- indication that external verification remains pending where applicable.

Do not expose:

- private Storage object paths;
- signed URLs as persistent data;
- reviewer credentials;
- another customer's information;
- internal-only administrative remarks.

## Owner/Admin UI Integration

Integrate requirement review into the existing Owner/Admin booking/reservation area with minimal design disruption.

A suitable implementation may use:

- booking detail;
- requirement-review dialog;
- dedicated review panel.

Owner/Admin should be able to:

1. identify the booking/customer;
2. see aggregate requirement status;
3. securely open the current government ID;
4. securely open the current driver's license;
5. record document outcomes;
6. record identity-consistency result;
7. record LTO outcome;
8. request resubmission when valid;
9. verify when every gate is satisfied.

Do not broadly redesign the admin booking module.

## Protected File Access

Continue using VS006 protected file delivery.

Owner/Admin may receive a short-lived signed URL only after trusted authorization.

Operations Staff must remain blocked.

Do not make the bucket public.

Do not increase signed URL lifetime beyond the frozen 5-minute maximum.

## Concurrency / Stale Review Protection

Review actions must be based on the current canonical requirement state.

Protect against situations such as:

- Owner/Admin reviewing an old document version while a replacement exists;
- duplicate review submissions;
- two Owner/Admin actions producing contradictory final states.

Use appropriate database/server checks so a stale review cannot mark a newer document version as accepted or verify the set incorrectly.

Do not build a general distributed-locking framework; use the smallest reliable transactional/concurrency mechanism.

## Payment Boundary

VS007 must not implement payment submission.

It may expose a derived fact such as:

`paymentEligible = requirement_status === "Verified"`

where useful for later integration.

But do not:

- upload payment proof;
- create payment records;
- redirect automatically into payment submission;
- verify payment.

## Error Handling

Handle at minimum:

- unauthenticated review attempt;
- Operations Staff review attempt;
- Customer review attempt;
- requirement set not found;
- requirement set not `Pending Review`;
- missing current document;
- stale document version;
- invalid review outcome;
- missing replacement reason;
- invalid `Verified` gate;
- invalid `Needs Resubmission` gate;
- LTO unavailable;
- provider/database failure;
- unauthorized protected-file access.

Do not expose raw SQL, private Storage paths, service-role credentials, or internal stack traces.

## Testing

Add focused tests where practical for:

- Owner/Admin-only review authorization;
- Operations Staff cannot review;
- Customer cannot review;
- Verified gate requires both documents Accepted;
- Verified gate requires identity Consistent;
- Verified gate requires LTO Clear;
- LTO Not Checked cannot verify;
- LTO Unavailable cannot verify;
- LTO Unavailable alone cannot cause Needs Resubmission;
- Needs Resubmission requires at least one flagged document;
- flagged document requires customer-facing reason;
- Customer can replace only flagged document types;
- unflagged document replacement is rejected during Needs Resubmission;
- resubmission requires newer versions for all flagged types;
- resubmission returns status to Pending Review;
- stale document-review version cannot satisfy verification;
- Operations Staff cannot access protected requirement files.

Provider-backed validation should verify where configured:

1. Owner/Admin can securely open current renter documents;
2. Operations Staff cannot open them;
3. Owner/Admin can record a valid Needs Resubmission decision;
4. Customer sees the affected document/reason;
5. Customer can replace only that flagged document;
6. Customer can resubmit after correction;
7. corrected set returns to Pending Review;
8. Owner/Admin can perform a subsequent review;
9. a fully valid review with LTO Clear becomes Verified;
10. LTO Unavailable leaves the set Pending Review;
11. Verified status survives reload/session changes;
12. payment workflow does not start automatically.

Use disposable development records/files where practical.

## Definition of Done

VS007 is complete when:

- Owner/Admin can securely review submitted renter requirements;
- review outcomes are canonically persisted;
- both current document versions are explicitly evaluated;
- identity consistency is explicitly evaluated;
- manual LTO outcome is recorded;
- Verified is server-enforced by the frozen deterministic gate;
- Needs Resubmission requires affected documents and customer-facing reasons;
- Customer can replace only flagged requirements;
- corrected documents return through explicit resubmission to Pending Review;
- stale review outcomes cannot verify newer document versions;
- Operations Staff remains excluded from protected documents/review;
- payment remains unimplemented and gated behind Verified requirements.

## Stop Rule

Stop after Requirement Review and Verification is complete.

Do not implement payment submission, payment verification, booking confirmation, vehicle assignment, rental processing, alternate renter/driver scenarios, or VS008.