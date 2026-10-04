import type { AdminBooking } from "./admin-presentations.ts";

export function currentLedgerStage({
  booking,
  requirementStatus,
  paymentStatus,
  quoteIssued = false,
}: {
  booking: AdminBooking;
  requirementStatus: string;
  paymentStatus: string;
  quoteIssued?: boolean;
}) {
  if (["Rejected", "Cancelled"].includes(booking.booking_status)) return 0;
  if (booking.rental?.started_at) return 6;
  if (booking.booking_status === "Confirmed") return 5;
  if (requirementStatus === "Verified")
    return quoteIssued ||
      ["Pending Verification", "Needs Resubmission", "Verified"].includes(
        paymentStatus,
      )
      ? 4
      : 3;
  if (
    requirementStatus === "Pending Review" ||
    requirementStatus === "Needs Resubmission"
  )
    return 2;
  return 1;
}
