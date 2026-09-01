import { calculateRentalDays } from "./rental-duration.ts";

export const MAX_FINDER_PASSENGERS = 100;

export type VehicleFinderInput = {
  requestedStart: string;
  requestedEnd: string;
  passengerCount: number;
  maximumBudget: number;
  preferredCategory: string | null;
  destination: string | null;
};

export type FinderCandidate = {
  id: string;
  name: string;
  category: string;
  passengerCapacity: number | null;
  baseRentalRate: number | null;
  imageUrl: string | null;
  branchName: string | null;
  transmission: string | null;
  fuelType: string | null;
  isActive: boolean;
  maintenanceReady: boolean;
  bookingConflict: boolean;
  rentalConflict: boolean;
};

export type VehicleRecommendation = {
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

export type FinderResult = {
  rentalDays: number;
  recommendations: VehicleRecommendation[];
  noMatch: FinderNoMatch | null;
};

export type FinderValidationResult =
  | { ok: true; value: VehicleFinderInput }
  | { ok: false; errors: Record<string, string> };

const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

function parseRentalTimestamp(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    );
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? 0);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateFinderInput(
  input: Record<string, unknown> | null,
  supportedCategories: string[],
): FinderValidationResult {
  const errors: Record<string, string> = {};
  const requestedStart = cleanText(input?.requestedStart);
  const requestedEnd = cleanText(input?.requestedEnd);
  const start = parseRentalTimestamp(requestedStart);
  const end = parseRentalTimestamp(requestedEnd);

  if (!start) errors.requestedStart = "Enter a valid rental start.";
  if (!end) errors.requestedEnd = "Enter a valid rental end.";
  if (start && end && start >= end)
    errors.requestedEnd = "Rental end must be after the start.";

  const passengerCount = Number(input?.passengerCount);
  if (
    !Number.isInteger(passengerCount) ||
    passengerCount <= 0 ||
    passengerCount > MAX_FINDER_PASSENGERS
  )
    errors.passengerCount = `Passenger count must be a whole number from 1 to ${MAX_FINDER_PASSENGERS}.`;

  const maximumBudget = Number(input?.maximumBudget);
  if (!Number.isFinite(maximumBudget) || maximumBudget <= 0)
    errors.maximumBudget = "Enter a positive maximum total budget.";

  const preferredCategoryInput = cleanText(input?.preferredCategory);
  const preferredCategory = preferredCategoryInput
    ? (supportedCategories.find(
        (category) =>
          category.toLocaleLowerCase() ===
          preferredCategoryInput.toLocaleLowerCase(),
      ) ?? null)
    : null;
  if (preferredCategoryInput && !preferredCategory)
    errors.preferredCategory = "Choose a supported vehicle category.";

  const destinationInput = cleanText(input?.destination);
  if (destinationInput.length > 200)
    errors.destination = "Destination must be 200 characters or fewer.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      requestedStart: start!.toISOString(),
      requestedEnd: end!.toISOString(),
      passengerCount,
      maximumBudget,
      preferredCategory,
      destination: destinationInput || null,
    },
  };
}

export function intervalsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  const aStart = new Date(firstStart);
  const aEnd = new Date(firstEnd);
  const bStart = new Date(secondStart);
  const bEnd = new Date(secondEnd);
  if ([aStart, aEnd, bStart, bEnd].some((date) => Number.isNaN(date.getTime())))
    return false;
  return aStart < bEnd && aEnd > bStart;
}

const money = (value: number) => Math.round(value * 100) / 100;

export function findVehicles(
  input: VehicleFinderInput,
  candidates: FinderCandidate[],
): FinderResult {
  const rentalDays = calculateRentalDays(
    new Date(input.requestedStart),
    new Date(input.requestedEnd),
  );

  const evaluated = candidates.map((vehicle) => {
    const capacityKnown =
      Number.isInteger(vehicle.passengerCapacity) &&
      Number(vehicle.passengerCapacity) > 0;
    const rateKnown =
      typeof vehicle.baseRentalRate === "number" &&
      Number.isFinite(vehicle.baseRentalRate) &&
      vehicle.baseRentalRate >= 0;
    const rawTotal = rateKnown ? vehicle.baseRentalRate! * rentalDays : null;
    const costKnown =
      rawTotal !== null &&
      Number.isFinite(rawTotal) &&
      Number.isSafeInteger(Math.round(rawTotal * 100));
    const estimatedTotalBaseRental = costKnown ? money(rawTotal) : null;
    const periodAvailable = !vehicle.bookingConflict && !vehicle.rentalConflict;
    const capacitySufficient =
      capacityKnown && vehicle.passengerCapacity! >= input.passengerCount;
    const withinBudget =
      estimatedTotalBaseRental !== null &&
      estimatedTotalBaseRental <= input.maximumBudget;
    return {
      vehicle,
      capacityKnown,
      periodAvailable,
      capacitySufficient,
      withinBudget,
      estimatedTotalBaseRental,
      eligible:
        vehicle.isActive &&
        vehicle.maintenanceReady &&
        periodAvailable &&
        capacitySufficient &&
        withinBudget,
    };
  });

  const eligible = evaluated
    .filter((item) => item.eligible)
    .sort((left, right) => {
      const preferredDifference =
        Number(
          right.vehicle.category === input.preferredCategory &&
            input.preferredCategory !== null,
        ) -
        Number(
          left.vehicle.category === input.preferredCategory &&
            input.preferredCategory !== null,
        );
      if (preferredDifference) return preferredDifference;
      const capacityDifference =
        left.vehicle.passengerCapacity! -
        input.passengerCount -
        (right.vehicle.passengerCapacity! - input.passengerCount);
      if (capacityDifference) return capacityDifference;
      const costDifference =
        left.estimatedTotalBaseRental! - right.estimatedTotalBaseRental!;
      if (costDifference) return costDifference;
      return (
        left.vehicle.name.localeCompare(right.vehicle.name, "en", {
          sensitivity: "base",
        }) || left.vehicle.id.localeCompare(right.vehicle.id)
      );
    });

  const recommendations = eligible.map((item, index) => {
    const preferredCategoryMatch =
      input.preferredCategory !== null &&
      item.vehicle.category === input.preferredCategory;
    const reasons = [
      "Available for your selected dates",
      `Seats your group of ${input.passengerCount}`,
      `Within your maximum base-rental budget`,
      "Maintenance-ready",
    ];
    if (preferredCategoryMatch)
      reasons.push(`Matches your ${input.preferredCategory} preference`);
    else if (input.preferredCategory)
      reasons.push(
        `Suitable alternative to your ${input.preferredCategory} preference`,
      );
    return {
      vehicleId: item.vehicle.id,
      name: item.vehicle.name,
      category: item.vehicle.category,
      passengerCapacity: item.vehicle.passengerCapacity!,
      baseRentalRate: item.vehicle.baseRentalRate!,
      estimatedTotalBaseRental: item.estimatedTotalBaseRental!,
      imageUrl: item.vehicle.imageUrl,
      branchName: item.vehicle.branchName,
      transmission: item.vehicle.transmission,
      fuelType: item.vehicle.fuelType,
      preferredCategoryMatch,
      rank: index + 1,
      reasons,
    };
  });

  if (recommendations.length)
    return { rentalDays, recommendations, noMatch: null };

  const operationallyPossible = evaluated.filter(
    (item) => item.vehicle.isActive && item.vehicle.maintenanceReady,
  );
  const factors: FinderNoMatch["factors"] = [];
  if (
    operationallyPossible.length > 0 &&
    !operationallyPossible.some((item) => item.periodAvailable)
  )
    factors.push("PERIOD_AVAILABILITY");
  if (
    operationallyPossible.some((item) => item.periodAvailable) &&
    !operationallyPossible.some(
      (item) => item.periodAvailable && item.capacitySufficient,
    )
  )
    factors.push("CAPACITY");
  if (
    operationallyPossible.some(
      (item) => item.periodAvailable && item.capacitySufficient,
    ) &&
    !operationallyPossible.some(
      (item) =>
        item.periodAvailable && item.capacitySufficient && item.withinBudget,
    )
  )
    factors.push("BUDGET");
  if (!factors.length) factors.push("GENERAL");

  return {
    rentalDays,
    recommendations: [],
    noMatch: {
      code: "NO_ELIGIBLE_VEHICLES",
      factors,
      message: "No vehicles currently meet all of your requirements.",
    },
  };
}
