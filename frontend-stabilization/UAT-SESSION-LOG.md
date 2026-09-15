# UAT Session Log

Template only. No UAT session has been recorded yet.

Do not add passwords, reset tokens, service-role keys, database credentials,
session cookies, signed URLs, private document/proof contents, or real personal
information. Do not create a GitHub Finding merely for expected behavior.

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
