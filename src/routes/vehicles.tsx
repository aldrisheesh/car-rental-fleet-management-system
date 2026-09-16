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
  ChevronDown,
  CircleDollarSign,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VehicleCard } from "@/components/site/VehicleCard";
import finderHero from "@/assets/destinations/elyu.jpg";
import { DateRangePicker } from "@/components/site/DateRangePicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  finderEvaluationState,
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

const finderTimeOptions = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function finderDateFromDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) return undefined;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function finderTimeFromDateTimeLocal(value: string, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(value)?.[1] ?? fallback;
}

function finderDateTimeLocalForDate(date: Date, time: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time}`;
}

function formatFinderSingleDate(value: string) {
  const date = finderDateFromDateTimeLocal(value);
  if (!date) return "Select a date";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFinderTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function FindCarPage() {
  const search = Route.useSearch();
  const finderForm = finderFormFromSearch(search);
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
  const [finderDatePickerOpen, setFinderDatePickerOpen] = useState(false);
  const [finderDraftRange, setFinderDraftRange] = useState<DateRange>();
  const [finderPickupTime, setFinderPickupTime] = useState("10:00");
  const [finderReturnTime, setFinderReturnTime] = useState("18:00");
  const [finderPreferencesOpen, setFinderPreferencesOpen] = useState(false);
  const finderValuesRef = useRef<FinderFormState | null>(null);
  const evaluatedKey = useRef("");

  const finderFirstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

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
      const availabilitySearch =
        search.finderStart || search.finderEnd
          ? encodeSearch({
              finderStart: search.finderStart,
              finderEnd: search.finderEnd,
            })
          : "";
      const rows = await fetchJson<CustomerVehicle[]>(
        `/api/vehicles${availabilitySearch}`,
      );
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
  }, [search.finderEnd, search.finderStart]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const evaluateFinder = useCallback(
    async (values: FinderFormState, updateUrl: boolean) => {
      finderValuesRef.current = values;
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
        if (nextErrors.passengerCount || nextErrors.maximumBudget) {
          setFinderPreferencesOpen(true);
        }
        setRefinementOpen(true);
        setFinderFocusKey((key) => key + 1);
        return;
      }

      setFinderErrors({});
      setFinderError("");
      setFinderResponse(null);
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
        setRefinementOpen(true);
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
    // Dates are sufficient for browsing. The optional smart finder criteria
    // are only required when ranking recommendations through the API.
    if (
      values.requestedStart &&
      values.requestedEnd &&
      !values.passengerCount &&
      !values.maximumBudget
    ) {
      setFinderErrors({});
      setFinderError("");
      setFinderResponse(null);
      finderValuesRef.current = values;
      window.location.assign(
        `/vehicles${encodeSearch({
          finderStart: values.requestedStart,
          finderEnd: values.requestedEnd,
          finderDestination: values.destination.trim() || null,
        })}`,
      );
      return;
    }
    void evaluateFinder(values, true);
  }

  function openFinderDatePicker() {
    setFinderDraftRange({
      from: finderDateFromDateTimeLocal(activeFinderForm.requestedStart),
      to: finderDateFromDateTimeLocal(activeFinderForm.requestedEnd),
    });
    setFinderPickupTime(
      finderTimeFromDateTimeLocal(activeFinderForm.requestedStart, "10:00"),
    );
    setFinderReturnTime(
      finderTimeFromDateTimeLocal(activeFinderForm.requestedEnd, "18:00"),
    );
    setFinderDatePickerOpen(true);
  }

  function applyFinderDates() {
    if (!finderDraftRange?.from || !finderDraftRange.to) return;

    finderValuesRef.current = {
      ...activeFinderForm,
      requestedStart: finderDateTimeLocalForDate(
        finderDraftRange.from,
        finderPickupTime,
      ),
      requestedEnd: finderDateTimeLocalForDate(
        finderDraftRange.to,
        finderReturnTime,
      ),
    };
    setFinderErrors((current) => ({
      ...current,
      requestedStart: undefined,
      requestedEnd: undefined,
    }));
    setFinderDatePickerOpen(false);
  }

  const directVehicles = browseCategory
    ? vehicles.filter((vehicle) => vehicle.category?.name === browseCategory)
    : vehicles;
  const summaryText = hasDates
    ? `${formatDateForSummary(search.finderStart)} – ${formatDateForSummary(search.finderEnd)}`
    : "No dates selected";
  const activeFinderForm = finderValuesRef.current ?? finderForm;
  const finderState = finderEvaluationState({
    hasCompleteCriteria: hasFullFinderCriteria,
    hasResponse: Boolean(finderResponse),
    hasError: Boolean(finderError),
    hasValidationErrors: Object.keys(finderErrors).length > 0,
  });
  const finderRetryValues = finderValuesRef.current ?? finderForm;
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
    finderErrors.requestedStart || finderErrors.requestedEnd
      ? {
          id: "finder-dates",
          label: "Rental dates",
          message:
            finderErrors.requestedStart ?? finderErrors.requestedEnd ?? "",
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
      <main
        id="main-content"
        className={`finder-main finder-main--catalog${finderState === "direct-browse" ? "" : " finder-main--evaluated"}`}
      >
        <div className="customer-container">
          {finderState === "direct-browse" ? (
            <div className="finder-catalog-visual" aria-hidden="true">
              <img src={finderHero} alt="" width={1672} height={941} />
            </div>
          ) : null}
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

          {finderState === "direct-browse" ? (
            <div className="finder-heading finder-catalog-heading">
              <div>
                <p className="eyebrow">The trip desk</p>
                <h1>Where are you headed?</h1>
                <p>
                  Good trips start with the right ride. Search a destination,
                  set your dates, and we&apos;ll find the best cars for your
                  journey.
                </p>
              </div>
            </div>
          ) : null}

          {!hasFullFinderCriteria && finderState !== "direct-browse" ? (
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
            className={`finder-refinement${hasFullFinderCriteria && finderResponse ? " finder-refinement--evaluated" : ""}${finderState === "direct-browse" ? " finder-refinement--catalog" : ""}`}
            open={refinementOpen || finderState === "direct-browse"}
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
              <div className="customer-field finder-dates">
                <label className="customer-label" htmlFor="finder-dates">
                  Rental dates
                </label>
                <Popover
                  open={finderDatePickerOpen}
                  onOpenChange={(open) => {
                    if (open) openFinderDatePicker();
                    else setFinderDatePickerOpen(false);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      id="finder-dates"
                      className="finder-date-trigger"
                      type="button"
                      aria-invalid={Boolean(
                        finderErrors.requestedStart ||
                        finderErrors.requestedEnd,
                      )}
                      aria-describedby={
                        finderErrors.requestedStart || finderErrors.requestedEnd
                          ? "finder-dates-error"
                          : undefined
                      }
                      onClick={openFinderDatePicker}
                    >
                      <span className="finder-date-part">
                        <CalendarDays size={20} aria-hidden="true" />
                        <span>
                          <small>Pick-up date</small>
                          <strong>
                            {formatFinderSingleDate(
                              activeFinderForm.requestedStart,
                            )}
                          </strong>
                        </span>
                      </span>
                      <span className="finder-date-part finder-date-part--return">
                        <CalendarDays size={20} aria-hidden="true" />
                        <span>
                          <small>Drop-off date</small>
                          <strong>
                            {formatFinderSingleDate(
                              activeFinderForm.requestedEnd,
                            )}
                          </strong>
                        </span>
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="home-date-picker-popover"
                    align="start"
                    sideOffset={12}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                  >
                    <DateRangePicker
                      selected={finderDraftRange}
                      onSelect={setFinderDraftRange}
                      firstAvailableDate={finderFirstAvailableDate}
                      pickupTime={finderPickupTime}
                      returnTime={finderReturnTime}
                      onPickupTimeChange={setFinderPickupTime}
                      onReturnTimeChange={setFinderReturnTime}
                      timeOptions={finderTimeOptions}
                      formatTime={formatFinderTime}
                      pickupTimeId="finder-pickup-time"
                      returnTimeId="finder-return-time"
                      onApply={applyFinderDates}
                    />
                  </PopoverContent>
                </Popover>
                <input
                  name="requestedStart"
                  type="hidden"
                  value={activeFinderForm.requestedStart}
                />
                <input
                  name="requestedEnd"
                  type="hidden"
                  value={activeFinderForm.requestedEnd}
                />
                <FieldError
                  id="finder-dates"
                  message={
                    finderErrors.requestedStart ?? finderErrors.requestedEnd
                  }
                />
              </div>
              <div
                className={`finder-smart-preferences${finderPreferencesOpen ? " is-open" : ""}`}
              >
                <button
                  className="finder-smart-preferences-trigger"
                  type="button"
                  aria-controls="finder-smart-preferences-panel"
                  aria-expanded={finderPreferencesOpen}
                  onClick={() => setFinderPreferencesOpen((open) => !open)}
                >
                  <span className="finder-preferences-summary-copy">
                    <SlidersHorizontal size={18} aria-hidden="true" />
                    <span>
                      <strong>Tailor this trip</strong>
                      <small>Passengers, budget, vehicle preference</small>
                    </span>
                  </span>
                  <ChevronDown
                    className="finder-preferences-summary-chevron"
                    size={18}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id="finder-smart-preferences-panel"
                  className="finder-smart-preferences-panel"
                  hidden={!finderPreferencesOpen}
                >
                  <div className="customer-field finder-destination finder-preference-field">
                    <label
                      className="finder-preference-label"
                      htmlFor="finder-destination"
                    >
                      <MapPin size={16} aria-hidden="true" />
                      <span>
                        <strong>Destination</strong>
                        <small>Where are you headed?</small>
                      </span>
                    </label>
                    <input
                      id="finder-destination"
                      className="customer-input"
                      name="destination"
                      type="text"
                      maxLength={200}
                      defaultValue={finderForm.destination}
                      placeholder="Enter destination"
                      autoComplete="off"
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

                  <div className="finder-smart-preferences-grid">
                    <div className="customer-field finder-preference-field">
                      <label
                        className="finder-preference-label"
                        htmlFor="finder-passengers"
                      >
                        <Users size={16} aria-hidden="true" />
                        <span>
                          <strong>Passengers</strong>
                          <small>Number of travellers</small>
                        </span>
                      </label>
                      <input
                        id="finder-passengers"
                        className="customer-input"
                        name="passengerCount"
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        placeholder="Passenger count"
                        autoComplete="off"
                        defaultValue={finderForm.passengerCount}
                        aria-invalid={Boolean(finderErrors.passengerCount)}
                        aria-describedby={
                          finderErrors.passengerCount
                            ? "finder-passengers-error"
                            : undefined
                        }
                      />
                      <FieldError
                        id="finder-passengers"
                        message={finderErrors.passengerCount}
                      />
                    </div>

                    <div className="customer-field finder-preference-field">
                      <label
                        className="finder-preference-label"
                        htmlFor="finder-budget"
                      >
                        <CircleDollarSign size={16} aria-hidden="true" />
                        <span>
                          <strong>Total rental budget</strong>
                          <small>Maximum budget in PHP</small>
                        </span>
                      </label>
                      <input
                        id="finder-budget"
                        className="customer-input"
                        name="maximumBudget"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="Budget in PHP"
                        autoComplete="off"
                        defaultValue={finderForm.maximumBudget}
                        aria-invalid={Boolean(finderErrors.maximumBudget)}
                        aria-describedby={
                          finderErrors.maximumBudget
                            ? "finder-budget-error"
                            : undefined
                        }
                      />
                      <FieldError
                        id="finder-budget"
                        message={finderErrors.maximumBudget}
                      />
                    </div>

                    <div className="customer-field finder-preference-field">
                      <label
                        className="finder-preference-label"
                        htmlFor="finder-category"
                      >
                        <CarFront size={16} aria-hidden="true" />
                        <span>
                          <strong>Vehicle preference</strong>
                          <small>Optional category</small>
                        </span>
                      </label>
                      <span className="finder-preference-select">
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
                        <ChevronDown size={17} aria-hidden="true" />
                      </span>
                      <FieldError
                        id="finder-category"
                        message={finderErrors.preferredCategory}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {finderState !== "direct-browse" ? (
                <ErrorSummary
                  errors={finderSummaryErrors}
                  focusKey={finderFocusKey}
                />
              ) : null}
              <div className="finder-refinement-actions">
                <button
                  className="customer-primary-button"
                  type="submit"
                  disabled={finderLoading}
                  aria-label={
                    finderLoading
                      ? "Finding matching cars"
                      : "See available cars"
                  }
                >
                  {finderLoading ? (
                    <RefreshCw
                      className="animate-spin"
                      size={17}
                      aria-hidden="true"
                    />
                  ) : (
                    <Search size={17} aria-hidden="true" />
                  )}
                  {finderLoading ? "Checking cars…" : "See available cars"}
                </button>
                <a className="customer-tertiary-button" href="/vehicles">
                  Clear trip criteria
                </a>
              </div>
            </form>
          </details>

          {finderState === "evaluating" ? (
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

          {finderState === "failed" ? (
            <div className="finder-empty-state">
              <StatusCallout
                tone="error"
                title="Finder evaluation failed"
                action={
                  <div className="finder-refinement-actions">
                    <button
                      className="customer-primary-button"
                      type="button"
                      onClick={() =>
                        void evaluateFinder(finderRetryValues, false)
                      }
                      disabled={finderLoading}
                    >
                      <RefreshCw size={17} aria-hidden="true" />
                      Try again
                    </button>
                    <button
                      className="customer-tertiary-button"
                      type="button"
                      onClick={() => setRefinementOpen(true)}
                    >
                      <SlidersHorizontal size={17} aria-hidden="true" />
                      Change trip
                    </button>
                  </div>
                }
              >
                {finderError ||
                  "Review the highlighted Finder details and try again."}
              </StatusCallout>
            </div>
          ) : null}

          {finderState === "evaluated" && finderResponse ? (
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
          ) : null}

          <FleetBrowseSection
            categories={categories}
            selectedCategory={browseCategory}
            onCategoryChange={setBrowseCategory}
            vehicles={vehicles}
            vehiclesLoading={vehiclesLoading}
            vehiclesError={vehiclesError}
            onRetry={() => void loadVehicles()}
            search={search}
          />
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function FleetBrowseSection({
  categories,
  selectedCategory,
  onCategoryChange,
  vehicles,
  vehiclesLoading,
  vehiclesError,
  onRetry,
  search,
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  vehicles: CustomerVehicle[];
  vehiclesLoading: boolean;
  vehiclesError: string;
  onRetry: () => void;
  search: FinderBookingSearch;
}) {
  const visibleVehicles = selectedCategory
    ? vehicles.filter((vehicle) => vehicle.category?.name === selectedCategory)
    : vehicles;
  return (
    <section
      className="finder-results-section finder-all-fleet"
      aria-labelledby="active-fleet-title"
    >
      <h2 id="active-fleet-title" className="sr-only">
        Available vehicles
      </h2>
      {vehiclesLoading ? <LoadingFleet /> : null}
      {vehiclesError ? (
        <StatusCallout
          tone="error"
          title="Fleet unavailable"
          action={
            <button
              className="customer-secondary-button"
              type="button"
              onClick={onRetry}
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
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
          {visibleVehicles.length ? (
            <div className="vehicle-grid">
              {visibleVehicles.map((vehicle) => (
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
              <p>Clear the category filter to see every active vehicle.</p>
              <button
                className="customer-secondary-button"
                type="button"
                onClick={() => onCategoryChange("")}
              >
                Show all cars
              </button>
            </div>
          )}
        </>
      ) : null}
    </section>
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
