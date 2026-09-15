# Controlled E2E Identity Verification

## Scope

This was a bounded, read-only controlled-identity verification against the
local non-production QA target on branch `stabilization/frontend-rebuild`.
The repository was at evidence commit `91fe10d90e8825ee71c6f7102c709375c514a8fc`
before this documentation-only change. The approved plan, the previous
resumed execution record, `scripts/qa/README.md`, and
`scripts/qa/controlled-fixtures.ts` were read before verification.

No Auth user, password, app metadata, profile, role, fixture, booking,
operational record, Storage object, source file, deployment, or application
data was changed. No E2E workflow mutation was attempted.

## Previous blocker

The previous execution established successful Customer and Owner/Admin login,
the Customer `Customer/Renter` role, active status, and Customer denial of the
Admin dashboard. It stopped because the Customer's controlled ownership could
not be established from ordinary profile metadata. The current verification
used the canonical protected Auth ownership authority required by the fixture
contract instead of treating ordinary profile metadata as ownership proof.

## Authentication result

- Customer authentication: **PASS**.
- Authenticated role: `Customer/Renter`.
- Customer account status: **Active**.
- Application session principal matched the sign-in principal: **PASS**.
- Customer Admin denial: **PASS**; the Admin dashboard read returned `403`.
- The Owner/Admin result remains the previously recorded **PASS**; no Owner/Admin
  workflow was executed in this identity-only check.

## Fixture ownership authority

The canonical authority is the `isOwnedAuthUser` rule in
`scripts/qa/fixture-inventory.ts`, as used by the controlled fixture tooling.
It requires the exact fixture identity together with the protected Auth
ownership tuple for the standard controlled fixture contract. The ordinary
profile row is not required to carry that protected marker.

The protected standard namespace tested was `briah-controlled-qa-v1`. No
protected metadata values, account email, Auth ID, token, cookie, password, or
other private account data are recorded here.

## Protected ownership verification

After application authentication, only the exact Auth principal from that
session was read through the Auth admin lookup. Unrelated Auth users were not
enumerated. The lookup was read-only.

- Protected ownership lookup performed: **YES**.
- Standard controlled namespace match: **NO**.
- Canonical standard Customer identity match: **zero**.
- Historical controlled identity match: **zero**.
- Protected ownership result: **FAIL**.

The authenticated principal therefore does not carry the canonical protected
ownership evidence required for the standard controlled fixture namespace.

## Fixture inventory cross-check

The authenticated principal's application profile was read-only checked and
remained `Customer/Renter` with `Active` status. The principal did not
correspond to exactly one standard fixture-owned Customer identity: it matched
none. The protected namespace/version/identity contract therefore did not
match, and the ordinary profile result was not used to override that failure.

The identity was not treated as historical-only, controlled by a different
standard fixture label, or safely interchangeable with a fixture identity.
No collision was used as a reason to weaken the ownership requirement.

## Classification

**B. CURRENT E2E CUSTOMER IS NOT CONTROLLED**

- Controlled fixture ownership: **FAIL**.
- Fixture label classification: **not controlled**.
- Current `E2E_CUSTOMER_EMAIL` / `E2E_CUSTOMER_PASSWORD` credentials are safe
  to use for controlled mutation: **NO**.

This result does not authorize changing or replacing the account itself.

## Authorized next step

Do not execute the controlled E2E workflow with the current Customer
credentials. Replace the local-only E2E Customer variables with credentials
for an existing standard controlled fixture Customer, without printing or
committing them. Re-run this identity verification and require **PASS** for
protected controlled ownership before any separately authorized controlled
E2E mutation attempt.
