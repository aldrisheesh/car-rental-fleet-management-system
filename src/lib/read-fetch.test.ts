import { readFetch } from "./read-fetch.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("API reads have a bounded lifetime and retain caller cancellation", async () => {
  const original = globalThis.fetch;
  let captured: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    captured = init;
    return new Response("{}");
  };
  try {
    const controller = new AbortController();
    await readFetch("/api/bookings", {
      signal: controller.signal,
      credentials: "same-origin",
    });
    assert.ok(captured?.signal);
    assert.notEqual(captured.signal, controller.signal);
    assert.equal(captured.credentials, "same-origin");
    controller.abort();
    assert.equal(captured.signal.aborted, true);
  } finally {
    globalThis.fetch = original;
  }
});

test("uploads and mutations keep their original body and signal", async () => {
  const original = globalThis.fetch;
  let captured: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    captured = init;
    return new Response("{}");
  };
  try {
    const body = new FormData();
    body.set("file", new Blob(["synthetic proof"]), "proof.txt");
    const init: RequestInit = { method: "POST", body };
    await readFetch("/api/payments", init);
    assert.equal(captured, init);
    assert.equal(captured?.signal, undefined);
    await readFetch("https://example.invalid/proof.pdf");
    assert.equal(captured, undefined);
  } finally {
    globalThis.fetch = original;
  }
});
