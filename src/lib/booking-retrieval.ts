type JsonResponse = {
  ok: boolean;
  json(): Promise<unknown>;
};

export type AdminBookingResponse = {
  bookings: unknown[];
  candidateVehicles: unknown[];
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
): Promise<AdminBookingResponse> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messageFrom(body));
  if (
    !isRecord(body) ||
    !Array.isArray(body.bookings) ||
    !Array.isArray(body.candidateVehicles)
  ) {
    throw new Error("Unable to load booking requests.");
  }
  return { bookings: body.bookings, candidateVehicles: body.candidateVehicles };
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
