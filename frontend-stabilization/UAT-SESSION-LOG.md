# UAT Session Log

Template only. No UAT session has been recorded yet.

Do not add passwords, reset tokens, service-role keys, database credentials,
session cookies, signed URLs, private document/proof contents, or real personal
information. Do not create a GitHub Finding merely for expected behavior.

## Approved UAT account inventory

Exactly seven approved UAT accounts were provisioned in project
`vkfacfjkwomhfvrieaza`. The Auth/profile IDs below are safe traceability
identifiers. No UAT test session has been recorded yet.

| UAT label | Role | Auth/profile ID | Readiness | Credential handoff |
| --- | --- | --- | --- | --- |
| UAT-A01 | Owner/Admin | `03a85037-a5f8-4fb0-9de0-da158d72a207` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-S01 | Operations Staff | `a67911f2-44f1-487a-ad91-0c2e1a3e684e` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-C01 | Customer/Renter | `78e786b5-dc4b-478e-ae6e-3daa6f9f78d3` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-C02 | Customer/Renter | `59347401-8a31-4794-ba92-c670d653922c` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-C03 | Customer/Renter | `423e574f-17ac-4bc1-97cd-882c9aff3bb4` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-C04 | Customer/Renter | `f0e55c51-3f54-408f-82ef-228bbfaaa28a` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |
| UAT-C05 | Customer/Renter | `3d3f97a7-d546-4c71-8a99-e8e94e0f23af` | Active; sign-in and role boundary verified | Stored securely; Lead-controlled handoff pending |

The seven IDs are absent from the Defense Manifest and remain NON-BASELINE.
Credentials are not recorded here.

## Session entry template

Copy the following block for each meaningful, Lead-authorized UAT session:

### `<session identifier>`

- Date/time and timezone: `<YYYY-MM-DD HH:MM TZ>`
- Tester label: `<Seb | Arron | Shane | Mica | Aldrich>`
- QA lane: `<UI/UX & Accessibility | Functional & Business Rules | Reliability/Security/Adversarial | Manuscript/Traceability | Lead / cross-lane / final validation>`
- UAT account label: `<UAT-A01 | UAT-S01 | UAT-C01 ... UAT-C05>`
- Application/build commit: `<commit or deployment identifier>`
- Supabase project ref checked: `vkfacfjkwomhfvrieaza`
- Pre-session verifier result: `<DEFENSE BASELINE VERIFIED | DEFENSE BASELINE VERIFIED — UAT DATA PRESENT>`
- Scenario: `<bounded scenario and purpose>`
- Branch/date/vehicle choice: `<branch, Manila-local pickup/return interval, vehicle key if safely exposed>`
- Created booking ID(s): `<none or IDs>`
- Created Requirement/document ID(s): `<none or IDs>`
- Created Payment/proof ID(s): `<none or IDs>`
- Created Rental ID(s): `<none or IDs>`
- Created Maintenance ID(s): `<none or IDs>`
- Other safe generated IDs: `<none or IDs>`
- Expected behavior: `<observable acceptance condition>`
- Observed result: `<pass, partial, or sanitized observation>`
- Finding/Issue link: `<none or existing GitHub link>`
- Post-session verifier result: `<DEFENSE BASELINE VERIFIED — UAT DATA PRESENT>`
- Extra-data counts reviewed: `<accounts / bookings / requirements / payments / rentals / maintenance / storage / notifications / audit / Decision Support>`
- Cleanup/disposition state: `<retained | Lead-authorized retirement pending | retired with authorization | no action>`
- Notes/escalation: `<none or sanitized note>`

## Session close rules

1. Run the post-session verifier before closing the entry.
2. Record baseline integrity separately from extra UAT counts.
3. Escalate and stop if `DEFENSE BASELINE DRIFT DETECTED` appears.
4. Use `NOTICE → RECORD → ROUTE` for cross-lane observations.
5. Do not record credentials or promise an exact restore.
