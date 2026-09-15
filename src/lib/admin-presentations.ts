export type AdminStatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "locked"
  | "neutral";

export type AdminVehicle = {
  id: string;
  name: string;
  license_plate?: string | null;
  branch_id?: string | null;
  is_active?: boolean | null;
  branch?: { id?: string; name: string } | null;
  category?: { id?: string; name: string } | null;
};

export type AdminRental = {
  id: string;
  booking_id?: string;
  vehicle_id?: string;
  scheduled_pickup_at: string;
  scheduled_return_at: string;
  started_at: string | null;
  ended_at: string | null;
  release_odometer?: number | null;
  release_fuel_level?: string | null;
  release_condition_summary?: string | null;
  existing_damage_notes?: string | null;
  agreement_acknowledged?: boolean;
  condition_acknowledged?: boolean;
  return_schedule_acknowledged?: boolean;
  return_odometer?: number | null;
  return_fuel_level?: string | null;
  return_condition_summary?: string | null;
  observed_damage_notes?: string | null;
  return_remarks?: string | null;
};

export type AdminFinderContext = {
  selected_vehicle_id?: string | null;
  requested_start?: string | null;
  requested_end?: string | null;
  passenger_count?: number | null;
  maximum_budget?: number | null;
  preferred_category_id?: string | null;
  destination?: string | null;
  recommendation_rank?: number | null;
  preferred_category?: { id: string; name: string } | null;
  selected_vehicle?: { id: string; name: string } | null;
};

export type AdminBooking = {
  id: string;
  customer_id?: string;
  requested_vehicle_id?: string;
  assigned_vehicle_id?: string | null;
  pickup_branch_id?: string;
  return_branch_id?: string;
  pickup_at: string;
  return_at: string;
  destination?: string | null;
  purpose_of_use?: string | null;
  pickup_delivery_option?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  preferred_seat_count?: number | null;
  customer_contact_number?: string | null;
  booking_status: string;
  assigned_by?: string | null;
  assigned_at?: string | null;
  assignment_note?: string | null;
  substitution_acknowledged?: boolean;
  cross_branch_acknowledged?: boolean;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  customer?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
  } | null;
  requested_vehicle?: AdminVehicle | null;
  assigned_vehicle?: AdminVehicle | null;
  pickup_branch?: { id: string; name: string } | null;
  return_branch?: { id: string; name: string } | null;
  finder_context?: AdminFinderContext | null;
  rental?: AdminRental | null;
  requirement_status?: string;
  payment_status?: string;
};

export type AdminRequirementDocument = {
  id: string;
  requirement_set_id: string;
  booking_id: string;
  customer_id: string;
  requirement_type: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  is_current: boolean;
  uploaded_at: string;
  superseded_at: string | null;
};

export type AdminRequirementReview = {
  government_id_outcome?: string;
  government_id_reason?: string | null;
  drivers_license_outcome?: string;
  drivers_license_reason?: string | null;
  identity_consistency?: string;
  lto_outcome?: string;
  reviewed_at?: string;
};

export type AdminRequirementSet = {
  id: string;
  booking_id: string;
  customer_id: string;
  status: string;
  submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  booking?: {
    id: string;
    customer?: {
      id: string;
      full_name?: string | null;
      email?: string | null;
    } | null;
    requested_vehicle?: { name: string } | null;
  } | null;
};

export type AdminRequirementsResponse = {
  requirementSet: AdminRequirementSet | null;
  documents: AdminRequirementDocument[];
  reviews?: AdminRequirementReview[];
  requiredTypes: string[];
};

export type AdminPaymentProof = {
  id: string;
  original_filename?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  version?: number | null;
  is_current?: boolean | null;
  uploaded_at?: string | null;
};

export type AdminPayment = {
  id: string;
  booking_id: string;
  customer_id?: string;
  status: string;
  payment_method_id?: string | null;
  payment_method_label?: string | null;
  submitted_amount?: number | string | null;
  required_amount?: number | string | null;
  transaction_reference?: string | null;
  resubmission_reason?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  booking?: {
    id: string;
    booking_status?: string;
    customer?: {
      id: string;
      full_name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  payment_methods?: {
    id: string;
    code?: string | null;
    label?: string | null;
    instructions?: string | null;
    is_demo?: boolean | null;
  } | null;
  payment_proofs?: AdminPaymentProof[];
};

export function formatAdminDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
  }).format(date);
}

export function formatAdminDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  if (!start || !end) return "Dates not recorded";
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return "Dates not recorded";
  }
  const formatter = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

export function formatAdminMoney(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount == null || !Number.isFinite(amount)) return null;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function bookingReference(id: string) {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "Reference unavailable";
}

export function rentalState(booking: Pick<AdminBooking, "rental">) {
  if (!booking.rental) return "Not started";
  if (booking.rental.ended_at) return "Returned";
  if (booking.rental.started_at) return "Active rental";
  return "Not started";
}

export function statusTone(status: string | null | undefined): AdminStatusTone {
  switch (status) {
    case "Verified":
    case "Confirmed":
    case "Active rental":
      return "success";
    case "Pending Review":
    case "Pending Verification":
      return "warning";
    case "Needs Resubmission":
    case "Rejected":
      return "error";
    case "Not Submitted":
      return "locked";
    case "Submitted":
      return "info";
    default:
      return "neutral";
  }
}

export function currentManilaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
  }).format(new Date());
}

export function currentManilaMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export function stringValue(value: unknown, fallback = "Not recorded") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function exactAdminEntity<T extends { id: string }>(
  entities: readonly T[],
  id: string,
) {
  return entities.find((entity) => entity.id === id) ?? null;
}

export function currentPaymentProof(payment: AdminPayment | null | undefined) {
  const current = (payment?.payment_proofs ?? []).filter(
    (proof) => proof.is_current !== false,
  );
  return current.length === 1 ? current[0] : null;
}

export function requirementReviewGate({
  governmentIdOutcome,
  driversLicenseOutcome,
  identityConsistency,
  ltoOutcome,
}: {
  governmentIdOutcome: string;
  driversLicenseOutcome: string;
  identityConsistency: string;
  ltoOutcome: string;
}) {
  const allOutcomesSelected = Boolean(
    governmentIdOutcome &&
    driversLicenseOutcome &&
    identityConsistency &&
    ltoOutcome,
  );
  const canVerify =
    allOutcomesSelected &&
    governmentIdOutcome === "Accepted" &&
    driversLicenseOutcome === "Accepted" &&
    identityConsistency === "Consistent" &&
    ltoOutcome === "Clear";
  const canResubmit =
    allOutcomesSelected &&
    (governmentIdOutcome === "Needs Replacement" ||
      driversLicenseOutcome === "Needs Replacement");
  return { canVerify, canResubmit };
}

export function paymentAmountPresentation(
  value: number | string | null | undefined,
) {
  return value == null || value === "" ? null : formatAdminMoney(value);
}
