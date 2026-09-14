import assert from "node:assert/strict";
import test from "node:test";

import { fetchJson } from "./customer-data.ts";

test("fetchJson preserves multipart boundaries for customer uploads", async () => {
  const originalFetch = globalThis.fetch;
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    requestInit = init;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const form = new FormData();
    form.set("bookingId", "booking-1");
    await fetchJson<{ ok: boolean }>("/api/payments", {
      method: "POST",
      body: form,
    });

    assert.equal(requestInit?.credentials, "same-origin");
    assert.equal(new Headers(requestInit?.headers).has("Content-Type"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
