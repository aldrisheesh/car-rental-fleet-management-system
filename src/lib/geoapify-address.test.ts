import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGeoapifyAutocompleteUrl,
  geoapifyAddressSuggestions,
} from "./geoapify-address.ts";

test("Geoapify autocomplete uses the Philippine country filter", () => {
  const url = buildGeoapifyAutocompleteUrl({
    text: "Taft Avenue",
    apiKey: "browser-key",
  });

  assert.equal(url.origin, "https://api.geoapify.com");
  assert.equal(url.pathname, "/v1/geocode/autocomplete");
  assert.equal(url.searchParams.get("text"), "Taft Avenue");
  assert.equal(url.searchParams.get("filter"), "countrycode:ph");
  assert.equal(url.searchParams.get("lang"), "en");
  assert.equal(url.searchParams.get("limit"), "5");
});

test("Geoapify suggestions retain only formatted address strings", () => {
  assert.deepEqual(
    geoapifyAddressSuggestions({
      features: [
        {
          properties: {
            formatted: "Taft Avenue, Malate, Manila, Philippines",
          },
        },
        {
          properties: {
            formatted: "Taft Avenue, Malate, Manila, Philippines",
          },
        },
        { properties: {} },
      ],
    }),
    [{ formatted: "Taft Avenue, Malate, Manila, Philippines" }],
  );
});
