import test from "node:test";
import assert from "node:assert/strict";
import { validDssMatch, routePointNote, dssMapUrl } from "./dss-location.ts";
import {
  signLocationMatch,
  verifyLocationMatch,
} from "./dss-location-token.server.ts";
const point = {
  latitude: 14.57,
  longitude: 121.18,
  label: "Dalig Barangay Hall",
  query: "Dalig, Antipolo",
  provider: "geoapify",
  resultType: "amenity",
};
test("confirmation cannot reuse a changed, expired or other-area geocoding result", () => {
  const token = signLocationMatch(point, "area-a", "test-secret", 1000);
  assert.deepEqual(
    verifyLocationMatch(token, "area-a", "test-secret", 1001),
    point,
  );
  assert.equal(verifyLocationMatch(token, "area-b", "test-secret", 1001), null);
  assert.equal(
    verifyLocationMatch(token, "area-a", "test-secret", 901001),
    null,
  );
  assert.equal(
    verifyLocationMatch(token + "x", "area-a", "test-secret", 1001),
    null,
  );
  assert.equal(
    verifyLocationMatch(token, "area-a", "different-secret", 1001),
    null,
  );
});
test("map point validation rejects nonfinite or out-of-country coordinates", () => {
  assert.equal(validDssMatch(point), true);
  for (const latitude of [NaN, Infinity, 0, 25])
    assert.equal(validDssMatch({ ...point, latitude }), false);
  assert.equal(validDssMatch({ ...point, longitude: 0 }), false);
  assert.equal(validDssMatch({ ...point, label: "" }), false);
  assert.match(
    dssMapUrl(point),
    /^https:\/\/www.openstreetmap.org\/export\/embed.html\?/,
  );
});
test("partial endpoints cannot be described as actual transfers", () => {
  const actual = {
    ...point,
    kind: "movement_point" as const,
    confirmedAt: "2026-10-03",
  };
  const area = { ...actual, kind: "area_reference" as const };
  assert.match(routePointNote(actual, null), /both operational areas/);
  assert.match(routePointNote(actual, area), /approximate area-reference/);
  assert.match(routePointNote(actual, actual), /not live tracking/);
});
