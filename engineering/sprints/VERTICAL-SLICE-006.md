# Vertical Slice 006 — Requirements and Secure Document Submission

**Status:** Approved for implementation  
**Objective:** Establish secure, booking-linked renter requirement submission using private Supabase Storage and canonical requirement metadata, without implementing Owner/Admin verification, payment, or later workflow transitions.

## Purpose

VS005 established canonical booking requests.

The next capability is to allow an authenticated Customer/Renter to submit the baseline renter documents required for their own booking through secure private storage.

This slice must establish:

- a booking-level requirement set;
- private renter-document storage;
- canonical document metadata;
- secure own-booking upload/view access;
- controlled document replacement/versioning;
- the aggregate transition from `Not Submitted` to `Pending Review` after the required baseline documents are present.

This slice must **not** implement manual requirement verification.

## Relevant Context

Read only:

- `engineering/AI-ENGINEERING-CONTEXT.md`
- `codex-context/02-roles-and-permissions.md`
- `codex-context/03-workflows-and-status-rules.md`
- `codex-context/04-data-and-business-rules.md`
- `codex-context/11-requirements-and-secure-storage.md`
- this slice contract.

Do not read previous vertical-slice contracts unless a concrete blocker requires them.

## Baseline Required Documents

For the baseline self-drive renter scenario, exactly these two requirement types are required:

- `Valid Government ID`
- `Driver's License`

Do not require:

- LTO portal screenshot;
- proof of billing;
- authorization letter;
- selfie with ID;
- arbitrary `Other` documents.

Those are not frozen as baseline requirements.

The LTO portal remains an external Owner/Admin verification aid for a later review slice.

## Requirement Set

Create a canonical booking-level requirement-set entity.

Each booking may have at most one current requirement set.

At minimum persist:

- canonical requirement-set ID;
- booking ID;
- customer ID or a safely derivable owner relation;
- aggregate requirement status;
- submitted timestamp where applicable;
- created timestamp;
- updated timestamp.

Initial aggregate status:

`Not Submitted`

Allowed transition in VS006:

`Not Submitted` → `Pending Review`

This transition may occur only when:

1. the authenticated customer owns the booking;
2. a current valid `Valid Government ID` upload exists;
3. a current valid `Driver's License` upload exists;
4. the customer explicitly submits the requirement set for review.

Do not automatically mark the set `Pending Review` merely because the second file upload completes unless the implementation deliberately combines the final upload and submit action in a clearly equivalent UX.

Do not implement:

- `Pending Review` → `Needs Resubmission`
- `Pending Review` → `Verified`

Those belong to the later authorized review slice.

## Requirement Document Records

Create canonical metadata records for protected renter documents.

At minimum persist:

- canonical document ID;
- requirement-set ID;
- booking ID where useful for direct relation;
- customer ownership relation;
- canonical requirement type;
- private storage object path/key;
- original filename;
- MIME type;
- size in bytes;
- version number or equivalent replacement ordering;
- current/non-current state;
- uploaded timestamp;
- superseded timestamp where applicable.

Do not persist signed URLs as canonical data.

Do not use original user filenames as storage keys.

## Private Supabase Storage

Use a private Supabase Storage bucket.

Canonical bucket name:

`renter-requirements`

The bucket must not be public.

Use an ownership-aware storage path such as:

`{customer_id}/{booking_id}/{requirement_type_key}/{generated_file_id}.{extension}`

Exact safe internal normalization of `requirement_type_key` may be chosen by implementation.

Do not expose service-role credentials or privileged bucket operations to browser code.

## Accepted File Types

Accept only:

- `.jpg` / `.jpeg` with MIME `image/jpeg`;
- `.png` with MIME `image/png`;
- `.pdf` with MIME `application/pdf`.

Reject unsupported file types.

Browser `accept` attributes may be used for UX but are not sufficient security validation.

Server-side validation is required.

## File Size

Maximum:

**10 MiB per file**

Reject files exceeding this limit before accepting them as canonical requirement documents.

## Upload Count

Maintain exactly one **current** document per baseline requirement type.

For each booking requirement set:

- one current Valid Government ID;
- one current Driver's License.

Older superseded versions may remain stored privately according to the frozen retention rule.

Do not implement unrestricted multiple-file collections for one requirement type.

## Customer Ownership

Customer/Renter may upload only for a booking they own.

The target customer must be derived from the authenticated principal.

Do not trust:

- client-supplied customer ID;
- route-supplied ownership;
- client role state.

Validate that:

- the booking exists;
- booking belongs to the authenticated customer;
- account/role is authorized;
- requirement-set state permits the upload/replacement.

## Replacement / Versioning

Before verification, Customer/Renter may replace their own current requirement file.

Replacement must:

1. upload a new private object;
2. create a new canonical document version;
3. mark the previous version non-current/superseded;
4. preserve the previous private object;
5. make only the newest valid version current.

Do not overwrite the previous object in place.

If replacement persistence fails after object upload, clean up the orphaned new object where practical.

If storage upload fails, do not create successful metadata state.

Avoid metadata/storage divergence.

## Submission State

Before both required documents are present:

`Not Submitted`

Once both current required documents exist, the customer may submit the requirement set.

On successful submission:

`Not Submitted` → `Pending Review`

After `Pending Review`:

- customer may view the submitted requirement set;
- do not allow ordinary replacement unless the workflow later reaches `Needs Resubmission`.

The later review slice will define review outcomes and corrected resubmission behavior.

Do not invent customer edits while `Pending Review`.

## Customer Read Access

Customer/Renter may read only:

- their own requirement-set status;
- their own requirement-document metadata;
- their own protected files.

Protected files must never be exposed through permanent public URLs.

For file viewing/downloading, use either:

- a trusted server-mediated response; or
- a short-lived signed URL issued after trusted authorization.

If using signed URLs, use a maximum expiration of:

**5 minutes**

Do not persist the signed URL.

## Owner/Admin Access Foundation

Owner/Admin must be able to access the protected requirement records/files necessary for later verification.

VS006 may establish the secure server/storage read boundary needed for that future capability.

However, VS006 must not implement:

- approve/verify buttons;
- rejection/resubmission decisions;
- review notes;
- LTO verification result recording;
- status transitions to `Verified` or `Needs Resubmission`.

If the existing admin booking UI has a suitable place to show a non-interactive requirement status such as `Not Submitted` or `Pending Review`, that may be integrated minimally.

Do not create the full verification UI yet.

## Operations Staff Restriction

Operations Staff must never receive raw access to:

- Valid Government ID;
- Driver's License.

This restriction must exist at the server/storage authorization boundary, not only through UI hiding.

Operations Staff may receive only a safe aggregate status where useful for reservation coordination, such as:

- `Not Submitted`
- `Pending Review`
- later `Verified`

but no protected file access.

## Storage and Database Authorization

Use least privilege.

Use additive migrations only.

Establish appropriate:

- table RLS;
- storage bucket policies;
- trusted server authorization.

Customer must not be able to:

- read another customer's requirement metadata;
- download another customer's files;
- upload into another customer's booking namespace;
- set verification status;
- impersonate Owner/Admin;
- modify protected review fields.

Operations Staff must not be able to access protected file objects.

Owner/Admin protected reads must be authorized through trusted identity/role checks.

Do not make the Storage bucket public as a convenience.

## Existing Customer UI Integration

Replace or adapt the existing mock requirement-upload presentation.

Preserve the defended visual style where practical.

The customer should work with a specific canonical booking request.

The UI must clearly show:

- booking/request being completed;
- Valid Government ID state;
- Driver's License state;
- upload/replace action where allowed;
- aggregate requirement status;
- submit-for-review action when both required files exist.

Remove the mandatory LTO screenshot upload from the baseline flow.

Do not immediately route the customer to payment after upload/submission.

After successful requirement submission, communicate:

`Pending Review`

and explain that payment becomes available only after Owner/Admin verification in a later workflow.

Do not imply that uploads are already verified.

## Booking Selection

A customer may have multiple booking requests.

Requirement submission must be associated with one explicit canonical booking.

Do not globally attach requirement files to the customer account without booking association.

If the existing customer dashboard lists booking requests, use the selected booking/request as the requirement context.

Do not accidentally reuse one requirement set across multiple bookings.

## Original Filename Safety

Treat original filenames as untrusted display metadata.

Safely encode/sanitize them for display.

Do not construct HTML or storage paths directly from unsanitized original filenames.

## Retention

No long-term automatic retention/deletion duration is frozen.

Therefore VS006 must:

- preserve superseded private versions;
- not automatically delete documents based on age;
- not implement scheduled cleanup based on an invented retention period.

This does not prevent cleanup of an orphan object created by a failed transaction.

## Error Handling

Handle at minimum:

- unauthenticated access;
- wrong role;
- booking not found;
- booking not owned by customer;
- unsupported requirement type;
- unsupported file format;
- oversized file;
- missing file;
- storage-provider failure;
- metadata persistence failure;
- unauthorized replacement;
- duplicate/current-version race where applicable;
- requirement submission before both required documents exist.

Do not expose raw storage/database internals or private object paths unnecessarily in user-facing errors.

## Testing

Add focused tests where practical for:

- allowed MIME/type validation;
- 10 MiB size enforcement;
- requirement-type validation;
- booking ownership enforcement;
- initial requirement-set status;
- current-document semantics;
- replacement/version behavior;
- submission gate requiring both baseline documents;
- customer cannot mark requirements `Verified`;
- customer cannot access another customer's metadata/file;
- Operations Staff cannot access raw protected files;
- Owner/Admin protected-read authorization boundary;
- no LTO screenshot baseline requirement.

Provider-backed validation should verify where configured:

1. private `renter-requirements` bucket exists;
2. bucket is not public;
3. Customer/Renter can upload valid ID for own booking;
4. Customer/Renter can upload driver's license for own booking;
5. unsupported file type is rejected;
6. oversized file is rejected;
7. another customer cannot access the files;
8. Operations Staff cannot access the files;
9. replacement creates a new current version and supersedes the old version;
10. both baseline files allow explicit submission to `Pending Review`;
11. only one current version exists per requirement type;
12. reload/session change preserves canonical requirement state;
13. no payment workflow starts automatically.

Use disposable development files/data and clean up test-only records where practical without violating the versioning/retention rules for real application data.

## Definition of Done

VS006 is complete when:

- renter requirements are linked to canonical booking requests;
- the baseline requirement set contains exactly Valid Government ID and Driver's License;
- protected files are stored in a private Supabase Storage bucket;
- accepted formats and 10 MiB limit are enforced;
- customer own-booking ownership is enforced;
- canonical document metadata is persisted;
- current/replacement version semantics work;
- both required files are required before submission;
- explicit submission changes aggregate status to `Pending Review`;
- upload does not equal verification;
- Customer can access only own protected documents;
- Owner/Admin protected-read foundation exists;
- Operations Staff raw-file access is blocked;
- no payment or requirement-review workflow is implemented prematurely.

## Stop Rule

Stop after secure requirement submission and `Pending Review` foundation are complete.

Do not implement Owner/Admin requirement verification, Needs Resubmission decisions, payment submission, payment verification, booking confirmation, vehicle assignment, rental processing, or VS007.