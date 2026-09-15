# Group User Acceptance Testing Plan

Status: **Planning only — Lead approval is required before account creation or
testing.**

This plan is prepared from `stabilization/frontend-rebuild` at the Defense
verifier merge commit `fdffa62b340e98828c292b032d18b59731d18614`.

Current verified state:

- Supabase project: `vkfacfjkwomhfvrieaza`.
- `npm run defense:verify`: `DEFENSE BASELINE VERIFIED` when run with the
  approved runtime environment loaded.
- Current dataset classification: `DEFENSE DATASET PARTIALLY READY — HISTORY
  TIME-GATED`.
- No UAT accounts or UAT records were created for this plan.

## Purpose

This plan defines a bounded, traceable way for the capstone group to exercise
Briah's Car Rental against the single production/Defense Supabase project
without silently changing the frozen Defense Baseline.

UAT is limited to synthetic identities and synthetic workflow data. The group
may exercise signup/sign-in, vehicle browsing, Finder, bookings, requirements,
payment proofs, Owner/Admin review, Operations Staff reads, conflict-safe rental
lifecycles, safe Maintenance scenarios, Reports, Notifications, and Audit.

This is not authorization to begin broad testing. It is not authorization to
change application rules, create historical forecast data, restore data, or
build destructive cleanup tooling.

## Environment model

- There is one hosted Supabase environment for production and defense:
  `vkfacfjkwomhfvrieaza`.
- The Defense Manifest is an allowlist of protected baseline identities and
  records. It is not a claim that every row in the project is Defense data.
- Rows and Auth identities not in the Manifest are classified by the verifier as
  post-freeze extra data. They are not automatically safe to delete.
- The verifier is read-only. It checks baseline identity, protected fields,
  Storage metadata, required Notification/Audit evidence, and the current
  time-gated Decision Support state.
- UAT must use the application and canonical workflows. No arbitrary SQL,
  direct table mutation, service-role client, or database credential is given
  to testers.
- The ignored local environment may contain runtime secrets. Secrets are loaded
  only through the approved local mechanism and are never copied into this
  plan, the session log, GitHub, prompts, or screenshots.

## Defense baseline protection

Every record named by `frontend-stabilization/DEFENSE-DATASET-MANIFEST.md` is
Baseline-owned. This includes:

- A01, S01, S02, and C01–C18 accounts and profiles;
- the nine baseline bookings and their booking/finder state;
- baseline Requirement sets, documents, reviews, Payments, and payment proofs;
- the C08 active rental and C09 returned rental;
- the three baseline Maintenance records and their protected state;
- baseline Storage objects;
- manifest-listed Notifications, Audit evidence, and Decision Support rows.

During ordinary UAT, testers must not edit, review, replace, upload against,
release, return, cancel, delete, normalize, or otherwise mutate a baseline
record. A UAT workflow must use a UAT account and a newly created UAT booking.
The baseline booking schedule must not be changed to make a test fit.

Audit is append-only. Additional Audit rows are historical truth and must not
be deleted merely to restore a count. Notifications are dynamically generated;
additional Notifications are expected to be reported rather than normalized.

The verifier remains the primary guard. A protected-record failure is not made
acceptable by the presence of a UAT log entry.

## UAT account strategy

The recommended population is **seven accounts**, created only after Lead
approval:

| Internal label | Role | Purpose |
| --- | --- | --- |
| UAT-A01 | Owner/Admin | UAT-only review, assignment, confirmation, rental, Maintenance, and reports actions that require the privileged role. |
| UAT-S01 | Operations Staff | UAT-only authorized read surfaces and read-only behavior. |
| UAT-C01 | Customer/Renter | Seb's primary customer workflow identity. |
| UAT-C02 | Customer/Renter | Arron's primary customer workflow identity. |
| UAT-C03 | Customer/Renter | Shane's reliability/security observation identity. |
| UAT-C04 | Customer/Renter | Mica's traceability identity. |
| UAT-C05 | Customer/Renter | Aldrich's cross-lane and final-validation identity. |

The seven-account recommendation is the smallest practical population that
keeps five named participants from sharing customer credentials while still
covering the privileged and staff workflows. If privileged testing is not
approved, omit UAT-A01 and do not attempt Owner/Admin scenarios; the resulting
six-account subset is not a substitute for privileged acceptance coverage.

Internal labels are for the session log only. Visible names and email
addresses must be ordinary-looking synthetic identities using a Lead-approved
synthetic mailbox/domain. They must not contain real personal information.
The labels must not be inserted into unsupported schema fields or displayed as
customer-facing QA markers.

Do not reuse C01–C18, A01, S01, or S02 as ordinary UAT identities. Do not
arbitrarily create extra accounts. Account labels do not grant authority; the
role assigned through the approved account-provisioning process does.

## Team ownership

The QA lanes own scenarios and evidence, not application implementation
authority:

| Tester | QA lane | Initial UAT identity | Ownership rule |
| --- | --- | --- | --- |
| Seb | UI/UX & Accessibility | UAT-C01 | Record UI observations and accessibility evidence; do not modify source while testing. |
| Arron | Functional & Business Rules | UAT-C02 | Exercise bounded canonical workflows and record expected/observed behavior. |
| Shane | Reliability/Security/Adversarial | UAT-C03 | Use only approved non-destructive checks; no brute force or destructive penetration tests. |
| Mica | Manuscript/Traceability | UAT-C04 | Verify scenario IDs, log completeness, and provenance links. |
| Aldrich | Lead / cross-lane / final validation | UAT-C05; UAT-A01 or UAT-S01 only when authorized | Resolve safety decisions, triage findings, and perform final validation. |

The initial identity mapping is a traceability aid, not a permanent assignment.
Any reassignment must be recorded in the session log. UAT-A01 and UAT-S01 are
controlled by the Lead and may be used by another tester only for an explicitly
assigned session.

## Credential handoff

Credentials are handled outside the repository and outside ChatGPT/Codex:

- use one individual password per UAT account;
- generate or reset credentials through the Lead-controlled, approved Auth
  process;
- hand credentials directly through an approved password manager or secure
  live handoff;
- require the tester to confirm sign-in without recording the password;
- reset a credential only for the account owner or with explicit Lead
  authorization.

Each Customer tester needs only that UAT Customer's email and password. The
Operations Staff tester needs the UAT Staff email and password. Owner/Admin
credentials are provided only to a specifically authorized person for a
specifically authorized privileged session.

No password, reset token, service-role key, database URL/password, signed URL,
session cookie, or API secret may appear in GitHub, tracked Markdown, prompts,
screenshots, issue text, or chat. The shared production service-role key is
never distributed to testers.

The existing Defense accounts require a separate Lead-managed readiness process;
they are not a credential source for ordinary UAT.

## UAT provenance

The verifier's Manifest allowlist is the integrity boundary:

- every UAT Auth identity and application row must be absent from the Defense
  Manifest;
- capture the generated booking ID immediately after a booking is created;
- capture Requirement, document, Payment, proof, Rental, Maintenance, and
  other generated IDs when the canonical UI exposes them safely;
- record the internal UAT account label, tester label, scenario, and IDs in the
  session log;
- use only existing canonical fields for a test-purpose note when the workflow
  already supports one and the note contains no private information;
- do not add a `uat_*`, QA marker, or other schema column solely for testing;
- do not infer that an unlisted row is safe to delete merely because it is not
  in the Manifest.

UAT records may remain in the project. Provenance is established by the
dedicated account, captured IDs, bounded scenario, and session log—not by
mutating baseline records or inventing customer-facing labels.

## Session logging

`frontend-stabilization/UAT-SESSION-LOG.md` is a template only until testing
is authorized. Add one entry for each meaningful session and no credentials.
Each entry records the date/time with timezone, tester label, QA lane, UAT
account label, scenario, created booking/Requirement/Payment/Rental IDs where
safe, expected behavior, observed result, Finding/Issue link if applicable,
and cleanup/disposition state.

An expected result does not require a GitHub Finding. A Finding link is added
only for a reproducible suspected defect. The log must distinguish a UAT
record's ID from a Defense baseline ID and must never contain document/proof
contents or secret values.

## Pre-UAT verification

Before every UAT session, the Lead or delegated tester must complete this
checklist:

1. Fetch the current `stabilization/frontend-rebuild` baseline and record the
   tested commit.
2. Confirm that the Supabase URL resolves to project ref
   `vkfacfjkwomhfvrieaza`; do not print the URL or credential-bearing values.
3. Run `npm run defense:verify` with the approved runtime environment loaded.
4. Accept only `DEFENSE BASELINE VERIFIED` or, after UAT data exists,
   `DEFENSE BASELINE VERIFIED — UAT DATA PRESENT`.
5. Confirm that baseline integrity is PASS and review any extra-data report.
6. Select a dedicated UAT account; do not use a Defense identity.
7. Define one bounded scenario, its expected result, and its safe vehicle/date
   choice before creating a record.
8. Confirm that the action is safe for the single production/Defense
   environment and that no baseline row, object, schedule, or role will be
   changed.

`VERIFICATION BLOCKED` also stops the session because baseline integrity has
not been proven. Any `DEFENSE BASELINE DRIFT DETECTED` result stops UAT
immediately and must be escalated to Aldrich. Do not create a compensating row,
delete a suspected row, or continue testing while drift is unresolved.

## Safe testing boundary

### Allowed controlled UAT

- normal synthetic signup/sign-in and sign-out;
- browsing vehicles and using Finder;
- creating a new UAT booking;
- uploading synthetic requirement documents;
- submitting synthetic payment proofs through the canonical demo payment flow;
- Owner/Admin review of UAT requirements and payments;
- Operations Staff authorized reads, with no write attempt as a Staff user;
- Owner/Admin mutation of UAT records only;
- conflict-safe assignment, confirmation, release, and return of UAT rentals;
- a Maintenance scenario on a Lead-approved UAT-safe vehicle;
- observing Fleet, Maintenance, Reports, Notifications, and Audit behavior.

Synthetic files must contain no real identity, license, payment, or other
private information. Use the canonical document types and the application UI.
Do not create real payment transactions or send mail to real recipients.

### Lead authorization required before the action

- destructive cleanup, Auth deletion, or Storage deletion;
- any baseline-record mutation or baseline schedule change;
- role escalation or changing a UAT role;
- schema, migration, policy, or application-business-rule changes;
- historical Decision Support generation or any forecast-history fabrication;
- bulk data/account generation;
- credential reset for another tester's account;
- any test whose safety depends on ambiguous record provenance or a restore.

### Not allowed

Brute force, destructive penetration testing, private-data enumeration,
arbitrary direct database mutations, attacks against third parties, and testing
by corrupting or normalizing Defense records are outside UAT.

Observation is not permission to fix. Testers must not edit source, migrations,
database records, or production configuration while a UAT session is in
progress.

## Vehicle/date strategy

The current Defense schedule includes nine baseline bookings. The latest
baseline return window is C07, ending `2026-09-23T02:16:44Z`; the exact
Manifest schedule is authoritative and must be rechecked before each session.
The baseline vehicle scenarios include:

| Baseline labels | Protected vehicle/scenario |
| --- | --- |
| C01–C07 | Future submitted/confirmed booking vehicles, including the confirmed C01 vehicle. |
| C08 | `DEV-RUSH-001`, active rental. |
| C09 | `DEV-INNO-001`, returned rental. |
| M01 | `DEV-HIAC-001`, completed Maintenance record. |
| M02 | `DEV-RANG-001`, cancelled Maintenance record and a C06 requested vehicle. |
| M03 | `DEV-URVN-001`, Open blocking Maintenance record; never select it for ordinary UAT. |

For the initial booking scenario:

- use a pickup/return interval beginning **2026-09-25 Manila time or later**,
  with a short one- or two-day duration;
- use Taft, Manila and the clean Finder candidate `DEV-MIRA-001` as the
  default only after a fresh read-only availability/Finder check;
- if that candidate is unavailable, stop and ask the Lead to select another
  vehicle rather than using a baseline-linked vehicle by guesswork;
- keep simultaneous UAT bookings on separate vehicles or non-overlapping
  intervals, and record the selected vehicle and dates;
- use the application availability result and canonical assignment checks; do
  not manually alter a baseline booking to resolve a conflict;
- do not use C01's confirmed future interval, C08's active interval, C09's
  returned-rental record, or the submitted C02–C07 intervals as UAT capacity;
- do not create a UAT maintenance record on `DEV-URVN-001` or mutate M01–M03.

If the current date has passed the suggested window, choose the next future
window after a fresh Finder/Calendar read. A date or vehicle that is merely
shown as available is not permission to mutate a baseline record. Maintenance
and rental tests should use separate bounded scenarios unless the Lead confirms
that their vehicle and time interval cannot affect another scenario.

## Post-UAT verification

After every meaningful session, run `npm run defense:verify` again with the
approved runtime environment loaded.

- Before any UAT records exist, the acceptable clean result is
  `DEFENSE BASELINE VERIFIED`.
- Once UAT data exists, the acceptable result is
  `DEFENSE BASELINE VERIFIED — UAT DATA PRESENT`.
- Baseline domains must remain PASS. Extra UAT data is not baseline drift when
  the protected Manifest rows remain intact.
- Record the verifier result and counts for extra UAT Auth accounts, profiles,
  bookings, Requirement sets/documents, Payments/proofs, Rentals, Maintenance,
  Storage objects, Notifications, Audit events, and any legitimate Decision
  Support rows in the session log or linked evidence.
- Additional Audit and Notification history is retained; do not delete or
  normalize it for presentation.

Any protected-row failure is handled as `DEFENSE BASELINE DRIFT DETECTED`:
stop, preserve evidence, and escalate to Aldrich. Do not treat a successful UAT
screen or a matching row count as proof that the baseline is intact.

## Finding workflow

Preserve the team workflow:

`DISCOVER → RECORD → TRIAGE → CONFIRM → ASSIGN → IMPLEMENT → VERIFY → PR → LEAD REVIEW → MERGE`

During UAT, a tester may discover and record a reproducible observation but may
not fix source or database state. Route suspected defects to a GitHub Finding
with the scenario, UAT account label, safe record IDs, expected behavior,
observed behavior, verifier result, and sanitized evidence.

For an observation crossing QA lanes, use:

`NOTICE → RECORD → ROUTE`

Do not create a Finding for expected behavior. Do not include credentials,
private document/proof content, signed URLs, or real personal information in a
Finding.

## End-of-UAT disposition

Cleanup is **not required after every session**. The supported operating state
is an intact Defense Baseline with post-freeze UAT data:

`DEFENSE BASELINE VERIFIED — UAT DATA PRESENT`

At the end of UAT, the Lead chooses one of these dispositions:

- **A — Retain:** retain UAT records if they are clean, realistic, documented,
  and do not impair presentation.
- **B — Selectively retire:** retire specific UAT records only after explicit
  Lead authorization and a record-by-record safety review. Do not assume Auth,
  Storage, Audit, Notification, or foreign-key side effects can be rewound.
- **C — Recreate:** use a separately approved whole-project recovery/recreation
  method if exact rollback is ever required. The current Manifest is not an
  exact restore package and no destructive restore tool is promised.

The disposition and rationale belong in the session log. A selective cleanup
must not be used to make verifier counts look clean, and append-only Audit or
external email-delivery history remains historical truth.

## Defense preparation

`npm run defense:verify` is mandatory:

| Point in the lifecycle | Required result |
| --- | --- |
| Before UAT begins | `DEFENSE BASELINE VERIFIED` or approved UAT-present result if prior UAT exists |
| After every meaningful UAT session | Baseline PASS; normally `DEFENSE BASELINE VERIFIED — UAT DATA PRESENT` |
| Before final merge | Baseline PASS on the merge candidate |
| Before deployment verification | Baseline PASS against the intended project |
| Before defense rehearsal | Baseline PASS and a reviewed UAT disposition |

The verifier proves baseline integrity, not exact full-project cleanliness. The
Lead must also review the session log, outstanding Findings, UAT accounts,
extra rows/objects, Notification/Audit side effects, and whether retained UAT
data improves or impairs the defense presentation.

Do not generate historical forecast data merely to make a Reports or Decision
Support surface look complete. The current history gate remains truthful until
an independently authorized coverage condition is met.

## Credential readiness

The Defense execution evidence states that passwords were not written to
evidence and that secure Lead-managed handoff/reset is required before later
demo or user testing. The existing Defense labels requiring usable credentials
if they are used for an actual defense demonstration are:

`A01`, `S01`, `S02`, `C01`–`C18`.

Practical priority for the current gate-C storyboard is A01, one or both of
S01/S02, C01–C09, and C15–C18. C10–C14 remain history-reserved and should not
be used for new workflow rows. This is a readiness list only; no password or
email is recorded here, and these identities remain prohibited for ordinary
UAT.

Recommended new UAT identities remain `UAT-A01`, `UAT-S01`, and `UAT-C01`–
`UAT-C05`, subject to Lead approval. They are separate from the Defense
credential handoff.

## Authorization required

Before any UAT account or UAT record is created, the Lead must approve in one
place:

1. the exact account count and role breakdown;
2. the internal labels, synthetic display names, and approved synthetic email
   domain/mailbox plan;
3. the individual credential handoff/reset method;
4. the team-to-session ownership mapping;
5. the safe vehicle/date/branch strategy, including the first bounded scenario;
6. whether UAT-A01 is authorized for privileged mutation workflows;
7. whether and where a UAT Maintenance scenario may run;
8. the escalation path for `DEFENSE BASELINE DRIFT DETECTED`; and
9. any later decision to retain or selectively retire UAT records.

Until those approvals exist, this document authorizes no account creation, no
signup campaign, no booking, no upload, no payment proof, no rental mutation,
no Maintenance mutation, and no cleanup.
