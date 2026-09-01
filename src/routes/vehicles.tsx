import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Search, Sparkles } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VehicleCard } from "@/components/site/VehicleCard";
import { peso, vehicles as mockVehicles, type Vehicle } from "@/data/vehicles";
import { instantToManilaDateTimeLocal } from "@/lib/business-time";

const categories = [
  "All",
  "Economy",
  "Sedan",
  "SUV",
  "MPV",
  "Van",
  "Pickup",
] as const;
const branches = ["All branches", "Taft, Manila", "Antipolo, Rizal"] as const;

type VehicleSearch = {
  category?: string;
  branch?: string;
  pickup?: string;
};

type FinderRecommendation = {
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

type FinderResponse = {
  rentalDays: number;
  criteria: {
    requestedStart: string;
    requestedEnd: string;
    passengerCount: number;
    maximumBudget: number;
    preferredCategory: string | null;
    destination: string | null;
  };
  recommendations: FinderRecommendation[];
  noMatch: {
    code: "NO_ELIGIBLE_VEHICLES";
    factors: Array<"CAPACITY" | "BUDGET" | "PERIOD_AVAILABILITY" | "GENERAL">;
    message: string;
  } | null;
};

const emptyFinderForm = {
  requestedStart: "",
  requestedEnd: "",
  passengerCount: "",
  maximumBudget: "",
  preferredCategory: "",
  destination: "",
};

function isCategory(value: unknown): value is (typeof categories)[number] {
  return (
    typeof value === "string" &&
    categories.includes(value as (typeof categories)[number])
  );
}

function isBranch(value: unknown): value is (typeof branches)[number] {
  return (
    typeof value === "string" &&
    branches.includes(value as (typeof branches)[number])
  );
}

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const Route = createFileRoute("/vehicles")({
  validateSearch: (search: Record<string, unknown>): VehicleSearch => ({
    category:
      isCategory(search.category) && search.category !== "All"
        ? search.category
        : undefined,
    branch:
      isBranch(search.branch) && search.branch !== "All branches"
        ? search.branch
        : undefined,
    pickup: isDateValue(search.pickup) ? search.pickup : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vehicles — Briah's Car Rental" },
      {
        name: "description",
        content:
          "Browse our full fleet of cars, SUVs, MPVs, vans, and pickups available for rent across Luzon.",
      },
      { property: "og:title", content: "Vehicles — Briah's Car Rental" },
      {
        property: "og:description",
        content:
          "Browse our full fleet of cars, SUVs, MPVs, vans, and pickups.",
      },
    ],
    links: [{ rel: "canonical", href: "/vehicles" }],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const search = Route.useSearch();
  const [cat, setCat] = useState<(typeof categories)[number]>(
    isCategory(search.category) ? search.category : "All",
  );
  const [branch, setBranch] = useState<(typeof branches)[number]>(
    isBranch(search.branch) ? search.branch : "All branches",
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderForm, setFinderForm] = useState(emptyFinderForm);
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState("");
  const [finderFieldErrors, setFinderFieldErrors] = useState<
    Record<string, string>
  >({});
  const [finderResult, setFinderResult] = useState<FinderResponse | null>(null);
  const [minimumFinderDateTime, setMinimumFinderDateTime] = useState("");

  useEffect(() => {
    setMinimumFinderDateTime(instantToManilaDateTimeLocal(new Date()));
  }, []);

  useEffect(() => {
    void fetch("/api/vehicles")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(
        (
          rows: Array<{
            id: string;
            name: string;
            license_plate: string | null;
            transmission: string | null;
            fuel_type: string | null;
            seat_capacity: number | null;
            daily_rate: number | null;
            image_url: string | null;
            branch: { name: string } | null;
            category: { name: string } | null;
          }>,
        ) => {
          setVehicles(
            rows.map((row) => {
              const fallback = mockVehicles.find(
                (vehicle) => vehicle.name === row.name,
              );
              return {
                id: row.id,
                name: row.name,
                category: (row.category?.name ??
                  fallback?.category ??
                  "Economy") as Vehicle["category"],
                image: row.image_url ?? fallback?.image ?? "",
                pricePerDay: Number(row.daily_rate ?? 0),
                transmission:
                  row.transmission === "Manual" ? "Manual" : "Automatic",
                seats: row.seat_capacity ?? 0,
                fuel: row.fuel_type === "Diesel" ? "Diesel" : "Gasoline",
                branch: (row.branch?.name ??
                  fallback?.branch ??
                  "Taft, Manila") as Vehicle["branch"],
                available: true,
              };
            }),
          );
        },
      )
      .catch(() => undefined);
  }, []);

  const filtered = vehicles.filter((v) => {
    if (cat !== "All" && v.category !== cat) return false;
    if (branch !== "All branches" && v.branch !== branch) return false;
    return true;
  });

  function updateFinderField(
    field: keyof typeof emptyFinderForm,
    value: string,
  ) {
    setFinderForm((current) => ({ ...current, [field]: value }));
    setFinderFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submitFinder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFinderLoading(true);
    setFinderError("");
    setFinderFieldErrors({});
    setFinderResult(null);
    try {
      const response = await fetch("/api/vehicle-finder", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...finderForm,
          passengerCount: Number(finderForm.passengerCount),
          maximumBudget: Number(finderForm.maximumBudget),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFinderFieldErrors(data?.errors ?? {});
        throw new Error(data?.message || "Unable to find vehicles right now.");
      }
      setFinderResult(data as FinderResponse);
    } catch (error) {
      setFinderError(
        error instanceof Error
          ? error.message
          : "Unable to find vehicles right now.",
      );
    } finally {
      setFinderLoading(false);
    }
  }

  function resetFinder() {
    setFinderOpen(false);
    setFinderForm(emptyFinderForm);
    setFinderResult(null);
    setFinderError("");
    setFinderFieldErrors({});
  }

  return (
    <div>
      <Header />
      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-16 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Our fleet
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
            All vehicles
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Every car is self-drive. Filter by type or branch to find your ride.
          </p>
          {search.pickup && (
            <p className="mt-3 text-xs font-medium text-primary">
              Showing options for pickup on {formatPickupDate(search.pickup)}
            </p>
          )}
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-card">
          <div className="flex flex-col gap-4 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Guided vehicle finder
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Find the Right Vehicle
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about your trip and we&apos;ll suggest suitable
                vehicles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFinderOpen((open) => !open)}
              aria-expanded={finderOpen}
              className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
              {finderOpen ? "Hide Finder" : "Start Finder"}
            </button>
          </div>

          {finderOpen && (
            <form
              onSubmit={submitFinder}
              className="border-t border-border p-5 md:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FinderField
                  label="Rental start"
                  error={finderFieldErrors.requestedStart}
                >
                  <input
                    className="input-control"
                    type="datetime-local"
                    min={minimumFinderDateTime || undefined}
                    value={finderForm.requestedStart}
                    onChange={(event) =>
                      updateFinderField("requestedStart", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.requestedStart)}
                    required
                  />
                </FinderField>
                <FinderField
                  label="Rental end"
                  error={finderFieldErrors.requestedEnd}
                >
                  <input
                    className="input-control"
                    type="datetime-local"
                    min={
                      finderForm.requestedStart ||
                      minimumFinderDateTime ||
                      undefined
                    }
                    value={finderForm.requestedEnd}
                    onChange={(event) =>
                      updateFinderField("requestedEnd", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.requestedEnd)}
                    required
                  />
                </FinderField>
                <FinderField
                  label="Passengers"
                  error={finderFieldErrors.passengerCount}
                >
                  <input
                    className="input-control"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="e.g. 5"
                    value={finderForm.passengerCount}
                    onChange={(event) =>
                      updateFinderField("passengerCount", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.passengerCount)}
                    required
                  />
                </FinderField>
                <FinderField
                  label="Maximum total base-rental budget (PHP)"
                  error={finderFieldErrors.maximumBudget}
                >
                  <input
                    className="input-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Budget for the full rental period"
                    value={finderForm.maximumBudget}
                    onChange={(event) =>
                      updateFinderField("maximumBudget", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.maximumBudget)}
                    required
                  />
                </FinderField>
                <FinderField
                  label="Preferred category (optional)"
                  error={finderFieldErrors.preferredCategory}
                >
                  <select
                    className="input-control"
                    value={finderForm.preferredCategory}
                    onChange={(event) =>
                      updateFinderField("preferredCategory", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.preferredCategory)}
                  >
                    <option value="">No preference</option>
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </FinderField>
                <FinderField
                  label="Destination / travel area (optional)"
                  error={finderFieldErrors.destination}
                >
                  <input
                    className="input-control"
                    maxLength={200}
                    placeholder="e.g. Baguio City"
                    value={finderForm.destination}
                    onChange={(event) =>
                      updateFinderField("destination", event.target.value)
                    }
                    aria-invalid={Boolean(finderFieldErrors.destination)}
                  />
                </FinderField>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Destination is captured for your requirements only and does not
                change recommendations in this baseline. Estimates cover base
                rental only, not final settlement or other charges.
              </p>
              {finderError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {finderError}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={finderLoading}
                  className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {finderLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {finderLoading ? "Finding vehicles…" : "Show recommendations"}
                </button>
                <button
                  type="button"
                  onClick={resetFinder}
                  className="touch-target rounded-full border border-border px-5 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Browse all vehicles
                </button>
              </div>
            </form>
          )}
        </div>

        {finderResult?.recommendations.length ? (
          <section className="mt-10" aria-labelledby="finder-results-title">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Smart Vehicle Finder
                </p>
                <h2
                  id="finder-results-title"
                  className="mt-1 font-display text-2xl font-semibold"
                >
                  Recommended for your trip
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {finderForm.passengerCount} passenger
                  {finderForm.passengerCount === "1" ? "" : "s"} ·{" "}
                  {finderResult.rentalDays} rental day
                  {finderResult.rentalDays === 1 ? "" : "s"} · up to{" "}
                  {peso(Number(finderForm.maximumBudget))} total base rental
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFinderResult(null);
                  setFinderError("");
                }}
                className="text-left text-sm font-semibold text-primary hover:underline"
              >
                Edit requirements
              </button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {finderResult.recommendations.map((recommendation) => (
                <div key={recommendation.vehicleId} className="relative">
                  <div className="absolute -left-2 -top-2 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background shadow-card">
                    #{recommendation.rank}
                  </div>
                  <VehicleCard
                    v={recommendationToVehicle(recommendation)}
                    bookingLabel="Continue to booking"
                    bookingSearch={{
                      vehicle: recommendation.vehicleId,
                      finderStart: finderResult.criteria.requestedStart,
                      finderEnd: finderResult.criteria.requestedEnd,
                      finderPassengers: String(finderResult.criteria.passengerCount),
                      finderBudget: String(finderResult.criteria.maximumBudget),
                      finderCategory: finderResult.criteria.preferredCategory ?? undefined,
                      finderDestination: finderResult.criteria.destination ?? undefined,
                      finderRank: String(recommendation.rank),
                    }}
                  />
                  <div className="-mt-3 rounded-b-xl border border-t-0 border-border bg-card px-5 pb-5 pt-6 shadow-soft">
                    <p className="text-sm font-semibold text-primary">
                      Estimated base rental:{" "}
                      {peso(recommendation.estimatedTotalBaseRental)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {finderResult.rentalDays} day
                      {finderResult.rentalDays === 1 ? "" : "s"} at{" "}
                      {peso(recommendation.baseRentalRate)}/day
                    </p>
                    <h3 className="mt-4 text-sm font-semibold">
                      Why this fits
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {recommendation.reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex gap-2 text-xs leading-5 text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {finderResult?.noMatch && (
          <section className="mt-10 rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-soft md:p-12">
            <h2 className="font-display text-2xl font-semibold">
              {finderResult.noMatch.message}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {noMatchGuidance(finderResult.noMatch.factors)} Hard requirements
              were not relaxed, so no unavailable or unsuitable vehicle is shown
              as a fallback.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setFinderResult(null)}
                className="touch-target rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Edit requirements
              </button>
              <button
                type="button"
                onClick={resetFinder}
                className="touch-target rounded-full border border-border px-5 text-sm font-semibold hover:bg-secondary"
              >
                Browse all vehicles
              </button>
            </div>
          </section>
        )}

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Browse all vehicles
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Explore the fleet
          </h2>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
          <FilterGroup
            label="Type"
            options={categories}
            value={cat}
            onChange={setCat}
          />
          <div className="hidden h-6 w-px bg-border md:block" />
          <FilterGroup
            label="Branch"
            options={branches}
            value={branch}
            onChange={setBranch}
          />
          <div className="ml-auto rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {filtered.length} vehicle{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-soft md:p-12">
            <h2 className="font-display text-xl font-semibold text-foreground">
              No vehicles found
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              No vehicles match those filters yet. Try another branch or browse
              the full fleet.
            </p>
            <button
              type="button"
              onClick={() => {
                setCat("All");
                setBranch("All branches");
              }}
              className="touch-target mt-5 inline-flex items-center justify-center rounded-full border border-primary/40 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
            >
              Clear filters
            </button>
            <Link
              to="/booking"
              className="touch-target mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:ml-3"
            >
              Request help booking
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function FinderField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error && <span className="mt-1 block text-destructive">{error}</span>}
    </label>
  );
}

function recommendationToVehicle(
  recommendation: FinderRecommendation,
): Vehicle {
  const fallback = mockVehicles.find(
    (vehicle) => vehicle.name === recommendation.name,
  );
  return {
    id: recommendation.vehicleId,
    name: recommendation.name,
    category: recommendation.category as Vehicle["category"],
    image: recommendation.imageUrl ?? fallback?.image ?? "",
    pricePerDay: recommendation.baseRentalRate,
    transmission:
      recommendation.transmission === "Manual" ? "Manual" : "Automatic",
    seats: recommendation.passengerCapacity,
    fuel: recommendation.fuelType === "Diesel" ? "Diesel" : "Gasoline",
    branch: (recommendation.branchName ??
      fallback?.branch ??
      "Taft, Manila") as Vehicle["branch"],
    available: true,
  };
}

function noMatchGuidance(
  factors: NonNullable<FinderResponse["noMatch"]>["factors"],
) {
  const messages: string[] = [];
  if (factors.includes("PERIOD_AVAILABILITY"))
    messages.push(
      "The selected rental period is currently limiting availability.",
    );
  if (factors.includes("CAPACITY"))
    messages.push(
      "No period-available vehicle has enough known seating capacity.",
    );
  if (factors.includes("BUDGET"))
    messages.push(
      "The maximum total base-rental budget is currently too restrictive.",
    );
  if (!messages.length)
    messages.push(
      "No vehicle satisfies every mandatory requirement right now.",
    );
  return `${messages.join(" ")} `;
}

function formatPickupDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={`${label} filter`}
      >
        {options.map((o) => (
          <button
            type="button"
            key={o}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors ${
              value === o
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
