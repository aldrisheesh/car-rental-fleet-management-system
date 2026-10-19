/** UI affordances only; the atomic server mutations recheck current eligibility. */
export function customerCancellationAction(
  booking: { booking_status: string; rental?: unknown },
  paymentStatus: string | null | undefined,
  paymentUnavailable = false,
): "withdraw" | "request" | null {
  if (
    booking.rental ||
    !["Draft", "Submitted", "Confirmed"].includes(booking.booking_status)
  )
    return null;
  if (paymentUnavailable) return null;
  if (booking.booking_status === "Confirmed") return "request";
  if (
    ["Pending Verification", "Verified", "Needs Resubmission"].includes(
      paymentStatus ?? "",
    )
  )
    return booking.booking_status === "Submitted" ? "request" : null;
  if (paymentStatus == null || paymentStatus === "Not Submitted")
    return "withdraw";
  return null;
}
