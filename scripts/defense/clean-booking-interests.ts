/** Narrow, backed-up cleanup of the authorized synthetic booking baseline. Default: dry run. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import { PROJECT } from "./baseline-data.ts";
import { syntheticBookingInterest } from "./booking-interest-data.ts";
import {
  categoryValue,
  splitCategory,
  validCategory,
} from "../../src/lib/booking-categories.ts";
const url = new URL(
  process.env.DEFENSE_DATABASE_URL ??
    readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
);
assert.ok(
  url.hostname === `db.${PROJECT}.supabase.co` ||
    decodeURIComponent(url.username) === `postgres.${PROJECT}`,
);
url.password ||= process.env.SUPABASE_DB_PASSWORD ?? "";
assert.ok(url.password, "Database credentials unavailable");
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const apply = process.argv.includes("--apply");
const rollback = new Error("verified-dry-run");
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
    const before =
      await tx`select * from booking_requests order by id for update`;
    assert.equal(
      before.length,
      299,
      "Unexpected booking count: review scope before changing data",
    );
    const context =
      await tx`select b.id, br.name branch, coalesce(v.seat_capacity,5) seats from booking_requests b join branches br on br.id=b.pickup_branch_id join vehicles v on v.id=b.requested_vehicle_id`;
    const byId = new Map(context.map((row) => [row.id, row]));
    const changes = before.map((row) => {
      assert.ok(
        /synthetic|test case|not a real rental/i.test(row.purpose_of_use) ||
          (row.purpose_of_use === "Vacation" &&
            row.destination === "Tagaytay trip"),
        "Unrecognized record; refusing to reinterpret it",
      );
      if (
        validCategory("purpose", row.purpose_of_use) &&
        validCategory("destination", row.destination) &&
        row.purpose_of_use.includes(" — SYNTHETIC DEMO — ")
      )
        return {
          id: row.id,
          purpose: row.purpose_of_use,
          destination: row.destination,
        };
      const ctx = byId.get(row.id);
      assert.ok(ctx);
      const planned = syntheticBookingInterest({
        id: row.id,
        pickup: row.pickup_at.toISOString(),
        returnAt: row.return_at.toISOString(),
        branch: ctx.branch,
        seats: ctx.seats,
      });
      const baseline =
        /^SYNTHETIC \/ (Business appointment|Airport transfer|Weekend trip|Out-of-town errands|Family celebration|Family visit)$/.test(
          row.purpose_of_use,
        );
      let purpose = planned.purpose,
        destination = planned.destination;
      if (!baseline) {
        const existing = splitCategory("purpose", row.purpose_of_use);
        const code =
          existing.code && existing.code !== "purpose.other"
            ? existing.code
            : row.purpose_of_use === "Vacation"
              ? "purpose.leisure"
              : /family|pickup|delivery/i.test(row.purpose_of_use)
                ? "purpose.family"
                : splitCategory("purpose", planned.purpose).code;
        purpose = categoryValue(
          "purpose",
          code,
          `SYNTHETIC DEMO — ${row.purpose_of_use}`,
        );
        if (validCategory("destination", row.destination))
          destination = row.destination;
        else if (/tagaytay/i.test(row.destination ?? ""))
          destination = categoryValue(
            "destination",
            "destination.cavite",
            `SYNTHETIC DEMO — ${row.destination}`,
          );
        else if (/taytay|antipolo/i.test(row.destination ?? ""))
          destination = categoryValue(
            "destination",
            "destination.rizal",
            `SYNTHETIC DEMO — ${row.destination}`,
          );
      }
      assert.ok(
        validCategory("purpose", purpose) &&
          validCategory("destination", destination),
      );
      return { id: row.id, purpose, destination };
    });
    if (apply) {
      mkdirSync("backup-artifacts/defense/booking-interests", {
        recursive: true,
      });
      const stamp = new Date().toISOString().replaceAll(":", "-");
      writeFileSync(
        `backup-artifacts/defense/booking-interests/${stamp}-before.json`,
        JSON.stringify(before, null, 2),
        { mode: 0o600, flag: "wx" },
      );
      writeFileSync(
        `backup-artifacts/defense/booking-interests/${stamp}-plan.json`,
        JSON.stringify(changes, null, 2),
        { mode: 0o600, flag: "wx" },
      );
    }
    await tx`update booking_requests b set purpose_of_use=p.purpose,destination=p.destination from jsonb_to_recordset(${sql.json(changes)}::jsonb) as p(id uuid,purpose text,destination text) where b.id=p.id and (b.purpose_of_use is distinct from p.purpose or b.destination is distinct from p.destination)`;
    const after = await tx`select * from booking_requests order by id`;
    const immutable = (rows: typeof before) =>
      rows.map(
        ({
          purpose_of_use: _p,
          destination: _d,
          updated_at: _u,
          category_codes,
          ...rest
        }) => {
          const {
            purpose: _pc,
            destination: _dc,
            resolution: _rc,
            ...otherCodes
          } = category_codes;
          return { ...rest, category_codes: otherCodes };
        },
      );
    assert.deepEqual(
      immutable(after),
      immutable(before),
      "Booking fields outside scope changed",
    );
    assert.ok(
      after.every(
        (row) =>
          validCategory("purpose", row.purpose_of_use) &&
          validCategory("destination", row.destination),
      ),
    );
    for (const row of after) {
      assert.equal(
        row.category_codes.resolution ?? "",
        splitCategory(
          row.booking_status === "Cancelled"
            ? "cancellation"
            : "booking_rejection",
          row.resolution_reason ?? "",
        ).code,
      );
      assert.equal(
        row.category_codes.purpose,
        splitCategory("purpose", row.purpose_of_use).code,
      );
      assert.equal(
        row.category_codes.destination,
        splitCategory("destination", row.destination).code,
      );
    }
    const summarize = (
      field: "purpose_of_use" | "destination",
      domain: "purpose" | "destination",
    ) => {
      const counts: Record<string, number> = {};
      for (const row of after) {
        const label = splitCategory(domain, row[field]).label;
        counts[label] = (counts[label] ?? 0) + 1;
      }
      return counts;
    };
    console.log(
      JSON.stringify({
        mode: apply ? "applied" : "verified dry run",
        bookings: after.length,
        purposes: summarize("purpose_of_use", "purpose"),
        destinations: summarize("destination", "destination"),
        otherBookingFields: "unchanged",
      }),
    );
    if (!apply) throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  await sql.end();
}
