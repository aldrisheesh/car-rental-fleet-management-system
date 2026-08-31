# Client Clarification Register

**Status:** Active Client Validation Register  
**Last updated:** 2026-09-01

Existing CQ-001 through CQ-022 remain active as previously defined.

## CQ-023 — Historical Operational Availability Baseline for Vehicles

**Process:** Fleet Analytics / Idle Detection / Utilization

**Known**

The manuscript permits the date when a never-rented vehicle became operationally available to serve as its idle-duration reference.

Vehicle utilization also excludes inactive days from Eligible Operational Days.

The system can begin recording canonical active/inactive state history going forward.

**Missing detail**

For vehicles that existed before canonical system state-history tracking, the system does not know:

- the exact date each vehicle first became operationally available;
- historical periods when the vehicle may have been inactive;
- whether Briah's has records that can establish those dates.

Vehicle record creation date must not automatically be treated as business operational availability.

**Temporary implementation assumption**

VS013 records trustworthy active/inactive state history prospectively.

For historical dates lacking recorded state coverage:

- do not backdate the current active state;
- do not fabricate an idle baseline;
- mark utilization historical eligibility coverage as incomplete;
- classify idle as Unable to Determine for a never-rented vehicle lacking a trustworthy operational-availability reference.

Explicitly labeled demo/sample historical state data may be used for functional testing.

**Question for Briah's**

> Para po sa mga sasakyan na wala pang previous rental record sa system, may record po ba kayo kung kailan sila first naging available/active for rental? May records din po ba kayo kung kailan sila temporarily inactive or unavailable dati? Maaari po ba naming gamitin/import ang mga dates na iyon para sa utilization at idle monitoring?

**Implementation impact**

May provide historical utilization denominator coverage and a trustworthy idle baseline for never-rented vehicles.

**Status:** Open — Client Confirmation

## Presentation Rule

Demonstrate the implemented provisional flow first, explain the temporary assumption, then ask the client-specific question.

After confirmation, update the authoritative specification/data rather than silently backdating history.
