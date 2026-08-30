# Requirements and Secure Storage Specification

**Status:** Frozen for Baseline Requirement Submission  
**Last updated:** 2026-08-31

This document defines the implementation rules for baseline Customer/Renter requirement submission and secure storage.

Manual review semantics are defined separately in `12-requirement-review-and-verification.md`.

## Baseline Scenario

The baseline implementation scenario is:

**Customer/Renter is also the intended self-drive driver.**

Required document types:

1. `Valid Government ID`
2. `Driver's License`

A customer-uploaded LTO portal screenshot is not a baseline required upload.

## Accepted File Types

Accept only:

- JPEG/JPG — `image/jpeg`
- PNG — `image/png`
- PDF — `application/pdf`

Maximum size:

**10 MiB per file**

Validate extension, MIME type, and supported file signature server-side.

## Booking Association

Every requirement set belongs to exactly one canonical booking request.

Customer identity must come from the authenticated principal.

## Requirement Set

Each booking has at most one current requirement set.

Initial status:

`Not Submitted`

When both baseline required current documents exist and the customer explicitly submits the set:

`Not Submitted` → `Pending Review`

After Owner/Admin review:

- `Pending Review` → `Needs Resubmission`; or
- `Pending Review` → `Verified`

Detailed review conditions are authoritative in `12-requirement-review-and-verification.md`.

## Document Metadata

Persist at minimum:

- canonical document ID;
- requirement-set ID;
- booking ID;
- customer ownership relation;
- canonical requirement type;
- private storage path/key;
- original filename;
- MIME type;
- size in bytes;
- version/replacement ordering;
- current/non-current state;
- uploaded timestamp;
- superseded timestamp where applicable.

Do not store signed URLs as truth.

## Replacement / Resubmission

Before initial submission (`Not Submitted`), Customer/Renter may replace either current requirement document.

When status is `Needs Resubmission`, Customer/Renter may replace only document types currently marked as requiring replacement by Owner/Admin review.

Replacement must:

- create a new private storage object;
- create a new document version;
- supersede the previous current version;
- preserve the previous object privately;
- maintain exactly one current version per requirement type.

After the required corrected files are present, the customer explicitly resubmits:

`Needs Resubmission` → `Pending Review`

The new review cycle evaluates the new current versions.

After status is `Verified`, ordinary customer replacement is prohibited.

Exceptional reopening after verification remains open.

## Supabase Storage Security

Use private bucket:

`renter-requirements`

Recommended path shape:

`{customer_id}/{booking_id}/{requirement_type_key}/{generated_file_id}.{extension}`

Never expose a permanent public URL.

Protected file delivery must use:

- trusted server-mediated access; or
- a short-lived signed URL after trusted authorization.

Maximum signed-URL lifetime:

**5 minutes**

## File Access

### Customer/Renter

May access only requirement metadata/files for their own bookings.

### Owner/Admin

May access protected renter documents required for manual verification.

### Operations Staff

Must not receive raw access to government-ID or driver's-license files.

## Retention

No long-term automatic retention/deletion duration is frozen.

Do not automatically delete aged or superseded requirement files.

## Warning to Codex

Do not:

- require an LTO screenshot;
- add additional mandatory baseline document types;
- make Storage public;
- expose Operations Staff to raw renter documents;
- treat upload as verification;
- allow replacement of arbitrary files while `Needs Resubmission`;
- allow ordinary replacement after `Verified`;
- invent a retention duration.
