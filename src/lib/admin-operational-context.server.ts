import {
  estimateReferenceFuelLiters,
  getTrustedTripContext,
  type ProviderName,
  type ProviderResult,
  type TripContext,
  type TripContextRequest,
} from "./external-context.server.ts";
import {
  interpretOperationalContext,
  type InterpretedOperationalContext,
} from "./operational-context.ts";

export type OperationalContextKind =
  | "booking_assignment"
  | "allocation_review"
  | "allocation_candidate";

export type OperationalContextRequest = {
  kind: OperationalContextKind;
  bookingId?: string;
  recommendationId?: string;
  vehicleId?: string;
};

export type ContextSource = {
  status: string;
  provider: string;
  fallbackUsed: boolean;
  checkedAt: string;
};

export type CandidateFuelContext = {
  vehicleId: string;
  candidateRank: number;
  vehicleName: string;
  licensePlate: string | null;
  referenceEfficiencyKmPerLiter: number | null;
  estimatedFuelLiters: number | null;
};

export type OperationalContextResponse = {
  kind: OperationalContextKind;
  status: "available" | "partial" | "unavailable" | "not_applicable";
  reason?: "missing_destination" | "context_unavailable";
  origin: { id: string; name: string; address: string | null };
  destination: { id?: string; name: string; address?: string | null };
  targetTime: string;
  evaluatedAt: string;
  timeSemantics: "booking_pickup" | "current_review";
  context: InterpretedOperationalContext | null;
  referenceEfficiencyKmPerLiter: number | null;
  estimatedFuelLiters: number | null;
  sources: Record<string, ContextSource>;
  explanations: string[];
  limitations: string[];
  recommendation?: {
    recommendedTransferUnits: number;
    candidates: CandidateFuelContext[];
  };
};

export type BookingContextRecord = {
  id: string;
  destination: string | null;
  pickupAt: string;
  pickupBranchId: string;
  bookingStatus: string;
};

export type BranchContextRecord = {
  id: string;
  name: string;
  address: string | null;
};

export type VehicleContextRecord = {
  id: string;
  name: string;
  licensePlate: string | null;
  referenceEfficiencyKmPerLiter: number | null;
};

export type AllocationContextRecord = {
  id: string;
  sourceBranchId: string;
  destinationBranchId: string;
  recommendedTransferUnits: number;
};

export type AllocationCandidateContextRecord = VehicleContextRecord & {
  candidateRank: number;
};

export interface OperationalContextRepository {
  findBooking(id: string): Promise<BookingContextRecord | null>;
  findBranch(id: string): Promise<BranchContextRecord | null>;
  findActiveVehicle(id: string): Promise<VehicleContextRecord | null>;
  findAllocation(id: string): Promise<AllocationContextRecord | null>;
  findAllocationCandidates(
    recommendationId: string,
  ): Promise<AllocationCandidateContextRecord[]>;
}

export class OperationalContextRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OperationalContextRequestError";
    this.status = status;
  }
}

export type OperationalContextDependencies = {
  repository: OperationalContextRepository;
  getTripContext?: (request: TripContextRequest) => Promise<TripContext>;
  now?: () => Date;
};

const PROVIDERS: Record<ProviderName, string> = {
  open_meteo: "Open-Meteo",
  openweather: "OpenWeather",
  tomtom: "TomTom",
  here: "HERE",
};

const REASON_COPY: Record<string, string> = {
  weather_clear: "No significant weather concern was identified.",
  weather_cloudy: "Cloudy conditions are expected.",
  weather_fog: "Fog may reduce visibility.",
  weather_drizzle: "Drizzle may affect travel conditions.",
  weather_rain: "Rain may affect travel conditions.",
  weather_freezing_precipitation:
    "Freezing precipitation may make travel hazardous.",
  weather_snow: "Snow may affect travel conditions.",
  weather_thunderstorm: "Thunderstorms may affect travel conditions.",
  weather_severe_thunderstorm:
    "Severe thunderstorms may make travel hazardous.",
  weather_severe_precipitation:
    "Severe precipitation may make travel hazardous.",
  weather_severe_atmosphere:
    "Severe atmospheric conditions may make travel hazardous.",
  weather_atmosphere: "Atmospheric conditions may reduce visibility.",
  weather_unavailable: "Weather context could not be verified.",
  road_open: "No recognized route-blocking incident was reported.",
  roadworks: "Road works may affect the route.",
  road_disruption: "A road disruption may affect the route.",
  traffic_accident: "A traffic accident may affect the route.",
  road_flooding: "Flooding may affect the route.",
  road_closure: "A relevant road closure was reported.",
  context_unavailable: "Some operational context could not be verified.",
  access_accessible: "The route is currently reported as accessible.",
  access_limited: "Current incidents may limit route access.",
  access_closed: "Current information indicates a closed or restricted route.",
  access_unknown: "Route accessibility could not be verified.",
  route_available:
    "The route is currently feasible based on available context.",
  route_caution:
    "The route is feasible with caution based on available context.",
  route_blocked: "Current information indicates the route may not be feasible.",
  route_unavailable: "Route information could not be verified.",
  fuel_estimate_available:
    "Fuel is a reference estimate based on route distance and canonical vehicle efficiency.",
  fuel_estimate_unavailable: "A reference fuel estimate is unavailable.",
};

const LIMITATION_COPY: Record<string, string> = {
  weather_context_unavailable:
    "Weather information is unavailable or incomplete.",
  road_context_unavailable:
    "Road incident information is unavailable or incomplete.",
  access_context_unavailable:
    "Route accessibility could not be fully assessed.",
  route_or_context_unavailable:
    "Route feasibility could not be fully assessed.",
  road_incident_unrecognized:
    "Some reported incidents could not be classified.",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireId(value: unknown, field: string): string {
  const id = text(value);
  if (!id)
    throw new OperationalContextRequestError(400, `${field} is required.`);
  return id;
}

function safeNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function failedResult<T>(checkedAt: string): ProviderResult<T> {
  return {
    status: "provider_error",
    fallbackUsed: false,
    fetchedAt: checkedAt,
    failureCategory: "provider_error",
  };
}

function unavailableTrip(checkedAt: string): TripContext {
  return {
    destinationGeocode: failedResult(checkedAt),
    originGeocode: failedResult(checkedAt),
    route: failedResult(checkedAt),
    weather: failedResult(checkedAt),
    trafficIncidents: failedResult(checkedAt),
  };
}

function source(result: ProviderResult<unknown>): ContextSource {
  return {
    status: result.status,
    provider: result.providerUsed
      ? PROVIDERS[result.providerUsed]
      : "Unavailable",
    fallbackUsed: result.fallbackUsed,
    checkedAt: result.fetchedAt,
  };
}

function sources(trip: TripContext): Record<string, ContextSource> {
  return {
    weather: source(trip.weather),
    traffic: source(trip.trafficIncidents),
    route: source(trip.route),
    origin: source(trip.originGeocode),
    destination: source(trip.destinationGeocode),
  };
}

function displayStatus(
  context: InterpretedOperationalContext,
): OperationalContextResponse["status"] {
  const available = [
    context.weather.classification !== "Unavailable",
    context.roadCondition.classification !== "Unknown",
    context.routeFeasibility.classification !== "Unavailable",
    context.routeAccessibility.classification !== "Unknown",
    context.distanceKm !== undefined,
    context.travelTimeMinutes !== undefined,
  ];
  if (available.every(Boolean)) return "available";
  return available.some(Boolean) ? "partial" : "unavailable";
}

function readable(
  codes: readonly string[],
  table: Record<string, string>,
): string[] {
  return [...new Set(codes.map((code) => table[code]).filter(Boolean))];
}

async function safeTrip(
  request: TripContextRequest,
  getTripContext: (request: TripContextRequest) => Promise<TripContext>,
  checkedAt: string,
): Promise<TripContext> {
  try {
    return await getTripContext(request);
  } catch {
    return unavailableTrip(checkedAt);
  }
}

function interpretedResponse(
  base: Omit<
    OperationalContextResponse,
    | "status"
    | "context"
    | "sources"
    | "explanations"
    | "limitations"
    | "estimatedFuelLiters"
  >,
  trip: TripContext,
): OperationalContextResponse {
  const context = interpretOperationalContext(trip);
  return {
    ...base,
    status: displayStatus(context),
    context,
    estimatedFuelLiters: context.estimatedFuelLiters ?? null,
    sources: sources(trip),
    explanations: readable(context.reasons, REASON_COPY),
    limitations: readable(context.limitations, LIMITATION_COPY),
  };
}

export async function resolveOperationalContext(
  request: OperationalContextRequest,
  dependencies: OperationalContextDependencies,
): Promise<OperationalContextResponse> {
  const now = dependencies.now ?? (() => new Date());
  const getTrip = dependencies.getTripContext ?? getTrustedTripContext;
  const evaluatedAt = now().toISOString();

  if (request.kind === "booking_assignment") {
    const bookingId = requireId(request.bookingId, "bookingId");
    const booking = await dependencies.repository.findBooking(bookingId);
    if (!booking || booking.bookingStatus !== "Submitted") {
      throw new OperationalContextRequestError(
        404,
        "Submitted booking not found.",
      );
    }
    const origin = await dependencies.repository.findBranch(
      booking.pickupBranchId,
    );
    if (!origin)
      throw new OperationalContextRequestError(404, "Pickup branch not found.");
    let vehicle: VehicleContextRecord | null = null;
    if (request.vehicleId) {
      vehicle = await dependencies.repository.findActiveVehicle(
        request.vehicleId,
      );
      if (!vehicle) {
        throw new OperationalContextRequestError(
          400,
          "Vehicle is not an active assignment candidate.",
        );
      }
    }
    const destination = text(booking.destination);
    const base = {
      kind: request.kind,
      origin,
      destination: { name: destination },
      targetTime: booking.pickupAt,
      evaluatedAt,
      timeSemantics: "booking_pickup" as const,
      referenceEfficiencyKmPerLiter:
        vehicle?.referenceEfficiencyKmPerLiter ?? null,
    };
    if (!destination) {
      return {
        ...base,
        status: "not_applicable",
        reason: "missing_destination",
        context: null,
        estimatedFuelLiters: null,
        sources: {},
        explanations: ["Context unavailable — no destination recorded."],
        limitations: ["Assignment and confirmation remain available."],
      };
    }
    const trip = await safeTrip(
      {
        destination,
        pickupBranchId: booking.pickupBranchId,
        targetTime: booking.pickupAt,
        ...(vehicle ? { vehicleId: vehicle.id } : {}),
        trafficAwareRoute: true,
      },
      getTrip,
      evaluatedAt,
    );
    return interpretedResponse(base, trip);
  }

  if (
    request.kind !== "allocation_review" &&
    request.kind !== "allocation_candidate"
  ) {
    throw new OperationalContextRequestError(
      400,
      "Invalid operational context kind.",
    );
  }
  const recommendationId = requireId(
    request.recommendationId,
    "recommendationId",
  );
  const recommendation =
    await dependencies.repository.findAllocation(recommendationId);
  if (!recommendation)
    throw new OperationalContextRequestError(
      404,
      "Allocation recommendation not found.",
    );
  const [origin, destination, candidates] = await Promise.all([
    dependencies.repository.findBranch(recommendation.sourceBranchId),
    dependencies.repository.findBranch(recommendation.destinationBranchId),
    dependencies.repository.findAllocationCandidates(recommendationId),
  ]);
  if (!origin || !destination) {
    throw new OperationalContextRequestError(
      404,
      "Allocation branch not found.",
    );
  }
  let selectedCandidate: AllocationCandidateContextRecord | undefined;
  if (request.kind === "allocation_candidate") {
    const vehicleId = requireId(request.vehicleId, "vehicleId");
    selectedCandidate = candidates.find(
      (candidate) => candidate.id === vehicleId,
    );
    if (!selectedCandidate) {
      throw new OperationalContextRequestError(
        400,
        "Vehicle is not an allocation candidate.",
      );
    }
  }
  const trip = await safeTrip(
    {
      destination: destination.address || destination.name,
      pickupBranchId: origin.id,
      targetTime: evaluatedAt,
      ...(selectedCandidate ? { vehicleId: selectedCandidate.id } : {}),
      trafficAwareRoute: true,
    },
    getTrip,
    evaluatedAt,
  );
  const interpreted = interpretOperationalContext(trip);
  const distanceKm = interpreted.distanceKm;
  const candidateFuel = candidates.map((candidate) => ({
    vehicleId: candidate.id,
    candidateRank: candidate.candidateRank,
    vehicleName: candidate.name,
    licensePlate: candidate.licensePlate,
    referenceEfficiencyKmPerLiter: safeNumber(
      candidate.referenceEfficiencyKmPerLiter,
    ),
    estimatedFuelLiters:
      distanceKm === undefined
        ? null
        : (estimateReferenceFuelLiters(
            distanceKm,
            candidate.referenceEfficiencyKmPerLiter,
          )?.estimatedLiters ?? null),
  }));
  const base = {
    kind: request.kind,
    origin,
    destination,
    targetTime: evaluatedAt,
    evaluatedAt,
    timeSemantics: "current_review" as const,
    referenceEfficiencyKmPerLiter:
      selectedCandidate?.referenceEfficiencyKmPerLiter ?? null,
    recommendation: {
      recommendedTransferUnits: recommendation.recommendedTransferUnits,
      candidates: candidateFuel,
    },
  };
  return interpretedResponse(base, trip);
}

export async function handleOperationalContextRequest(
  request: Request,
  dependencies: OperationalContextDependencies & {
    getPrincipal: () => Promise<{ role: string }>;
  },
): Promise<Response> {
  try {
    const principal = await dependencies.getPrincipal();
    if (principal.role !== "Owner/Admin") {
      return Response.json(
        { message: "Owner/Admin access is required." },
        { status: 403 },
      );
    }
    const body = (await request
      .json()
      .catch(() => null)) as OperationalContextRequest | null;
    if (!body || typeof body.kind !== "string") {
      return Response.json(
        { message: "A valid context request is required." },
        { status: 400 },
      );
    }
    return Response.json(await resolveOperationalContext(body, dependencies));
  } catch (error) {
    if (error instanceof OperationalContextRequestError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }
    const reason = error instanceof Error ? error.message : "";
    if (reason === "unauthenticated") {
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }
    if (reason === "forbidden") {
      return Response.json(
        { message: "Owner/Admin access is required." },
        { status: 403 },
      );
    }
    return Response.json(
      { message: "Unable to load operational context." },
      { status: 503 },
    );
  }
}
