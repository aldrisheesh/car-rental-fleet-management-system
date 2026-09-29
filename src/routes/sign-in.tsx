import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { SignInDialog } from "@/components/site/SignInDialog";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";
import {
  encodeSearch,
  fetchJson,
  type CustomerVehicle,
} from "@/lib/customer-data";
import {
  validateFinderBookingSearch,
  type FinderBookingSearch,
} from "@/lib/finder-booking";

type AuthSearch = FinderBookingSearch & {
  returnTo?: string;
};

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search): AuthSearch => ({
    ...validateFinderBookingSearch(search),
    returnTo:
      typeof search.returnTo === "string" &&
      search.returnTo.startsWith("/") &&
      !search.returnTo.startsWith("//")
        ? search.returnTo
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | Briah's Car Rental" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthenticationPage,
});

function AuthenticationPage() {
  const search = Route.useSearch();
  return search.vehicle ? <SelectedCarSignIn /> : <GeneralSignIn />;
}

function GeneralSignIn() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const bookingContext = encodeSearch({
    vehicle: search.vehicle,
    finderStart: search.finderStart,
    finderEnd: search.finderEnd,
    finderPassengers: search.finderPassengers,
    finderBudget: search.finderBudget,
    finderCategory: search.finderCategory,
    finderDestination: search.finderDestination,
    finderRank: search.finderRank,
  });
  const customerDestination =
    search.returnTo ?? (search.vehicle ? `/booking${bookingContext}` : "/");

  function closeSignIn() {
    void navigate({
      to: "/vehicles",
      search: {
        ...search,
        vehicle: undefined,
        returnTo: undefined,
      } as never,
    });
  }

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="sign-in-route-main">
        <div className="sign-in-route-backdrop" aria-hidden="true">
          <div className="sign-in-route-intro">
            <span>Find a car</span>
            <h1>Choose the road ahead.</h1>
            <p>Browse a rental that fits your next trip.</p>
          </div>
          <div className="sign-in-route-cards">
            <div className="sign-in-route-card">
              <span className="sign-in-route-image sign-in-route-image--one" />
              <strong>Ford Ranger</strong>
              <small>₱3,000 / day</small>
            </div>
            <div className="sign-in-route-card">
              <span className="sign-in-route-image sign-in-route-image--two" />
              <strong>Ready for your dates</strong>
              <small>Pick-up & return details</small>
            </div>
          </div>
        </div>
      </main>
      <SignInDialog
        open
        onOpenChange={(open) => {
          if (!open) closeSignIn();
        }}
        customerSuccessTo={customerDestination}
        adminSuccessTo="/admin"
      />
    </CustomerPage>
  );
}

function SelectedCarSignIn() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [vehicle, setVehicle] = useState<CustomerVehicle | null>(null);
  const bookingContext = encodeSearch({
    vehicle: search.vehicle,
    finderStart: search.finderStart,
    finderEnd: search.finderEnd,
    finderPassengers: search.finderPassengers,
    finderBudget: search.finderBudget,
    finderCategory: search.finderCategory,
    finderDestination: search.finderDestination,
    finderRank: search.finderRank,
  });

  useEffect(() => {
    if (!search.vehicle) return;
    let cancelled = false;
    void fetchJson<CustomerVehicle[]>("/api/vehicles")
      .then((rows) => {
        if (!cancelled)
          setVehicle(rows.find((row) => row.id === search.vehicle) ?? null);
      })
      .catch(() => {
        if (!cancelled) setVehicle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [search.vehicle]);

  function returnToVehicle() {
    if (!search.vehicle) return;
    void navigate({
      to: "/vehicles/$vehicleId",
      params: { vehicleId: search.vehicle },
      search: { ...search, vehicle: undefined, returnTo: undefined } as never,
    });
  }

  return (
    <CustomerPage>
      <Header hideWordmark />
      <main id="main-content" className="auth-main harbor-booking-main">
        <div className="auth-layout harbor-booking-layout">
          <aside
            className="auth-context harbor-booking-context"
            aria-label="Selected vehicle"
          >
            {vehicle ? (
              <div className="auth-context-image">
                <VehicleImage
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  priority
                  sizes="(max-width: 767px) 100vw, 66vw"
                />
              </div>
            ) : null}
            <div className="auth-context-copy harbor-booking-context-copy">
              <h2 className="auth-context-name">
                {vehicle?.name ?? "Your rental request"}
              </h2>
              {vehicle ? (
                <div
                  className="harbor-booking-vehicle-meta"
                  aria-label="Vehicle details"
                >
                  <em>{vehicle.category?.name || "Category not listed"}</em>
                  {vehicle.seat_capacity ? (
                    <em>{vehicle.seat_capacity} seats</em>
                  ) : null}
                  {vehicle.transmission ? (
                    <em>{vehicle.transmission}</em>
                  ) : null}
                </div>
              ) : null}
              <p>
                Sign in to continue with this car and send your rental request.
              </p>
            </div>
          </aside>
          <section
            className="harbor-booking-panel harbor-booking-auth-panel"
            aria-label="Sign in or create an account"
          >
            <Link
              className="harbor-booking-back"
              to="/vehicles"
              search={
                { ...search, vehicle: undefined, returnTo: undefined } as never
              }
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back to vehicles
            </Link>
            <SignInDialog
              open
              contextual
              onOpenChange={(open) => {
                if (!open) returnToVehicle();
              }}
              customerSuccessTo={`/booking${bookingContext}`}
              adminSuccessTo="/admin"
            />
          </section>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
