import test from "node:test";
import assert from "node:assert/strict";
import { readForecastHistoryPages } from "./forecast-history.server.ts";
test("history larger than the API cap retains all latest-run positions", async () => {
  const history = Array.from({ length: 1008 }, (_, id) => ({
    id,
    run: id < 972 ? "historical" : "latest",
  }));
  const all = await readForecastHistoryPages(async (from, to) => ({
    data: history.slice(from, to + 1),
    error: null,
  }));
  assert.equal(all.length, 1008);
  assert.equal(all.filter((r) => r.run === "latest").length, 36);
});
test("a failed later page cannot produce a partial forecast history", async () => {
  await assert.rejects(
    readForecastHistoryPages(async (from) =>
      from
        ? { data: null, error: new Error("page unavailable") }
        : { data: Array(500).fill(0), error: null },
    ),
    /page unavailable/,
  );
});
