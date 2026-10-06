import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const origin = process.argv[2] ?? "https://briahcarrental.site";
const comparison = process.argv[3];
const folder = "output/performance-2026-10-05/system";
await mkdir(folder, { recursive: true });
async function session(base, role) {
  const prefix = role === "admin" ? "E2E_ADMIN" : "E2E_CUSTOMER";
  const response = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env[`${prefix}_EMAIL`],
      password: process.env[`${prefix}_PASSWORD`],
    }),
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${role} test sign-in`);
  const cookies = response.headers.getSetCookie();
  if (process.env.PERF_BROWSER_STATE === "1") {
    await writeFile(
      `${folder}/${role}-state.json`,
      JSON.stringify({
        cookies: cookies.map((value) => {
          const [pair, ...attributes] = value.split(";");
          const split = pair.indexOf("=");
          return {
            name: pair.slice(0, split),
            value: pair.slice(split + 1),
            domain: new URL(base).hostname,
            path: "/",
            httpOnly: attributes.some(
              (a) => a.trim().toLowerCase() === "httponly",
            ),
            secure: new URL(base).protocol === "https:",
            sameSite: "Lax",
          };
        }),
        origins: [],
      }),
      { mode: 0o600 },
    );
  }
  return cookies.map((v) => v.split(";")[0]).join("; ");
}
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generatedAt")
        .map(([key, item]) => [
          key,
          (key === "customerBindings" || key === "adminBindings") &&
          Array.isArray(item)
            ? item
                .map(normalize)
                .sort((a, b) =>
                  JSON.stringify(a).localeCompare(JSON.stringify(b)),
                )
            : normalize(item),
        ]),
    );
  // Storage URLs contain fresh signing timestamps; compare the exact resource path.
  if (typeof value === "string" && value.includes("/storage/v1/object/sign/"))
    return value.split("?")[0];
  return value;
}
let adminBookings = [];
let adminPayments = [];
for (const role of ["admin", "customer"]) {
  const cookie = await session(origin, role);
  const otherCookie = comparison ? await session(comparison, role) : null;
  const read = async (path) => {
    const response = await fetch(`${origin}${path}`, {
      headers: { cookie },
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(response.status, 200, path);
    return response.json();
  };
  const bookingBody = await read("/api/bookings");
  const bookings = Array.isArray(bookingBody)
    ? bookingBody
    : bookingBody.bookings;
  const paymentsBody = await read("/api/payments");
  if (role === "admin") {
    adminBookings = bookings;
    adminPayments = paymentsBody.payments;
  }
  const vehicleBody = await read("/api/vehicles");
  const bookingId =
    bookings.find((b) => b.id === "d1000000-0000-4000-8000-000000000002")?.id ??
    bookings[0]?.id;
  const payment =
    paymentsBody.payments.find((p) => p.booking_id === bookingId) ??
    paymentsBody.payments[0];
  const vehicleId = vehicleBody[0]?.id;
  const paths =
    role === "admin"
      ? [
          "/api/admin-dashboard",
          "/api/bookings?view=queue&page=1&limit=25",
          "/api/bookings",
          "/api/payments",
          "/api/payment-methods",
          "/api/requirements",
          "/api/requirements?view=all",
          "/api/maintenance",
          "/api/maintenance?readiness=summary",
          "/api/admin-fleet",
          "/api/admin-users",
          "/api/notifications",
          "/api/audit-events?page=1&limit=25",
          "/api/dss-locations",
          "/api/admin-public-contact",
          "/api/auth/profile",
          "/api/backup-status",
          "/api/admin-calendar?month=2026-10",
          "/api/forecasts",
          "/api/supply-evaluations",
          "/api/allocation-recommendations",
          "/api/vehicle-analytics?start=2026-09-06&end=2026-10-05",
          "/api/admin-reports?start=2026-09-06&end=2026-10-05&branch=all",
        ]
      : [
          "/api/bookings?view=dashboard",
          "/api/bookings",
          "/api/notifications",
          "/api/auth/profile",
          "/api/auth/session",
        ];
  paths.push(
    "/api/vehicles",
    "/api/booking-master-data",
    "/api/public-contact",
    "/api/vehicles?finderStart=2026-11-09T09%3A00&finderEnd=2026-11-12T09%3A00",
  );
  if (bookingId)
    paths.push(
      `/api/requirements?bookingId=${bookingId}`,
      `/api/payments?bookingId=${bookingId}`,
      `/api/booking-date-changes?bookingId=${bookingId}`,
      `/api/payment-policy?bookingId=${bookingId}`,
      `/api/payment-quote?bookingId=${bookingId}`,
    );
  if (vehicleId) paths.push(`/api/vehicle-images?vehicleId=${vehicleId}`);
  if (comparison && bookingId) {
    if (role === "admin") {
      const dispatchResponse = await fetch(
        `${comparison}/api/bookings?view=dispatch`,
        { headers: { cookie: otherCookie } },
      );
      assert.equal(dispatchResponse.status, 200);
      const dispatch = (await dispatchResponse.json()).bookings;
      const expected = bookings.map((b) => ({
        id: b.id,
        booking_status: b.booking_status,
        pickup_at: b.pickup_at,
        return_at: b.return_at,
        created_at: b.created_at,
        updated_at: b.updated_at,
        customer: b.customer
          ? { id: b.customer.id, full_name: b.customer.full_name }
          : null,
        requested_vehicle: b.requested_vehicle
          ? { id: b.requested_vehicle.id, name: b.requested_vehicle.name }
          : null,
        pickup_branch: b.pickup_branch
          ? { id: b.pickup_branch.id, name: b.pickup_branch.name }
          : null,
      }));
      assert.deepEqual(dispatch, expected, "Dashboard booking labels changed");
      const summaryResponse = await fetch(
        `${comparison}/api/payments?view=summary`,
        { headers: { cookie: otherCookie } },
      );
      assert.equal(summaryResponse.status, 200);
      assert.deepEqual(
        (await summaryResponse.json()).payments,
        paymentsBody.payments.map((p) => ({
          id: p.id,
          booking_id: p.booking_id,
          status: p.status,
        })),
        "Dashboard payment counts changed",
      );
      console.log(
        JSON.stringify({
          role,
          check: "dashboard-projection-equivalence",
          status: "PASS",
        }),
      );
    }
    if (role === "customer") {
      const ownIds = new Set(bookings.map((b) => b.id));
      const foreign = adminBookings.find((b) => !ownIds.has(b.id));
      const foreignPayment = adminPayments.find(
        (p) => !ownIds.has(p.booking_id),
      );
      assert.ok(foreign, "Cross-customer fixture is required");
      for (const base of [comparison]) {
        const cookies = base === origin ? cookie : otherCookie;
        const cross = await fetch(
          `${base}/api/bookings?bookingId=${foreign.id}`,
          { headers: { cookie: cookies } },
        );
        assert.equal(cross.status, 200);
        assert.deepEqual(
          await cross.json(),
          [],
          "Customer must not see another customer's booking",
        );
        if (foreignPayment) {
          const payment = await fetch(
            `${base}/api/payments?paymentId=${foreignPayment.id}`,
            { headers: { cookie: cookies } },
          );
          assert.equal(payment.status, 200);
          assert.deepEqual(
            (await payment.json()).payments,
            [],
            "Customer must not see another customer's payment",
          );
        }
      }
      console.log(
        JSON.stringify({
          role,
          check: "cross-customer-isolation",
          status: "PASS",
        }),
      );
    }
    const unreadResponse = await fetch(
      `${comparison}/api/notifications?view=unread`,
      { headers: { cookie: otherCookie } },
    );
    assert.equal(unreadResponse.status, 200);
    assert.equal(
      (await unreadResponse.json()).unreadCount,
      (await read("/api/notifications")).unreadCount,
    );
    console.log(
      JSON.stringify({
        role,
        check: "unread-count-equivalence",
        status: "PASS",
      }),
    );
    const exactResponse = await fetch(
      `${comparison}/api/bookings?bookingId=${bookingId}`,
      { headers: { cookie: otherCookie } },
    );
    assert.equal(exactResponse.status, 200);
    const exact = await exactResponse.json();
    const exactRows = Array.isArray(exact) ? exact : exact.bookings;
    assert.deepEqual(
      normalize(exactRows),
      normalize(bookings.filter((b) => b.id === bookingId)),
      `${role} exact booking projection`,
    );
    console.log(
      JSON.stringify({
        role,
        check: "exact-booking-equivalence",
        status: "PASS",
      }),
    );
    if (payment) {
      const response = await fetch(
        `${comparison}/api/payments?paymentId=${payment.id}`,
        { headers: { cookie: otherCookie } },
      );
      assert.equal(response.status, 200);
      assert.deepEqual(
        normalize((await response.json()).payments),
        normalize(paymentsBody.payments.filter((p) => p.id === payment.id)),
        `${role} exact payment projection`,
      );
      console.log(
        JSON.stringify({
          role,
          check: "exact-payment-equivalence",
          status: "PASS",
        }),
      );
    }
  }
  const finderInput = {
    requestedStart: "2026-11-09T09:00",
    requestedEnd: "2026-11-12T09:00",
    passengerCount: 4,
    largeBagCount: 1,
    maximumBudget: 15000,
    preferredCategory: null,
    destination: "Synthetic performance rehearsal",
  };
  const finderOptions = {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify(finderInput),
    signal: AbortSignal.timeout(30000),
  };
  const finderStart = performance.now();
  const finder = await fetch(`${origin}/api/vehicle-finder`, finderOptions);
  assert.equal(finder.status, 200, "read-only Finder evaluation");
  const finderBody = await finder.json();
  if (comparison) {
    const otherFinder = await fetch(`${comparison}/api/vehicle-finder`, {
      ...finderOptions,
      headers: { cookie: otherCookie, "Content-Type": "application/json" },
    });
    assert.equal(otherFinder.status, 200);
    assert.deepEqual(
      await otherFinder.json(),
      finderBody,
      "Finder ranking and eligibility changed",
    );
  }
  console.log(
    JSON.stringify({
      role,
      path: "/api/vehicle-finder",
      status: finder.status,
      totalMs: Math.round(performance.now() - finderStart),
      ...(comparison ? { equivalence: "PASS" } : {}),
    }),
  );
  for (let round = 1; round <= Number(process.env.PERF_ROUNDS ?? 1); round++)
    for (const path of paths) {
      const start = performance.now();
      const comparisonRequest = comparison ? fetch(`${comparison}${path}`, {
        headers: { cookie: otherCookie },
        signal: AbortSignal.timeout(30000),
      }) : null;
      const response = await fetch(`${origin}${path}`, {
        headers: { cookie },
        signal: AbortSignal.timeout(30000),
      });
      const text = await response.text();
      const result = {
        role,
        round,
        path,
        status: response.status,
        totalMs: Math.round(performance.now() - start),
        bytes: Buffer.byteLength(text),
      };
      if (comparison) {
        const other = await comparisonRequest;
        assert.equal(other.status, response.status, path);
        if (response.ok) {
          const reference = normalize(JSON.parse(text));
          const optimized = normalize(await other.json());
          // Existing forecast/supply optimizations remove unused audit fields only.
          const project = (ref, shape) =>
            Array.isArray(shape)
              ? (assert.equal(ref.length, shape.length, `Row count changed: ${role} ${path}`),
                shape.map((v, i) => project(ref[i], v)))
              : shape && typeof shape === "object"
                ? Object.fromEntries(
                    Object.keys(shape).map((k) => [
                      k,
                      project(ref[k], shape[k]),
                    ]),
                  )
                : ref;
          assert.deepEqual(
            optimized,
            project(reference, optimized),
            `Response changed: ${role} ${path}`,
          );
        }
        result.equivalence = "PASS";
      }
      console.log(JSON.stringify(result));
    }
  await writeFile(
    `${folder}/${role}-routes.json`,
    JSON.stringify({ bookingId, paymentId: payment?.id, vehicleId }, null, 2),
  );
}
