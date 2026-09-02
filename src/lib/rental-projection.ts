export function isActiveRental(rental: {
  started_at?: unknown;
  ended_at?: unknown;
}) {
  return rental.started_at != null && rental.ended_at == null;
}

export function projectCustomerRental(rental: Record<string, unknown> | null) {
  if (!rental) return null;
  return {
    id: rental.id,
    booking_id: rental.booking_id,
    vehicle_id: rental.vehicle_id,
    scheduled_pickup_at: rental.scheduled_pickup_at,
    scheduled_return_at: rental.scheduled_return_at,
    started_at: rental.started_at,
    ended_at: rental.ended_at,
    active: isActiveRental(rental),
  };
}
