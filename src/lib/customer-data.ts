import {
  instantToManilaDateTimeLocal,
  manilaDateTimeLocalToInstant,
} from "./business-time.ts";

export type CustomerVehicle = {
  id: string;
  name: string;
  license_plate: string | null;
  transmission: string | null;
  fuel_type: string | null;
  seat_capacity: number | null;
  daily_rate: number | null;
  image_url: string | null;
  is_active?: boolean;
  branch: { id?: string; name: string } | null;
  category: { id?: string; name: string } | null;
};

export type BookingMasterData = {
  branches: Array<{ id: string; name: string }>;
  vehicles: Array<{
    id: string;
    name: string;
    seat_capacity: number | null;
    image_url: string | null;
    branch_id: string;
    category: { id: string; name: string } | null;
  }>;
};

export type FinderRecommendation = {
  vehicleId: string;
  name: string;
  category: string;
  passengerCapacity: number;
  baseRentalRate: number;
  estimatedTotalBaseRental: number;
  imageUrl: string | null;
  branchName: string | null;
  transmission: string | null;
  fuelType: string | null;
  preferredCategoryMatch: boolean;
  rank: number;
  reasons: string[];
};

export type FinderNoMatch = {
  code: "NO_ELIGIBLE_VEHICLES";
  factors: Array<"CAPACITY" | "BUDGET" | "PERIOD_AVAILABILITY" | "GENERAL">;
  message: string;
};

export type FinderResponse = {
  rentalDays: number;
  criteria: {
    requestedStart: string;
    requestedEnd: string;
    passengerCount: number;
    maximumBudget: number;
    preferredCategory: string | null;
    destination: string | null;
  };
  recommendations: FinderRecommendation[];
  noMatch: FinderNoMatch | null;
};

export type CustomerBooking = {
  id: string;
  booking_status: string;
  pickup_at: string;
  return_at: string;
  purpose_of_use?: string | null;
  destination?: string | null;
  pickup_delivery_option?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  preferred_seat_count?: number | null;
  requested_vehicle: {
    id: string;
    name: string;
    license_plate: string | null;
    branch_id: string;
  } | null;
  assigned_vehicle: {
    id: string;
    name: string;
    license_plate: string | null;
    branch_id: string;
    is_active?: boolean;
  } | null;
  pickup_branch: { id: string; name: string } | null;
  return_branch: { id: string; name: string } | null;
  finder_context: {
    selected_vehicle_id: string;
    requested_start: string;
    requested_end: string;
    passenger_count: number;
    maximum_budget: number;
    preferred_category_id: string | null;
    destination: string | null;
    recommendation_rank: number | null;
    preferred_category: { id: string; name: string } | null;
    selected_vehicle: { id: string; name: string } | null;
  } | null;
  rental: CustomerRental | null;
};

export type CustomerRental = {
  id: string;
  booking_id?: string;
  vehicle_id: string;
  scheduled_pickup_at: string;
  scheduled_return_at: string;
  started_at: string | null;
  ended_at: string | null;
  active?: boolean;
};

export type RequirementSet = {
  id: string;
  booking_id: string;
  customer_id: string;
  status:
    | "Not Submitted"
    | "Pending Review"
    | "Needs Resubmission"
    | "Verified"
    | string;
  submitted_at: string | null;
  updated_at?: string;
};

export type RequirementDocument = {
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

export type CustomerRequirementReview = {
  governmentIdOutcome: string;
  governmentIdReason: string;
  driversLicenseOutcome: string;
  driversLicenseReason: string;
  identityConsistency: string;
  ltoOutcome: string;
};

export type RequirementsResponse = {
  requirementSet: RequirementSet | null;
  documents: RequirementDocument[];
  review: CustomerRequirementReview | null;
  requiredTypes: string[];
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      credentials: "same-origin",
      ...init,
    });
  } catch {
    throw new ApiRequestError(
      "The service is unavailable right now. Check your connection and try again.",
      0,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | T
    | { message?: string; errors?: Record<string, string> }
    | null;
  if (!response.ok) {
    const errorPayload = payload as {
      message?: string;
      errors?: Record<string, string>;
    } | null;
    throw new ApiRequestError(
      errorPayload?.message ?? "The request could not be completed.",
      response.status,
      errorPayload?.errors ?? {},
    );
  }
  return payload as T;
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Rate not listed";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInstant(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateRange(
  startValue: string | null | undefined,
  endValue: string | null | undefined,
) {
  if (!startValue || !endValue) return "Dates not selected";
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates not recorded";
  }
  const startParts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).formatToParts(start);
  const endParts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatToParts(end);
  const part = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const startMonth = part(startParts, "month");
  const startDay = part(startParts, "day");
  const endMonth = part(endParts, "month");
  const endDay = part(endParts, "day");
  const endYear = part(endParts, "year");
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${endYear}`;
}

export function formatInputDateTime(value: string) {
  const instant = manilaDateTimeLocalToInstant(value);
  return instant ? formatInstant(instant.toISOString()) : "Not selected";
}

export function dateTimeInputFromIso(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : instantToManilaDateTimeLocal(date);
}

export function encodeSearch(
  values: Record<string, string | number | null | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function humanizeRequirementType(type: string) {
  return type === "Valid Government ID" || type === "Driver's License"
    ? type
    : type || "Document";
}

export function fileSizeLabel(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) {
    return "Size not recorded";
  }
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
