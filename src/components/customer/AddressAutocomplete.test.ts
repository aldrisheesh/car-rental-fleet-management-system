import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./AddressAutocomplete.tsx", import.meta.url);
const bookingPath = new URL("../../routes/booking.tsx", import.meta.url);

async function source(url: URL) {
  return readFile(url, "utf8");
}

test("address autocomplete preserves manual-entry fallback without a configured key", async () => {
  const component = await source(componentPath);
  assert.match(
    component,
    /Address suggestions are unavailable\. You can enter the full address\./,
  );
  assert.match(component, /onChange\(event\.target\.value\)/);
  assert.match(component, /VITE_GEOAPIFY_API_KEY/);
});

test("a Geoapify selection resolves the formatted address into the existing string field", async () => {
  const component = await source(componentPath);
  assert.match(component, /buildGeoapifyAutocompleteUrl/);
  assert.match(component, /onChange\(suggestion\.formatted\)/);
  assert.match(component, /selectedAddress\.current = suggestion\.formatted/);
  assert.match(component, /requestId\.current \+= 1/);
  assert.match(component, /AbortController/);
});

test("a Geoapify provider failure preserves the manual address fallback", async () => {
  const component = await source(componentPath);
  assert.match(component, /if \(!response\.ok\) throw new Error/);
  assert.match(component, /controller\.signal\.aborted/);
  assert.match(component, /setStatus\(FALLBACK_MESSAGE\)/);
});

test("booking gives delivery and alternate return their own autocomplete inputs", async () => {
  const booking = await source(bookingPath);
  assert.match(booking, /!draft\.sameReturnLocation \? \(/);
  assert.match(booking, /id="pickup-location"/);
  assert.match(booking, /id="dropoff-location"/);
  assert.match(booking, /updateDraft\("pickupLocation", value\)/);
  assert.match(booking, /updateDraft\("dropoffLocation", value\)/);
});

test("booking submits only address strings and no provider metadata", async () => {
  const booking = await source(bookingPath);
  assert.match(booking, /sameReturnLocation: draft\.sameReturnLocation/);
  assert.doesNotMatch(
    booking,
    /deliveryLatitude|deliveryLongitude|placeId|featureId|geoapify/i,
  );
});
