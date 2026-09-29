# Phase 4 reminder and deployment readiness

Date: 29 September 2026  
Branch: `stabilization/ui-refinement`

## Current result

The scheduled-notification implementation is ready for a preview deployment and controlled delivery test. The repository now builds as a TanStack Start application with a Nitro server function, and the Vercel output routes application and API requests to that function.

The production Vercel alias is currently reachable and `/api/health` returns a connected Supabase health response. The custom domains `briahscarrental.site` and `www.briahscarrental.site` do not currently resolve in DNS. The production deployment also predates the cron-compatible GET handler: an unauthenticated GET to `/api/internal/reminders` currently falls through to application HTML. The prepared build corrects that behavior, but it has not been deployed.

## Prepared changes

- `vercel.json` uses the `tanstack-start` framework preset and no longer forces the client-only `dist/client` output or rewrites all paths to `index.html`.
- A daily Vercel cron invokes `GET /api/internal/reminders` at `00:00 UTC` (08:00 Asia/Manila).
- The internal route accepts Vercel cron GET requests and trusted manual POST requests through the same processor.
- Authorization accepts `CRON_SECRET` for Vercel and `REMINDER_PROCESSOR_SECRET` for an independently invoked trusted processor. Both remain server-only secrets.
- Pickup, return, overdue, maintenance and low-availability notification logic remains idempotent and does not mutate booking or rental lifecycle state.
- Non-blocking maintenance records with status `Open` no longer create a false active-maintenance condition.

## Verification

- Reminder, operational-notification and transactional-email tests: 37 passed, 0 failed.
- TypeScript check: passed.
- Targeted ESLint check: passed.
- Vercel prebuilt build: passed.
- Generated output: `.vercel/output/functions/__server.func` exists.
- Generated route map: assets remain static; all remaining routes fall through to `/__server`.
- Generated cron: `/api/internal/reminders` with schedule `0 0 * * *`.
- Production health observation: `https://briah-car-rental.vercel.app/api/health` returned HTTP 200 JSON with `database: "connected"` on 29 September 2026.

The local `.vercel` build output and downloaded environment files are ignored and are not evidence artifacts to commit.

## Limits and remaining actions

The daily schedule is compatible with the Vercel Hobby plan. Vercel documents that Hobby cron execution can occur within the scheduled hour, so 08:00 Asia/Manila is a target hour rather than an exact execution minute. The processor's late-run logic preserves eligible pickup and return reminders after their 24-hour threshold, subject to the booking still being in a valid state.

The following items remain before Phase 4 reminders and Phase 5 deployment can be marked complete:

1. Remove the Vercel project's old custom output/build overrides or confirm that the repository configuration takes precedence.
2. Add a production `CRON_SECRET` without exposing it in repository files or evidence.
3. Deploy to Preview and verify `/api/health`, unauthorized reminder handling, authentication, uploads and an authorized one-off reminder run.
4. Promote the verified deployment to Production and confirm the cron appears in Vercel.
5. Run a controlled notification cycle with test recipients and record in-app creation, email queue state, provider acceptance and recipient delivery separately.
6. Repair the custom-domain DNS records, then verify HTTPS and route behavior on the actual defense domain.

Payment reminders remain intentionally unresolved because the project has no approved payment due date, recipient rule or reminder frequency. That rule must be agreed and recorded before implementation; the system must not invent a cancellation deadline, penalty or fee.
