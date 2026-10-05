export type TransferBooking = {
  id: string;
  assigned_vehicle_id: string | null;
  booking_status: string;
};
export type TransferRental = { booking_id: string; ended_at: string | null };

/** A branch reassignment persists beyond the planning week. Calendar expiry alone
 * cannot prove that the customer returned the vehicle. */
export function hasUnfinishedConfirmedReservation(
  vehicleId: string,
  bookings: TransferBooking[],
  rentals: TransferRental[],
) {
  const completedBookings = new Set(
    rentals
      .filter((rental) => rental.ended_at)
      .map((rental) => rental.booking_id),
  );
  return bookings.some(
    (booking) =>
      booking.assigned_vehicle_id === vehicleId &&
      booking.booking_status === "Confirmed" &&
      !completedBookings.has(booking.id),
  );
}
