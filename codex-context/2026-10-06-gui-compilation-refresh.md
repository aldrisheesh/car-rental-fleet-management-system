# GUI compilation refresh

Final artifact: output/pdf/Briah-System-GUI-Desktop-2026-10-06.pdf.

The updated desktop compilation includes 34 screen views across 32 portrait US Letter (short bond, 8.5 × 11 inch) pages. Twenty-eight views were captured from the current local application on October 6. Six unchanged reference views were retained from the October 5 compilation: registration, operations calendar, maintenance, branch locations, users/roles, and audit trail. The original compilation is preserved.

New/updated coverage includes the daylight home hero, personal handover section with corrected headroom, notification pagination for both roles, rental-stage and fleet-category filters, booking and payment workflows, release collection and return inspection, simplified DSS guidance, stacked transfer review, and booking-purpose/destination plus operational report graphs. The customer request review was captured without sending the rental request. No payments, approvals, read states, preference changes, releases, or returns were submitted.

Capture provenance and compilation index are in output/gui-desktop-2026-10-06/manifest.json, pdf-index.json and pdf-summary.json. Builder: tmp/pdfs/build_gui_latest_portrait.py. Each long screen is shown in full on one page. Three pages pair short screens from the same section. All screenshots fit within half-inch printable margins. The cover uses the exact reference typography, positions, section labels, rules, and footer; only page numbers change. The handover detail is cropped from the freshly captured full home screenshot. Catalog photos were loaded by scrolling before its final capture.

QA: PDF reopened with pypdf; all changed pages rendered after the duplicate handover screen was removed; the remaining pages retain the previously reviewed layout through Poppler and visually reviewed in contact sheets, with larger spot checks. Nine contents links, outline navigation, page counts, margins, and all source image paths verified. Screenshots contain the established synthetic demonstration records.

Removed the standalone How it works capture (96), already included in Home. Screen numbers, contents ranges, outlines, and footer page counts regenerated. Sign in and customer registration now share page 3.
