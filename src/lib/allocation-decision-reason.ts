import { categoryValue, validCategory } from "./booking-categories.ts";

export const TRANSFER_REVIEW_FACTORS = [
  ["readiness", "Vehicle readiness"],
  ["bookings", "Bookings and customer commitments"],
  ["weather", "Weather conditions"],
  ["route", "Road and route conditions"],
  ["fuel", "Distance and estimated fuel"],
] as const;
export const TRANSFER_DECLINE_REASONS = [
  "Vehicle is no longer available",
  "Vehicle needs maintenance or inspection",
  "Transfer would affect customer bookings",
  "Weather or road conditions need further verification",
  "Route or receiving location cannot be used",
  "Transfer distance or fuel requirement is unsuitable",
  "Branch needs have changed",
  "Other reason",
] as const;

/** Preserve every checked factor in the existing audited decision reason. */
export function transferDecisionReason(
  state: "Approved" | "Rejected",
  factors: string[],
  declineReason: string,
  details: string,
) {
  const selected = TRANSFER_REVIEW_FACTORS.filter(([key]) =>
    factors.includes(key),
  );
  if (!selected.length || details.length > 200) return "";
  if (
    state === "Rejected" &&
    (!TRANSFER_DECLINE_REASONS.some((reason) => reason === declineReason) ||
      (declineReason === "Other reason" && !details.trim()))
  )
    return "";
  const code =
    state === "Rejected"
      ? "allocation.unsuitable"
      : selected.some(([key]) => key === "readiness")
        ? "allocation.readiness"
        : selected.some(([key]) => key === "bookings")
          ? "allocation.customer"
          : selected.some(([key]) => key === "route" || key === "weather")
            ? "allocation.route"
            : "allocation.other";
  const narrative = [
    state === "Rejected" ? `Decline reason: ${declineReason}` : "",
    `Factors reviewed: ${selected.map(([, label]) => label).join(", ")}`,
    details.trim() ? `Additional details: ${details.trim()}` : "",
  ]
    .filter(Boolean)
    .join("; ");
  const value = categoryValue("allocation_review", code, narrative);
  return validCategory("allocation_review", value) ? value : "";
}
