import test from "node:test";
import assert from "node:assert/strict";
import { pickupArrangementReady, meetingMapUrl } from "./pickup-arrangement.ts";

test("pickup arrangements require both addresses and useful instructions", () => {
  const complete = {
    pickup_meeting_address: "Dalig Barangay Hall, Antipolo",
    pickup_meeting_instructions: "Meet at the main entrance.",
    return_meeting_address: "Dalig Barangay Hall, Antipolo",
    return_meeting_instructions: "Contact the team before arriving.",
  };
  assert.equal(pickupArrangementReady(complete), true);
  for (const field of Object.keys(complete)) {
    assert.equal(pickupArrangementReady({ ...complete, [field]: "  " }), false);
  }
  assert.equal(pickupArrangementReady({}), false);
});
test("map links encode the agreed address and omit missing locations", () => {
  assert.equal(
    meetingMapUrl("  Main gate & entrance, Manila  "),
    "https://www.google.com/maps/search/?api=1&query=Main%20gate%20%26%20entrance%2C%20Manila",
  );
  assert.equal(meetingMapUrl(" "), null);
  assert.equal(meetingMapUrl(null), null);
});
