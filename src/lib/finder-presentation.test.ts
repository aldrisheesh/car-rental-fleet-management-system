import test from "node:test";
import assert from "node:assert/strict";

import {
  filterFinderRecommendations,
  finderCriteriaSummary,
} from "./finder-presentation.ts";

const criteria = {
  requestedStart: "2026-10-18T02:00:00.000Z",
  requestedEnd: "2026-10-20T02:00:00.000Z",
  passengerCount: 5,
  maximumBudget: 12_000,
  preferredCategory: "MPV",
  destination: null,
};

test("formats evaluated Finder criteria for people, not internal raw values", () => {
  assert.deepEqual(finderCriteriaSummary(criteria), [
    { id: "dates", label: "Rental dates", value: "Oct 18 – Oct 20, 2026" },
    { id: "passengers", label: "Passengers", value: "5" },
    {
      id: "budget",
      label: "Maximum budget",
      value: "₱12,000 total",
    },
    { id: "category", label: "Vehicle preference", value: "MPV" },
  ]);
  assert.equal(
    finderCriteriaSummary(criteria).some((item) =>
      item.value.includes("12000 maximum budget"),
    ),
    false,
  );
});

test("filters evaluated recommendations without changing canonical ordering or data", () => {
  const recommendations = [
    { vehicleId: "vios", category: "Sedan" },
    { vehicleId: "innova", category: "MPV" },
    { vehicleId: "xpander", category: "MPV" },
  ] as Parameters<typeof filterFinderRecommendations>[0];

  assert.deepEqual(
    filterFinderRecommendations(recommendations, "MPV").map(
      (recommendation) => recommendation.vehicleId,
    ),
    ["innova", "xpander"],
  );
  assert.deepEqual(
    filterFinderRecommendations(recommendations, ""),
    recommendations,
  );
});
