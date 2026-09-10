export function existingBookingFromLookup(
  value: unknown,
): Record<string, unknown> | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const bookingId = (candidate as { id?: unknown }).id;
  return typeof bookingId === "string" && bookingId.trim()
    ? (candidate as Record<string, unknown>)
    : null;
}
