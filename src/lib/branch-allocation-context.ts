import { branchPerformance, fleet } from "@/data/admin";

export type WeatherRisk = "normal" | "moderate" | "high";
export type TrafficSeverity = "light" | "moderate" | "heavy";
export type FuelTrendDirection = "down" | "stable" | "up";
export type ContextSourceType = "live" | "fallback";
export type ConfidenceLabel = "High" | "Medium" | "Low";

export type ContextSourceStatus = {
  weather: ContextSourceType;
  traffic: ContextSourceType;
  fuel: ContextSourceType;
};

export type BranchContext = {
  branch: string;
  weatherRisk: WeatherRisk;
  trafficSeverity: TrafficSeverity;
  fuelTrend: {
    direction: FuelTrendDirection;
    delta: number;
  };
  source: ContextSourceStatus;
  updatedAt: string;
};

export type AllocationScoreBreakdown = {
  demandPressure: number;
  availabilityGap: number;
  weather: number;
  traffic: number;
  fuel: number;
};

export type BranchAllocationRecommendation = {
  id: string;
  from: string;
  to: string;
  unit: string;
  reason: string;
  urgencyScore: number;
  confidence: ConfidenceLabel;
  breakdown: AllocationScoreBreakdown;
  source: ContextSourceStatus;
  updatedAt: string;
};

const DEFAULT_TIMEOUT_MS = 1800;

function resolveTimeout() {
  const raw = Number(import.meta.env.VITE_DECISIONS_CONTEXT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function toWeatherRisk(value: string | undefined): WeatherRisk | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["normal", "clear", "fair"].includes(normalized)) return "normal";
  if (["moderate", "rain", "cloudy", "windy"].includes(normalized)) return "moderate";
  if (["high", "storm", "typhoon", "severe"].includes(normalized)) return "high";
  return null;
}

function toTrafficSeverity(value: string | undefined): TrafficSeverity | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["light", "free", "freeflow"].includes(normalized)) return "light";
  if (["moderate", "busy"].includes(normalized)) return "moderate";
  if (["heavy", "gridlock", "jam"].includes(normalized)) return "heavy";
  return null;
}

function toFuelDirection(value: string | undefined): FuelTrendDirection | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["down", "rollback", "decrease"].includes(normalized)) return "down";
  if (["stable", "flat", "neutral"].includes(normalized)) return "stable";
  if (["up", "increase", "hike"].includes(normalized)) return "up";
  return null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out fetching context provider.")), timeoutMs),
    ),
  ]);
}

async function readJson(url: string, headers?: Record<string, string>) {
  const response = await withTimeout(fetch(url, { headers }), resolveTimeout());
  if (!response.ok) {
    throw new Error(`Provider returned ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

async function weatherProvider(branch: string): Promise<{ weatherRisk: WeatherRisk; source: ContextSourceType }> {
  const endpoint = import.meta.env.VITE_WEATHER_API_URL as string | undefined;
  if (!endpoint) {
    return { weatherRisk: "moderate", source: "fallback" };
  }

  try {
    const key = import.meta.env.VITE_WEATHER_API_KEY as string | undefined;
    const payload = await readJson(`${endpoint}?branch=${encodeURIComponent(branch)}`, key ? { Authorization: `Bearer ${key}` } : undefined);
    const risk = toWeatherRisk(String(payload.weatherRisk ?? payload.risk ?? payload.condition ?? ""));
    if (!risk) throw new Error("Unknown weather format");
    return { weatherRisk: risk, source: "live" };
  } catch {
    return { weatherRisk: "moderate", source: "fallback" };
  }
}

async function trafficProvider(branch: string): Promise<{ trafficSeverity: TrafficSeverity; source: ContextSourceType }> {
  const endpoint = import.meta.env.VITE_WAZE_API_URL as string | undefined;
  if (!endpoint) {
    return { trafficSeverity: "moderate", source: "fallback" };
  }

  try {
    const key = import.meta.env.VITE_WAZE_API_KEY as string | undefined;
    const payload = await readJson(`${endpoint}?branch=${encodeURIComponent(branch)}`, key ? { Authorization: `Bearer ${key}` } : undefined);
    const severity = toTrafficSeverity(String(payload.trafficSeverity ?? payload.severity ?? payload.level ?? ""));
    if (!severity) throw new Error("Unknown traffic format");
    return { trafficSeverity: severity, source: "live" };
  } catch {
    return { trafficSeverity: "moderate", source: "fallback" };
  }
}

async function fuelProvider(): Promise<{ fuelTrend: { direction: FuelTrendDirection; delta: number }; source: ContextSourceType }> {
  const endpoint = import.meta.env.VITE_FUEL_API_URL as string | undefined;
  if (!endpoint) {
    return { fuelTrend: { direction: "up", delta: 0.85 }, source: "fallback" };
  }

  try {
    const key = import.meta.env.VITE_FUEL_API_KEY as string | undefined;
    const payload = await readJson(endpoint, key ? { Authorization: `Bearer ${key}` } : undefined);
    const direction = toFuelDirection(String(payload.direction ?? payload.trend ?? ""));
    const delta = Number(payload.delta ?? payload.change ?? 0);
    if (!direction || !Number.isFinite(delta)) throw new Error("Unknown fuel format");
    return { fuelTrend: { direction, delta }, source: "live" };
  } catch {
    return { fuelTrend: { direction: "up", delta: 0.85 }, source: "fallback" };
  }
}

async function getBranchContext(branch: string): Promise<BranchContext> {
  const [weather, traffic, fuel] = await Promise.all([
    weatherProvider(branch),
    trafficProvider(branch),
    fuelProvider(),
  ]);

  return {
    branch,
    weatherRisk: weather.weatherRisk,
    trafficSeverity: traffic.trafficSeverity,
    fuelTrend: fuel.fuelTrend,
    source: {
      weather: weather.source,
      traffic: traffic.source,
      fuel: fuel.source,
    },
    updatedAt: new Date().toISOString(),
  };
}

function calcVehiclePool(branch: string) {
  const records = fleet.filter((vehicle) => vehicle.branch === branch);
  return {
    total: records.length,
    available: records.filter((vehicle) => vehicle.status === "Available").length,
  };
}

function factorWeather(value: WeatherRisk) {
  if (value === "high") return 12;
  if (value === "moderate") return 6;
  return 0;
}

function factorTraffic(value: TrafficSeverity) {
  if (value === "heavy") return 10;
  if (value === "moderate") return 5;
  return 0;
}

function factorFuel(trend: { direction: FuelTrendDirection; delta: number }) {
  if (trend.direction === "up") return 4 + Math.min(8, Math.round(Math.abs(trend.delta) * 3));
  if (trend.direction === "down") return -3;
  return 0;
}

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function summarizeReason(toContext: BranchContext, breakdown: AllocationScoreBreakdown) {
  const reasons: string[] = [];
  if (breakdown.demandPressure > 15) reasons.push("demand surge");
  if (breakdown.availabilityGap > 10) reasons.push("availability gap");
  if (toContext.trafficSeverity === "heavy") reasons.push("heavy traffic");
  if (toContext.weatherRisk === "high") reasons.push("severe weather");
  if (toContext.fuelTrend.direction === "up") reasons.push("fuel hike");
  return reasons.length ? reasons.slice(0, 3).join(", ") : "balanced allocation support";
}

function pickUnitsForTransfer(from: string, count: number) {
  const candidates = fleet
    .filter(
      (vehicle) =>
        vehicle.branch === from && (vehicle.status === "Available" || vehicle.status === "Reserved"),
    )
    .slice(0, count)
    .map((vehicle) => `1× ${vehicle.name}`);

  while (candidates.length < count) {
    candidates.push(`1× ${from.split(",")[0]} standby unit`);
  }

  return candidates;
}

export async function getBranchAllocationRecommendations(): Promise<BranchAllocationRecommendation[]> {
  const contexts = await Promise.all(branchPerformance.map((branch) => getBranchContext(branch.name)));

  const rows = branchPerformance
    .map((branch) => {
      const pool = calcVehiclePool(branch.name);
      const context = contexts.find((item) => item.branch === branch.name)!;
      const demandPressure = Math.round((branch.demand / 100) * 30);
      const availabilityRatio = pool.total > 0 ? pool.available / pool.total : 0;
      const availabilityGap = Math.round(Math.max(0, (0.35 - availabilityRatio) * 50));
      const weather = factorWeather(context.weatherRisk);
      const traffic = factorTraffic(context.trafficSeverity);
      const fuel = factorFuel(context.fuelTrend);
      const urgencyScore = Math.max(0, Math.min(100, demandPressure + availabilityGap + weather + traffic + fuel + 20));

      return {
        branch: branch.name,
        pool,
        context,
        breakdown: {
          demandPressure,
          availabilityGap,
          weather,
          traffic,
          fuel,
        } satisfies AllocationScoreBreakdown,
        urgencyScore,
      };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const target = rows[0];
  const donor = rows.find(
    (item) => item.branch !== target.branch && item.pool.available >= 1 && item.urgencyScore < target.urgencyScore,
  );

  if (!target || !donor) return [];

  const units = pickUnitsForTransfer(donor.branch, 3);
  const scoreSeries = [
    target.urgencyScore,
    Math.max(0, target.urgencyScore - 18),
    Math.max(0, target.urgencyScore - 36),
  ];

  return units.map((unit, index) => {
    const urgencyScore = scoreSeries[index] ?? scoreSeries[scoreSeries.length - 1];
    return {
      id: `${donor.branch}->${target.branch}-${index + 1}`,
      from: donor.branch,
      to: target.branch,
      unit,
      reason: summarizeReason(target.context, target.breakdown),
      urgencyScore,
      confidence: confidenceLabel(urgencyScore),
      breakdown: target.breakdown,
      source: target.context.source,
      updatedAt: target.context.updatedAt,
    };
  });
}
