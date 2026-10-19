import test from "node:test";
import assert from "node:assert/strict";
import { customerCancellationAction } from "./customer-cancellation.ts";

test("unpaid drafts and submitted requests can be withdrawn across review stages", () => {
  for (const booking_status of ["Draft", "Submitted"])
    for (const payment of [null, "Not Submitted"])
      assert.equal(
        customerCancellationAction({ booking_status, rental: null }, payment),
        "withdraw",
      );
});
test("submitted proof, correction, verified payment and confirmed bookings need review", () => {
  for (const payment of [
    "Pending Verification",
    "Needs Resubmission",
    "Verified",
  ])
    assert.equal(
      customerCancellationAction({ booking_status: "Submitted" }, payment),
      "request",
    );
  assert.equal(
    customerCancellationAction({ booking_status: "Confirmed" }, null),
    "request",
  );
});
test("unknown payment evidence and released or closed bookings never expose withdrawal", () => {
  assert.equal(
    customerCancellationAction({ booking_status: "Submitted" }, null, true),
    null,
  );
  assert.equal(
    customerCancellationAction({ booking_status: "Submitted" }, "Unexpected"),
    null,
  );
  assert.equal(
    customerCancellationAction(
      { booking_status: "Confirmed", rental: { id: "rental" } },
      "Verified",
    ),
    null,
  );
  for (const booking_status of ["Cancelled", "Rejected", "Returned"])
    assert.equal(
      customerCancellationAction({ booking_status }, "Verified"),
      null,
    );
});
