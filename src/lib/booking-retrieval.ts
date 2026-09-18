type JsonResponse = {
  ok: boolean;
  json(): Promise<unknown>;
};

export type AdminBookingResponse = {
  bookings: unknown[];
  candidateVehicles: unknown[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  branches?: Array<{ id: string; name: string }>;
  statuses?: string[];
};

export async function parseCustomerBookingResponse(
  response: JsonResponse,
): Promise<unknown[]> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messageFrom(body));
  if (!Array.isArray(body)) throw new Error("Unable to load booking requests.");
  return body;
}

export async function parseAdminBookingResponse(
  response: JsonResponse,
  options: { allowStaffResponse?: boolean } = {},
): Promise<AdminBookingResponse> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messageFrom(body));
  if (!isRecord(body) || !Array.isArray(body.bookings)) {
    throw new Error("Unable to load booking requests.");
  }
  const pagination = isPagination(body.pagination) ? body.pagination : undefined;
  const branches = Array.isArray(body.branches)
    ? body.branches.filter(isBranch)
    : undefined;
  const statuses = Array.isArray(body.statuses)
    ? body.statuses.filter((value): value is string => typeof value === "string")
    : undefined;
  if (!Array.isArray(body.candidateVehicles)) {
    if (!options.allowStaffResponse) {
      throw new Error("Unable to load booking requests.");
    }
    return {
      bookings: body.bookings,
      candidateVehicles: [],
      ...(pagination ? { pagination } : {}),
      ...(branches ? { branches } : {}),
      ...(statuses ? { statuses } : {}),
    };
  }
  return {
    bookings: body.bookings,
    candidateVehicles: body.candidateVehicles,
    ...(pagination ? { pagination } : {}),
    ...(branches ? { branches } : {}),
    ...(statuses ? { statuses } : {}),
  };
}

function messageFrom(body: unknown) {
  return isRecord(body) &&
    typeof body.message === "string" &&
    body.message.trim()
    ? body.message
    : "Unable to load booking requests.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPagination(value: unknown): value is NonNullable<AdminBookingResponse["pagination"]> {
  return isRecord(value) &&
    typeof value.page === "number" && Number.isInteger(value.page) && value.page > 0 &&
    typeof value.limit === "number" && Number.isInteger(value.limit) && value.limit > 0 &&
    typeof value.total === "number" && Number.isInteger(value.total) && value.total >= 0;
}

function isBranch(value: unknown): value is { id: string; name: string } {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}
