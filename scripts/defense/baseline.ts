/* eslint-disable @typescript-eslint/no-explicit-any -- Offline seed/restore tooling handles heterogeneous rows whose exact schema is checked against the target database. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import {
  buildBaseline,
  TABLES,
  PROJECT,
  VERSION,
  type Dataset,
} from "./baseline-data.ts";

export const ROOT = "backup-artifacts/defense";
export function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export function digest(value: any) {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
function save(path: string, value: any) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
}
function stamp() {
  return new Date().toISOString().replaceAll(":", "-");
}
export function verifyRows(expected: Dataset, actual: Dataset) {
  const differences = [];
  for (const table of [...TABLES, "vehicles"]) {
    const sort = (rows: any[]) =>
      rows
        .map(canonical)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    if (
      digest(sort(expected[table] ?? [])) !== digest(sort(actual[table] ?? []))
    )
      differences.push(table);
  }
  return differences;
}
export function parseArgs(args: string[]) {
  const command = args[0] ?? "audit";
  if (!["audit", "prepare", "reset", "verify", "drill"].includes(command))
    throw new Error("Commands: audit, prepare, reset, verify, drill");
  const allowed = args
    .slice(1)
    .every(
      (x) =>
        x === "--apply" ||
        x === "--rehearse" ||
        x.startsWith("--as-of=") ||
        x.startsWith("--baseline="),
    );
  if (!allowed) throw new Error("Unknown argument.");
  if (args.includes("--apply") && !["prepare", "reset"].includes(command))
    throw new Error("--apply is only valid for prepare/reset");
  return {
    command,
    rehearse: args.includes("--rehearse"),
    apply: args.includes("--apply"),
    asOf:
      args.find((x) => x.startsWith("--as-of="))?.slice(8) ??
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    file: args.find((x) => x.startsWith("--baseline="))?.slice(11),
  };
}
async function schema(sql: any) {
  return await sql`select c.relname as table_name,a.attname as column_name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull,pg_get_expr(d.adbin,d.adrelid) as default_value from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum where n.nspname='public' and c.relkind='r' order by c.relname,a.attnum`;
}
async function readAll(sql: any) {
  const names =
    await sql`select tablename from pg_tables where schemaname='public' order by tablename`;
  const data: Dataset = {};
  for (const { tablename: t } of names)
    data[t] = await sql`select * from ${sql("public." + t)}`;
  return JSON.parse(JSON.stringify(data));
}
function dependencies(data: Dataset) {
  return {
    profiles: data.profiles
      .map((p) => ({
        id: p.id,
        user_type: p.user_type,
        account_status: p.account_status,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    branches: [...data.branches].sort((a, b) => a.id.localeCompare(b.id)),
    categories: [...data.vehicle_categories].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
    payment_methods: [...data.payment_methods].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
    vehicleIds: data.vehicles.map((v) => v.id).sort(),
  };
}
async function replace(sql: any, data: Dataset) {
  const triggers =
    await sql`select c.relname as table_name,t.tgname,t.tgenabled from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal and c.relname in ${sql([...TABLES, "vehicles"])}`;
  for (const t of triggers)
    await sql`alter table ${sql("public." + t.table_name)} disable trigger ${sql(t.tgname)}`;
  for (const t of [...TABLES].reverse())
    await sql`delete from ${sql("public." + t)}`;
  for (const v of data.vehicles) {
    const { id, ...fields } = v;
    await sql`update public.vehicles set ${sql(fields)} where id=${id}`;
  }
  for (const t of TABLES) {
    const rows = data[t] ?? [];
    if (!rows.length) continue;
    const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const quoted = cols
      .map((c) => '"' + c.replaceAll('"', '""') + '"')
      .join(",");
    for (let i = 0; i < rows.length; i += 200)
      await sql.unsafe(
        `insert into public."${t}" (${quoted}) select ${quoted} from jsonb_populate_recordset(null::public."${t}",$1::text::jsonb)`,
        [JSON.stringify(rows.slice(i, i + 200))],
      );
  }
  for (const t of triggers) {
    const action =
      t.tgenabled === "D"
        ? "disable"
        : t.tgenabled === "A"
          ? "enable always"
          : t.tgenabled === "R"
            ? "enable replica"
            : "enable";
    await sql.unsafe(
      `alter table public."${t.table_name}" ${action} trigger "${t.tgname}"`,
    );
  }
}
async function ensureAssets(client: any, assets: any[], bytes: Buffer) {
  let next = 0,
    completed = 0;
  await Promise.all(
    Array.from({ length: 10 }, async () => {
      while (next < assets.length) {
        const a = assets[next++];
        const r = await client.storage
          .from(a.bucket)
          .upload(a.path, bytes, { contentType: "image/png", upsert: false });
        if (r.error) {
          if (
            String(r.error.statusCode) !== "409" &&
            !/already exists|duplicate/i.test(r.error.message)
          )
            throw new Error(
              `Storage upload failed (${r.error.statusCode ?? "unknown"}).`,
            );
          const old = await client.storage.from(a.bucket).download(a.path);
          if (
            old.error ||
            digest(
              Buffer.from(await old.data.arrayBuffer()).toString("base64"),
            ) !== digest(bytes.toString("base64"))
          )
            throw new Error(
              "Baseline storage collision; existing content differs.",
            );
        }
        completed++;
        if (completed % 100 === 0 || completed === assets.length)
          console.log(`Storage prepared: ${completed}/${assets.length}`);
      }
    }),
  );
}
async function checkAssets(client: any, assets: any[], bytes: Buffer) {
  let next = 0,
    completed = 0;
  await Promise.all(
    Array.from({ length: 10 }, async () => {
      while (next < assets.length) {
        const a = assets[next++];
        const r = await client.storage.from(a.bucket).download(a.path);
        if (r.error || !Buffer.from(await r.data.arrayBuffer()).equals(bytes))
          throw new Error(
            `Missing or changed synthetic storage artifact in ${a.bucket}.`,
          );
        completed++;
        if (completed % 100 === 0 || completed === assets.length)
          console.log(`Storage verified: ${completed}/${assets.length}`);
      }
    }),
  );
}
export async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(ROOT, { recursive: true });
  const api = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!api || new URL(api).hostname !== `${PROJECT}.supabase.co`)
    throw new Error("Refusing an unexpected Supabase project.");
  const u = new URL(
    process.env.DEFENSE_DATABASE_URL ??
      readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
  );
  if (
    !(
      u.hostname === `db.${PROJECT}.supabase.co` ||
      decodeURIComponent(u.username) === `postgres.${PROJECT}`
    )
  )
    throw new Error("API/database project mismatch.");
  if (!u.password) u.password = process.env.SUPABASE_DB_PASSWORD ?? "";
  if (!u.password) throw new Error("Database credentials unavailable.");
  const sql = postgres(u.toString(), {
    ssl: "require",
    max: 1,
    prepare: false,
    connect_timeout: 15,
    types: {
      date: {
        to: 1082,
        from: [1082],
        serialize: (x: any) => x,
        parse: (x: string) => x,
      },
      timestamp: {
        to: 1184,
        from: [1184],
        serialize: (x: any) => x,
        parse: (x: string) => x,
      },
    },
  });
  const client = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const current = await readAll(sql),
      signature = digest(await schema(sql));
    if (args.command === "audit") {
      console.log(
        JSON.stringify(
          {
            project: PROJECT,
            counts: Object.fromEntries(
              Object.entries(current).map(([t, r]) => [t, r.length]),
            ),
            resetTables: TABLES,
            preserved: [
              "Auth users and passwords",
              "profiles",
              "branches/categories/payment methods",
              "audit history archived in pre-reset snapshot",
              "backup/recovery records",
              "existing Storage objects",
            ],
          },
          null,
          2,
        ),
      );
      return;
    }
    let baseline: any;
    if (args.command === "prepare") {
      const generated = buildBaseline(current, args.asOf);
      const bytes = readFileSync("scripts/defense/synthetic-document.png");
      for (const t of ["renter_requirement_documents", "payment_proofs"])
        for (const r of generated.data[t]) r.size_bytes = bytes.length;
      baseline = {
        ...generated,
        schema: signature,
        dependencies: dependencies(current),
        assetSha256: createHash("sha256").update(bytes).digest("hex"),
      };
      const planFile = `${ROOT}/plan-${args.asOf}-${stamp()}.json`;
      save(planFile, baseline);
      console.log(
        JSON.stringify(
          {
            plan: planFile,
            counts: Object.fromEntries(
              Object.entries(baseline.data).map(([t, r]: any) => [t, r.length]),
            ),
            expected: baseline.expected,
          },
          null,
          2,
        ),
      );
    } else {
      const file =
        args.file ??
        (existsSync(`${ROOT}/latest.txt`)
          ? readFileSync(`${ROOT}/latest.txt`, "utf8").trim()
          : null);
      if (!file)
        throw new Error("No saved baseline. Run prepare --apply first.");
      const envelope = JSON.parse(readFileSync(file, "utf8"));
      if (envelope.sha256 !== digest(envelope.baseline))
        throw new Error("Baseline integrity check failed.");
      baseline = envelope.baseline;
      if (
        baseline.project !== PROJECT ||
        baseline.version !== VERSION ||
        baseline.schema !== signature
      )
        throw new Error(
          "Baseline project/version/schema mismatch; regenerate after schema changes.",
        );
    }
    if (args.command === "prepare" && !args.apply && !args.rehearse) {
      console.log(
        "DRY RUN: database and Storage unchanged. Add --apply to prepare this baseline.",
      );
      return;
    }
    if (digest(dependencies(current)) !== digest(baseline.dependencies))
      throw new Error(
        "Accounts or catalog configuration changed; inspect and prepare a new baseline.",
      );
    const bytes = readFileSync("scripts/defense/synthetic-document.png");
    if (
      createHash("sha256").update(bytes).digest("hex") !== baseline.assetSha256
    )
      throw new Error("Placeholder asset changed.");
    if (args.command === "verify") {
      const differences = verifyRows(baseline.data, current);
      console.log(
        JSON.stringify(
          {
            databaseMatches: !differences.length,
            differences,
            referenceDate: baseline.asOf,
            expected: baseline.expected,
          },
          null,
          2,
        ),
      );
      if (differences.length) throw new Error("Baseline drift detected.");
      await checkAssets(client, baseline.assets, bytes);
      console.log("Verified all baseline database rows and storage artifacts.");
      return;
    }
    if (args.command === "reset" && !args.apply) {
      console.log(
        JSON.stringify(
          {
            dryRun: true,
            referenceDate: baseline.asOf,
            differences: verifyRows(baseline.data, current),
            resetTables: TABLES,
          },
          null,
          2,
        ),
      );
      return;
    }
    if (args.rehearse) {
      // Rehearsals roll back SQL and deliberately perform no Storage writes.
    } else if (args.command === "prepare")
      await ensureAssets(client, baseline.assets, bytes);
    else await checkAssets(client, baseline.assets, bytes);
    const backupFile = `${ROOT}/before-${args.command}-${stamp()}.json`;
    let normalized: any;
    const applyTransaction = async (tx: any) => {
      await tx`set local lock_timeout='10s'`;
      await tx`set local statement_timeout='60s'`;
      await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
      // Lock application tables as a unit, preserving FK checks. No network I/O while locked.
      await tx.unsafe(
        `lock table ${[...TABLES, "vehicles", "profiles", "branches", "vehicle_categories", "payment_methods"].map((t) => `public."${t}"`).join(",")} in access exclusive mode`,
      );
      const before = await readAll(tx);
      if (digest(dependencies(before)) !== digest(baseline.dependencies))
        throw new Error("Catalog changed during preparation.");
      save(backupFile, {
        project: PROJECT,
        createdAt: new Date().toISOString(),
        schema: signature,
        data: before,
      });
      if (args.command === "drill") {
        const target = baseline.data.booking_requests.find(
          (b: any) => b.booking_status === "Draft",
        );
        if (!target) throw new Error("Drill requires a draft.");
        await tx`update public.booking_requests set purpose_of_use='Temporary reset drill edit' where id=${target.id}`;
        // Also prove that a newly created test booking is removed by reset.
        const extra = {
          ...target,
          id: "00000000-0000-4000-a000-00000000defe",
          purpose_of_use: "Temporary reset drill new record",
        };
        await tx.unsafe(
          "insert into public.booking_requests select * from jsonb_populate_record(null::public.booking_requests,$1::text::jsonb)",
          [JSON.stringify(extra)],
        );
      }
      await replace(tx, baseline.data);
      const actual = await readAll(tx);
      // Normalize PostgreSQL numeric defaults and timestamp formats for exact subsequent checks.
      normalized = {
        ...baseline,
        data: Object.fromEntries(
          [...TABLES, "vehicles"].map((t) => [t, actual[t]]),
        ),
      };
      if (
        args.command !== "prepare" &&
        verifyRows(baseline.data, actual).length
      )
        throw new Error("Restore did not exactly reproduce the baseline.");
      if (digest(before.profiles) !== digest(actual.profiles))
        throw new Error("Protected records changed.");
      const disabled =
        await tx`select tgname from pg_trigger where not tgisinternal and tgenabled='D' and tgrelid in (select oid from pg_class where relnamespace='public'::regnamespace)`;
      if (disabled.length)
        throw new Error("Unexpected disabled application trigger.");
      if (args.command === "drill" || args.rehearse)
        throw new Error("ROLLBACK_VERIFIED_DRILL");
    };
    if (args.command === "drill" || args.rehearse) {
      try {
        await sql.begin(applyTransaction);
      } catch (e) {
        if (!(e instanceof Error) || e.message !== "ROLLBACK_VERIFIED_DRILL")
          throw e;
      }
      console.log(
        "PASS: transactional baseline rehearsal completed; all database changes rolled back.",
      );
      return;
    }
    await sql.begin(applyTransaction);
    const baselineFile = `${ROOT}/baseline-${baseline.asOf}-${stamp()}.json`;
    save(baselineFile, { sha256: digest(normalized), baseline: normalized });
    writeFileSync(`${ROOT}/latest.txt`, baselineFile + "\n", { mode: 0o600 });
    console.log(
      JSON.stringify(
        {
          applied: true,
          baseline: baselineFile,
          backup: backupFile,
          referenceDate: baseline.asOf,
          restoredTables: TABLES.length,
          accountsPreserved: true,
          auditHistoryArchived: true,
        },
        null,
        2,
      ),
    );
  } finally {
    await sql.end();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : "Baseline operation failed");
    process.exitCode = 1;
  });
