import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, RefreshCw } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  FinderReasons,
  FinderRationale,
  Rate,
  StatusCallout,
  VehicleFacts,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  encodeSearch,
  fetchJson,
  formatDateRange,
  type CustomerVehicle,
  type FinderResponse,
} from "@/lib/customer-data";
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

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const search = Route.useSearch();
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [finderStatus, setFinderStatus] = useState<
    "idle" | "checking" | "matched" | "stale" | "error"
  >("idle");
  const [finderResponse, setFinderResponse] = useState<FinderResponse | null>(
    null,
  );
  const [activeImage, setActiveImage] = useState(0);
  const finderKey = useRef("");

  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null;
  const handoff = useMemo(
    () => parseFinderBookingHandoff({ ...search, vehicle: vehicleId }),
    [search, vehicleId],
  );
  const selectedDates = useMemo(
    () => parseFinderDateSelection(search),
    [search],
  );
  const tripDates = handoff ?? selectedDates;
  const hasEvaluatedContext = Boolean(handoff);

  async function loadVehicle() {
    setLoading(true);
    setLoadError("");
    try {
      const rows = await fetchJson<CustomerVehicle[]>("/api/vehicles");
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
  }

  useEffect(() => {
    void loadVehicle();
  }, []);

  useEffect(() => {
    if (!handoff) {
      finderKey.current = "";
      setFinderResponse(null);
      setFinderStatus("idle");
      return;
    }
    const key = [
      handoff.selectedVehicleId,
      handoff.requestedStart,
      handoff.requestedEnd,
      handoff.passengerCount,
      handoff.maximumBudget,
      handoff.preferredCategory,
      handoff.destination,
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
        setFinderResponse(result);
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
  const matchedRecommendation = finderResponse?.recommendations.find(
    (item) => item.vehicleId === vehicleId,
  );

  function continueWithVehicle() {
    if (!vehicle) return;
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
            <div
              className="finder-empty-state"
              role="status"
              aria-live="polite"
            >
              <h1>Loading vehicle details</h1>
              <p>The selected vehicle is being loaded from the active fleet.</p>
            </div>
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
          ) : (
            <div className="detail-layout">
              <section
                className="detail-gallery"
                aria-label={`${vehicle.name} images`}
              >
                <div className="detail-gallery-main">
                  <VehicleImage
                    src={vehicle.image_url}
                    alt={vehicle.name}
                    priority
                    sizes="(max-width: 767px) 100vw, 58vw"
                  />
                </div>
                <div className="detail-gallery-thumbs">
                  <button
                    className={`detail-gallery-thumb ${activeImage === 0 ? "is-active" : ""}`}
                    type="button"
                    aria-label={`Show ${vehicle.name} image`}
                    aria-pressed={activeImage === 0}
                    onClick={() => setActiveImage(0)}
                  >
                    <VehicleImage src={vehicle.image_url} alt="" sizes="5rem" />
                  </button>
                </div>
              </section>

              <section className="detail-panel" aria-labelledby="vehicle-title">
                <div className="detail-heading">
                  <p className="detail-category">
                    {vehicle.category?.name || "Category not listed"}
                  </p>
                  <h1 id="vehicle-title">{vehicle.name}</h1>
                  <Rate value={vehicle.daily_rate} />
                </div>

                {finderStatus === "checking" ? (
                  <StatusCallout tone="info" title="Checking your trip fit">
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
                    title="Trip fit could not be refreshed"
                  >
                    The vehicle details below are current fleet data. Finder
                    reasons are hidden until the trip evaluation can be checked
                    again.
                  </StatusCallout>
                ) : null}
                {matchedRecommendation ? (
                  <FinderReasons
                    reasons={matchedRecommendation.reasons.slice(0, 1)}
                  />
                ) : null}

                <VehicleFacts vehicle={vehicle} />

                <div className="detail-context">
                  <h2>
                    <CalendarDays size={17} aria-hidden="true" /> Your trip
                  </h2>
                  {tripDates ? (
                    <>
                      <div
                        className="detail-trip-dates"
                        aria-label={`Trip dates: ${formatDateRange(
                          tripDates.requestedStart,
                          tripDates.requestedEnd,
                        )}`}
                      >
                        <time dateTime={tripDates.requestedStart}>
                          <span>Pick-up</span>
                          <strong>
                            {formatTripDate(tripDates.requestedStart)}
                          </strong>
                        </time>
                        <span
                          className="detail-trip-dates-divider"
                          aria-hidden="true"
                        />
                        <time dateTime={tripDates.requestedEnd}>
                          <span>Return</span>
                          <strong>
                            {formatTripDate(tripDates.requestedEnd)}
                          </strong>
                        </time>
                      </div>
                      {handoff ? (
                        <p className="detail-trip-meta">
                          {handoff.passengerCount}{" "}
                          {handoff.passengerCount === 1
                            ? "passenger"
                            : "passengers"}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p>
                      No trip dates selected yet. You can continue with this car
                      and add the request details next.
                    </p>
                  )}
                </div>

                <div className="detail-action-panel detail-action-panel-desktop">
                  <button
                    className="customer-primary-button"
                    type="button"
                    onClick={continueWithVehicle}
                  >
                    Continue with this car
                  </button>
                  <p className="detail-action-note">
                    Your selection is not a reservation until you send a rental
                    request.
                  </p>
                </div>
              </section>
            </div>
          )}
          {matchedRecommendation ? (
            <FinderRationale reasons={matchedRecommendation.reasons} />
          ) : null}
          {vehicle ? (
            <div className="detail-action-panel detail-action-panel-mobile">
              <button
                className="customer-primary-button"
                type="button"
                onClick={continueWithVehicle}
              >
                Continue with this car
              </button>
              <p className="detail-action-note">
                Your selection is not a reservation until you send a rental
                request.
              </p>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
