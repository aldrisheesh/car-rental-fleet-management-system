import { performance } from "node:perf_hooks";
import assert from "node:assert/strict";

const origin = process.argv[2] ?? "https://briahcarrental.site";
const login = await fetch(`${origin}/api/auth/sign-in`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  }),
});
if (!login.ok) throw new Error(`Test sign-in failed: ${login.status}`);
const cookie = login.headers
  .getSetCookie()
  .map((v) => v.split(";")[0])
  .join("; ");
const paths = [
  "/api/vehicles",
  "/api/forecasts",
  "/api/supply-evaluations",
  "/api/allocation-recommendations",
  "/api/vehicle-analytics?start=2026-09-06&end=2026-10-05",
  "/api/admin-fleet",
  "/api/admin-dashboard",
  "/api/bookings?view=queue&page=1&limit=25",
  "/api/admin-calendar?month=2026-10",
  "/api/admin-reports?start=2026-09-06&end=2026-10-05&branch=all",
];
if (process.argv[3]) {
  const comparisonOrigin = process.argv[3];
  const comparisonLogin = await fetch(`${comparisonOrigin}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.E2E_ADMIN_EMAIL,
      password: process.env.E2E_ADMIN_PASSWORD,
    }),
  });
  if (!comparisonLogin.ok)
    throw new Error(`Comparison sign-in failed: ${comparisonLogin.status}`);
  const comparisonCookie = comparisonLogin.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  function project(reference, shape) {
    if (Array.isArray(shape)) {
      assert.equal(
        reference.length,
        shape.length,
        "Row counts must be preserved",
      );
      return shape.map((value, i) => project(reference[i], value));
    }
    if (shape !== null && typeof shape === "object")
      return Object.fromEntries(
        Object.keys(shape).map((key) => [
          key,
          project(reference[key], shape[key]),
        ]),
      );
    return reference;
  }
  for (const path of paths) {
    const [reference, optimized] = await Promise.all([
      fetch(`${origin}${path}`, { headers: { cookie } }),
      fetch(`${comparisonOrigin}${path}`, {
        headers: { cookie: comparisonCookie },
      }),
    ]);
    assert.equal(reference.status, 200, path);
    assert.equal(optimized.status, 200, path);
    const oldBody = await reference.json();
    const newBody = await optimized.json();
    if (path === "/api/admin-fleet" || path === "/api/admin-dashboard") {
      delete oldBody.generatedAt;
      delete newBody.generatedAt;
    }
    assert.deepEqual(
      newBody,
      project(oldBody, newBody),
      `Canonical results changed: ${path}`,
    );
    console.log(`PASS: canonical response equivalence ${path}`);
  }
  process.exit(0);
}
for (let round = 1; round <= Number(process.env.PERF_ROUNDS ?? 3); round++) {
  for (const path of paths) {
    const start = performance.now();
    const response = await fetch(`${origin}${path}`, {
      headers: { cookie },
      signal: AbortSignal.timeout(30000),
    });
    const headersMs = performance.now() - start;
    const body = await response.text();
    console.log(
      JSON.stringify({
        round,
        path,
        status: response.status,
        headersMs: Math.round(headersMs),
        totalMs: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(body),
        region: response.headers.get("x-vercel-id")?.split("::")[0],
      }),
    );
  }
}
