export const AUDIT_DOMAINS = [
  "booking",
  "requirements",
  "payment",
  "rental",
  "maintenance",
] as const;

export const AUDIT_ACTOR_TYPES = ["User", "System"] as const;

export type AuditDomain = (typeof AUDIT_DOMAINS)[number];
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];
export type AuditMetadata = Record<string, unknown>;

export type AuditEvent = {
  id: string;
  actor_type: AuditActorType;
  actor_user_id: string | null;
  action: string;
  entity_type: AuditDomain;
  entity_id: string;
  booking_id: string | null;
  metadata: AuditMetadata;
  occurred_at: string;
  actor: {
    id: string;
    full_name: string;
    email: string | null;
    user_type: string;
  } | null;
};

export function summarizeAuditEvent(
  event: Pick<AuditEvent, "action" | "metadata">,
) {
  const metadata = event.metadata ?? {};
  const previous = safeLabel(metadata.previous_status);
  const next = safeLabel(metadata.new_status);
  const transition = previous && next ? `${previous} → ${next}` : null;

  switch (event.action) {
    case "booking.created":
      return "Booking request created.";
    case "booking.vehicle_assigned": {
      const previousVehicle = shortId(metadata.previous_assigned_vehicle_id);
      const assignedVehicle = shortId(metadata.assigned_vehicle_id);
      return previousVehicle
        ? `Vehicle changed from ${previousVehicle} to ${assignedVehicle ?? "another vehicle"}.`
        : `Vehicle ${assignedVehicle ?? "selected"} assigned.`;
    }
    case "booking.confirmed":
      return transition
        ? `Booking status changed: ${transition}.`
        : "Booking confirmed.";
    case "requirements.submitted":
      return "Requirements submitted for review.";
    case "requirements.resubmitted":
      return "Corrected requirements resubmitted for review.";
    case "requirements.needs_resubmission":
    case "requirements.verified":
      return transition
        ? `Requirement status changed: ${transition}.`
        : humanizeAction(event.action);
    case "payment.submitted":
      return "Payment proof submitted for review.";
    case "payment.resubmitted":
      return "Corrected payment proof resubmitted for review.";
    case "payment.needs_resubmission":
    case "payment.verified":
      return transition
        ? `Payment status changed: ${transition}.`
        : humanizeAction(event.action);
    case "rental.released":
      return `Vehicle ${shortId(metadata.vehicle_id) ?? ""} released for rental.`.replace(
        "  ",
        " ",
      );
    case "rental.returned":
      return `Vehicle ${shortId(metadata.vehicle_id) ?? ""} returned.`.replace(
        "  ",
        " ",
      );
    case "maintenance.created":
      return `${safeLabel(metadata.maintenance_type) ?? "Maintenance"} opened for vehicle ${shortId(metadata.vehicle_id) ?? "record"}.`;
    case "maintenance.completed":
    case "maintenance.cancelled":
      return transition
        ? `${safeLabel(metadata.maintenance_type) ?? "Maintenance"}: ${transition}.`
        : humanizeAction(event.action);
    default:
      return humanizeAction(event.action);
  }
}

export function humanizeAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" · ");
}

function safeLabel(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function shortId(value: unknown) {
  const id = safeLabel(value);
  return id ? id.slice(0, 8) : null;
}
