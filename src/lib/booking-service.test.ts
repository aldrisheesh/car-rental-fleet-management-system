import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingServiceErrors,
  bookingServiceFields,
} from "./booking-service.ts";

const draft = {
  pickupDeliveryOption: "delivery" as const,
  pickupLocation: "  Manila  ",
  dropoffLocation: "  Antipolo  ",
  sameReturnLocation: true,
};
test("pickup does not submit retained delivery addresses or require address fields", () => {
  const pickup = { ...draft, pickupDeliveryOption: "pickup" as const };
  assert.deepEqual(bookingServiceFields(pickup), {
    pickupDeliveryOption: "pickup",
    pickupLocation: null,
    dropoffLocation: null,
  });
  assert.deepEqual(
    bookingServiceErrors({
      ...pickup,
      pickupLocation: "",
      dropoffLocation: "",
      sameReturnLocation: false,
    }),
    {},
  );
});
test("delivery uses the chosen collection arrangement and requires missing addresses", () => {
  assert.deepEqual(bookingServiceFields(draft), {
    pickupDeliveryOption: "delivery",
    pickupLocation: "Manila",
    dropoffLocation: "Manila",
  });
  assert.equal(
    bookingServiceFields({ ...draft, sameReturnLocation: false })
      .dropoffLocation,
    "Antipolo",
  );
  assert.deepEqual(
    bookingServiceErrors({
      ...draft,
      pickupLocation: " ",
      dropoffLocation: "",
      sameReturnLocation: false,
    }),
    {
      pickupLocation: "Enter the delivery address.",
      dropoffLocation: "Enter the collection address.",
    },
  );
});
