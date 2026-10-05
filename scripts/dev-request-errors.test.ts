import assert from "node:assert/strict";
import test from "node:test";
import { isExpectedClientDisconnect } from "./dev-request-errors.ts";

test("only a confirmed client disconnect suppresses Node's aborted-request error", () => {
  const abort = Object.assign(new Error("aborted"), { code: "ECONNRESET" });
  assert.equal(
    isExpectedClientDisconnect(abort, { aborted: true }, { destroyed: false }),
    true,
  );
  assert.equal(
    isExpectedClientDisconnect(abort, { aborted: false }, { destroyed: true }),
    true,
  );
  assert.equal(
    isExpectedClientDisconnect(abort, { aborted: false }, { destroyed: false }),
    false,
  );
  assert.equal(
    isExpectedClientDisconnect(
      new Error("database failed"),
      { aborted: true },
      { destroyed: true },
    ),
    false,
  );
  assert.equal(
    isExpectedClientDisconnect(
      new Error("aborted"),
      { aborted: true },
      { destroyed: true },
    ),
    false,
  );
});
