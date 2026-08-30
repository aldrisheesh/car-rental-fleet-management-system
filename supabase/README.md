# Supabase database workflow

This directory contains version-controlled SQL migrations for the Supabase
database. Apply them with the Supabase CLI from the repository root:

```sh
npx supabase db push
```

After applying migrations, refresh the checked-in TypeScript contract with:

```sh
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

Provider validation requires a configured Supabase CLI project or credentials.
Do not treat a local build as evidence that migrations have been applied.
