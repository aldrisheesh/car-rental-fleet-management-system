import {
  instantToManilaDateTimeLocal,
  manilaDateTimeLocalToInstant,
} from "./business-time.ts";
import type {
  VehicleFinderInput,
  VehicleRecommendation,
} from "./vehicle-finder.ts";

export const FINDER_BASELINE = "VS017";

export type FinderBookingHandoff = {
  selectedVehicleId: string;
  requestedStart: string;
  requestedEnd: string;
  passengerCount: number;
  largeBagCount: number;
  maximumBudget: number;
  /** Kept for existing booking-form prefill links. */
  destination: string | null;
  displayedRank: number | null;
};

export type FinderDateSelection = Pick<
  FinderBookingHandoff,
  "requestedStart" | "requestedEnd"
>;

export type FinderBookingSearch = {
  vehicle?: string;
  /** Existing draft booking to revise from the customer booking page. */
  editBooking?: string;
  /** Legacy browse-link compatibility; current Finder evaluation ignores this value. */
  branch?: string;
  /** Legacy browse-link compatibility; current customer slice does not use these fields. */
  category?: string;
  pickup?: string;
  finderStart?: string;
  finderEnd?: string;
  finderPassengers?: string | number;
  finderBags?: string | number;
  finderBudget?: string | number;
  finderCategory?: string;
  finderDestination?: string;
  finderRank?: string | number;
  /** Preserves a date-only trip search while moving through the fleet catalog. */
  finderIntent?: string;
  /** One-time browse-page instruction to open the rental date picker. */
  finderOpenDates?: string;
};

export type FinderMaterialBooking = {
  vehicleId: string;
  pickup: string;
  dropoff: string;
  passengerCount: string;
  destination: string;
};

const searchText = (value: unknown) => {
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
};

const searchNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return undefined;
};

export function validateFinderBookingSearch(
  search: Record<string, unknown>,
): FinderBookingSearch {
  return {
    vehicle: searchText(search.vehicle),
    editBooking: searchText(search.editBooking),
    branch: searchText(search.branch),
    category: searchText(search.category),
    pickup: searchText(search.pickup),
    finderStart: searchText(search.finderStart),
    finderEnd: searchText(search.finderEnd),
    finderPassengers: searchNumber(search.finderPassengers),
    finderBags: searchNumber(search.finderBags),
    finderBudget: searchNumber(search.finderBudget),
    finderCategory: searchText(search.finderCategory),
    finderDestination: searchText(search.finderDestination),
    finderRank: searchNumber(search.finderRank),
    finderIntent: searchText(search.finderIntent),
    finderOpenDates: searchText(search.finderOpenDates),
  };
}

/**
 * Dates selected while browsing the active fleet do not imply that the user
 * ran a full Finder evaluation. Keep them available to downstream detail pages
 * without manufacturing recommendation provenance.
 */
export function parseFinderDateSelection(
  search: FinderBookingSearch,
): FinderDateSelection | null {
  if (!search.finderStart || !search.finderEnd) return null;

  const parseDate = (value: string) => {
    const localDate = manilaDateTimeLocalToInstant(value);
    if (localDate) return localDate;
    const instant = new Date(value);
    return Number.isNaN(instant.getTime()) ? null : instant;
  };
  const start = parseDate(search.finderStart);
  const end = parseDate(search.finderEnd);
  if (!start || !end || end <= start) return null;

  return {
    requestedStart: start.toISOString(),
    requestedEnd: end.toISOString(),
  };
}

export function parseFinderBookingHandoff(
  search: FinderBookingSearch,
): FinderBookingHandoff | null {
  if (
    !search.vehicle ||
    !search.finderStart ||
    !search.finderEnd ||
    !search.finderPassengers ||
    search.finderBags == null ||
    !search.finderBudget
  )
    return null;

  const start = new Date(search.finderStart);
  const end = new Date(search.finderEnd);
  const passengerCount = Number(search.finderPassengers);
  const largeBagCount = Number(search.finderBags);
  const maximumBudget = Number(search.finderBudget);
  const displayedRankValue = search.finderRank
    ? Number(search.finderRank)
    : null;
  const displayedRank =
    displayedRankValue !== null &&
    Number.isInteger(displayedRankValue) &&
    displayedRankValue > 0
      ? displayedRankValue
      : null;
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString() !== search.finderStart ||
    end.toISOString() !== search.finderEnd ||
    end <= start ||
    !Number.isInteger(passengerCount) ||
    passengerCount <= 0 ||
    !Number.isInteger(largeBagCount) ||
    largeBagCount < 0 ||
    !Number.isFinite(maximumBudget) ||
    maximumBudget <= 0
  )
    return null;

  return {
    selectedVehicleId: search.vehicle,
    requestedStart: start.toISOString(),
    requestedEnd: end.toISOString(),
    passengerCount,
    largeBagCount,
    maximumBudget,
    destination: search.finderDestination?.trim() || null,
    displayedRank,
  };
}

export function finderBookingPrefill(handoff: FinderBookingHandoff) {
  return {
    pickup: instantToManilaDateTimeLocal(new Date(handoff.requestedStart)),
    dropoff: instantToManilaDateTimeLocal(new Date(handoff.requestedEnd)),
    passengerCount: String(handoff.passengerCount),
    destination: handoff.destination ?? "",
  };
}

export function finderProvenanceMatchesBooking(
  handoff: FinderBookingHandoff,
  booking: FinderMaterialBooking,
) {
  const pickup = manilaDateTimeLocalToInstant(booking.pickup);
  const dropoff = manilaDateTimeLocalToInstant(booking.dropoff);
  if (!pickup || !dropoff) return false;
  return (
    booking.vehicleId === handoff.selectedVehicleId &&
    pickup.toISOString() === handoff.requestedStart &&
    dropoff.toISOString() === handoff.requestedEnd &&
    Number(booking.passengerCount) === handoff.passengerCount
  );
}

export function finderContextForSubmission(handoff: FinderBookingHandoff) {
  return {
    selectedVehicleId: handoff.selectedVehicleId,
    requestedStart: instantToManilaDateTimeLocal(
      new Date(handoff.requestedStart),
    ),
    requestedEnd: instantToManilaDateTimeLocal(new Date(handoff.requestedEnd)),
    passengerCount: handoff.passengerCount,
    largeBagCount: handoff.largeBagCount,
    maximumBudget: handoff.maximumBudget,
    displayedRank: handoff.displayedRank,
  };
}

export function revalidateFinderBookingBasis({
  selectedVehicleId,
  bookingVehicleId,
  bookingPickupAt,
  bookingReturnAt,
  bookingPassengerCount,
  bookingDestination: _bookingDestination,
  canonicalInput,
  recommendations,
}: {
  selectedVehicleId: string;
  bookingVehicleId: string;
  bookingPickupAt: string;
  bookingReturnAt: string;
  bookingPassengerCount: number | null;
  bookingDestination?: string | null;
  canonicalInput: VehicleFinderInput;
  recommendations: VehicleRecommendation[];
}):
  | { ok: true; recommendationRank: number }
  | { ok: false; reason: "MISMATCH" | "STALE" } {
  if (
    selectedVehicleId !== bookingVehicleId ||
    canonicalInput.requestedStart !== bookingPickupAt ||
    canonicalInput.requestedEnd !== bookingReturnAt ||
    canonicalInput.passengerCount !== bookingPassengerCount
  )
    return { ok: false, reason: "MISMATCH" };

  const recommendation = recommendations.find(
    (item) => item.vehicleId === bookingVehicleId,
  );
  return recommendation
    ? { ok: true, recommendationRank: recommendation.rank }
    : { ok: false, reason: "STALE" };
}
