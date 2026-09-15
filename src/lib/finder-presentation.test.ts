import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  filterFinderRecommendations,
  finderCriteriaSummary,
  finderEvaluationState,
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

test("keeps complete Finder journeys distinct from direct browse across evaluation states", () => {
  assert.equal(
    finderEvaluationState({
      hasCompleteCriteria: false,
      hasResponse: false,
      hasError: false,
      hasValidationErrors: false,
    }),
    "direct-browse",
  );
  assert.equal(
    finderEvaluationState({
      hasCompleteCriteria: true,
      hasResponse: false,
      hasError: false,
      hasValidationErrors: false,
    }),
    "evaluating",
  );
  assert.equal(
    finderEvaluationState({
      hasCompleteCriteria: true,
      hasResponse: false,
      hasError: true,
      hasValidationErrors: false,
    }),
    "failed",
  );
  assert.equal(
    finderEvaluationState({
      hasCompleteCriteria: true,
      hasResponse: false,
      hasError: false,
      hasValidationErrors: true,
    }),
    "failed",
  );
  assert.equal(
    finderEvaluationState({
      hasCompleteCriteria: true,
      hasResponse: true,
      hasError: false,
      hasValidationErrors: false,
    }),
    "evaluated",
  );
});

test("the vehicle route keeps evaluated failure visible and out of direct browse", async () => {
  const source = await readFile(
    new URL("../routes/vehicles.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /void evaluateFinder\(finderFormFromSearch\(search\), false\)/,
  );
  assert.match(source, /finderValuesRef\.current = values/);
  assert.match(source, /const finderRetryValues = finderValuesRef\.current/);
  assert.match(source, /setFinderResponse\(null\);\s*setFinderLoading\(true\)/);
  assert.match(
    source,
    /} catch \(error\) \{[\s\S]*?setRefinementOpen\(true\);[\s\S]*?} finally/,
  );
  assert.match(source, /finderState === "failed"/);
  assert.match(source, /title="Finder evaluation failed"/);
  assert.match(source, /finderState === "evaluated" && finderResponse/);
  assert.match(source, /void evaluateFinder\(finderRetryValues, false\)/);
  assert.match(source, /Change trip/);
  assert.match(source, /finderState === "direct-browse"/);
  assert.match(source, /id="active-fleet-title"/);
  assert.doesNotMatch(source, /\{!finderResponse \?/);
});
