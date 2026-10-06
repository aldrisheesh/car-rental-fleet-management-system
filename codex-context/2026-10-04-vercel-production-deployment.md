# Production deployment — October 4, 2026

Production: https://briahcarrental.site
Deployment: dpl_BucQtdezxe3NEFgruFWeq1bPmedR
Immutable URL: https://briah-car-rental-9pqfl9p4m-aldrisheeshs-projects.vercel.app
Vercel status: READY; target: production. Custom domain aliases promoted successfully.

Deployed current working directory, including uncommitted DSS hardening and transfer changes. No Git push or commit was performed.

Initial deployment was rejected for vulnerable TanStack Start 1.168.13. Updated package manifest and lockfile to Start 1.168.60 with server-core 1.169.39, the vendor-patched versions. Router resolved to 1.170.41. Root error component now uses the router ErrorComponentProps type (error is unknown). No vulnerability bypass was used.

Added .vercelignore to exclude secrets, backups, screenshots, temporary files, dependencies and local output from deployment. Remote build uses stored Vercel production secrets. Production and rehearsal use the same Supabase project; the transfer readiness migration was already applied.

Validation: 46 focused tests passed; TypeScript and git diff --check passed; Vercel remote production build completed. Public homepage HTTP 200; unauthenticated protected fleet API HTTP 401. Signed in through frontend, loaded Fleet Allocation for Sedan October 12–18: Taft required 2/projected 1/shortage 1, Antipolo projected 1/surplus 1, no eligible current donor. Approved and rejected decision history both retained.

Screenshot: output/vercel-production-2026-10-04/allocation-live.jpg

This was a production deployment smoke check, not a repeat of every end-to-end rehearsal. Known DSS presentation observations from the prior rehearsal remain documented in 2026-10-04-dss-successful-transfer.md.
