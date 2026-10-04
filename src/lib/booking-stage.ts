import type { AdminBooking, AdminStatusTone } from "./admin-presentations";

type Stage = {
  label: string;
  detail: string;
  action: string;
  tone: AdminStatusTone;
};
export function bookingStage(booking: AdminBooking): Stage {
  const result = (
    label: string,
    detail: string,
    action = "View booking",
    tone: AdminStatusTone = "neutral",
  ): Stage => ({ label, detail, action, tone });
  const status = booking.booking_status;
  const documents = booking.requirement_status;
  const payment = booking.payment_status;
  const rental = booking.rental;
  if ((rental?.started_at || rental?.ended_at) && status !== "Confirmed")
    return result(
      "Review needed",
      "Booking and rental records differ.",
      "Review booking",
      "warning",
    );
  if (status === "Cancelled" || status === "Rejected")
    return result(
      status,
      status === "Rejected"
        ? "Booking was not approved."
        : "Booking was cancelled.",
      "View booking",
      status === "Rejected" ? "error" : "neutral",
    );
  if (rental?.ended_at)
    return result(
      "Returned",
      "Rental return recorded.",
      "View rental",
      "success",
    );
  if (rental?.started_at)
    return result(
      "Active rental",
      "Rental is in progress.",
      "View rental",
      "success",
    );
  if (status === "Confirmed")
    return result(
      "Confirmed",
      "Rental: not started.",
      "View booking",
      "success",
    );
  if (status === "Draft")
    return result(
      "Draft",
      documents === "Needs Resubmission"
        ? "Documents: customer correction needed."
        : "Customer has not submitted this request.",
    );
  if (status !== "Submitted")
    return result(
      "Review needed",
      "Booking status is unavailable or unrecognized.",
      "Review booking",
      "warning",
    );
  if (!documents)
    return result(
      "Status unavailable",
      "Document status is unavailable.",
      "Review booking",
      "warning",
    );
  if (documents === "Pending Review")
    return result(
      "Document review",
      "Documents: pending review.",
      "Review documents",
      "warning",
    );
  if (documents === "Needs Resubmission")
    return result(
      "Awaiting documents",
      "Documents: customer correction needed.",
      "View booking",
      "warning",
    );
  if (documents === "Not Submitted")
    return result("Awaiting documents", "Documents: not submitted.");
  if (documents !== "Verified")
    return result(
      "Review needed",
      `Documents: ${documents}.`,
      "Review booking",
      "warning",
    );
  if (payment === "Pending Verification")
    return result(
      "Payment review",
      "Payment: awaiting verification.",
      "Review payment",
      "warning",
    );
  if (payment === "Verified")
    return result(
      "Ready to confirm",
      "Documents and payment verified.",
      "Review confirmation",
      "info",
    );
  if (payment === "Not Submitted")
    return result("Awaiting payment", "Payment: not submitted.");
  if (payment === "Needs Resubmission")
    return result(
      "Awaiting payment",
      "Payment: customer correction needed.",
      "View booking",
      "warning",
    );
  return result(
    "Review needed",
    payment ? `Payment: ${payment}.` : "Payment status is unavailable.",
    "Review booking",
    "warning",
  );
}
