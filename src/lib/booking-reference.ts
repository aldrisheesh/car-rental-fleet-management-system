/** Display only; routes, searches and mutations continue to use the full primary ID. */
export function bookingReference(id: string) {
  const value = id.trim().toUpperCase();
  return value
    ? `#${value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-12)}` : value}`
    : "Reference unavailable";
}

export function bookingReferenceLabel(id: string) {
  return id.trim()
    ? `Booking ${bookingReference(id)}`
    : "Booking reference unavailable";
}
