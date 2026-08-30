# Requirements and Secure Storage Specification

**Status:** Frozen for Baseline Requirement Submission  
**Last updated:** 2026-08-31

This document defines the implementation rules for the baseline Customer/Renter requirement-submission capability.

It is intentionally limited to secure renter-document submission and storage. Manual requirement review and verification belong to a later vertical slice.

## 1. Source Basis

The revised manuscript requires customers to submit valid identification, driver's-license information, and other applicable renter requirements before booking approval.

The validated client workflow requires requirements to be fully verified before down payment proceeds and confirms use of the LTO portal as an external license-verification aid.

Existing prototype UI fields and older mock/data-dictionary document examples are not automatically mandatory business requirements.

## 2. Baseline Scenario

The baseline implementation scenario is:

**Customer/Renter is also the intended self-drive driver.**

For this scenario, exactly two document types are required before the requirement set may move from `Not Submitted` to `Pending Review`:

1. `Valid Government ID`
2. `Driver's License`

These names are canonical requirement-type labels for the baseline implementation.

## 3. LTO Portal Rule

The business may use the LTO portal externally to verify driver's-license information.

A customer-uploaded screenshot of the LTO portal is **not** a baseline required upload.

Do not preserve the prototype's LTO-screenshot field as a mandatory requirement merely because it exists in the current UI.

Later requirement-review logic may record that Owner/Admin performed external LTO verification, but VS006 must not invent the final review metadata if it is outside that slice.

## 4. Additional / Alternate Documents

The manuscript and older data dictionary mention possible supporting documents such as:

- proof of billing
- authorization letter
- selfie with ID
- other supporting documents

These are not frozen as universally required.

Do not make them mandatory in the baseline self-drive renter flow.

If future client validation defines an alternate renter/driver scenario, this document may be revised to add a scenario-specific requirement matrix.

## 5. Accepted File Types

Baseline renter-document uploads accept only:

- JPEG / JPG — MIME `image/jpeg`
- PNG — MIME `image/png`
- PDF — MIME `application/pdf`

Do not accept executable, archive, script, HTML, SVG, or arbitrary binary formats.

The implementation must validate both:

- declared MIME type; and
- expected extension/content handling as reasonably supported by the selected server/storage implementation.

A renamed executable or unsupported file must not be accepted merely because its filename looks valid.

## 6. Maximum File Size and Count

Maximum size:

**10 MiB per uploaded file**

Baseline count:

- one current `Valid Government ID` file per booking requirement set;
- one current `Driver's License` file per booking requirement set.

A replacement creates a new version/current file rather than allowing multiple simultaneously active files for the same baseline requirement type.

Do not introduce arbitrary multi-file upload for a baseline requirement type.

## 7. Booking Association

Every renter-document submission must belong to exactly one canonical booking request.

The authenticated Customer/Renter may upload documents only for a booking owned by that authenticated customer.

Do not accept a client-supplied customer ID as ownership authority.

The server must derive customer identity from the authenticated principal and validate ownership of the target booking.

## 8. Requirement Set

Use a booking-level requirement-set concept to represent the aggregate requirement-verification status defined in `03-workflows-and-status-rules.md`.

A booking has at most one current requirement set.

Initial aggregate status:

`Not Submitted`

When current valid uploads exist for both baseline required document types and the customer completes/submits the requirement set:

`Not Submitted` → `Pending Review`

Customer upload does not create `Verified`.

`Pending Review` → `Needs Resubmission` and `Pending Review` → `Verified` belong to the later authorized review capability.

## 9. Document Metadata

Persist document metadata separately from the binary file.

At minimum, each stored document record should preserve:

- canonical document ID;
- booking ID;
- authenticated customer ID or derivable owner relation;
- canonical requirement type;
- private storage path/key;
- original filename for display only;
- MIME type;
- size in bytes;
- version or equivalent replacement ordering;
- whether/current-version semantics;
- uploaded timestamp;
- superseded timestamp where applicable.

Do not use the original user filename as the authoritative storage key.

Generate collision-resistant storage object names.

## 10. Replacement / Resubmission

For an unverified requirement set:

- Customer/Renter may replace their own current document for a required type.
- Replacement must create a new stored object/document version.
- The previous version becomes superseded/non-current.
- Do not silently overwrite the previous object in place.
- Only the current version is used for the active requirement submission.

When the aggregate status is `Needs Resubmission`, submission of the required corrected replacement(s) may return the aggregate status to `Pending Review`.

Exactly which document(s) require replacement will be determined by the later Owner/Admin review record.

After the aggregate status is `Verified`, Customer/Renter replacement is not allowed in the baseline flow.

Exceptional reopening after verification remains an open decision.

## 11. Supabase Storage Security

Renter requirement files must use a **private Supabase Storage bucket**.

Recommended canonical bucket name:

`renter-requirements`

The bucket must not be public.

A storage object should be namespaced so ownership and booking association are explicit, for example:

`{customer_id}/{booking_id}/{requirement_type_key}/{generated_file_id}.{extension}`

Exact internal normalization of `requirement_type_key` may be chosen by implementation as long as the canonical business labels remain unchanged.

## 12. File Access

### Customer/Renter

May:

- upload permitted document types for their own booking;
- view/download only their own current/superseded requirement documents where the UI exposes them;
- replace their own unverified/current requirements under the rules above.

Must not:

- access another customer's requirement files;
- modify review decisions;
- mark requirements verified.

### Owner/Admin

May access protected renter documents required for manual requirement verification.

Review/verification mutation is implemented in the later review slice.

### Operations Staff

Must not receive raw access to:

- government-ID files;
- driver's-license files.

Staff may later receive only an authorized non-sensitive derived status where required for reservation coordination.

## 13. Delivery of Private Files

Never expose a permanent public URL for protected renter documents.

Use one of these protected patterns:

- trusted server-mediated file response; or
- short-lived signed URL created only after trusted authorization.

If signed URLs are used, use a short expiry suitable for immediate viewing/download. Default implementation target:

**5 minutes maximum**

Do not store signed URLs as persistent database truth.

Store the private object path/key instead.

## 14. Upload Trust Boundary

The implementation must validate before accepting/persisting a file:

- authenticated principal;
- `Customer/Renter` role;
- active account where applicable;
- ownership of target booking;
- allowed requirement type;
- allowed file type;
- file-size limit;
- replacement/status eligibility.

Do not rely only on browser `accept` attributes.

Client-side validation may improve UX but is not the security boundary.

## 15. Filename and Metadata Safety

Treat original filenames as untrusted display metadata.

Sanitize or safely encode filenames before display.

Do not build storage paths directly from an unsanitized original filename.

Do not expose server filesystem paths, service-role credentials, or private bucket internals to the user.

## 16. Retention and Deletion

No automatic time-based deletion policy is frozen yet.

Therefore:

- do not implement automatic expiry/deletion of renter documents;
- do not hard-delete superseded files merely as part of replacement;
- keep superseded versions private and non-current;
- retain files until a formal retention/deletion policy is approved.

This is an implementation safety default, not a permanent legal/business retention period.

The long-term retention/deletion duration remains in `10-open-decisions.md`.

## 17. Scope Boundary for VS006

VS006 may implement:

- private Storage bucket/policies;
- requirement-set persistence;
- secure customer uploads;
- document metadata;
- baseline two-document submission;
- replacement/versioning before verification;
- own-document viewing;
- aggregate `Not Submitted` → `Pending Review`.

VS006 must not implement:

- Owner/Admin verification to `Verified`;
- review rejection / `Needs Resubmission` decisions unless explicitly authorized by the slice;
- payment submission;
- payment verification;
- booking confirmation;
- vehicle assignment;
- rental lifecycle;
- arbitrary additional mandatory document scenarios.

## 18. Warning to Codex

Do not treat the existing prototype requirement-upload UI as business authority.

In particular:

- do not require an LTO portal screenshot;
- do not make proof of billing, authorization letter, selfie with ID, or `Other` mandatory in the baseline flow;
- do not make Storage public;
- do not expose Operations Staff to protected ID/license files;
- do not allow upload to imply verification;
- do not invent a long-term retention duration.
