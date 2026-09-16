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
  assert.match(
    component,
    /onChange=\{\(event\) => onChange\(event\.target\.value\)\}/,
  );
});

test("a Places selection resolves the formatted address into the existing string field", async () => {
  const component = await source(componentPath);
  assert.match(component, /fields: \["formattedAddress"\]/);
  assert.match(
    component,
    /onChange\(place\.formattedAddress \|\| prediction\.text\.toString\(\)\)/,
  );
  assert.match(component, /includedRegionCodes: \["ph"\]/);
});

test("booking keeps alternate autocomplete conditional and submits only address strings", async () => {
  const booking = await source(bookingPath);
  assert.match(booking, /!draft\.sameReturnLocation \? \(/);
  assert.match(booking, /sameReturnLocation: draft\.sameReturnLocation/);
  assert.doesNotMatch(booking, /deliveryLatitude|deliveryLongitude|placeId/);
});
