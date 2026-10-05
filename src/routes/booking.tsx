import { rememberBookingLoadingState } from "@/lib/booking-loading-state";
import { CategorizedField } from "@/components/booking/CategorizedField";
import { BookingPolicy } from "@/components/booking/BookingPolicy";
import { validCategory } from "@/lib/booking-categories";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CircleAlert,
  ClipboardCheck,
  FileCheck2,
  Fuel,
  Luggage,
  MapPin,
  RefreshCw,
  Settings2,
  Users,
} from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { AddressAutocomplete } from "@/components/customer/AddressAutocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomerPage,
  FieldError,
  Rate,
  RentalJourney,
  StatusCallout,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  dateTimeInputFromIso,
  encodeSearch,
  fetchJson,
  formatDateRange,
  type BookingMasterData,
  type CustomerBooking,
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
import {
  isAtLeastNextManilaCalendarDay,
  manilaDateTimeLocalToInstant,
} from "@/lib/business-time";
import { resolvedReturnLocation } from "@/lib/customer-handoff";
import {
  bookingServiceErrors,
  bookingServiceFields,
} from "@/lib/booking-service";
import {
  calculateRentalDays,
  formatRentalDuration,
} from "@/lib/rental-duration";

export const Route = createFileRoute("/booking")({
  validateSearch: (search) => validateFinderBookingSearch(search),
  head: () => ({
    meta: [
      { title: "Rental request | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Save trip details, complete requirements, then submit one rental request for review.",
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

function sameBookingDetails(left: BookingDraft, right: BookingDraft) {
  const normalize = (draft: BookingDraft) => ({
    pickupBranchId: draft.pickupBranchId,
    returnBranchId: draft.returnBranchId,
    pickupAt: draft.pickupAt,
    returnAt: draft.returnAt,
    purposeOfUse: draft.purposeOfUse.trim(),
    ...bookingServiceFields(draft),
    destination: draft.destination.trim(),
    preferredSeatCount: draft.preferredSeatCount,
  });
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function tripMoment(value: string) {
  const instant = manilaDateTimeLocalToInstant(value);
  if (!instant) return { date: "Choose dates in Find a Car", time: "—" };
  return {
    date: new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(instant),
    time: new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
    }).format(instant),
  };
}

function tripShortDate(value: string) {
  const instant = manilaDateTimeLocalToInstant(value);
  if (!instant) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(instant);
}

function tripSidebarMoment(value: string) {
  const instant = manilaDateTimeLocalToInstant(value);
  if (!instant) return "Choose dates in Find a Car";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}

function formatPhp(amount: number | null) {
  if (amount === null || !Number.isFinite(amount)) return "Rate pending";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
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
    preferredSeatCount: "",
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
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(Boolean(search.editBooking));
  const [editError, setEditError] = useState("");
  const [initialEditDraft, setInitialEditDraft] = useState<BookingDraft | null>(
    null,
  );
  const [noChangesOpen, setNoChangesOpen] = useState(false);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const draftHydrated = useRef(false);

  const vehicleId = search.vehicle ?? "";
  const editBookingId = search.editBooking;
  const isEditing = Boolean(editBookingId);
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
    if (!editBookingId || !sessionChecked) {
      if (!editBookingId) setEditLoading(false);
      return;
    }
    if (!principal || principal.role !== "Customer/Renter") {
      window.location.assign(
        `/sign-in${encodeSearch({ ...search, returnTo: "/booking" })}`,
      );
      return;
    }
    let cancelled = false;
    setEditLoading(true);
    setEditError("");
    void fetchJson<CustomerBooking[]>("/api/bookings")
      .then((bookings) => {
        if (cancelled) return;
        const booking = bookings.find((item) => item.id === editBookingId);
        if (!booking || booking.booking_status !== "Draft") {
          setEditError("This request is no longer available to edit online.");
          return;
        }
        if (booking.requested_vehicle?.id !== vehicleId) {
          setEditError("The selected car does not match this rental request.");
          return;
        }
        const pickupLocation = booking.pickup_location ?? "";
        const dropoffLocation = booking.dropoff_location ?? "";
        const initialDraft: BookingDraft = {
          pickupBranchId: booking.pickup_branch?.id ?? "",
          returnBranchId: booking.return_branch?.id ?? "",
          pickupAt: dateTimeInputFromIso(booking.pickup_at),
          returnAt: dateTimeInputFromIso(booking.return_at),
          purposeOfUse: booking.purpose_of_use ?? "",
          pickupDeliveryOption:
            booking.pickup_delivery_option === "pickup" ? "pickup" : "delivery",
          pickupLocation,
          dropoffLocation:
            pickupLocation === dropoffLocation ? "" : dropoffLocation,
          sameReturnLocation: pickupLocation === dropoffLocation,
          destination: booking.destination ?? "",
          preferredSeatCount: booking.preferred_seat_count?.toString() ?? "",
        };
        setDraft(initialDraft);
        setInitialEditDraft(initialDraft);
      })
      .catch((error) => {
        if (cancelled) return;
        setEditError(
          error instanceof ApiRequestError
            ? error.message
            : "Your request could not be loaded for editing.",
        );
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editBookingId, principal, sessionChecked, vehicleId]);

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
    if (isEditing || draftHydrated.current || typeof window === "undefined")
      return;
    draftHydrated.current = true;
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<BookingDraft>;
      setDraft((current) => ({
        ...current,
        ...parsed,
        pickupDeliveryOption:
          parsed.pickupDeliveryOption === "pickup" ? "pickup" : "delivery",
        sameReturnLocation: parsed.sameReturnLocation ?? true,
      }));
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [isEditing, storageKey]);

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

    if (!selectedVehicle)
      nextErrors.vehicle = "Choose an active vehicle before continuing.";
    if (!pickup) nextErrors.pickupAt = "Enter a valid pickup date and time.";
    if (!returned) nextErrors.returnAt = "Enter a valid return date and time.";
    if (pickup && pickup.getTime() < Date.now() - 60_000)
      nextErrors.pickupAt = "Pickup cannot be in the past.";
    else if (pickup && !isAtLeastNextManilaCalendarDay(pickup))
      nextErrors.pickupAt =
        "Choose a pickup date at least one calendar day ahead. Same-day booking is not available.";
    if (pickup && returned && returned <= pickup)
      nextErrors.returnAt = "Return must be after pickup.";
    if (!validCategory("purpose", draft.purposeOfUse))
      nextErrors.purposeOfUse =
        "Choose a purpose category and add details if you select Other.";
    Object.assign(nextErrors, bookingServiceErrors(draft));
    if (!validCategory("destination", draft.destination))
      nextErrors.destination =
        "Choose a destination area; add details for Other (200 characters maximum).";
    return nextErrors;
  }

  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDetails();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    if (
      isEditing &&
      initialEditDraft &&
      sameBookingDetails(draft, initialEditDraft)
    ) {
      setNoChangesOpen(true);
      return;
    }
    if (typeof window !== "undefined")
      window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
    setReviewAcknowledged(false);
    setReviewLoading(true);
    window.setTimeout(() => {
      setStep(2);
      setReviewLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 260);
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
    if (!reviewAcknowledged) {
      setSubmitError(
        "Read the rental guidelines and tick the acknowledgement before sending your request.",
      );
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
      ...bookingServiceFields(draft),
      destination: draft.destination.trim() || null,
      // Kept null for compatibility with existing booking records; the
      // customer form no longer asks for a seat preference.
      preferredSeatCount: null,
      finderContext:
        !isEditing && finderContextIsStillValid() && handoff
          ? finderContextForSubmission(handoff)
          : undefined,
    };
    if (!isEditing) {
      const fingerprint = JSON.stringify(payload);
      if (
        !idempotency.current ||
        idempotency.current.fingerprint !== fingerprint
      ) {
        idempotency.current = { fingerprint, key: crypto.randomUUID() };
      }
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
          ...(isEditing
            ? { action: "edit", bookingId: editBookingId }
            : { idempotencyKey: idempotency.current?.key }),
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
      if (!editBookingId)
        rememberBookingLoadingState(bookingId, "requirements-needed");
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
      <RentalJourney current="Request" />
      <main id="main-content" className="request-main">
        <div className="customer-container">
          {step === 1 ? (
            <div className="request-breadcrumb">
              <a
                href={
                  isEditing
                    ? `/bookings/${encodeURIComponent(editBookingId!)}`
                    : `/vehicles${encodeSearch({ ...search, vehicle: undefined })}`
                }
              >
                <ArrowLeft size={15} aria-hidden="true" />{" "}
                {isEditing ? "Requirements" : "Find a Car"}
              </a>
              <span aria-hidden="true">/</span>
              <span>Rental request</span>
            </div>
          ) : null}

          {masterError || (!masterLoading && !selectedVehicle) ? (
            <div className="request-heading">
              <div>
                <h1>Your trip, at a glance</h1>
                <p>
                  Add the trip details the team needs to review your request.
                </p>
              </div>
            </div>
          ) : null}

          {masterLoading || editLoading ? (
            <TripOverviewSkeleton
              delivery={draft.pickupDeliveryOption === "delivery"}
            />
          ) : masterError || editError ? (
            <StatusCallout
              tone="error"
              title={
                editError
                  ? "Request unavailable"
                  : "Request options unavailable"
              }
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
              {editError || masterError}
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
          ) : reviewLoading ? (
            <ReviewRequestSkeleton />
          ) : step === 1 ? (
            <TripOverview
              draft={draft}
              pickupArea={
                masterData?.branches.find(
                  (area) => area.id === draft.pickupBranchId,
                )?.name ?? "Selected operating area"
              }
              returnArea={
                masterData?.branches.find(
                  (area) => area.id === draft.returnBranchId,
                )?.name ?? "Selected operating area"
              }
              errors={errors}
              vehicle={selectedVehicle}
              principal={principal}
              sessionChecked={sessionChecked}
              updateDraft={updateDraft}
              onSubmit={continueToReview}
              isEditing={isEditing}
            />
          ) : (
            <div className="request-layout request-review-layout">
              <ReviewTripSidebar
                draft={draft}
                vehicle={selectedVehicle}
                pickupArea={
                  masterData?.branches.find(
                    (area) => area.id === draft.pickupBranchId,
                  )?.name ?? "Selected operating area"
                }
                returnArea={
                  masterData?.branches.find(
                    (area) => area.id === draft.returnBranchId,
                  )?.name ?? "Selected operating area"
                }
              />
              <ReviewPanel
                draft={draft}
                pickupArea={
                  masterData?.branches.find(
                    (area) => area.id === draft.pickupBranchId,
                  )?.name ?? "Selected operating area"
                }
                returnArea={
                  masterData?.branches.find(
                    (area) => area.id === draft.returnBranchId,
                  )?.name ?? "Selected operating area"
                }
                acknowledged={reviewAcknowledged}
                submitError={submitError}
                submitting={submitting}
                onAcknowledgementChange={(checked) => {
                  setReviewAcknowledged(checked);
                  setSubmitError("");
                }}
                onEdit={() => {
                  setReviewAcknowledged(false);
                  setStep(1);
                }}
                onSend={() => void sendRentalRequest()}
                isEditing={isEditing}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
      <Dialog open={noChangesOpen} onOpenChange={setNoChangesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No changes to review</DialogTitle>
            <DialogDescription>
              Your rental request is unchanged. Would you like to upload your
              requirements now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="customer-secondary-button"
              type="button"
              onClick={() => setNoChangesOpen(false)}
            >
              Keep editing
            </button>
            <button
              className="customer-primary-button"
              type="button"
              onClick={() => {
                if (editBookingId)
                  window.location.assign(
                    `/bookings/${encodeURIComponent(editBookingId)}`,
                  );
              }}
            >
              Upload requirements <ArrowRight size={17} aria-hidden="true" />
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerPage>
  );
}

function TripOverviewSkeleton({ delivery }: { delivery: boolean }) {
  return (
    <div
      className="request-overview request-overview--loading"
      role="status"
      aria-live="polite"
      aria-label="Loading rental request"
    >
      <span className="sr-only">Loading rental request</span>
      <div className="request-overview-story" aria-hidden="true">
        <header className="request-overview-intro request-overview-skeleton__intro">
          <i />
          <i />
        </header>
        <section className="request-overview-vehicle request-overview-skeleton__vehicle">
          <i className="request-overview-skeleton__photo" />
          <div className="request-overview-vehicle-info">
            <i className="request-overview-skeleton__category" />
            <i className="request-overview-skeleton__name" />
            <i className="request-overview-skeleton__rate" />
            <div className="request-overview-skeleton__specs">
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>
        <section className="request-overview-schedule request-overview-skeleton__schedule">
          <div className="request-overview-skeleton__timeline">
            <span>
              <i />
              <i />
              <i />
            </span>
            <i className="request-overview-skeleton__journey" />
            <span>
              <i />
              <i />
              <i />
            </span>
          </div>
        </section>
      </div>
      <div
        className="request-overview-form request-overview-skeleton__form"
        aria-hidden="true"
      >
        <i className="request-overview-skeleton__form-title" />
        <i className="request-overview-skeleton__form-copy" />
        <i className="request-overview-skeleton__label" />
        <div className="request-overview-skeleton__service">
          <i />
          <i />
        </div>
        {delivery ? (
          <>
            <i className="request-overview-skeleton__input" />
            <i className="request-overview-skeleton__checkbox" />
          </>
        ) : (
          <div className="request-overview-skeleton__pickup">
            <i />
            <i />
          </div>
        )}
        <i className="request-overview-skeleton__label" />
        <i className="request-overview-skeleton__input" />
        <i className="request-overview-skeleton__label" />
        <i className="request-overview-skeleton__input" />
        <i className="request-overview-skeleton__button" />
      </div>
      <section
        className="request-overview-next request-overview-skeleton__next"
        aria-hidden="true"
      >
        <i className="request-overview-skeleton__next-title" />
        <div>
          <span>
            <i />
            <i />
          </span>
          <span>
            <i />
            <i />
          </span>
          <span>
            <i />
            <i />
          </span>
        </div>
      </section>
    </div>
  );
}

function ReviewRequestSkeleton() {
  return (
    <div
      className="request-layout request-review-layout review-request-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading rental request review"
    >
      <span className="sr-only">Loading rental request review</span>
      <aside className="review-request-skeleton-sidebar" aria-hidden="true">
        <i className="review-request-skeleton-eyebrow" />
        <i className="review-request-skeleton-image" />
        <i className="review-request-skeleton-category" />
        <i className="review-request-skeleton-name" />
        <i className="review-request-skeleton-rate" />
        <div className="review-request-skeleton-specs">
          <i />
          <i />
          <i />
        </div>
        <div className="review-request-skeleton-dates">
          <i />
          <i />
        </div>
        <div className="review-request-skeleton-total">
          <i />
          <i />
          <i />
        </div>
      </aside>
      <section className="review-request-skeleton-content" aria-hidden="true">
        <i className="review-request-skeleton-kicker" />
        <i className="review-request-skeleton-title" />
        <i className="review-request-skeleton-copy" />
        <div className="review-request-skeleton-records">
          <i />
          <i />
          <i />
        </div>
        <div className="review-request-skeleton-guidelines">
          <i />
          <div>
            <i />
            <i />
          </div>
        </div>
        <i className="review-request-skeleton-acknowledgement" />
        <div className="review-request-skeleton-actions">
          <i />
          <i />
        </div>
      </section>
    </div>
  );
}

function TripOverview({
  draft,
  pickupArea,
  returnArea,
  errors,
  vehicle,
  principal,
  sessionChecked,
  updateDraft,
  onSubmit,
  isEditing,
}: {
  draft: BookingDraft;
  pickupArea: string;
  returnArea: string;
  errors: BookingErrors;
  vehicle: CustomerVehicle;
  principal: ReturnType<typeof getClientPrincipal>;
  sessionChecked: boolean;
  updateDraft: <K extends keyof BookingDraft>(
    field: K,
    value: BookingDraft[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isEditing: boolean;
}) {
  const isDelivery = draft.pickupDeliveryOption === "delivery";
  const pickup = tripMoment(draft.pickupAt);
  const returned = tripMoment(draft.returnAt);
  const pickupInstant = manilaDateTimeLocalToInstant(draft.pickupAt);
  const returnInstant = manilaDateTimeLocalToInstant(draft.returnAt);
  const duration =
    pickupInstant && returnInstant
      ? formatRentalDuration(pickupInstant, returnInstant)
      : null;
  const returnAddress = resolvedReturnLocation({
    deliveryAddress: draft.pickupLocation,
    alternateReturnAddress: draft.dropoffLocation,
    sameReturnLocation: draft.sameReturnLocation,
  });

  return (
    <div className="request-overview">
      <div className="request-overview-story">
        <header className="request-overview-intro">
          <h1>
            {isEditing ? "Edit your rental request" : "Your trip, at a glance"}
          </h1>
          <p>
            {isEditing
              ? "Update your trip details before submitting your requirements."
              : "Review your car and dates, then add the details for your rental request."}
          </p>
        </header>

        <section
          className="request-overview-vehicle"
          aria-label="Selected vehicle"
        >
          <div className="request-overview-photo">
            <VehicleImage
              src={vehicle.image_url}
              alt={vehicle.name}
              priority
              sizes="(max-width: 800px) 100vw, 38vw"
            />
          </div>
          <div className="request-overview-vehicle-info">
            <p className="request-overview-category">
              {vehicle.category?.name || "Vehicle"}
            </p>
            <h2>{vehicle.name}</h2>
            <Rate value={vehicle.daily_rate} />
            <dl className="request-overview-specs">
              <div>
                <Users size={19} aria-hidden="true" />
                <dt>Seats</dt>
                <dd>
                  {vehicle.seat_capacity
                    ? `${vehicle.seat_capacity} seats`
                    : "Not listed"}
                </dd>
              </div>
              <div>
                <Luggage size={19} aria-hidden="true" />
                <dt>Luggage</dt>
                <dd>
                  {vehicle.large_luggage_capacity
                    ? `${vehicle.large_luggage_capacity} large bag${vehicle.large_luggage_capacity === 1 ? "" : "s"}`
                    : "Not listed"}
                </dd>
              </div>
              <div>
                <Settings2 size={19} aria-hidden="true" />
                <dt>Transmission</dt>
                <dd>{vehicle.transmission || "Not listed"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="request-overview-schedule"
          aria-labelledby="trip-schedule-title"
        >
          <h2 id="trip-schedule-title" className="sr-only">
            Trip schedule
          </h2>
          <div className="request-overview-timeline">
            <div className="request-overview-stop">
              <span className="request-overview-stop-label">
                {isDelivery ? "Delivery" : "Pickup"}
              </span>
              <span className="request-overview-stop-icon" aria-hidden="true">
                <CarFront size={21} strokeWidth={2} />
              </span>
              <div className="request-overview-stop-details">
                <strong>{pickup.date}</strong>
                <span className="request-overview-stop-time">
                  {pickup.time}
                </span>
                <span className="request-overview-stop-address">
                  {isDelivery
                    ? draft.pickupLocation.trim() || "Add a delivery address"
                    : `${pickupArea} · Meeting point to be confirmed`}
                </span>
              </div>
            </div>
            <div className="request-overview-journey-line" aria-hidden="true">
              <span>{duration ?? "Trip"}</span>
              <span className="request-overview-journey-rule" />
              <small>
                {tripShortDate(draft.pickupAt)} –{" "}
                {tripShortDate(draft.returnAt)}
              </small>
            </div>
            <div className="request-overview-stop">
              <span className="request-overview-stop-label">Return</span>
              <span className="request-overview-stop-icon" aria-hidden="true">
                <CarFront size={21} strokeWidth={2} />
              </span>
              <div className="request-overview-stop-details">
                <strong>{returned.date}</strong>
                <span className="request-overview-stop-time">
                  {returned.time}
                </span>
                <span className="request-overview-stop-address">
                  {!isDelivery
                    ? `${returnArea} · Return point to be confirmed`
                    : returnAddress.trim()
                      ? `Collection at ${returnAddress.trim()}`
                      : draft.sameReturnLocation
                        ? "Same as delivery address"
                        : "Add a collection address"}
                </span>
              </div>
            </div>
          </div>
          {errors.pickupAt || errors.returnAt ? (
            <p className="request-overview-date-error" role="alert">
              {errors.pickupAt ?? errors.returnAt}{" "}
              <a href="/vehicles">Choose new dates in Find a Car</a>.
            </p>
          ) : null}
        </section>
      </div>

      <form className="request-overview-form" onSubmit={onSubmit} noValidate>
        <div className="request-overview-form-heading">
          <h2>{isEditing ? "Update your trip" : "Complete your request"}</h2>
          <p>Choose how to receive the car and tell us about your trip.</p>
        </div>
        <fieldset className="request-service-choice">
          <legend>How would you like to receive the car?</legend>
          <div className="request-service-options">
            {(
              [
                {
                  value: "pickup",
                  title: "Pick up the car",
                  detail: "Meet the team at an agreed location.",
                },
                {
                  value: "delivery",
                  title: "Have it delivered",
                  detail: "We bring the car to your address.",
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={
                  draft.pickupDeliveryOption === option.value
                    ? "is-selected"
                    : ""
                }
              >
                <input
                  type="radio"
                  name="rental-service"
                  value={option.value}
                  checked={draft.pickupDeliveryOption === option.value}
                  onChange={() =>
                    updateDraft("pickupDeliveryOption", option.value)
                  }
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {!isDelivery ? (
          <div className="request-pickup-arrangement">
            <MapPin size={18} aria-hidden="true" />
            <div>
              <strong>Pickup in {pickupArea}</strong>
              <p>
                The team will include the agreed meeting points with your quote
                before payment. Return the car to the agreed location in{" "}
                {returnArea}.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="customer-field">
              <label className="customer-label" htmlFor="pickup-location">
                Delivery address
              </label>
              <AddressAutocomplete
                id="pickup-location"
                label="Delivery address"
                value={draft.pickupLocation}
                onChange={(value) => updateDraft("pickupLocation", value)}
                error={errors.pickupLocation}
              />
              <FieldError
                id="pickup-location"
                message={errors.pickupLocation}
              />
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
                <strong>Return to the same address</strong>
                <small>We’ll collect the car at your delivery address.</small>
              </span>
            </label>
            {!draft.sameReturnLocation ? (
              <div className="customer-field">
                <label className="customer-label" htmlFor="dropoff-location">
                  Collection address
                </label>
                <AddressAutocomplete
                  id="dropoff-location"
                  label="Collection address"
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
          </>
        )}
        <CategorizedField
          id="purpose"
          label="Purpose of use"
          domain="purpose"
          customer
          value={draft.purposeOfUse}
          onChange={(value) => updateDraft("purposeOfUse", value)}
        />
        <FieldError id="purpose" message={errors.purposeOfUse} />
        <CategorizedField
          id="destination"
          label="Destination area"
          domain="destination"
          customer
          value={draft.destination}
          onChange={(value) => updateDraft("destination", value)}
        />
        <FieldError id="destination" message={errors.destination} />
        {sessionChecked && !principal ? (
          <p className="request-overview-signin">
            You can fill in the details now. Sign in before saving your request.
          </p>
        ) : null}
        <div className="request-overview-form-action">
          <button className="customer-primary-button" type="submit">
            {isEditing ? "Review changes" : "Review rental request"}{" "}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
      <section
        className="request-overview-next"
        aria-labelledby="request-next-title"
      >
        <h2 id="request-next-title">What happens next?</h2>
        <ol>
          <li>
            <ClipboardCheck size={27} aria-hidden="true" />
            <div>
              <strong>Review your request</strong>
              <p>Check these details before saving.</p>
            </div>
          </li>
          <li>
            <FileCheck2 size={27} aria-hidden="true" />
            <div>
              <strong>Complete requirements</strong>
              <p>Submit the required documents for review.</p>
            </div>
          </li>
          <li>
            <CalendarDays size={27} aria-hidden="true" />
            <div>
              <strong>Track its status</strong>
              <p>Check My Bookings for updates and next steps.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}

function ReviewTripSidebar({
  draft,
  pickupArea,
  returnArea,
  vehicle,
}: {
  draft: BookingDraft;
  pickupArea: string;
  returnArea: string;
  vehicle: CustomerVehicle;
}) {
  const isDelivery = draft.pickupDeliveryOption === "delivery";
  const pickup = manilaDateTimeLocalToInstant(draft.pickupAt);
  const returned = manilaDateTimeLocalToInstant(draft.returnAt);
  const rentalDays =
    pickup && returned ? calculateRentalDays(pickup, returned) : null;
  const dailyRate =
    typeof vehicle.daily_rate === "number" &&
    Number.isFinite(vehicle.daily_rate) &&
    vehicle.daily_rate >= 0
      ? vehicle.daily_rate
      : null;
  const baseRentalTotal =
    rentalDays !== null && dailyRate !== null ? rentalDays * dailyRate : null;
  const returnLocation = resolvedReturnLocation({
    deliveryAddress: draft.pickupLocation,
    alternateReturnAddress: draft.dropoffLocation,
    sameReturnLocation: draft.sameReturnLocation,
  });

  return (
    <aside className="review-trip-sidebar" aria-labelledby="review-trip-title">
      <p className="review-trip-sidebar-eyebrow">Your rental</p>
      <div className="review-trip-sidebar-image">
        <VehicleImage
          src={vehicle.image_url}
          alt={vehicle.name}
          sizes="(max-width: 900px) 100vw, 26vw"
        />
      </div>
      <div className="review-trip-sidebar-identity">
        <p>{vehicle.category?.name || "Vehicle"}</p>
        <h2 id="review-trip-title">{vehicle.name}</h2>
        <strong>
          {formatPhp(dailyRate)} <small>/ day</small>
        </strong>
      </div>
      <dl className="review-trip-sidebar-specs">
        <div>
          <dt>Seats</dt>
          <dd>
            {vehicle.seat_capacity ? `${vehicle.seat_capacity} seats` : "—"}
          </dd>
        </div>
        <div>
          <dt>Luggage</dt>
          <dd>
            {vehicle.large_luggage_capacity
              ? `${vehicle.large_luggage_capacity} large bag${vehicle.large_luggage_capacity === 1 ? "" : "s"}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Transmission</dt>
          <dd>{vehicle.transmission || "—"}</dd>
        </div>
      </dl>
      <div className="review-trip-sidebar-dates">
        <div>
          <span>{isDelivery ? "Delivery" : "Pickup"}</span>
          <strong>{tripSidebarMoment(draft.pickupAt)}</strong>
          <small>
            {isDelivery
              ? draft.pickupLocation
              : `${pickupArea} · Meeting point to be confirmed`}
          </small>
        </div>
        <div>
          <span>Return</span>
          <strong>{tripSidebarMoment(draft.returnAt)}</strong>
          <small>
            {isDelivery
              ? returnLocation
              : `${returnArea} · Agreed return location`}
          </small>
        </div>
      </div>
      <div className="review-trip-sidebar-total">
        <span>Estimated vehicle rental</span>
        <strong>{formatPhp(baseRentalTotal)}</strong>
        <small>
          {rentalDays === null
            ? "Rental period pending"
            : `${rentalDays} day${rentalDays === 1 ? "" : "s"}`}{" "}
          · listed daily rate
        </small>
      </div>
      <p className="review-trip-sidebar-note">
        {isDelivery
          ? "Delivery and other charges are confirmed before payment."
          : "Pickup arrangements and any other charges are confirmed before payment."}
      </p>
    </aside>
  );
}

function ReviewPanel({
  draft,
  pickupArea,
  returnArea,
  acknowledged,
  submitError,
  submitting,
  onAcknowledgementChange,
  onEdit,
  onSend,
  isEditing,
}: {
  draft: BookingDraft;
  pickupArea: string;
  returnArea: string;
  acknowledged: boolean;
  submitError: string;
  submitting: boolean;
  onAcknowledgementChange: (checked: boolean) => void;
  onEdit: () => void;
  onSend: () => void;
  isEditing: boolean;
}) {
  const isDelivery = draft.pickupDeliveryOption === "delivery";
  const returnLocation = resolvedReturnLocation({
    deliveryAddress: draft.pickupLocation,
    alternateReturnAddress: draft.dropoffLocation,
    sameReturnLocation: draft.sameReturnLocation,
  });

  return (
    <section
      className="request-form request-review"
      aria-labelledby="review-title"
    >
      <header className="request-review-header">
        <p>One last check</p>
        <h2 id="review-title">
          {isEditing ? "Review your changes" : "Review your rental request"}
        </h2>
        <span>
          Confirm your trip details, then acknowledge the rental guidelines
          before {isEditing ? "saving your changes." : "sending your request."}
        </span>
      </header>

      <div className="request-review-records">
        <section className="request-review-record">
          <div className="request-review-record-icon">
            <CarFront size={19} aria-hidden="true" />
          </div>
          <div>
            <h3>{isDelivery ? "Delivery" : "Pickup"}</h3>
            <p>
              {tripMoment(draft.pickupAt).date} at{" "}
              {tripMoment(draft.pickupAt).time}
            </p>
            <small>
              {isDelivery
                ? draft.pickupLocation
                : `${pickupArea} · Meeting point to be confirmed by the team`}
            </small>
          </div>
          <button className="review-edit-link" type="button" onClick={onEdit}>
            Edit
          </button>
        </section>
        <section className="request-review-record">
          <div className="request-review-record-icon">
            <RefreshCw size={18} aria-hidden="true" />
          </div>
          <div>
            <h3>Return</h3>
            <p>
              {tripMoment(draft.returnAt).date} at{" "}
              {tripMoment(draft.returnAt).time}
            </p>
            <small>
              {isDelivery
                ? returnLocation
                : `${returnArea} · Agreed return location`}
            </small>
          </div>
          <button className="review-edit-link" type="button" onClick={onEdit}>
            Edit
          </button>
        </section>
        <section className="request-review-record request-review-record--purpose">
          <div className="request-review-record-icon">
            <ClipboardCheck size={19} aria-hidden="true" />
          </div>
          <div>
            <h3>Purpose of use</h3>
            <p>{draft.purposeOfUse}</p>
            {draft.destination ? (
              <small>Destination: {draft.destination}</small>
            ) : null}
          </div>
          <button className="review-edit-link" type="button" onClick={onEdit}>
            Edit
          </button>
        </section>
      </div>

      <section
        className="request-review-guidelines"
        aria-labelledby="rental-guidelines-title"
      >
        <div className="request-review-guidelines-heading">
          <div>
            <p>Before you send</p>
            <h3 id="rental-guidelines-title">Rental guidelines</h3>
          </div>
          <span>For a smooth rental</span>
        </div>
        <div className="request-review-guidelines-grid">
          <section className="request-review-guideline request-review-guideline--do">
            <div>
              <BadgeCheck size={20} aria-hidden="true" />
              <h4>Please do</h4>
            </div>
            <ul>
              <li>
                <BadgeCheck size={16} aria-hidden="true" />
                Bring your valid IDs and driver’s license.
              </li>
              <li>
                <BadgeCheck size={16} aria-hidden="true" />
                Use the vehicle only for lawful personal travel.
              </li>
              <li>
                <BadgeCheck size={16} aria-hidden="true" />
                Report any accident or damage right away.
              </li>
              <li>
                <BadgeCheck size={16} aria-hidden="true" />
                Return it clean and at the agreed fuel level.
              </li>
            </ul>
          </section>
          <section className="request-review-guideline request-review-guideline--avoid">
            <div>
              <CircleAlert size={20} aria-hidden="true" />
              <h4>Please avoid</h4>
            </div>
            <ul>
              <li>
                <CircleAlert size={16} aria-hidden="true" />
                Smoking, racing, towing, or off-road driving.
              </li>
              <li>
                <CircleAlert size={16} aria-hidden="true" />
                Subleasing or letting unregistered drivers use it.
              </li>
              <li>
                <CircleAlert size={16} aria-hidden="true" />
                Returning late without contacting Briah.
              </li>
              <li>
                <CircleAlert size={16} aria-hidden="true" />
                Removing or altering vehicle accessories.
              </li>
            </ul>
          </section>
        </div>
      </section>

      {submitError ? (
        <StatusCallout tone="error" title="Rental request not saved">
          {submitError}
        </StatusCallout>
      ) : null}
      <BookingPolicy />
      <label className="request-review-acknowledgement">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => onAcknowledgementChange(event.target.checked)}
        />
        <span>
          <strong>
            I have read and understand the rental guidelines and cancellation
            policy.
          </strong>
        </span>
      </label>
      <p className="request-review-next-step">
        {isEditing
          ? "Saving keeps this request in draft so you can continue with your requirements."
          : "After sending, you can complete your requirements. Briah reviews the request once the required documents are received."}
      </p>
      <div className="request-actions request-review-actions">
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
          disabled={submitting || !acknowledged}
        >
          {submitting ? (
            <RefreshCw className="animate-spin" size={17} aria-hidden="true" />
          ) : null}
          {submitting
            ? isEditing
              ? "Saving changes…"
              : "Sending request…"
            : isEditing
              ? "Save changes"
              : "Send rental request"}
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
