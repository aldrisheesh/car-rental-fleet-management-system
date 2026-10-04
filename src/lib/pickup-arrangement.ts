export type PickupArrangement = {
  pickup_meeting_address?: string | null;
  pickup_meeting_instructions?: string | null;
  return_meeting_address?: string | null;
  return_meeting_instructions?: string | null;
};
export function pickupArrangementReady(booking: PickupArrangement) {
  return Boolean(
    booking.pickup_meeting_address?.trim() &&
    booking.pickup_meeting_instructions?.trim() &&
    booking.return_meeting_address?.trim() &&
    booking.return_meeting_instructions?.trim(),
  );
}
export function meetingMapUrl(address: string | null | undefined) {
  return address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : null;
}
