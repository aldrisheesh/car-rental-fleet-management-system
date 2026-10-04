import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, RefreshCw } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  Rate,
  StatusCallout,
  VehicleFacts,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  dateTimeInputFromIso,
  encodeSearch,
  fetchJson,
  formatMoney,
  type CustomerVehicle,
  type FinderResponse,
} from "@/lib/customer-data";
import { calculateRentalDays } from "@/lib/rental-duration";
import {
  finderContextForSubmission,
  parseFinderDateSelection,
  parseFinderBookingHandoff,
  validateFinderBookingSearch,
} from "@/lib/finder-booking";
import { getCustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/vehicles/$vehicleId")({
  validateSearch: (search) => validateFinderBookingSearch(search),
  head: () => ({
    meta: [
      { title: "Vehicle details | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Review canonical vehicle details before sending a rental request.",
      },
    ],
  }),
  component: VehicleDetailPage,
});

function formatTripDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTripTime(value: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "Time not selected";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}

function VehicleDetailSkeleton() {
  return (
    <div
      className="detail-layout vehicle-detail-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading vehicle details"
    >
      <span className="sr-only">Loading vehicle details</span>
      <section className="detail-gallery" aria-hidden="true">
        <i className="vehicle-detail-skeleton__image" />
        <i className="vehicle-detail-skeleton__thumb" />
      </section>
      <section className="detail-panel" aria-hidden="true">
        <div className="vehicle-detail-skeleton__heading">
          <i />
          <i />
          <i />
        </div>
        <div className="vehicle-detail-skeleton__facts">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <i />
              <i />
            </div>
          ))}
        </div>
        <div className="vehicle-detail-skeleton__trip">
          <i />
          <span>
            <i />
            <i />
          </span>
        </div>
        <i className="vehicle-detail-skeleton__action" />
      </section>
    </div>
  );
}

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const search = Route.useSearch();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [finderStatus, setFinderStatus] = useState<
    "idle" | "checking" | "matched" | "stale" | "error"
  >("idle");
  const [activeImage, setActiveImage] = useState(0);
  const finderKey = useRef("");

  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null;
  const galleryImages = useMemo(() => {
    if (!vehicle) return [];
    const images = vehicle.images?.length
      ? [...vehicle.images]
      : vehicle.image_url
        ? [{ id: "cover", public_url: vehicle.image_url, is_cover: true }]
        : [];
    return images.sort(
      (left, right) =>
        Number(Boolean(right.is_cover)) - Number(Boolean(left.is_cover)),
    );
  }, [vehicle]);
  const handoff = useMemo(
    () => parseFinderBookingHandoff({ ...search, vehicle: vehicleId }),
    [search, vehicleId],
  );
  const selectedDates = useMemo(
    () => parseFinderDateSelection(search),
    [search],
  );
  const tripDates = handoff ?? selectedDates;
  const canContinue = Boolean(tripDates);

  const loadVehicle = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const availabilitySearch = tripDates
        ? encodeSearch({
            finderStart: dateTimeInputFromIso(tripDates.requestedStart),
            finderEnd: dateTimeInputFromIso(tripDates.requestedEnd),
          })
        : "";
      const rows = await fetchJson<CustomerVehicle[]>(
        `/api/vehicles${availabilitySearch}`,
      );
      setVehicles(rows);
    } catch (error) {
      setLoadError(
        error instanceof ApiRequestError
          ? error.message
          : "Vehicle details cannot be loaded right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [tripDates?.requestedEnd, tripDates?.requestedStart]);

  useEffect(() => {
    void loadVehicle();
  }, [loadVehicle]);

  useEffect(() => {
    setActiveImage(0);
  }, [vehicle?.id, galleryImages[0]?.id]);

  useEffect(() => {
    if (!handoff) {
      finderKey.current = "";
      setFinderStatus("idle");
      return;
    }
    const key = [
      handoff.selectedVehicleId,
      handoff.requestedStart,
      handoff.requestedEnd,
      handoff.passengerCount,
      handoff.largeBagCount,
      handoff.maximumBudget,
    ].join("|");
    if (finderKey.current === key) return;
    finderKey.current = key;
    setFinderStatus("checking");
    void fetchJson<FinderResponse>("/api/vehicle-finder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finderContextForSubmission(handoff)),
    })
      .then((result) => {
        const selected = result.recommendations.find(
          (item) => item.vehicleId === vehicleId,
        );
        setFinderStatus(selected ? "matched" : "stale");
      })
      .catch(() => {
        setFinderStatus("error");
      });
  }, [handoff, vehicleId]);

  const backSearch = encodeSearch({ ...search, vehicle: undefined });
  const bookingSearch = encodeSearch({ ...search, vehicle: vehicleId });
  const rentalEstimate = useMemo(() => {
    if (!tripDates || !vehicle || vehicle.daily_rate == null) return null;
    try {
      const rentalDays = calculateRentalDays(
        new Date(tripDates.requestedStart),
        new Date(tripDates.requestedEnd),
      );
      return {
        rentalDays,
        total: rentalDays * vehicle.daily_rate,
      };
    } catch {
      return null;
    }
  }, [tripDates, vehicle]);

  function continueWithVehicle() {
    if (!vehicle || !canContinue) return;
    const destination = getCustomerSession()
      ? `/booking${bookingSearch}`
      : `/sign-in${bookingSearch}`;
    window.location.assign(destination);
  }

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="detail-main">
        <div className="customer-container">
          <div className="detail-breadcrumb">
            <a href={`/vehicles${backSearch}`}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to cars
            </a>
            <span aria-hidden="true">/</span>
            <span>Vehicle details</span>
          </div>

          {loading ? (
            <VehicleDetailSkeleton />
          ) : loadError ? (
            <StatusCallout
              tone="error"
              title="Vehicle details unavailable"
              action={
                <button
                  className="customer-secondary-button"
                  type="button"
                  onClick={() => void loadVehicle()}
                >
                  <RefreshCw size={16} aria-hidden="true" /> Try again
                </button>
              }
            >
              {loadError}
            </StatusCallout>
          ) : !vehicle ? (
            <StatusCallout tone="info" title="Vehicle not found">
              This vehicle is not in the active fleet returned by the service.
              Go back to Find a Car to choose another vehicle.
            </StatusCallout>
          ) : tripDates && vehicle.is_available === false ? (
            <StatusCallout
              tone="warning"
              title="Car unavailable for your dates"
            >
              This car cannot be selected for the requested rental period. Go
              back to the available cars to choose another option.
            </StatusCallout>
          ) : (
            <div className="detail-layout">
              <section
                className="detail-gallery"
                aria-label={`${vehicle.name} images`}
              >
                <div className="detail-gallery-main">
                  <VehicleImage
                    src={
                      galleryImages[activeImage]?.public_url ??
                      vehicle.image_url
                    }
                    alt={vehicle.name}
                    priority
                    sizes="(max-width: 767px) 100vw, 58vw"
                  />
                </div>
                {galleryImages.length > 1 ? (
                  <div className="detail-gallery-thumbs">
                    {galleryImages.map((image, index) => (
                      <button
                        key={image.id}
                        className={`detail-gallery-thumb ${activeImage === index ? "is-active" : ""}`}
                        type="button"
                        aria-label={`Show ${vehicle.name} image ${index + 1}`}
                        aria-pressed={activeImage === index}
                        onClick={() => setActiveImage(index)}
                      >
                        <VehicleImage
                          src={image.public_url}
                          alt=""
                          sizes="5rem"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="detail-panel" aria-labelledby="vehicle-title">
                <div className="detail-heading">
                  <p className="detail-category">
                    {vehicle.category?.name || "Category not listed"}
                  </p>
                  <h1 id="vehicle-title">{vehicle.name}</h1>
                  <Rate value={vehicle.daily_rate} />
                  <p className="detail-intro">{vehicleFitSummary(vehicle)}</p>
                </div>

                {finderStatus === "checking" ? (
                  <StatusCallout tone="info" title="Checking your ride match">
                    The Finder context is being checked against the current
                    fleet.
                  </StatusCallout>
                ) : null}
                {finderStatus === "stale" ? (
                  <StatusCallout
                    tone="warning"
                    title="This Finder selection needs a refresh"
                  >
                    The selected vehicle no longer matches the current evaluated
                    result. You can still review its active-fleet details or
                    return to Find a Car.
                  </StatusCallout>
                ) : null}
                {finderStatus === "error" ? (
                  <StatusCallout
                    tone="warning"
                    title="Your ride match could not be refreshed"
                  >
                    The vehicle details below are current fleet data. Finder
                    reasons are hidden until the trip evaluation can be checked
                    again.
                  </StatusCallout>
                ) : null}
                <section
                  className="detail-trip-fit"
                  aria-labelledby="detail-trip-fit-title"
                >
                  <h2 id="detail-trip-fit-title">A good fit for your trip</h2>
                  <VehicleFacts vehicle={vehicle} showBranch={false} />
                </section>

                <section
                  className="detail-rental"
                  aria-labelledby="detail-rental-title"
                >
                  <h2 id="detail-rental-title">
                    <CalendarDays size={18} aria-hidden="true" /> Plan your
                    rental
                  </h2>
                  {tripDates ? (
                    <>
                      <p className="detail-rental-dates">
                        <time dateTime={tripDates.requestedStart}>
                          {formatTripDate(tripDates.requestedStart)} at{" "}
                          {formatTripTime(tripDates.requestedStart)}
                        </time>
                        <span aria-hidden="true"> to </span>
                        <time dateTime={tripDates.requestedEnd}>
                          {formatTripDate(tripDates.requestedEnd)} at{" "}
                          {formatTripTime(tripDates.requestedEnd)}
                        </time>
                      </p>
                      {rentalEstimate ? (
                        <div className="detail-rental-estimate">
                          <span>
                            {rentalEstimate.rentalDays}{" "}
                            {rentalEstimate.rentalDays === 1 ? "day" : "days"}
                          </span>
                          <p>Estimated vehicle rental</p>
                          <strong>{formatMoney(rentalEstimate.total)}</strong>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="detail-rental-empty">
                      Choose dates to see the estimated vehicle rental and
                      request this car.
                    </p>
                  )}
                  <button
                    className="customer-primary-button"
                    type="button"
                    onClick={continueWithVehicle}
                    disabled={!canContinue}
                  >
                    Request this car
                  </button>
                  {!canContinue ? (
                    <Link
                      className="customer-secondary-button detail-choose-dates"
                      to="/vehicles"
                      search={
                        {
                          ...search,
                          vehicle: undefined,
                          finderOpenDates: "true",
                        } as never
                      }
                    >
                      <CalendarDays size={16} aria-hidden="true" /> Choose dates
                    </Link>
                  ) : null}
                  <p className="detail-action-note">
                    Choose pickup or delivery when completing your request.
                  </p>
                </section>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function vehicleFitSummary(vehicle: CustomerVehicle) {
  const seats = vehicle.seat_capacity;
  const bags = vehicle.large_luggage_capacity;
  if (seats && bags != null) {
    return `Comfortably carries up to ${seats} travellers with room for ${bags} large ${bags === 1 ? "suitcase" : "suitcases"}.`;
  }
  if (seats) return `Comfortably carries up to ${seats} travellers.`;
  return "Review the rental plan to see whether this car suits your trip.";
}
