# Defense Dataset Verify Tool

## Purpose

`npm run defense:verify` is a read-only verification command for the approved
Defense Dataset. It answers whether the current production project still
contains the baseline records and states recorded in
`DEFENSE-DATASET-MANIFEST.md`. It does not restore, repair, normalize, or
otherwise mutate production data.

The verifier reads only the approved production project and treats the current
time-gated Decision Support state truthfully: the present baseline has no
historical analytical inputs or derived Decision Support rows.

## Project guard

The verifier extracts the project ref from `SUPABASE_URL` and requires the
exact host ref `vkfacfjkwomhfvrieaza`. It rejects custom/ambiguous hosts,
missing credentials, and any other Supabase project before creating a client or
performing a read. It does not rely on environment names such as
`production`.

The service-role credential is read at runtime from `SUPABASE_SERVICE_ROLE_KEY`
and is never printed or written to the manifest/report. The command should be
run with the normal runtime environment already configured; `.env.local`
remains ignored.

## Manifest model

The approved Markdown manifest remains the human-readable authority. Because it
does not expose every safe row/object identifier in machine-readable form, the
bounded companion is:

`scripts/defense/manifest.json`

The companion was derived from the approved Markdown manifest and current
execution evidence at `60ddeb7ded6381b53e201150f4312d2e1c4d9c42`. It contains
safe UUIDs, canonical vehicle/branch bindings, workflow states, evidence
predicates, and SHA-256 fingerprints of private Storage paths. It contains no
credentials, passwords, signed URLs, private paths, or document/proof content.

The verifier checks the companion's authorized project ref, expected counts,
required evidence shape, and SHA-256 digest of the Markdown manifest before
using it. A future authorized history/Decision Support update must update both
manifest files and their recorded relationship; the verifier does not hard-code
the current zero derived-state counts.

## Baseline ownership model

The manifest is an allowlist, not a claim that every row in the Supabase
project is Defense data. Baseline records are matched by their safe IDs and
then checked for the fields that define their approved identity and state:

- all 21 Auth IDs and profiles, role, display name, and Active status;
- the 9 booking IDs, customer, branch, requested/assigned vehicle, and status;
- requirement sets, documents, reviews, payments, proofs, rentals, and
  maintenance records with their approved bindings and lifecycle state;
- Storage object existence through private-path fingerprints, without exposing
  the paths or contents;
- required notification and audit evidence predicates;
- the coverage singleton and manifest-listed Decision Support records.

Missing IDs are `MISSING BASELINE RECORD`; changed protected fields are
`MODIFIED BASELINE RECORD`; duplicate/unresolvable evidence is
`AMBIGUOUS / UNRESOLVED`. The four registered-only accounts C15–C18 are
explicitly checked for the absence of child workflow rows.

## UAT differentiation

Rows and Auth identities whose IDs are not in the manifest are reported as
post-freeze extra data. They are not silently treated as baseline records and
do not fail baseline integrity by themselves. This produces the intended
distinction between, for example, an intact baseline plus new UAT accounts and
bookings versus a missing or modified baseline booking.

Notifications are not fixed-count baseline data. The verifier checks the
manifest-required evidence and reports additional notification rows separately.
Audit is append-only: required baseline events must remain present, while
additional audit rows are allowed and reported separately rather than treated
as corruption. Additional Decision Support rows are also reported separately;
future authorized outputs become baseline only when the manifest is updated.

## Verification coverage

The command reads Auth, profiles, application tables, safe Storage metadata,
and the time-gated/derived-state tables. It covers:

- accounts and role/status distribution;
- current booking ownership, state, branch, and vehicle binding;
- requirement state/binding, document type/version/currentness, reviews, and
  Storage ownership;
- payment state/binding and proof ownership;
- the C08 active and C09 returned rentals;
- the three maintenance scenarios and blocking flags;
- required notification evidence plus additional notifications;
- required audit evidence plus append-only additions;
- the expected empty Decision Support state from the current manifest, without
  baking zero values into the verifier.

The verifier never downloads private document/proof content and never prints
Storage paths, messages, transaction references, email addresses, or Auth
metadata.

## Result classes

The process exits `0` for either of the two verified classes:

- `DEFENSE BASELINE VERIFIED` — baseline intact and no extra UAT records;
- `DEFENSE BASELINE VERIFIED — UAT DATA PRESENT` — baseline intact with
  extra non-baseline records.

It exits `2` for:

- `DEFENSE BASELINE DRIFT DETECTED` — a protected baseline record/evidence
  item is missing or modified.

It exits `3` for:

- `VERIFICATION BLOCKED` — the exact project, credentials, manifest, or
  required read access cannot be proven.

## Tests

`npm run test:defense` runs nine focused tests using an in-memory read model;
no production write/API mutation is used. Coverage includes:

- exact project-ref acceptance and wrong-project refusal;
- complete baseline pass;
- missing baseline booking;
- modified baseline booking state;
- extra UAT account/booking classification;
- append-only audit and extra-notification tolerance;
- manifest mismatch rejection;
- secret-safe report output.

## Production verification

The verifier was run against the configured production project
`vkfacfjkwomhfvrieaza` after the implementation was built. The observed result
was:

`DEFENSE BASELINE VERIFIED`

Observed additional UAT data: **NO**. The run found zero extra Auth accounts,
profiles, bookings, requirement sets, payments, rentals, maintenance rows,
Storage objects, notifications, audit events, or Decision Support rows beyond
the manifest-required evidence.

No production insert, update, delete, truncate, upload, Storage removal, Auth
mutation, password change, notification mutation, audit mutation, or derived
output mutation was executed.

## Security review

- The exact project-ref guard runs before production reads.
- Secrets are runtime-only; no service key or password is tracked or printed.
- `.env.local` remains ignored.
- Database access is limited to explicit `select` calls and Auth user listing.
- Storage access is limited to recursive object metadata listing; there is no
  download, upload, or remove path.
- There is no SQL execution or mutation path in the verifier.
- There is no Auth create/update/delete path.
- Reports print only safe project/status/count information and, when needed,
  safe baseline UUIDs for drift diagnosis.
- Existing QA fixture ownership markers were not reused.

The Supabase changelog was checked before implementation; no relevant change to
the service-role read, Auth listing, or Storage metadata APIs was identified.

## Restore feasibility assessment

No `defense:restore` command is implemented. The following is design-only:

Deterministic pieces are limited to an isolated target with a complete,
separately approved database/Storage/Auth snapshot: the manifest can identify
which baseline UUIDs and Storage path fingerprints should be present, and the
canonical application services can regenerate future derived Decision Support
outputs after the history gate is satisfied. The current manifest alone does
not contain complete row payloads, document/proof contents, Auth passwords, or
all timestamps needed to recreate the project exactly.

UAT-only rows can be tentatively identified by IDs absent from the manifest.
That is not enough to authorize deletion: a row attached to a baseline account,
an object without a corresponding application row, or a record with ambiguous
provenance must stop for review. Baseline IDs must never be inferred from QA or
VS naming markers.

Auth deletion/recreation would invalidate sessions and normally produces new
identity lifecycle implications; passwords are intentionally outside the
manifest. Storage deletion is destructive and private-object contents are not
captured by the manifest. Audit is append-only and protected by foreign-key and
trigger rules, so extra audit history cannot be safely erased to make a count
match. Notifications and email-delivery rows are derived side effects and
cannot be safely rewound without considering already-delivered messages.

Forecasts, supply evaluations, and allocation recommendations should be
regenerated by their canonical services after authorized historical generation,
not hand-restored. Reports should likewise be regenerated from source rows.

Therefore exact full-state restoration on the live project is unsafe and
impractical from this manifest alone. A true exact rollback would require a
whole-project restore/recreation boundary that includes database, Auth, and
Storage, plus separate treatment of external email side effects. A future
restore tool should fail closed unless that boundary and explicit Lead approval
exist.

## Remaining limitations

- Verification needs a privileged read credential because Auth listing and
  private Storage metadata are not available through the public client.
- Storage path fingerprints detect path reassignment/deletion, but the tool
  intentionally does not inspect private file contents.
- Notification and audit verification checks required evidence predicates, not
  an exact forever-total count.
- Extra-row classification is allowlist-based. It cannot prove who created an
  unlisted row or safely identify a UAT row whose provenance was never recorded.
- The current baseline is legitimately history-time-gated; zero Decision
  Support outputs are expected until the approved coverage condition changes.

## Recommendation

Use `npm run defense:verify` as the mandatory read-only pre-defense and
post-UAT evidence check. Keep the Markdown and JSON manifests synchronized,
record UAT activity separately, and do not implement a destructive restore
until a Lead-approved whole-project or isolated-project recovery boundary can
preserve Auth, Storage, append-only audit, and external side-effect semantics.
