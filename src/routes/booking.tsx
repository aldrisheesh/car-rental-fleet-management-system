import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  ErrorSummary,
  FieldError,
  Rate,
  RequestProgress,
  StatusCallout,
  VehicleFacts,
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
  validateFinderBookingSearch,
} from "@/lib/finder-booking";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";

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
  destination: string;
  preferredSeatCount: string;
};

type BookingErrors = Partial<Record<keyof BookingDraft | "vehicle", string>>;

function initialDraft(
  handoff: ReturnType<typeof parseFinderBookingHandoff>,
): BookingDraft {
  return {
    pickupBranchId: "",
    returnBranchId: "",
    pickupAt: handoff ? dateTimeInputFromIso(handoff.requestedStart) : "",
    returnAt: handoff ? dateTimeInputFromIso(handoff.requestedEnd) : "",
    purposeOfUse: "",
    pickupDeliveryOption: "pickup",
    pickupLocation: "",
    dropoffLocation: "",
    destination: handoff?.destination ?? "",
    preferredSeatCount: handoff ? String(handoff.passengerCount) : "",
  };
}

function RentalRequestPage() {
  const search = Route.useSearch();
  const handoff = useMemo(() => parseFinderBookingHandoff(search), [search]);
  const [masterData, setMasterData] = useState<BookingMasterData | null>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState("");
  const [draft, setDraft] = useState<BookingDraft>(() => initialDraft(handoff));
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [principal, setPrincipal] = useState(getClientPrincipal());
  const [sessionChecked, setSessionChecked] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const draftHydrated = useRef(false);

  const vehicleId = search.vehicle ?? "";
  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  const storageKey = `briahs-rental-request-draft:${vehicleId}:${search.finderStart ?? ""}`;

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
      setDraft((current) => ({ ...current, ...parsed }));
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
    if (!draft.pickupBranchId)
      nextErrors.pickupBranchId = "Choose a pickup branch.";
    if (!draft.returnBranchId)
      nextErrors.returnBranchId = "Choose a return branch.";
    if (!pickup) nextErrors.pickupAt = "Enter a valid pickup date and time.";
    if (!returned) nextErrors.returnAt = "Enter a valid return date and time.";
    if (pickup && pickup.getTime() < Date.now() - 60_000)
      nextErrors.pickupAt = "Pickup cannot be in the past.";
    if (pickup && returned && returned <= pickup)
      nextErrors.returnAt = "Return must be after pickup.";
    if (!draft.purposeOfUse.trim())
      nextErrors.purposeOfUse = "Tell us the purpose of this rental.";
    if (
      draft.pickupDeliveryOption === "delivery" &&
      !draft.pickupLocation.trim()
    )
      nextErrors.pickupLocation = "Enter the pickup location for delivery.";
    if (
      draft.pickupDeliveryOption === "delivery" &&
      !draft.dropoffLocation.trim()
    )
      nextErrors.dropoffLocation = "Enter the drop-off location for delivery.";
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
      setErrorFocusKey((key) => key + 1);
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
      setErrorFocusKey((key) => key + 1);
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
      pickupDeliveryOption: draft.pickupDeliveryOption,
      pickupLocation:
        draft.pickupDeliveryOption === "delivery"
          ? draft.pickupLocation.trim()
          : null,
      dropoffLocation:
        draft.pickupDeliveryOption === "delivery"
          ? draft.dropoffLocation.trim()
          : null,
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

  const errorSummary = [
    errors.vehicle
      ? { id: "selected-vehicle", label: "Vehicle", message: errors.vehicle }
      : null,
    errors.pickupBranchId
      ? {
          id: "pickup-branch",
          label: "Pickup branch",
          message: errors.pickupBranchId,
        }
      : null,
    errors.returnBranchId
      ? {
          id: "return-branch",
          label: "Return branch",
          message: errors.returnBranchId,
        }
      : null,
    errors.pickupAt
      ? {
          id: "pickup-at",
          label: "Pickup date and time",
          message: errors.pickupAt,
        }
      : null,
    errors.returnAt
      ? {
          id: "return-at",
          label: "Return date and time",
          message: errors.returnAt,
        }
      : null,
    errors.purposeOfUse
      ? { id: "purpose", label: "Purpose", message: errors.purposeOfUse }
      : null,
    errors.pickupLocation
      ? {
          id: "pickup-location",
          label: "Pickup location",
          message: errors.pickupLocation,
        }
      : null,
    errors.dropoffLocation
      ? {
          id: "dropoff-location",
          label: "Drop-off location",
          message: errors.dropoffLocation,
        }
      : null,
    errors.preferredSeatCount
      ? {
          id: "preferred-seats",
          label: "Preferred seats",
          message: errors.preferredSeatCount,
        }
      : null,
    errors.destination
      ? { id: "destination", label: "Destination", message: errors.destination }
      : null,
  ].filter((error): error is { id: string; label: string; message: string } =>
    Boolean(error),
  );

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
                  errorSummary={errorSummary}
                  errorFocusKey={errorFocusKey}
                  masterData={masterData}
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
  errorSummary,
  errorFocusKey,
  masterData,
  principal,
  sessionChecked,
  updateDraft,
  onSubmit,
}: {
  draft: BookingDraft;
  errors: BookingErrors;
  errorSummary: Array<{ id: string; label: string; message: string }>;
  errorFocusKey: number;
  masterData: BookingMasterData | null;
  principal: ReturnType<typeof getClientPrincipal>;
  sessionChecked: boolean;
  updateDraft: <K extends keyof BookingDraft>(
    field: K,
    value: BookingDraft[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const branches = masterData?.branches ?? [];
  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      <ErrorSummary errors={errorSummary} focusKey={errorFocusKey} />
      <fieldset className="customer-fieldset">
        <legend>
          <CalendarDays size={19} aria-hidden="true" /> Trip schedule
        </legend>
        <div className="request-form-grid">
          <div className="customer-field">
            <label className="customer-label" htmlFor="pickup-at">
              Pickup date and time
            </label>
            <input
              id="pickup-at"
              className="customer-input"
              type="datetime-local"
              value={draft.pickupAt}
              aria-invalid={Boolean(errors.pickupAt)}
              aria-describedby={errors.pickupAt ? "pickup-at-error" : undefined}
              onChange={(event) => updateDraft("pickupAt", event.target.value)}
              required
            />
            <FieldError id="pickup-at" message={errors.pickupAt} />
          </div>
          <div className="customer-field">
            <label className="customer-label" htmlFor="return-at">
              Return date and time
            </label>
            <input
              id="return-at"
              className="customer-input"
              type="datetime-local"
              value={draft.returnAt}
              aria-invalid={Boolean(errors.returnAt)}
              aria-describedby={errors.returnAt ? "return-at-error" : undefined}
              onChange={(event) => updateDraft("returnAt", event.target.value)}
              required
            />
            <FieldError id="return-at" message={errors.returnAt} />
          </div>
        </div>
      </fieldset>

      <fieldset className="customer-fieldset">
        <legend>
          <MapPin size={19} aria-hidden="true" /> Branches and handoff
        </legend>
        <div className="request-form-grid">
          <div className="customer-field">
            <label className="customer-label" htmlFor="pickup-branch">
              Pickup branch
            </label>
            <select
              id="pickup-branch"
              className="customer-select"
              value={draft.pickupBranchId}
              aria-invalid={Boolean(errors.pickupBranchId)}
              aria-describedby={
                errors.pickupBranchId ? "pickup-branch-error" : undefined
              }
              onChange={(event) =>
                updateDraft("pickupBranchId", event.target.value)
              }
              required
            >
              <option value="">Choose a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <FieldError id="pickup-branch" message={errors.pickupBranchId} />
          </div>
          <div className="customer-field">
            <label className="customer-label" htmlFor="return-branch">
              Return branch
            </label>
            <select
              id="return-branch"
              className="customer-select"
              value={draft.returnBranchId}
              aria-invalid={Boolean(errors.returnBranchId)}
              aria-describedby={
                errors.returnBranchId ? "return-branch-error" : undefined
              }
              onChange={(event) =>
                updateDraft("returnBranchId", event.target.value)
              }
              required
            >
              <option value="">Choose a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <FieldError id="return-branch" message={errors.returnBranchId} />
          </div>
        </div>
        <div className="customer-field">
          <span className="customer-label">Pickup or delivery</span>
          <div
            className="request-radio-list"
            role="radiogroup"
            aria-label="Pickup or delivery"
          >
            <label className="request-radio-option">
              <input
                type="radio"
                name="pickupDeliveryOption"
                value="pickup"
                checked={draft.pickupDeliveryOption === "pickup"}
                onChange={() => updateDraft("pickupDeliveryOption", "pickup")}
              />
              <span>Pickup at branch</span>
            </label>
            <label className="request-radio-option">
              <input
                type="radio"
                name="pickupDeliveryOption"
                value="delivery"
                checked={draft.pickupDeliveryOption === "delivery"}
                onChange={() => updateDraft("pickupDeliveryOption", "delivery")}
              />
              <span>Delivery</span>
            </label>
          </div>
        </div>
        {draft.pickupDeliveryOption === "delivery" ? (
          <div className="request-form-grid">
            <div className="customer-field">
              <label className="customer-label" htmlFor="pickup-location">
                Pickup location
              </label>
              <input
                id="pickup-location"
                className="customer-input"
                type="text"
                value={draft.pickupLocation}
                aria-invalid={Boolean(errors.pickupLocation)}
                aria-describedby={
                  errors.pickupLocation ? "pickup-location-error" : undefined
                }
                onChange={(event) =>
                  updateDraft("pickupLocation", event.target.value)
                }
                required
              />
              <FieldError
                id="pickup-location"
                message={errors.pickupLocation}
              />
            </div>
            <div className="customer-field">
              <label className="customer-label" htmlFor="dropoff-location">
                Drop-off location
              </label>
              <input
                id="dropoff-location"
                className="customer-input"
                type="text"
                value={draft.dropoffLocation}
                aria-invalid={Boolean(errors.dropoffLocation)}
                aria-describedby={
                  errors.dropoffLocation ? "dropoff-location-error" : undefined
                }
                onChange={(event) =>
                  updateDraft("dropoffLocation", event.target.value)
                }
                required
              />
              <FieldError
                id="dropoff-location"
                message={errors.dropoffLocation}
              />
            </div>
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
        <legend>Your contact context</legend>
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

      <StatusCallout tone="info" title="What happens next">
        Briah&apos;s team will review this rental request. Sending it does not
        confirm the booking.
      </StatusCallout>

      <div className="request-actions">
        <a className="customer-tertiary-button" href="/vehicles">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Find a Car
        </a>
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
      <h2 id="selected-car-title">Selected car</h2>
      <div className="request-summary-image">
        <VehicleImage
          src={vehicle.image_url}
          alt={vehicle.name}
          sizes="(max-width: 767px) 100vw, 30vw"
        />
      </div>
      <div>
        <p className="request-summary-category">
          {vehicle.category?.name || "Category not listed"}
        </p>
        <p className="request-summary-name">{vehicle.name}</p>
        <Rate value={vehicle.daily_rate} />
      </div>
      <VehicleFacts vehicle={vehicle} />
      {handoff ? (
        <p className="customer-helper">
          Selected from evaluated Finder results.
        </p>
      ) : null}
      {handoff ? (
        <p className="customer-helper">
          {formatDateRange(handoff.requestedStart, handoff.requestedEnd)}
        </p>
      ) : null}
    </aside>
  );
}
