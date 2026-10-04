import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./AddressAutocomplete.tsx", import.meta.url);
const bookingPath = new URL("../../routes/booking.tsx", import.meta.url);
const locationsPath = new URL(
  "../../routes/admin.branches.tsx",
  import.meta.url,
);

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
  assert.match(component, /unavailableHelp = FALLBACK_MESSAGE/);
  assert.match(component, /setStatus\(unavailableHelp\)/);
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

test("the operational location editor can omit only the idle helper", async () => {
  const [component, locations] = await Promise.all([
    source(componentPath),
    source(locationsPath),
  ]);
  assert.match(component, /idleHelp = "Start typing an address/);
  assert.match(component, /\{helperText \? \(/);
  assert.match(locations, /idleHelp=""/);
});

test("the operational location editor explains the manual lookup fallback after autocomplete has no suggestion", async () => {
  const [component, locations] = await Promise.all([
    source(componentPath),
    source(locationsPath),
  ]);
  assert.match(component, /noSuggestionsHelp = "No address suggestions found/);
  assert.match(component, /unavailableHelp = FALLBACK_MESSAGE/);
  assert.match(
    locations,
    /No suggestion was found\. You can still use Find address to look up the address you entered\./,
  );
  assert.match(
    locations,
    /Address suggestions are unavailable\. You can still use Find address to look up the address you entered\./,
  );
});
