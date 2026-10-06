# Approved showroom vehicle images

User selected Version 3 (forest teal modern showroom) and explicitly authorized generating twelve new main photos and setting them in the system. All twelve original active vehicles now have one new canonical gallery image marked cover and the matching legacy vehicles.image_url. This is a shared database/Storage change, immediately visible on localhost and production; no deployment needed.

Assets and complete built-in generation prompts: `output/fleet-showroom-2026-10-05/` (`originals/`, `web/`, generation-manifest.json). JPEGs were transcoded with macOS sips at quality 88, retain original framing and dimensions, and are 405–479KB. The Wigo was regenerated without the sedan reference because the initial draft was visually too similar to a Vios. Final chosen images inspected individually and in the live catalog. Exact years/trims/colors are not recorded in the database, so these are illustrative depictions rather than condition/equipment evidence.

Installation: `scripts/defense/install-showroom-photos.mjs`, guarded to project vkfacfjkwomhfvrieaza and twelve active rows. Current galleries were empty. Each new Storage object has a unique path, old objects retained. Public downloads of each uploaded file matched SHA256 before SQL installation. A transaction locks vehicles/vehicle_images and guards concurrent cover changes, inserts twelve new covers with illustrative alt text and updates matching image_url fields. IDs, paths, hashes and previous-record backup are in `installed.json`. Previous vehicles and gallery rows were archived with restrictive file permissions in `backup-artifacts/vehicle-photos/`.

Verified frontend: live `/vehicles` has twelve articles with new main URLs, all images loaded. Ford Everest detail uses new photo. Local Fleet Manage photos for Ford Ranger shows 1 of 5 and Cover photo. Screenshots: live-catalog.jpg and admin-cover.jpg. Temporary verification tabs closed after task. No booking/maintenance/availability writes in installer.

Baseline tooling now includes vehicle_images in TABLES and hashes vehicle-images Storage references during capture. Updated promoted snapshot: `backup-artifacts/defense/baseline-2026-10-05-2026-10-05T09-37-14.308Z.json`, 1,476 referenced artifacts. It supersedes prior 09:01 snapshot and is pointed to by latest.txt. Verify passed exact database comparison plus all storage hashes. Restore drill log: `output/fleet-showroom-2026-10-05/baseline-drill.log`. No actual reset intended/performed. Baseline tests 12 passed; scoped ESLint passed. Earlier unrelated DSS/frontend fixes remain local/unpublished.

## Completed galleries

On October 5, 2026, the user approved synthetic demo year/trim specifications and authorized the remaining photos. Generated 36 additional illustrative photos with the built-in image generation tool: rear exterior, front cabin and passenger cabin for each of the twelve active vehicles. Each gallery now has four images, including its unchanged main cover.

Final prompts and original generation paths are recorded in `gallery-final-manifest.json`. Original PNGs are in `gallery-originals/`; installed optimized JPEGs are in `gallery-web/`. Demo specifications are in `demo-specifications.json`. These are illustrative AI depictions for the synthetic fleet, not manufacturer-verified equipment or condition photos.

`scripts/defense/install-showroom-gallery.mjs` uploaded unique objects, verified all 36 public downloads by SHA256 and inserted non-cover rows at sort orders 1–3 in a guarded transaction. `gallery-installed.json` records installed rows, URLs, hashes and the pre-install backup. All twelve galleries have exactly four photos and one cover. Existing covers, vehicle records and operational test cases were preserved. Scoped ESLint passed. Customer gallery navigation was checked in the frontend; `gallery-customer-preview.jpg` shows the installed front cabin and four thumbnails.

Latest promoted defense snapshot: `backup-artifacts/defense/baseline-2026-10-05-2026-10-05T10-50-27.646Z.json`, with 1,512 referenced artifacts. This supersedes the earlier snapshot above. Database rows and all storage artifacts passed verification (`gallery-baseline-verify.log`). No frontend deployment was required.

The transactional restore drill also passed (`gallery-baseline-drill.log`); its temporary changes were rolled back.
