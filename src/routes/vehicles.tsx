import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VehicleCard } from "@/components/site/VehicleCard";
import {
  CustomerPage,
  ErrorSummary,
  FieldError,
  StatusCallout,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  dateTimeInputFromIso,
  encodeSearch,
  fetchJson,
  type CustomerVehicle,
  type FinderResponse,
} from "@/lib/customer-data";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";
import {
  validateFinderBookingSearch,
  type FinderBookingSearch,
} from "@/lib/finder-booking";
import {
  filterFinderRecommendations,
  finderCriteriaSummary,
} from "@/lib/finder-presentation";

export const Route = createFileRoute("/vehicles")({
  validateSearch: (search) => validateFinderBookingSearch(search),
  head: () => ({
    meta: [
      { title: "Find a Car | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Browse Briah's active fleet or evaluate cars against your trip details.",
      },
    ],
  }),
  component: VehiclesRouteComponent,
});

type FinderFormState = {
  requestedStart: string;
  requestedEnd: string;
  passengerCount: string;
  maximumBudget: string;
  preferredCategory: string;
  destination: string;
};

type FinderFormErrors = Partial<Record<keyof FinderFormState, string>>;

function VehiclesRouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  return pathname === "/vehicles" || pathname === "/vehicles/" ? (
    <FindCarPage />
  ) : (
    <Outlet />
  );
}

const finderFormFromSearch = (
  search: FinderBookingSearch,
): FinderFormState => ({
  requestedStart: dateTimeInputFromIso(search.finderStart),
  requestedEnd: dateTimeInputFromIso(search.finderEnd),
  passengerCount: String(search.finderPassengers ?? ""),
  maximumBudget: String(search.finderBudget ?? ""),
  preferredCategory: search.finderCategory ?? "",
  destination: search.finderDestination ?? "",
});

function FindCarPage() {
  const search = Route.useSearch();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [finderResponse, setFinderResponse] = useState<FinderResponse | null>(
    null,
  );
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState("");
  const [finderErrors, setFinderErrors] = useState<FinderFormErrors>({});
  const [finderFocusKey, setFinderFocusKey] = useState(0);
  const [refinementOpen, setRefinementOpen] = useState(false);
  const [browseCategory, setBrowseCategory] = useState("");
  const evaluatedKey = useRef("");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          vehicles
            .map((vehicle) => vehicle.category?.name)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [vehicles],
  );
  const hasDates = Boolean(search.finderStart && search.finderEnd);
  const hasFullFinderCriteria = Boolean(
    search.finderStart &&
    search.finderEnd &&
    search.finderPassengers &&
    search.finderBudget,
  );
  const finderKey = [
    search.finderStart,
    search.finderEnd,
    search.finderPassengers,
    search.finderBudget,
    search.finderCategory,
    search.finderDestination,
  ].join("|");

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError("");
    try {
      const rows = await fetchJson<CustomerVehicle[]>("/api/vehicles");
      setVehicles(rows);
    } catch (error) {
      setVehiclesError(
        error instanceof ApiRequestError
          ? error.message
          : "Vehicles cannot be loaded right now.",
      );
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const evaluateFinder = useCallback(
    async (values: FinderFormState, updateUrl: boolean) => {
      const nextErrors: FinderFormErrors = {};
      const start = manilaDateTimeLocalToInstant(values.requestedStart);
      const end = manilaDateTimeLocalToInstant(values.requestedEnd);
      const passengerCount = Number(values.passengerCount);
      const maximumBudget = Number(values.maximumBudget);

      if (!start) nextErrors.requestedStart = "Enter a valid rental start.";
      if (!end) nextErrors.requestedEnd = "Enter a valid rental end.";
      if (start && start.getTime() < Date.now() - 60_000) {
        nextErrors.requestedStart = "Rental start cannot be in the past.";
      }
      if (start && end && start >= end) {
        nextErrors.requestedEnd = "Rental end must be after the start.";
      }
      if (
        !Number.isInteger(passengerCount) ||
        passengerCount <= 0 ||
        passengerCount > 100
      ) {
        nextErrors.passengerCount =
          "Passenger count must be a whole number from 1 to 100.";
      }
      if (!Number.isFinite(maximumBudget) || maximumBudget <= 0) {
        nextErrors.maximumBudget = "Enter a positive maximum total budget.";
      }
      if (values.destination.trim().length > 200) {
        nextErrors.destination = "Destination must be 200 characters or fewer.";
      }
      if (Object.keys(nextErrors).length) {
        setFinderErrors(nextErrors);
        setFinderFocusKey((key) => key + 1);
        return;
      }

      setFinderErrors({});
      setFinderError("");
      setFinderLoading(true);
      try {
        const result = await fetchJson<FinderResponse>("/api/vehicle-finder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestedStart: values.requestedStart,
            requestedEnd: values.requestedEnd,
            passengerCount,
            maximumBudget,
            preferredCategory: values.preferredCategory.trim() || null,
            destination: values.destination.trim() || null,
          }),
        });
        setFinderResponse(result);
        if (updateUrl) {
          window.location.assign(
            `/vehicles${encodeSearch({
              finderStart: result.criteria.requestedStart,
              finderEnd: result.criteria.requestedEnd,
              finderPassengers: result.criteria.passengerCount,
              finderBudget: result.criteria.maximumBudget,
              finderCategory: result.criteria.preferredCategory,
              finderDestination: result.criteria.destination,
            })}`,
          );
        }
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setFinderErrors(error.fieldErrors as FinderFormErrors);
          setFinderError(error.message);
        } else {
          setFinderError(
            "The Finder is unavailable right now. Try again in a moment.",
          );
        }
      } finally {
        setFinderLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasFullFinderCriteria) {
      evaluatedKey.current = "";
      setFinderResponse(null);
      return;
    }
    if (evaluatedKey.current === finderKey) return;
    evaluatedKey.current = finderKey;
    void evaluateFinder(finderFormFromSearch(search), false);
  }, [evaluateFinder, finderKey, hasFullFinderCriteria, search]);

  function submitRefinement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: FinderFormState = {
      requestedStart: String(form.get("requestedStart") ?? ""),
      requestedEnd: String(form.get("requestedEnd") ?? ""),
      passengerCount: String(form.get("passengerCount") ?? ""),
      maximumBudget: String(form.get("maximumBudget") ?? ""),
      preferredCategory: String(form.get("preferredCategory") ?? ""),
      destination: String(form.get("destination") ?? ""),
    };
    void evaluateFinder(values, true);
  }

  const directVehicles = browseCategory
    ? vehicles.filter((vehicle) => vehicle.category?.name === browseCategory)
    : vehicles;
  const summaryText = hasDates
    ? `${formatDateForSummary(search.finderStart)} – ${formatDateForSummary(search.finderEnd)}`
    : "No dates selected";
  const finderForm = finderFormFromSearch(search);
  const compactCriteria: FinderResponse["criteria"] =
    finderResponse?.criteria ?? {
      requestedStart: search.finderStart ?? "",
      requestedEnd: search.finderEnd ?? "",
      passengerCount: Number(search.finderPassengers),
      maximumBudget: Number(search.finderBudget),
      preferredCategory: search.finderCategory ?? null,
      destination: search.finderDestination ?? null,
    };
  const finderSummaryErrors = [
    finderErrors.requestedStart
      ? {
          id: "finder-start",
          label: "Rental start",
          message: finderErrors.requestedStart,
        }
      : null,
    finderErrors.requestedEnd
      ? {
          id: "finder-end",
          label: "Rental end",
          message: finderErrors.requestedEnd,
        }
      : null,
    finderErrors.passengerCount
      ? {
          id: "finder-passengers",
          label: "Passengers",
          message: finderErrors.passengerCount,
        }
      : null,
    finderErrors.maximumBudget
      ? {
          id: "finder-budget",
          label: "Maximum budget",
          message: finderErrors.maximumBudget,
        }
      : null,
    finderErrors.preferredCategory
      ? {
          id: "finder-category",
          label: "Vehicle preference",
          message: finderErrors.preferredCategory,
        }
      : null,
    finderErrors.destination
      ? {
          id: "finder-destination",
          label: "Destination",
          message: finderErrors.destination,
        }
      : null,
  ].filter((error): error is { id: string; label: string; message: string } =>
    Boolean(error),
  );

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="finder-main">
        <div className="customer-container">
          {hasFullFinderCriteria ? (
            <div
              className="trip-summary trip-summary--evaluated"
              aria-label="Current Finder criteria"
            >
              <dl className="finder-criteria-summary">
                {finderCriteriaSummary(compactCriteria).map((item) => {
                  const Icon = {
                    dates: CalendarDays,
                    passengers: Users,
                    budget: CircleDollarSign,
                    category: CarFront,
                  }[item.id];
                  return (
                    <div className="finder-criteria-item" key={item.id}>
                      <dt>
                        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                        <span>{item.label}</span>
                      </dt>
                      <dd>{item.value}</dd>
                    </div>
                  );
                })}
              </dl>
              <button
                className="customer-primary-button trip-summary-action"
                type="button"
                aria-controls="finder-refinement"
                aria-expanded={refinementOpen}
                onClick={() => setRefinementOpen((open) => !open)}
              >
                {refinementOpen ? "Close filters" : "Change trip"}
              </button>
            </div>
          ) : null}

          {!finderResponse ? (
            <div className="finder-heading">
              <div>
                <p className="eyebrow">Find a car</p>
                <h1>Explore the active fleet</h1>
                <p>
                  Browse canonical active vehicle data, then add trip details
                  when you want a closer fit.
                </p>
              </div>
            </div>
          ) : null}

          {!hasFullFinderCriteria ? (
            <div className="trip-summary" aria-label="Current trip dates">
              <div className="trip-summary-copy">
                <span className="trip-summary-label">Trip dates</span>
                <span className="trip-summary-value">{summaryText}</span>
              </div>
              <button
                className="customer-tertiary-button"
                type="button"
                onClick={() => setRefinementOpen(true)}
              >
                {hasDates ? "Refine this search" : "Add trip details"}
              </button>
            </div>
          ) : null}

          <details
            id="finder-refinement"
            className={`finder-refinement${hasFullFinderCriteria && finderResponse ? " finder-refinement--evaluated" : ""}`}
            open={refinementOpen}
            onToggle={(event) => setRefinementOpen(event.currentTarget.open)}
          >
            <summary
              className={
                hasFullFinderCriteria && finderResponse
                  ? "finder-refinement-summary-hidden"
                  : undefined
              }
              tabIndex={
                hasFullFinderCriteria && finderResponse ? -1 : undefined
              }
              aria-hidden={hasFullFinderCriteria && Boolean(finderResponse)}
            >
              <span>
                <SlidersHorizontal size={17} aria-hidden="true" /> Narrow by
                trip details
              </span>
            </summary>
            <form
              className="finder-refinement-form"
              onSubmit={submitRefinement}
              noValidate
            >
              <div className="customer-field">
                <label className="customer-label" htmlFor="finder-start">
                  Rental start
                </label>
                <input
                  id="finder-start"
                  className="customer-input"
                  name="requestedStart"
                  type="datetime-local"
                  defaultValue={finderForm.requestedStart}
                  aria-invalid={Boolean(finderErrors.requestedStart)}
                  aria-describedby={
                    finderErrors.requestedStart
                      ? "finder-start-error"
                      : undefined
                  }
                  required
                />
                <FieldError
                  id="finder-start"
                  message={finderErrors.requestedStart}
                />
              </div>
              <div className="customer-field">
                <label className="customer-label" htmlFor="finder-end">
                  Rental end
                </label>
                <input
                  id="finder-end"
                  className="customer-input"
                  name="requestedEnd"
                  type="datetime-local"
                  defaultValue={finderForm.requestedEnd}
                  aria-invalid={Boolean(finderErrors.requestedEnd)}
                  aria-describedby={
                    finderErrors.requestedEnd ? "finder-end-error" : undefined
                  }
                  required
                />
                <FieldError
                  id="finder-end"
                  message={finderErrors.requestedEnd}
                />
              </div>
              <div className="customer-field">
                <label className="customer-label" htmlFor="finder-passengers">
                  Passengers
                </label>
                <input
                  id="finder-passengers"
                  className="customer-input"
                  name="passengerCount"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  defaultValue={finderForm.passengerCount}
                  aria-invalid={Boolean(finderErrors.passengerCount)}
                  aria-describedby={
                    finderErrors.passengerCount
                      ? "finder-passengers-error"
                      : undefined
                  }
                  required
                />
                <FieldError
                  id="finder-passengers"
                  message={finderErrors.passengerCount}
                />
              </div>
              <div className="customer-field">
                <label className="customer-label" htmlFor="finder-budget">
                  Maximum total base-rental budget
                </label>
                <input
                  id="finder-budget"
                  className="customer-input"
                  name="maximumBudget"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={finderForm.maximumBudget}
                  aria-invalid={Boolean(finderErrors.maximumBudget)}
                  aria-describedby={
                    finderErrors.maximumBudget
                      ? "finder-budget-error"
                      : undefined
                  }
                  required
                />
                <FieldError
                  id="finder-budget"
                  message={finderErrors.maximumBudget}
                />
              </div>
              <div className="customer-field">
                <label className="customer-label" htmlFor="finder-category">
                  Vehicle preference{" "}
                  <span className="customer-helper">(optional)</span>
                </label>
                <select
                  id="finder-category"
                  className="customer-select"
                  name="preferredCategory"
                  defaultValue={finderForm.preferredCategory}
                  aria-invalid={Boolean(finderErrors.preferredCategory)}
                  aria-describedby={
                    finderErrors.preferredCategory
                      ? "finder-category-error"
                      : undefined
                  }
                >
                  <option value="">Any category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="finder-category"
                  message={finderErrors.preferredCategory}
                />
              </div>
              <div className="customer-field finder-destination">
                <label className="customer-label" htmlFor="finder-destination">
                  Destination{" "}
                  <span className="customer-helper">(optional)</span>
                </label>
                <input
                  id="finder-destination"
                  className="customer-input"
                  name="destination"
                  type="text"
                  maxLength={200}
                  defaultValue={finderForm.destination}
                  aria-invalid={Boolean(finderErrors.destination)}
                  aria-describedby={
                    finderErrors.destination
                      ? "finder-destination-error"
                      : undefined
                  }
                />
                <FieldError
                  id="finder-destination"
                  message={finderErrors.destination}
                />
              </div>
              <ErrorSummary
                errors={finderSummaryErrors}
                focusKey={finderFocusKey}
              />
              {finderError ? (
                <StatusCallout tone="error" title="Finder unavailable">
                  {finderError}
                </StatusCallout>
              ) : null}
              <div className="finder-refinement-actions">
                <button
                  className="customer-primary-button"
                  type="submit"
                  disabled={finderLoading}
                >
                  {finderLoading ? (
                    <RefreshCw
                      className="animate-spin"
                      size={17}
                      aria-hidden="true"
                    />
                  ) : (
                    <Filter size={17} aria-hidden="true" />
                  )}
                  {finderLoading ? "Checking cars…" : "Find matching cars"}
                </button>
                <a className="customer-tertiary-button" href="/vehicles">
                  Clear trip criteria
                </a>
              </div>
            </form>
          </details>

          {finderLoading && !finderResponse ? (
            <div
              className="finder-empty-state"
              role="status"
              aria-live="polite"
            >
              <h2>Checking the fleet</h2>
              <p>
                We&apos;re evaluating the current Finder criteria. This can take
                a moment.
              </p>
            </div>
          ) : null}

          {finderResponse ? (
            <FinderResults
              response={finderResponse}
              search={search}
              categories={categories}
              browseCategory={browseCategory}
              onBrowseCategory={setBrowseCategory}
              refinementOpen={refinementOpen}
              onToggleRefinement={() => setRefinementOpen((open) => !open)}
              onOpenRefinement={() => setRefinementOpen(true)}
            />
          ) : (
            <section
              className="finder-results-section"
              aria-labelledby="active-fleet-title"
            >
              <h2 id="active-fleet-title">
                {hasDates ? "Active cars to explore" : "Active fleet"}
              </h2>
              <p className="finder-results-meta">
                {hasDates
                  ? "These are active vehicles returned by the fleet API. Period availability and trip fit are evaluated when you run the Finder."
                  : "Browse the vehicles currently returned by the fleet API."}
              </p>
              {vehiclesLoading ? <LoadingFleet /> : null}
              {vehiclesError ? (
                <StatusCallout
                  tone="error"
                  title="Fleet unavailable"
                  action={
                    <button
                      className="customer-secondary-button"
                      type="button"
                      onClick={() => void loadVehicles()}
                    >
                      <RefreshCw size={16} aria-hidden="true" /> Try again
                    </button>
                  }
                >
                  {vehiclesError}
                </StatusCallout>
              ) : null}
              {!vehiclesLoading && !vehiclesError && vehicles.length === 0 ? (
                <StatusCallout tone="info" title="No active cars to show">
                  The active fleet is empty right now.
                </StatusCallout>
              ) : null}
              {!vehiclesLoading && !vehiclesError && vehicles.length > 0 ? (
                <>
                  <CategoryFilterRail
                    categories={categories}
                    selectedCategory={browseCategory}
                    onCategoryChange={setBrowseCategory}
                  />
                  {directVehicles.length ? (
                    <div className="vehicle-grid">
                      {directVehicles.map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          href={`/vehicles/${encodeURIComponent(vehicle.id)}${encodeSearch({ ...search, vehicle: vehicle.id })}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="finder-empty-state">
                      <h2>No cars match this filter</h2>
                      <p>
                        Clear the category filter to see every active vehicle
                        returned by the fleet.
                      </p>
                      <button
                        className="customer-secondary-button"
                        type="button"
                        onClick={() => setBrowseCategory("")}
                      >
                        Show all cars
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function FinderResults({
  response,
  search,
  categories,
  browseCategory,
  onBrowseCategory,
  refinementOpen,
  onToggleRefinement,
  onOpenRefinement,
}: {
  response: FinderResponse;
  search: FinderBookingSearch;
  categories: string[];
  browseCategory: string;
  onBrowseCategory: (category: string) => void;
  refinementOpen: boolean;
  onToggleRefinement: () => void;
  onOpenRefinement: () => void;
}) {
  const noMatch =
    Boolean(response.noMatch) || response.recommendations.length === 0;
  const visibleRecommendations = filterFinderRecommendations(
    response.recommendations,
    browseCategory,
  );

  return (
    <section
      className="finder-results-section"
      aria-labelledby={noMatch ? "no-match-title" : "finder-results-title"}
    >
      {noMatch ? (
        <>
          <h2 id="no-match-title">No cars match these trip details</h2>
          <p className="finder-results-meta">
            {response.noMatch?.message ??
              "No eligible vehicles were returned for these criteria."}
          </p>
        </>
      ) : (
        <>
          <h2 id="finder-results-title">Cars that fit your trip</h2>
          <p className="finder-results-meta">
            {visibleRecommendations.length}{" "}
            {visibleRecommendations.length === 1 ? "car" : "cars"} shown for{" "}
            {response.rentalDays} rental{" "}
            {response.rentalDays === 1 ? "day" : "days"}.
          </p>
        </>
      )}

      <CategoryFilterRail
        categories={categories}
        selectedCategory={browseCategory}
        onCategoryChange={onBrowseCategory}
        showCategories={!noMatch}
        onOpenRefinement={onToggleRefinement}
        refinementOpen={refinementOpen}
      />

      {noMatch ? (
        <div className="finder-empty-state">
          {response.noMatch?.factors?.length ? (
            <p className="customer-helper">
              Try adjusting:{" "}
              {response.noMatch.factors
                .map((factor) => factor.toLowerCase().replaceAll("_", " "))
                .join(", ")}
              .
            </p>
          ) : null}
          <button
            className="customer-secondary-button"
            type="button"
            onClick={onOpenRefinement}
          >
            <SlidersHorizontal size={17} aria-hidden="true" /> Edit trip
            criteria
          </button>
        </div>
      ) : visibleRecommendations.length === 0 ? (
        <div className="finder-empty-state">
          <h2>No evaluated cars in this category</h2>
          <p>
            Show all evaluated cars to compare the complete Finder result set.
          </p>
          <button
            className="customer-secondary-button"
            type="button"
            onClick={() => onBrowseCategory("")}
          >
            Show all cars
          </button>
        </div>
      ) : (
        <>
          <div className="vehicle-grid">
            {visibleRecommendations.map((recommendation) => {
              const vehicle: CustomerVehicle = {
                id: recommendation.vehicleId,
                name: recommendation.name,
                license_plate: null,
                transmission: recommendation.transmission,
                fuel_type: recommendation.fuelType,
                seat_capacity: recommendation.passengerCapacity,
                daily_rate: recommendation.baseRentalRate,
                image_url: recommendation.imageUrl,
                branch: recommendation.branchName
                  ? { name: recommendation.branchName }
                  : null,
                category: recommendation.category
                  ? { name: recommendation.category }
                  : null,
              };
              return (
                <VehicleCard
                  key={recommendation.vehicleId}
                  vehicle={vehicle}
                  reason={recommendation.reasons[0]}
                  href={`/vehicles/${encodeURIComponent(recommendation.vehicleId)}${encodeSearch(
                    {
                      vehicle: recommendation.vehicleId,
                      finderStart: search.finderStart,
                      finderEnd: search.finderEnd,
                      finderPassengers: search.finderPassengers,
                      finderBudget: search.finderBudget,
                      finderCategory: search.finderCategory,
                      finderDestination: search.finderDestination,
                      finderRank: recommendation.rank,
                    },
                  )}`}
                />
              );
            })}
          </div>
          <div className="finder-results-meta finder-results-browse-link">
            <a className="customer-link" href="/vehicles">
              Browse the active fleet without trip evaluation{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </>
      )}
    </section>
  );
}

function CategoryFilterRail({
  categories,
  selectedCategory,
  onCategoryChange,
  showCategories = true,
  onOpenRefinement,
  refinementOpen = false,
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showCategories?: boolean;
  onOpenRefinement?: () => void;
  refinementOpen?: boolean;
}) {
  return (
    <div
      className="finder-filter-row"
      role="group"
      aria-label={
        showCategories
          ? "Filter results by vehicle category"
          : "Finder result controls"
      }
    >
      {showCategories ? (
        <div className="finder-filter-options">
          <span className="finder-filter-label">Vehicle category</span>
          <button
            className={`finder-filter-button ${selectedCategory === "" ? "is-active" : ""}`}
            type="button"
            aria-pressed={selectedCategory === ""}
            onClick={() => onCategoryChange("")}
          >
            <CarFront size={19} strokeWidth={1.8} aria-hidden="true" />
            All cars
          </button>
          {categories.map((category) => (
            <button
              className={`finder-filter-button ${selectedCategory === category ? "is-active" : ""}`}
              type="button"
              aria-pressed={selectedCategory === category}
              key={category}
              onClick={() => onCategoryChange(category)}
            >
              <CarFront size={19} strokeWidth={1.8} aria-hidden="true" />
              {category}
            </button>
          ))}
        </div>
      ) : null}
      {onOpenRefinement ? (
        <button
          className="finder-filter-action"
          type="button"
          aria-controls="finder-refinement"
          aria-expanded={refinementOpen}
          onClick={onOpenRefinement}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
          {refinementOpen ? "Close filters" : "Filters"}
        </button>
      ) : null}
    </div>
  );
}

function LoadingFleet() {
  return (
    <div className="finder-empty-state" role="status" aria-live="polite">
      <h2>Loading active cars</h2>
      <p>Vehicle details are coming from the current fleet service.</p>
    </div>
  );
}

function formatDateForSummary(value: string | undefined) {
  if (!value) return "Not selected";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not selected";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
