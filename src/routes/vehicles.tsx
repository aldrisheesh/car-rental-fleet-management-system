import { HANDOVER_TIMES } from "@/lib/handover-times";
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
  Luggage,
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
import { getCustomerSession } from "@/lib/customer-auth";

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
  largeBagCount: string;
  maximumBudget: string;
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
  largeBagCount: String(search.finderBags ?? ""),
  maximumBudget: String(search.finderBudget ?? ""),
});

function availabilityDateTimeFromSearch(value: string | undefined) {
  if (!value) return undefined;
  // Catalog availability accepts Manila datetime-local values. Preserve those
  // values verbatim, while translating older links that carried UTC ISO time.
  return manilaDateTimeLocalToInstant(value)
    ? value
    : dateTimeInputFromIso(value) || undefined;
}

const finderTimeOptions = HANDOVER_TIMES;

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
    search.finderBags != null &&
    search.finderBudget,
  );
  const finderKey = [
    search.finderStart,
    search.finderEnd,
    search.finderPassengers,
    search.finderBags,
    search.finderBudget,
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

  useEffect(() => {
    if (!search.finderOpenDates) return;
    setRefinementOpen(true);
    setFinderDraftRange(undefined);
    setFinderPickupTime("");
    setFinderReturnTime("");
    setFinderDatePickerOpen(true);
    void navigate({
      to: "/vehicles",
      search: { ...search, finderOpenDates: undefined } as never,
      replace: true,
    });
  }, [navigate, search]);

  const evaluateFinder = useCallback(
    async (values: FinderFormState, updateUrl: boolean) => {
      finderValuesRef.current = values;
      const nextErrors: FinderFormErrors = {};
      const start = manilaDateTimeLocalToInstant(values.requestedStart);
      const end = manilaDateTimeLocalToInstant(values.requestedEnd);
      const passengerCount = Number(values.passengerCount);
      const largeBagCount = Number(values.largeBagCount);
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
        nextErrors.passengerCount = "Enter 1–100 passengers.";
      }
      if (
        values.largeBagCount.trim().length === 0 ||
        !Number.isInteger(largeBagCount) ||
        largeBagCount < 0 ||
        largeBagCount > 100
      ) {
        nextErrors.largeBagCount = "Enter 0–100 bags.";
      }
      if (!Number.isFinite(maximumBudget) || maximumBudget <= 0) {
        nextErrors.maximumBudget = "Enter a total budget.";
      }
      if (Object.keys(nextErrors).length) {
        setFinderErrors(nextErrors);
        if (
          nextErrors.passengerCount ||
          nextErrors.largeBagCount ||
          nextErrors.maximumBudget
        ) {
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
            largeBagCount,
            maximumBudget,
          }),
        });
        setFinderResponse(result);
        if (updateUrl) {
          // This request already evaluated the criteria we are about to place
          // in the URL. Mark it before navigating so the search effect does
          // not issue a second request and temporarily clear the first result.
          evaluatedKey.current = [
            result.criteria.requestedStart,
            result.criteria.requestedEnd,
            result.criteria.passengerCount,
            result.criteria.largeBagCount,
            result.criteria.maximumBudget,
          ].join("|");
          void navigate({
            to: "/vehicles",
            search: {
              finderStart: result.criteria.requestedStart,
              finderEnd: result.criteria.requestedEnd,
              finderPassengers: result.criteria.passengerCount,
              finderBags: result.criteria.largeBagCount,
              finderBudget: result.criteria.maximumBudget,
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
      largeBagCount: String(form.get("largeBagCount") ?? ""),
      maximumBudget: String(form.get("maximumBudget") ?? ""),
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

    if (
      ![values.passengerCount, values.largeBagCount, values.maximumBudget].some(
        (value) => value.trim(),
      )
    ) {
      setFinderErrors({});
      setFinderError("");
      setFinderResponse(null);
      void navigate({
        to: "/vehicles",
        search: {
          finderStart: values.requestedStart,
          finderEnd: values.requestedEnd,
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
    setFinderPickupTime(
      hasBookableRange
        ? finderTimeFromDateTimeLocal(activeFinderForm.requestedStart)
        : "",
    );
    setFinderReturnTime(
      hasBookableRange
        ? finderTimeFromDateTimeLocal(activeFinderForm.requestedEnd)
        : "",
    );
    setFinderDatePickerOpen(true);
  }

  function applyFinderDates() {
    if (!finderDraftRange?.from || !finderDraftRange.to) return;

    const nextValues = {
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
    finderValuesRef.current = nextValues;
    setFinderErrors((current) => ({
      ...current,
      requestedStart: undefined,
      requestedEnd: undefined,
    }));
    setFinderDatePickerOpen(false);
    setFinderError("");
    setFinderResponse(null);
    void navigate({
      to: "/vehicles",
      search: {
        finderStart: nextValues.requestedStart,
        finderEnd: nextValues.requestedEnd,
        finderIntent: "trip",
      } as never,
    });
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
    finderErrors.largeBagCount
      ? {
          id: "finder-large-bags",
          label: "Large bags",
          message: finderErrors.largeBagCount,
        }
      : null,
    finderErrors.maximumBudget
      ? {
          id: "finder-budget",
          label: "Maximum budget",
          message: finderErrors.maximumBudget,
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
                <p className="eyebrow">Find Your Ride</p>
                <h1>Find the right car for your trip.</h1>
                <p>
                  Tell us who and what you&apos;re bringing. We&apos;ll match
                  you with available cars that fit your group, luggage, and
                  budget.
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
                <SlidersHorizontal size={17} aria-hidden="true" /> Find your
                ride
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
                      <strong>Find your best match</strong>
                      <small>
                        For ranked recommendations, add your group, bags &amp;
                        total budget
                      </small>
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
                  <div className="finder-smart-preferences-grid">
                    <div className="customer-field finder-preference-field">
                      <label
                        className="finder-preference-label"
                        htmlFor="finder-passengers"
                      >
                        <Users size={16} aria-hidden="true" />
                        <span>
                          <strong>Passengers</strong>
                          <small>People travelling</small>
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
                        placeholder="e.g. 4"
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
                        htmlFor="finder-large-bags"
                      >
                        <Luggage size={16} aria-hidden="true" />
                        <span>
                          <strong>Large bags</strong>
                          <small>Enter 0 if none</small>
                        </span>
                      </label>
                      <input
                        id="finder-large-bags"
                        className="customer-input"
                        name="largeBagCount"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        placeholder="e.g. 2"
                        autoComplete="off"
                        defaultValue={finderForm.largeBagCount}
                        aria-invalid={Boolean(finderErrors.largeBagCount)}
                        aria-describedby={
                          finderErrors.largeBagCount
                            ? "finder-large-bags-error"
                            : undefined
                        }
                      />
                      <FieldError
                        id="finder-large-bags"
                        message={finderErrors.largeBagCount}
                      />
                    </div>

                    <div className="customer-field finder-preference-field">
                      <label
                        className="finder-preference-label"
                        htmlFor="finder-budget"
                      >
                        <CircleDollarSign size={16} aria-hidden="true" />
                        <span>
                          <strong>Budget (₱)</strong>
                          <small>Whole rental</small>
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
                        placeholder="e.g. 5000"
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
                    finderLoading ? "Finding matching cars" : "Find my ride"
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
                  {finderLoading ? "Checking cars…" : "Find my ride"}
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
  const finderHasNoMatches = Boolean(
    finderResponse && finderResponse.recommendations.length === 0,
  );
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
      {!vehiclesLoading &&
      !vehiclesError &&
      (finderVehicles.length === 0 || finderHasNoMatches) ? (
        <div className="finder-empty-state" role="status">
          <h2>No cars fit these details</h2>
          <p>
            Try a higher total budget, fewer passengers, or different rental
            dates.
          </p>
        </div>
      ) : null}
      {!vehiclesLoading &&
      !vehiclesError &&
      finderVehicles.length > 0 &&
      !finderHasNoMatches ? (
        <>
          <CategoryFilterRail
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
          />
          {visibleVehicles.length ? (
            <div className="vehicle-grid">
              {visibleVehicles.map((vehicle) => {
                const vehicleDoesNotMatch = Boolean(
                  matchedVehicleIds && !matchedVehicleIds.has(vehicle.id),
                );
                return (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    href={`${getCustomerSession() ? "/booking" : "/sign-in"}${encodeSearch({ ...search, vehicle: vehicle.id })}`}
                    detailHref={`/vehicles/${encodeURIComponent(vehicle.id)}${encodeSearch({ ...search, vehicle: vehicle.id })}`}
                    detailDisabled={
                      vehicle.is_available === false || vehicleDoesNotMatch
                    }
                    bookingLabel="Request this car"
                    actionDisabled={
                      !hasDates ||
                      vehicle.is_available === false ||
                      Boolean(vehicleDoesNotMatch)
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
                      vehicle.is_available !== false && vehicleDoesNotMatch,
                    )}
                  />
                );
              })}
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
