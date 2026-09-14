# Hosted QA Reset Connection Diagnosis

## Previous failure

The evidence in `HOSTED-QA-RESET-EXECUTION.md` records the command:

```sh
npx --no-install supabase db reset --linked --no-seed
```

The CLI reached `Initialising login role...` and exited with status 1:

```text
LegacyDbResetCancelledError: context canceled
```

No project confirmation/reset completion or migration replay occurred. The evidence records that the remote migration history and database inventory were unchanged, and the command was not retried.

## CLI version

`supabase` `2.116.0`, invoked with `npx --no-install`. No upgrade was performed.

## Project identity

- Branch: `stabilization/frontend-rebuild`
- HEAD: `13426a3d65a52316c017eff7805f74f4c4c905f` (`docs: record hosted qa database reset`)
- Working tree: clean
- Linked project ref: `cpkyxnxpzufigcmaptpg`
- Linked project status: `ACTIVE_HEALTHY`
- `origin/main`: `faed190d9b78bb845e2c89e7160eda90106f741f`, unchanged from the execution evidence

## Database password availability

MISSING

## Connection path

The previous failure occurred on the CLI temporary-login-role path: its output reached `Initialising login role...`. The evidence does not show a database-password direct connection, and the failed reset did not reach confirmation, reset, or migration replay.

Because `SUPABASE_DB_PASSWORD` is unavailable locally, this session did not attempt the direct database-password path.

## Read-only connection result

NOT RUN — a direct read-only connection could not be safely tested without the database password. No debug retry was needed.

## Migration-read result

The local migration directory currently contains 52 SQL migrations, including `20260910010000_maintenance_service_access.sql`. This session did not run `migration list --linked` because the direct connection prerequisite was unavailable. The prior read-only execution evidence records 51 remote migrations, with that file as the only local-only migration and no remote-only migrations.

No migration push, reset, replay, or migration-history repair was performed.

## Failure classification

**C. DATABASE PASSWORD NOT AVAILABLE**

The previous temporary-login-role path failed, and the direct password connection cannot be tested in this session.

## Recommended reset retry method

Do not retry the reset until a valid hosted QA database password is securely supplied as `SUPABASE_DB_PASSWORD` and the destructive authorization gates are separately re-established. First run the read-only check:

```sh
npx --no-install supabase migration list --linked
```

with `SUPABASE_DB_PASSWORD` injected through the approved secure environment mechanism. If that succeeds and the exact project ref and reset authorization are reconfirmed, the later reset method is:

```sh
npx --no-install supabase db reset --linked --no-seed
```

This diagnosis session did not run `db reset`.
