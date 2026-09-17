import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { AddressAutocomplete } from "@/components/customer/AddressAutocomplete";
import { DateRangePicker } from "@/components/site/DateRangePicker";
import { RentalDateTrigger } from "@/components/site/RentalDateTrigger";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CustomerPage,
  FieldError,
  Rate,
  RequestProgress,
  StatusCallout,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  dateTimeInputFromIso,
  encodeSearch,
  fetchJson,
  formatDateRange,
  formatInputDateTime,
  type BookingMasterData,
  type CustomerVehicle,
} from "@/lib/customer-data";
import { getClientPrincipal, getSession } from "@/lib/auth-client";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  finderContextForSubmission,
  finderProvenanceMatchesBooking,
  parseFinderBookingHandoff,
  parseFinderDateSelection,
  validateFinderBookingSearch,
} from "@/lib/finder-booking";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";
import { resolvedReturnLocation } from "@/lib/customer-handoff";

export const Route = createFileRoute("/booking")({
  validateSearch: (search) => validateFinderBookingSearch(search),
  head: () => ({
    meta: [
      { title: "Rental request | Briah's Car Rental" },
      {
        name: "description",
        content: "Share trip details and send a rental request for review.",
      },
    ],
  }),
  component: RentalRequestPage,
});

type BookingDraft = {
  pickupBranchId: string;
  returnBranchId: string;
  pickupAt: string;
  returnAt: string;
  purposeOfUse: string;
  pickupDeliveryOption: "pickup" | "delivery";
  pickupLocation: string;
  dropoffLocation: string;
  sameReturnLocation: boolean;
  destination: string;
  preferredSeatCount: string;
};

type BookingErrors = Partial<Record<keyof BookingDraft | "vehicle", string>>;

const timeOptions = [
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

function dateFromDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function timeFromDateTimeLocal(value: string, fallback: string) {
  return /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.exec(value)?.[1] ?? fallback;
}

function dateTimeLocalForDate(date: Date, time: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time}`;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function initialDraft(
  handoff: ReturnType<typeof parseFinderBookingHandoff>,
  selectedDates: ReturnType<typeof parseFinderDateSelection>,
): BookingDraft {
  const tripDates = handoff ?? selectedDates;
  return {
    pickupBranchId: "",
    returnBranchId: "",
    pickupAt: tripDates ? dateTimeInputFromIso(tripDates.requestedStart) : "",
    returnAt: tripDates ? dateTimeInputFromIso(tripDates.requestedEnd) : "",
    purposeOfUse: "",
    pickupDeliveryOption: "delivery",
    pickupLocation: "",
    dropoffLocation: "",
    sameReturnLocation: true,
    destination: handoff?.destination ?? "",
    preferredSeatCount: handoff ? String(handoff.passengerCount) : "",
  };
}

function RentalRequestPage() {
  const search = Route.useSearch();
  const handoff = useMemo(() => parseFinderBookingHandoff(search), [search]);
  const selectedDates = useMemo(
    () => parseFinderDateSelection(search),
    [search],
  );
  const [masterData, setMasterData] = useState<BookingMasterData | null>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState("");
  const [draft, setDraft] = useState<BookingDraft>(() =>
    initialDraft(handoff, selectedDates),
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [principal, setPrincipal] = useState(getClientPrincipal());
  const [sessionChecked, setSessionChecked] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const draftHydrated = useRef(false);

  const vehicleId = search.vehicle ?? "";
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const storageKey = `briahs-rental-request-draft:${vehicleId}:${search.finderStart ?? ""}:${search.finderEnd ?? ""}`;

  async function loadBookingOptions() {
    setMasterLoading(true);
    setMasterError("");
    try {
      const [options, activeVehicles] = await Promise.all([
        fetchJson<BookingMasterData>("/api/booking-master-data"),
        fetchJson<CustomerVehicle[]>("/api/vehicles"),
      ]);
      setMasterData(options);
      setVehicles(activeVehicles);
    } catch (error) {
      setMasterError(
        error instanceof ApiRequestError
          ? error.message
          : "Booking options cannot be loaded right now.",
      );
    } finally {
      setMasterLoading(false);
    }
  }

  useEffect(() => {
    void loadBookingOptions();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSession().then((result) => {
      if (cancelled) return;
      if (result.ok) setPrincipal(result.data.principal);
      else setPrincipal(null);
      setSessionChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!masterData || !selectedVehicle) return;
    setDraft((current) => {
      const vehicleBranchId =
        selectedVehicle.branch?.id ??
        masterData.vehicles.find((item) => item.id === vehicleId)?.branch_id ??
        "";
      return {
        ...current,
        pickupBranchId: current.pickupBranchId || vehicleBranchId,
        returnBranchId: current.returnBranchId || vehicleBranchId,
      };
    });
  }, [masterData, selectedVehicle, vehicleId]);

  useEffect(() => {
    if (draftHydrated.current || typeof window === "undefined") return;
    draftHydrated.current = true;
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<BookingDraft>;
      setDraft((current) => ({
        ...current,
        ...parsed,
        pickupDeliveryOption: "delivery",
        sameReturnLocation: parsed.sameReturnLocation ?? true,
      }));
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  function updateDraft<K extends keyof BookingDraft>(
    field: K,
    value: BookingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function validateDetails() {
    const nextErrors: BookingErrors = {};
    const pickup = manilaDateTimeLocalToInstant(draft.pickupAt);
    const returned = manilaDateTimeLocalToInstant(draft.returnAt);
    const preferredSeats = draft.preferredSeatCount.trim()
      ? Number(draft.preferredSeatCount)
      : null;

    if (!selectedVehicle)
      nextErrors.vehicle = "Choose an active vehicle before continuing.";
    if (!pickup) nextErrors.pickupAt = "Enter a valid pickup date and time.";
    if (!returned) nextErrors.returnAt = "Enter a valid return date and time.";
    if (pickup && pickup.getTime() < Date.now() - 60_000)
      nextErrors.pickupAt = "Pickup cannot be in the past.";
    if (pickup && returned && returned <= pickup)
      nextErrors.returnAt = "Return must be after pickup.";
    if (!draft.purposeOfUse.trim())
      nextErrors.purposeOfUse = "Tell us the purpose of this rental.";
    if (!draft.pickupLocation.trim())
      nextErrors.pickupLocation = "Enter the delivery address.";
    if (!draft.sameReturnLocation && !draft.dropoffLocation.trim())
      nextErrors.dropoffLocation = "Enter the return address.";
    if (
      preferredSeats !== null &&
      (!Number.isInteger(preferredSeats) || preferredSeats <= 0)
    )
      nextErrors.preferredSeatCount =
        "Preferred seats must be a positive whole number.";
    if (draft.destination.length > 200)
      nextErrors.destination = "Destination must be 200 characters or fewer.";
    return nextErrors;
  }

  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDetails();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    if (typeof window !== "undefined")
      window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finderContextIsStillValid() {
    if (!handoff || !selectedVehicle) return false;
    return finderProvenanceMatchesBooking(handoff, {
      vehicleId: selectedVehicle.id,
      pickup: draft.pickupAt,
      dropoff: draft.returnAt,
      passengerCount: draft.preferredSeatCount,
      destination: draft.destination,
    });
  }

  async function sendRentalRequest() {
    const nextErrors = validateDetails();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setStep(1);
      return;
    }
    if (!selectedVehicle || !draft.pickupBranchId || !draft.returnBranchId)
      return;
    if (!getCustomerSession()) {
      if (typeof window !== "undefined")
        window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
      window.location.assign(
        `/sign-in${encodeSearch({ ...search, vehicle: selectedVehicle.id })}`,
      );
      return;
    }

    const payload = {
      requestedVehicleId: selectedVehicle.id,
      pickupBranchId: draft.pickupBranchId,
      returnBranchId: draft.returnBranchId,
      pickupAt: draft.pickupAt,
      returnAt: draft.returnAt,
      purposeOfUse: draft.purposeOfUse.trim(),
      pickupDeliveryOption: "delivery",
      pickupLocation: draft.pickupLocation.trim(),
      dropoffLocation: resolvedReturnLocation({
        deliveryAddress: draft.pickupLocation,
        alternateReturnAddress: draft.dropoffLocation,
        sameReturnLocation: draft.sameReturnLocation,
      }),
      destination: draft.destination.trim() || null,
      preferredSeatCount: draft.preferredSeatCount.trim()
        ? Number(draft.preferredSeatCount)
        : null,
      finderContext:
        finderContextIsStillValid() && handoff
          ? finderContextForSubmission(handoff)
          : undefined,
    };
    const fingerprint = JSON.stringify(payload);
    if (
      !idempotency.current ||
      idempotency.current.fingerprint !== fingerprint
    ) {
      idempotency.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await fetchJson<{
        id?: string;
        booking?: { id?: string };
      }>("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          idempotencyKey: idempotency.current.key,
        }),
      });
      const bookingId = result.id ?? result.booking?.id;
      if (!bookingId) {
        setSubmitError(
          "The request was sent, but its booking identity was not returned. Check My Bookings before trying again.",
        );
        return;
      }
      if (typeof window !== "undefined")
        window.sessionStorage.removeItem(storageKey);
      window.location.assign(`/bookings/${encodeURIComponent(bookingId)}`);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        if (typeof window !== "undefined")
          window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
        window.location.assign(
          `/sign-in${encodeSearch({ ...search, vehicle: selectedVehicle.id })}`,
        );
        return;
      }
      setSubmitError(
        error instanceof ApiRequestError
          ? error.status === 409
            ? `${error.message} Review the current request details before trying again.`
            : error.message
          : "The rental request could not be sent. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="request-main">
        <div className="customer-container">
          <div className="request-breadcrumb">
            <a
              href={
                selectedVehicle
                  ? `/vehicles/${encodeURIComponent(selectedVehicle.id)}${encodeSearch(search)}`
                  : "/vehicles"
              }
            >
              <ArrowLeft size={15} aria-hidden="true" /> Find a Car
            </a>
            <span aria-hidden="true">/</span>
            <span>Rental request</span>
          </div>

          <div className="request-heading">
            <div>
              <p className="eyebrow">Your rental request</p>
              <h1>
                {step === 1
                  ? "Tell us about your rental"
                  : "Review your rental request"}
              </h1>
              <p>
                {step === 1
                  ? "Add the trip details the team needs to review your request."
                  : "Check the details below before sending your request to Briah's team."}
              </p>
            </div>
          </div>
          <RequestProgress current={step} />

          {masterLoading ? (
            <div
              className="finder-empty-state"
              role="status"
              aria-live="polite"
            >
              <h2>Loading request options</h2>
              <p>
                Branches and vehicle details are coming from the current booking
                service.
              </p>
            </div>
          ) : masterError ? (
            <StatusCallout
              tone="error"
              title="Request options unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadBookingOptions()}
                >
                  <RefreshCw size={16} aria-hidden="true" /> Try again
                </button>
              }
            >
              {masterError}
            </StatusCallout>
          ) : !vehicleId ? (
            <StatusCallout
              tone="info"
              title="Choose a car first"
              action={
                <a className="customer-secondary-button" href="/vehicles">
                  Find a car
                </a>
              }
            >
              Your rental request must be tied to the exact vehicle you
              selected.
            </StatusCallout>
          ) : !selectedVehicle ? (
            <StatusCallout
              tone="warning"
              title="Selected car is no longer available"
              action={
                <a className="customer-secondary-button" href="/vehicles">
                  Return to Find a Car
                </a>
              }
            >
              The active fleet no longer contains this vehicle. No request has
              been created.
            </StatusCallout>
          ) : (
            <div className="request-layout">
              {step === 1 ? (
                <DetailsForm
                  draft={draft}
                  errors={errors}
                  principal={principal}
                  sessionChecked={sessionChecked}
                  updateDraft={updateDraft}
                  onSubmit={continueToReview}
                />
              ) : (
                <ReviewPanel
                  draft={draft}
                  branches={masterData?.branches ?? []}
                  handoff={handoff}
                  principal={principal}
                  submitError={submitError}
                  submitting={submitting}
                  onEdit={() => setStep(1)}
                  onSend={() => void sendRentalRequest()}
                />
              )}
              <SelectedCarSummary vehicle={selectedVehicle} handoff={handoff} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function DetailsForm({
  draft,
  errors,
  principal,
  sessionChecked,
  updateDraft,
  onSubmit,
}: {
  draft: BookingDraft;
  errors: BookingErrors;
  principal: ReturnType<typeof getClientPrincipal>;
  sessionChecked: boolean;
  updateDraft: <K extends keyof BookingDraft>(
    field: K,
    value: BookingDraft[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const [pickupTime, setPickupTime] = useState(() =>
    timeFromDateTimeLocal(draft.pickupAt, ""),
  );
  const [returnTime, setReturnTime] = useState(() =>
    timeFromDateTimeLocal(draft.returnAt, ""),
  );
  const firstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  function openDatePicker() {
    const pickupDate = dateFromDateTimeLocal(draft.pickupAt);
    const returnDate = dateFromDateTimeLocal(draft.returnAt);
    const hasBookableRange =
      pickupDate &&
      returnDate &&
      pickupDate >= firstAvailableDate &&
      returnDate >= firstAvailableDate;

    setDraftRange(
      hasBookableRange ? { from: pickupDate, to: returnDate } : undefined,
    );
    setPickupTime(
      hasBookableRange ? timeFromDateTimeLocal(draft.pickupAt, "") : "",
    );
    setReturnTime(
      hasBookableRange ? timeFromDateTimeLocal(draft.returnAt, "") : "",
    );
    setDatePickerOpen(true);
  }

  function applyDates() {
    if (!draftRange?.from || !draftRange.to) return;
    updateDraft("pickupAt", dateTimeLocalForDate(draftRange.from, pickupTime));
    updateDraft("returnAt", dateTimeLocalForDate(draftRange.to, returnTime));
    setDatePickerOpen(false);
  }

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      <fieldset className="customer-fieldset">
        <legend>
          <CalendarDays size={19} aria-hidden="true" /> Trip schedule
        </legend>
        <Popover
          open={datePickerOpen}
          onOpenChange={(open) => {
            if (open) openDatePicker();
            else setDatePickerOpen(false);
          }}
        >
          <PopoverTrigger asChild>
            <RentalDateTrigger
              id="pickup-at"
              className="request-rental-date-trigger"
              pickupValue={
                draft.pickupAt
                  ? formatInputDateTime(draft.pickupAt)
                  : "Select a date"
              }
              returnValue={
                draft.returnAt
                  ? formatInputDateTime(draft.returnAt)
                  : "Select a date"
              }
              invalid={Boolean(errors.pickupAt || errors.returnAt)}
              describedBy={
                errors.pickupAt || errors.returnAt
                  ? "pickup-at-error"
                  : undefined
              }
              onClick={openDatePicker}
            />
          </PopoverTrigger>
          <PopoverContent
            className="home-date-picker-popover"
            align="start"
            sideOffset={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <DateRangePicker
              selected={draftRange}
              onSelect={setDraftRange}
              firstAvailableDate={firstAvailableDate}
              pickupTime={pickupTime}
              returnTime={returnTime}
              onPickupTimeChange={setPickupTime}
              onReturnTimeChange={setReturnTime}
              timeOptions={timeOptions}
              formatTime={formatTime}
              pickupTimeId="booking-pickup-time"
              returnTimeId="booking-return-time"
              onApply={applyDates}
            />
          </PopoverContent>
        </Popover>
        <FieldError
          id="pickup-at"
          message={errors.pickupAt ?? errors.returnAt}
        />
      </fieldset>

      <fieldset className="customer-fieldset">
        <legend>
          <MapPin size={19} aria-hidden="true" /> Delivery &amp; return
        </legend>
        <div className="customer-field">
          <label className="customer-label" htmlFor="pickup-location">
            Where should we deliver the vehicle?
          </label>
          <AddressAutocomplete
            id="pickup-location"
            label="Where should we deliver the vehicle?"
            value={draft.pickupLocation}
            onChange={(value) => updateDraft("pickupLocation", value)}
            error={errors.pickupLocation}
          />
          <FieldError id="pickup-location" message={errors.pickupLocation} />
        </div>
        <label className="request-same-location">
          <input
            type="checkbox"
            checked={draft.sameReturnLocation}
            onChange={(event) =>
              updateDraft("sameReturnLocation", event.target.checked)
            }
          />
          <span>
            <strong>Return the vehicle to the same address</strong>
            <small>We’ll use your delivery address for collection.</small>
          </span>
        </label>
        {!draft.sameReturnLocation ? (
          <div className="customer-field">
            <label className="customer-label" htmlFor="dropoff-location">
              Where should we collect the vehicle?
            </label>
            <AddressAutocomplete
              id="dropoff-location"
              label="Where should we collect the vehicle?"
              value={draft.dropoffLocation}
              onChange={(value) => updateDraft("dropoffLocation", value)}
              error={errors.dropoffLocation}
            />
            <FieldError
              id="dropoff-location"
              message={errors.dropoffLocation}
            />
          </div>
        ) : null}
      </fieldset>

      <fieldset className="customer-fieldset">
        <legend>Tell us about the trip</legend>
        <div className="request-form-grid">
          <div className="customer-field full-span">
            <label className="customer-label" htmlFor="purpose">
              Purpose of use
            </label>
            <textarea
              id="purpose"
              className="customer-textarea"
              value={draft.purposeOfUse}
              aria-invalid={Boolean(errors.purposeOfUse)}
              aria-describedby={
                errors.purposeOfUse ? "purpose-error" : undefined
              }
              onChange={(event) =>
                updateDraft("purposeOfUse", event.target.value)
              }
              required
            />
            <FieldError id="purpose" message={errors.purposeOfUse} />
          </div>
          <div className="customer-field">
            <label className="customer-label" htmlFor="destination">
              Destination <span className="customer-helper">(optional)</span>
            </label>
            <input
              id="destination"
              className="customer-input"
              type="text"
              maxLength={200}
              value={draft.destination}
              aria-invalid={Boolean(errors.destination)}
              aria-describedby={
                errors.destination ? "destination-error" : undefined
              }
              onChange={(event) =>
                updateDraft("destination", event.target.value)
              }
            />
            <FieldError id="destination" message={errors.destination} />
          </div>
          <div className="customer-field">
            <label className="customer-label" htmlFor="preferred-seats">
              Preferred seats{" "}
              <span className="customer-helper">(optional)</span>
            </label>
            <input
              id="preferred-seats"
              className="customer-input"
              type="number"
              min="1"
              step="1"
              value={draft.preferredSeatCount}
              aria-invalid={Boolean(errors.preferredSeatCount)}
              aria-describedby={
                errors.preferredSeatCount ? "preferred-seats-error" : undefined
              }
              onChange={(event) =>
                updateDraft("preferredSeatCount", event.target.value)
              }
            />
            <FieldError
              id="preferred-seats"
              message={errors.preferredSeatCount}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="customer-fieldset">
        <legend>Your contact</legend>
        {sessionChecked && !principal ? (
          <StatusCallout tone="info" title="Sign in before you send">
            Your contact details will come from your authenticated customer
            profile. You can complete the form first.
          </StatusCallout>
        ) : null}
        <div className="request-contact">
          <div className="customer-field">
            <span className="customer-label">Name</span>
            <div className="request-readonly-value">
              {principal?.fullName ?? "Sign in to load"}
            </div>
          </div>
          <div className="customer-field">
            <span className="customer-label">Email</span>
            <div className="request-readonly-value">
              {principal?.email ?? "Sign in to load"}
            </div>
          </div>
          <div className="customer-field">
            <span className="customer-label">Phone</span>
            <div className="request-readonly-value">
              {principal?.phoneNumber ?? "Sign in to load"}
            </div>
          </div>
        </div>
      </fieldset>

      <aside className="request-review-note" role="status">
        <div>
          <strong>Review before confirmation</strong>
          <p>
            Briah&apos;s team will review this rental request. Sending it does
            not confirm the booking.
          </p>
        </div>
      </aside>

      <div className="request-actions">
        <button className="customer-primary-button" type="submit">
          Review rental request <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

function ReviewPanel({
  draft,
  branches,
  handoff,
  principal,
  submitError,
  submitting,
  onEdit,
  onSend,
}: {
  draft: BookingDraft;
  branches: BookingMasterData["branches"];
  handoff: ReturnType<typeof parseFinderBookingHandoff>;
  principal: ReturnType<typeof getClientPrincipal>;
  submitError: string;
  submitting: boolean;
  onEdit: () => void;
  onSend: () => void;
}) {
  const pickupBranchName =
    branches.find((branch) => branch.id === draft.pickupBranchId)?.name ??
    "Branch not recorded";
  const returnBranchName =
    branches.find((branch) => branch.id === draft.returnBranchId)?.name ??
    "Branch not recorded";
  const handoffDetails = [
    `Pickup branch · ${pickupBranchName}`,
    `Return branch · ${returnBranchName}`,
    `Service · ${
      draft.pickupDeliveryOption === "delivery"
        ? "Delivery"
        : "Pickup at branch"
    }`,
    ...(draft.pickupDeliveryOption === "delivery"
      ? [
          `Pickup address · ${draft.pickupLocation}`,
          `Drop-off address · ${draft.dropoffLocation}`,
        ]
      : []),
    ...(draft.destination ? [`Destination · ${draft.destination}`] : []),
  ].join("\n");

  return (
    <section className="request-form" aria-labelledby="review-title">
      <h2 id="review-title" className="sr-only">
        Review rental request details
      </h2>
      <div className="review-groups">
        <div className="review-group">
          <div className="review-group-heading">
            <h2>Trip schedule</h2>
            <button className="review-edit-link" type="button" onClick={onEdit}>
              Edit
            </button>
          </div>
          <p>
            {formatInputDateTime(draft.pickupAt)} →{" "}
            {formatInputDateTime(draft.returnAt)}
          </p>
        </div>
        <div className="review-group">
          <div className="review-group-heading">
            <h2>Branches and handoff</h2>
            <button className="review-edit-link" type="button" onClick={onEdit}>
              Edit
            </button>
          </div>
          <p>{handoffDetails}</p>
        </div>
        <div className="review-group">
          <div className="review-group-heading">
            <h2>Purpose and seats</h2>
            <button className="review-edit-link" type="button" onClick={onEdit}>
              Edit
            </button>
          </div>
          <p>
            {draft.purposeOfUse}
            {draft.preferredSeatCount
              ? `\nPreferred seats · ${draft.preferredSeatCount}`
              : ""}
          </p>
        </div>
        <div className="review-group">
          <div className="review-group-heading">
            <h2>Contact</h2>
            <button className="review-edit-link" type="button" onClick={onEdit}>
              Edit
            </button>
          </div>
          <p>
            {principal?.fullName ?? "Sign in required"}
            {principal?.email ? `\n${principal.email}` : ""}
            {principal?.phoneNumber ? `\n${principal.phoneNumber}` : ""}
          </p>
        </div>
      </div>

      {handoff ? (
        <p className="customer-helper">
          This request came from evaluated Finder results. The same trip context
          will be rechecked before submission.
        </p>
      ) : null}
      {submitError ? (
        <StatusCallout tone="error" title="Rental request not sent">
          {submitError}
        </StatusCallout>
      ) : null}
      <StatusCallout tone="info" title="Send a rental request">
        Submitting creates a rental request. It does not confirm the booking.
      </StatusCallout>
      <div className="request-actions">
        <button
          className="customer-tertiary-button"
          type="button"
          onClick={onEdit}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to request details
        </button>
        <button
          className="customer-primary-button"
          type="button"
          onClick={onSend}
          disabled={submitting}
        >
          {submitting ? (
            <RefreshCw className="animate-spin" size={17} aria-hidden="true" />
          ) : null}
          {submitting ? "Sending request…" : "Send rental request"}
        </button>
      </div>
    </section>
  );
}

function SelectedCarSummary({
  vehicle,
  handoff,
}: {
  vehicle: CustomerVehicle;
  handoff: ReturnType<typeof parseFinderBookingHandoff>;
}) {
  return (
    <aside className="request-summary" aria-labelledby="selected-car-title">
      <div className="request-summary-frame">
        <div className="request-summary-heading">
          <h2 id="selected-car-title">Selected vehicle</h2>
          {handoff ? <span>Finder match</span> : null}
        </div>
        <div className="request-summary-image">
          <VehicleImage
            src={vehicle.image_url}
            alt={vehicle.name}
            sizes="(max-width: 767px) 100vw, 30vw"
          />
          <p className="request-summary-category">
            {vehicle.category?.name || "Vehicle"}
          </p>
        </div>
        <div className="request-summary-identity">
          <p className="request-summary-name">{vehicle.name}</p>
          <Rate value={vehicle.daily_rate} />
        </div>
        <dl className="request-summary-specs">
          <div>
            <dt>Seats</dt>
            <dd>
              {vehicle.seat_capacity ? `${vehicle.seat_capacity} seats` : "—"}
            </dd>
          </div>
          <div>
            <dt>Transmission</dt>
            <dd>{vehicle.transmission || "—"}</dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>{vehicle.fuel_type || "—"}</dd>
          </div>
        </dl>
      </div>
      {handoff ? (
        <p className="request-summary-trip">
          Your trip ·{" "}
          {formatDateRange(handoff.requestedStart, handoff.requestedEnd)}
        </p>
      ) : null}
    </aside>
  );
}
