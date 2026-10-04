# Locations list and editor — October 3, 2026

Implemented approved Version 1 on `/admin/branches`, preserving the admin shell and existing canonical vehicle assignments.

- Searchable location list, active filter, current vehicle counts and saved-point confirmation status.
- Inline editor combines name, active state, address lookup, matched address, reference purpose, map preview, acknowledgment and one Save location action.
- New-location flow uses a draft UUID without inserting a branch before Save.
- Address changes invalidate previews. Purpose changes require renewed confirmation. Signed geocoding results expire after 15 minutes and are bound to the location and searched address.
- Unsaved-edit warning when switching locations; Cancel restores persisted state; before-unload warning for unsaved edits.
- Deactivation requires a location-specific dialog, preserves history, and commits any other editor changes together.
- `save_operational_location` persists branch details and confirmed private map point in one database transaction. Active saves without a usable point fail without partial changes. A trigger removes stale points after legacy address updates too.
- Private map points and the save function remain server-only; API enforces Owner/Admin access.

## Verification

- TypeScript, scoped ESLint, production build and `git diff --check` passed.
- 19 focused tests passed (location, canonical branch contract, admin slice contracts, operational external context).
- Connected-database QA passed creation, rename preservation, address replacement, failed-save rollback, invalid-actor rollback, active-point requirement, inactive state, legacy stale-point removal, and function permissions. QA changes rolled back. Script: `node --env-file=.env.local scripts/qa/verify-location-editor.mjs`.
- Additive migration `20261003141509_unified_location_editor.sql` applied to the configured connected project; QA verified it again afterward.
- Unauthenticated GET returns 401.
- Browser: landmark lookup returned Dalig Barangay Hall; actual OpenStreetMap preview rendered. Save disabled until acknowledgment, enabled afterward, and disabled again on address change. Unsaved-selection dialog, blank new-location Cancel, location-specific deactivation dialog, and empty search verified without saving real business changes.
- Layout checked at desktop 1920×1080, laptop 1366×900 and mobile 390×844. Laptop/mobile document widths matched viewport widths; no horizontal overflow. Viewport override reset afterward.
- Screenshots: `locations-editor-2026-10-03/desktop.png`, `laptop.png`, `mobile.png`. Desktop screenshot shows an unsaved preview, not an owner-approved endpoint.

## Remaining owner action and limits

Confirm the intended map pin for each operational area, save it, then recheck external context in Decision Support. The broad Dalig address with postal code did not produce a usable match during verification; the specific public landmark did. A provider match may have imperfect address text and must be checked by the owner. An area reference remains approximate and does not establish individual home locations, live vehicle positions or available parking capacity.

App changes are local and uncommitted. No app deployment, fleet reassignment, booking edit, defense-baseline reset or owner map confirmation was performed.
