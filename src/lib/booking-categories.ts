/** Stable codes shared by forms, API validation and the database lookup table. */
export const BOOKING_CATEGORIES = {
  purpose: [
    ["purpose.family", "Family trip"],
    ["purpose.leisure", "Leisure / holiday"],
    ["purpose.business", "Business / work"],
    ["purpose.airport", "Airport transfer"],
    ["purpose.event", "Wedding / special event"],
    ["purpose.replacement", "Temporary replacement vehicle"],
    ["purpose.other", "Other purpose"],
  ],
  destination: [
    ["destination.ncr", "Metro Manila"],
    ["destination.rizal", "Rizal"],
    ["destination.cavite", "Cavite"],
    ["destination.laguna", "Laguna"],
    ["destination.batangas", "Batangas"],
    ["destination.quezon", "Quezon"],
    ["destination.bulacan", "Bulacan"],
    ["destination.pampanga", "Pampanga"],
    ["destination.bataan", "Bataan"],
    ["destination.zambales", "Zambales"],
    ["destination.tarlac", "Tarlac"],
    ["destination.nueva_ecija", "Nueva Ecija"],
    ["destination.pangasinan", "Pangasinan"],
    ["destination.benguet", "Benguet / Baguio"],
    ["destination.other", "Other destination"],
  ],
  booking_rejection: [
    ["rejection.unavailable", "Vehicle unavailable for requested dates"],
    ["rejection.delivery", "Delivery location cannot be accommodated"],
    ["rejection.eligibility", "Driver does not meet rental requirements"],
    ["rejection.inconsistent", "Request information could not be verified"],
    ["rejection.terms", "Rental terms could not be agreed"],
    ["rejection.other", "Other rejection reason"],
  ],
  cancellation: [
    ["cancellation.customer", "Customer requested cancellation"],
    ["cancellation.vehicle", "Vehicle cannot be supplied"],
    ["cancellation.weather", "Weather / safety disruption"],
    ["cancellation.terms", "Rental terms could not be fulfilled"],
    ["cancellation.other", "Other cancellation reason"],
  ],
  document_review: [
    ["document.unreadable", "Document is unclear or unreadable"],
    ["document.expired", "Document has expired"],
    ["document.incomplete", "Document is incomplete"],
    ["document.wrong", "Incorrect document submitted"],
    ["document.mismatch", "Details do not match"],
    ["document.unverifiable", "Document could not be verified"],
    ["document.other", "Other document correction"],
    ["selfie.unclear", "Photo is blurry, dark or affected by glare"],
    ["selfie.face", "Face is covered, cropped or not clearly visible"],
    ["selfie.id", "ID is cropped, covered or unreadable in the photo"],
    ["selfie.missing", "Photo does not show the customer holding their ID"],
    [
      "selfie.mismatch",
      "Face or ID does not match the submitted identification",
    ],
    ["selfie.unverifiable", "Photo could not be verified"],
    ["selfie.other", "Other selfie correction"],
  ],
  payment_review: [
    ["payment.amount", "Amount does not match the payment request"],
    ["payment.reference", "Transaction reference does not match"],
    ["payment.unreadable", "Payment proof is unclear or unreadable"],
    ["payment.unreceived", "Payment could not be confirmed as received"],
    ["payment.wrong", "Incorrect payment proof submitted"],
    ["payment.other", "Other payment correction"],
  ],
  rescheduling: [
    ["reschedule.plans", "Travel plans changed"],
    ["reschedule.flight", "Flight / transport schedule changed"],
    ["reschedule.emergency", "Personal emergency"],
    ["reschedule.weather", "Weather / safety concern"],
    ["reschedule.other", "Other date change reason"],
  ],
  reschedule_decline: [
    ["reschedule_decline.unavailable", "Vehicle unavailable for the new dates"],
    [
      "reschedule_decline.maintenance",
      "Vehicle needs maintenance or inspection during the new dates",
    ],
    [
      "reschedule_decline.delivery",
      "Delivery or collection unavailable for the new dates",
    ],
    [
      "reschedule_decline.handover",
      "Requested handover time cannot be accommodated",
    ],
    [
      "reschedule_decline.revised_quote",
      "Change requires a revised booking or quote",
    ],
    [
      "reschedule_decline.unagreed",
      "New dates could not be agreed with the customer",
    ],
    ["reschedule_decline.other", "Other reschedule decline reason"],
  ],
  allocation_review: [
    ["allocation.readiness", "Vehicle readiness reviewed"],
    ["allocation.route", "Route / weather reviewed"],
    ["allocation.customer", "Customer commitments considered"],
    ["allocation.unsuitable", "Transfer is unsuitable"],
    ["allocation.other", "Other allocation decision"],
  ],
} as const;
export type CategoryDomain = keyof typeof BOOKING_CATEGORIES;
export function splitCategory(domain: CategoryDomain, value: string) {
  const option = BOOKING_CATEGORIES[domain].find(
    ([, label]) => value === label || value.startsWith(`${label} — `),
  );
  return {
    code: option?.[0] ?? "",
    label: option?.[1] ?? "",
    details: option ? value.slice(option[1].length).replace(/^ — /, "") : value,
  };
}
export function categoryValue(
  domain: CategoryDomain,
  code: string,
  details = "",
) {
  const option = BOOKING_CATEGORIES[domain].find(([key]) => key === code);
  return option
    ? `${option[1]}${details.trim() ? ` — ${details.trim()}` : ""}`
    : "";
}
export function validCategory(
  domain: CategoryDomain,
  value: unknown,
  optional = false,
) {
  if (typeof value !== "string") return optional && value == null;
  if (!value.trim()) return optional;
  if (value.length > (domain === "destination" ? 200 : 500)) return false;
  const { code, details } = splitCategory(domain, value.trim());
  return (
    Boolean(code) && (!code.endsWith(".other") || details.trim().length > 0)
  );
}
