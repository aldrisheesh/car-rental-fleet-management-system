# Owner-confirmed DSS location points

Implemented locally on main. Application changes are not deployed. The additive migration `20261003140000_confirmed_dss_route_points.sql` was applied to the configured Supabase project and recorded in migration history.

## Behavior

Locations now provides a DSS map point dialog for each active operational area. The owner searches an address, sees the provider's matched label and match type, checks an OpenStreetMap pin, chooses an area reference or actual parking/handover point, and acknowledges the displayed result before saving. Editing the search text invalidates the candidate. Signed results expire after 15 minutes and cannot be reused for another area or altered by the client. Existing operations addresses are not changed by this flow.

Allocation context now reads these confirmed endpoints. Both areas need a saved point before route/fuel assessment is attempted. Area-reference routes explicitly remain approximate. Road reports concern the destination vicinity and are not proof of a blockage on the calculated route. This feature does not model homes, parking capacity, real-time vehicle positions, or customer delivery pins.

## Verification

- Production build, TypeScript and scoped ESLint passed.
- 37 operational-context, provider, location and signed-confirmation tests passed.
- Database RLS enabled; anon/authenticated table access revoked; server access confirmed.
- Insert/read verified in a rolled-back transaction. Confirmed-point count remains zero.
- Unauthenticated endpoint returns 401.
- Browser: supplied Dalig address resolves to Dalig Barangay Hall and the map renders.
- Save disabled until acknowledgment; enabled after acknowledgment. Editing the address removes the confirmation controls.
- Desktop dialog verified at 1920×1080. At 390×844 the settled dialog is 358px wide and internally scrolls; confirmation control reachable.

## Remaining owner action

Confirm both map points in Locations, selecting area reference for approximate barangay/street points unless an actual movement endpoint is verified. Then recheck external context in Decision Support. No owner location was saved during implementation; no fleet data, rental records or customer delivery fields were changed.

The new private table is not part of the current synthetic operational-record reset list. Existing baseline/schema drift must still be addressed before the pending full defense rehearsal; no baseline reset occurred here.

Screenshots: `dss-location-confirmation-2026-10-03/desktop.png`, `dss-location-confirmation-2026-10-03/mobile.png`.
