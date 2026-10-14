import test from "node:test";
import assert from "node:assert/strict";
import { submitPaymentWithRecovery } from "./payment-submission-recovery.ts";

test("a committed proof with a lost response refreshes the saved review state without a second write", async () => {
  let saved = "Not Submitted",
    screen = "Not Submitted",
    writes = 0;
  const result = await submitPaymentWithRecovery({
    submit: async () => {
      writes++;
      saved = "Pending Verification";
      throw { status: 0 };
    },
    refresh: async () => {
      screen = saved;
    },
  });
  assert.equal(screen, "Pending Verification");
  assert.equal(writes, 1);
  assert.deepEqual(result, { state: "uncertain", acknowledged: false });
});
test("an interrupted request that was never received is not falsely described as rejected or saved", async () => {
  let reads = 0;
  const result = await submitPaymentWithRecovery({
    submit: async () => {
      throw { status: 0 };
    },
    refresh: async () => {
      reads++;
    },
  });
  assert.equal(reads, 1);
  assert.deepEqual(result, { state: "uncertain", acknowledged: false });
});
test("a definitive refusal preserves its error after checking the current booking", async () => {
  const error = { status: 409, message: "payment_hold_expired" };
  let reads = 0;
  const result = await submitPaymentWithRecovery({
    submit: async () => {
      throw error;
    },
    refresh: async () => {
      reads++;
    },
  });
  assert.equal(reads, 1);
  assert.deepEqual(result, { state: "rejected", error });
});
test("a refresh failure after an accepted write never claims payment was not submitted", async () => {
  let writes = 0;
  const result = await submitPaymentWithRecovery({
    submit: async () => {
      writes++;
    },
    refresh: async () => {
      throw Error("offline");
    },
  });
  assert.equal(writes, 1);
  assert.deepEqual(result, { state: "uncertain", acknowledged: true });
});
test("a gateway failure after a committed write is recovered from the canonical read", async () => {
  let seen = false;
  const result = await submitPaymentWithRecovery({
    submit: async () => {
      throw { status: 502 };
    },
    refresh: async () => {
      seen = true;
    },
  });
  assert.equal(seen, true);
  assert.deepEqual(result, { state: "uncertain", acknowledged: false });
});
test("a successful submission and status read complete normally", async () => {
  assert.deepEqual(
    await submitPaymentWithRecovery({
      submit: async () => {},
      refresh: async () => {},
    }),
    { state: "refreshed" },
  );
});
