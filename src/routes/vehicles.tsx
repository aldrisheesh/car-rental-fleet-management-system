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
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
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
import { RentalDateTrigger } from "@/components/site/RentalDateTrigger";
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
import {
  isAtLeastNextManilaCalendarDay,
  manilaDateTimeLocalToInstant,
} from "@/lib/business-time";
import {
  validateFinderBookingSearch,
  type FinderBookingSearch,
} from "@/lib/finder-booking";
import { finderEvaluationState } from "@/lib/finder-presentation";

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

function availabilityDateTimeFromSearch(value: string | undefined) {
  if (!value) return undefined;
  // Catalog availability accepts Manila datetime-local values. Preserve those
  // values verbatim, while translating older links that carried UTC ISO time.
  return manilaDateTimeLocalToInstant(value)
    ? value
    : dateTimeInputFromIso(value) || undefined;
}

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

function finderTimeFromDateTimeLocal(value: string) {
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? "";
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
  const navigate = useNavigate();
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
  const [finderPickupTime, setFinderPickupTime] = useState("");
  const [finderReturnTime, setFinderReturnTime] = useState("");
  const [finderPreferencesOpen, setFinderPreferencesOpen] = useState(false);
  const finderValuesRef = useRef<FinderFormState | null>(null);
  const evaluatedKey = useRef("");

  const finderFirstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
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
      const availabilityStart = availabilityDateTimeFromSearch(
        search.finderStart,
      );
      const availabilityEnd = availabilityDateTimeFromSearch(search.finderEnd);
      const availabilitySearch =
        availabilityStart || availabilityEnd
          ? encodeSearch({
              finderStart: availabilityStart,
              finderEnd: availabilityEnd,
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
      } else if (start && !isAtLeastNextManilaCalendarDay(start)) {
        nextErrors.requestedStart =
          "Choose a rental start date at least one calendar day ahead. Same-day booking is not available.";
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
          void navigate({
            to: "/vehicles",
            search: {
              finderStart: result.criteria.requestedStart,
              finderEnd: result.criteria.requestedEnd,
              finderPassengers: result.criteria.passengerCount,
              finderBudget: result.criteria.maximumBudget,
              finderCategory: result.criteria.preferredCategory,
              finderDestination: result.criteria.destination,
              finderIntent: "trip",
            } as never,
          });
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
    [navigate],
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

    // The date picker is the only supported way to set a rental period here.
    // Treat an incomplete period as a request to choose dates, rather than an
    // inline form error that leaves the customer at a dead end.
    if (!values.requestedStart || !values.requestedEnd) {
      setFinderErrors((current) => ({
        ...current,
        requestedStart: undefined,
        requestedEnd: undefined,
      }));
      setFinderError("");
      openFinderDatePicker();
      return;
    }

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
      void navigate({
        to: "/vehicles",
        search: {
          finderStart: values.requestedStart,
          finderEnd: values.requestedEnd,
          finderDestination: values.destination.trim() || null,
          finderIntent: "trip",
        } as never,
      });
      return;
    }
    void evaluateFinder(values, true);
  }

  function openFinderDatePicker() {
    const pickupDate = finderDateFromDateTimeLocal(
      activeFinderForm.requestedStart,
    );
    const returnDate = finderDateFromDateTimeLocal(
      activeFinderForm.requestedEnd,
    );
    const hasBookableRange =
      pickupDate &&
      returnDate &&
      pickupDate >= finderFirstAvailableDate &&
      returnDate >= finderFirstAvailableDate;

    setFinderDraftRange(
      hasBookableRange ? { from: pickupDate, to: returnDate } : undefined,
    );
    setFinderPickupTime("");
    setFinderReturnTime("");
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

  const activeFinderForm = finderValuesRef.current ?? finderForm;
  const finderState = finderEvaluationState({
    hasCompleteCriteria: hasFullFinderCriteria,
    hasResponse: Boolean(finderResponse),
    hasError: Boolean(finderError),
    hasValidationErrors: Object.keys(finderErrors).length > 0,
  });
  // The Trip Desk catalog is the canonical browse surface for both date-only
  // availability and the optional preference-based Finder result. The Finder
  // response narrows the same catalog rather than swapping in an older page.
  const finderViewState = "direct-browse";
  const finderRetryValues = finderValuesRef.current ?? finderForm;
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
        className={`finder-main finder-main--catalog${finderViewState === "direct-browse" ? "" : " finder-main--evaluated"}`}
      >
        <div className="customer-container">
          {finderViewState === "direct-browse" ? (
            <div className="finder-catalog-visual" aria-hidden="true">
              <img src={finderHero} alt="" width={1672} height={941} />
            </div>
          ) : null}
          {finderViewState === "direct-browse" ? (
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

          <details
            id="finder-refinement"
            className={`finder-refinement${hasFullFinderCriteria && finderResponse ? " finder-refinement--evaluated" : ""}${finderViewState === "direct-browse" ? " finder-refinement--catalog" : ""}`}
            open={refinementOpen || finderViewState === "direct-browse"}
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
                    <RentalDateTrigger
                      id="finder-dates"
                      pickupValue={`${formatFinderSingleDate(
                        activeFinderForm.requestedStart,
                      )}${
                        finderTimeFromDateTimeLocal(
                          activeFinderForm.requestedStart,
                        )
                          ? ` at ${formatFinderTime(
                              finderTimeFromDateTimeLocal(
                                activeFinderForm.requestedStart,
                              ),
                            )}`
                          : ""
                      }`}
                      returnValue={`${formatFinderSingleDate(
                        activeFinderForm.requestedEnd,
                      )}${
                        finderTimeFromDateTimeLocal(
                          activeFinderForm.requestedEnd,
                        )
                          ? ` at ${formatFinderTime(
                              finderTimeFromDateTimeLocal(
                                activeFinderForm.requestedEnd,
                              ),
                            )}`
                          : ""
                      }`}
                      invalid={Boolean(
                        finderErrors.requestedStart ||
                        finderErrors.requestedEnd,
                      )}
                      describedBy={
                        finderErrors.requestedStart || finderErrors.requestedEnd
                          ? "finder-dates-error"
                          : undefined
                      }
                      onClick={openFinderDatePicker}
                    />
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
              {finderViewState !== "direct-browse" ? (
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

          {finderViewState === "direct-browse" ? (
            <FleetBrowseSection
              categories={categories}
              selectedCategory={browseCategory}
              onCategoryChange={setBrowseCategory}
              vehicles={vehicles}
              vehiclesLoading={
                vehiclesLoading ||
                (hasFullFinderCriteria && !finderResponse && !finderError)
              }
              vehiclesError={vehiclesError}
              onRetry={() => void loadVehicles()}
              search={search}
              finderResponse={finderResponse}
              hasDates={hasDates}
            />
          ) : null}
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
  finderResponse,
  hasDates,
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  vehicles: CustomerVehicle[];
  vehiclesLoading: boolean;
  vehiclesError: string;
  onRetry: () => void;
  search: FinderBookingSearch;
  finderResponse: FinderResponse | null;
  hasDates: boolean;
}) {
  const matchedVehicleIds = finderResponse
    ? new Set(finderResponse.recommendations.map((item) => item.vehicleId))
    : null;
  const finderVehicles = [...vehicles].sort((left, right) => {
    const rank = (vehicle: CustomerVehicle) => {
      if (vehicle.is_available === false) return 2;
      if (matchedVehicleIds && !matchedVehicleIds.has(vehicle.id)) return 1;
      return 0;
    };
    return rank(left) - rank(right);
  });
  const visibleVehicles = selectedCategory
    ? finderVehicles.filter(
        (vehicle) => vehicle.category?.name === selectedCategory,
      )
    : finderVehicles;
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
      {!vehiclesLoading && !vehiclesError && finderVehicles.length === 0 ? (
        <StatusCallout tone="info" title="No cars match this trip">
          {finderResponse?.noMatch?.message ??
            "Try adjusting your trip preferences or dates to see more available cars."}
        </StatusCallout>
      ) : null}
      {!vehiclesLoading && !vehiclesError && finderVehicles.length > 0 ? (
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
                  actionDisabled={
                    !hasDates ||
                    vehicle.is_available === false ||
                    Boolean(
                      matchedVehicleIds && !matchedVehicleIds.has(vehicle.id),
                    )
                  }
                  disabledActionLabel={
                    !hasDates
                      ? "Choose dates to check availability"
                      : vehicle.is_available === false
                        ? "Unavailable for your dates"
                        : "Does not match your trip"
                  }
                  availabilityUnavailable={vehicle.is_available === false}
                  tripMismatch={Boolean(
                    vehicle.is_available !== false &&
                    matchedVehicleIds &&
                    !matchedVehicleIds.has(vehicle.id),
                  )}
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
    <div
      className="finder-fleet-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading available cars"
    >
      <span className="sr-only">Loading available cars</span>
      <div className="finder-fleet-skeleton__filters" aria-hidden="true">
        <i className="finder-fleet-skeleton__filter-label" />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="vehicle-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <article className="finder-fleet-skeleton__card" key={index}>
            <i className="finder-fleet-skeleton__image" />
            <div className="finder-fleet-skeleton__body">
              <i className="finder-fleet-skeleton__title" />
              <i className="finder-fleet-skeleton__detail" />
              <i className="finder-fleet-skeleton__detail is-short" />
              <span>
                <i />
                <i />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
