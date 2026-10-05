import fs from "node:fs";
import postgres from "postgres";
import assert from "node:assert/strict";
const u = new URL(fs.readFileSync("supabase/.temp/pooler-url", "utf8").trim());
u.password = process.env.SUPABASE_DB_PASSWORD ?? "";
const sql = postgres(u.toString(), { ssl: "require", max: 1, prepare: false });
const rollback = Error("rollback");
try {
  await sql.begin(async (tx) => {
    const [r] =
      await tx`select id from allocation_recommendations where decision_state='Pending' limit 1`;
    assert.ok(r, "Pending fixture required");
    const [owner] =
      await tx`select id from profiles where user_type='Owner/Admin' and account_status='Active' limit 1`;
    const [c] =
      await tx`select id from profiles where user_type='Customer/Renter' limit 1`;
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.decide_allocation_recommendation_with_reason(${r.id},${owner.id},'Rejected',null,'Free text')`,
      ),
      /decision_reason_required/,
    );
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.decide_allocation_recommendation_with_reason(${r.id},${c.id},'Rejected',null,'Transfer is unsuitable')`,
      ),
      /forbidden/,
    );
    const [after] =
      await tx`select * from public.decide_allocation_recommendation_with_reason(${r.id},${owner.id},'Rejected',null,'Transfer is unsuitable — Controlled rollback rehearsal')`;
    assert.equal(after.decision_reason_code, "allocation.unsuitable");
    assert.equal(after.decision_state, "Rejected");
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`select public.decide_allocation_recommendation_with_reason(${r.id},${owner.id},'Rejected',null,'Transfer is unsuitable')`,
      ),
      /recommendation_already_decided/,
    );
    await assert.rejects(
      tx.savepoint(
        () =>
          tx`update allocation_recommendations set decision_reason='Other allocation decision — Changed' where id=${r.id}`,
      ),
      /allocation_decision_reason_immutable/,
    );
    console.log(
      "Passed: allocation category validation, authorization, atomic decision and reason, duplicate guard, immutable saved reason. Rolled back.",
    );
    throw rollback;
  });
} catch (e) {
  if (e !== rollback) throw e;
} finally {
  await sql.end();
}
