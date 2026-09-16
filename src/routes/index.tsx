import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Fuel,
  Headphones,
  MapPin,
  Settings2,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import heroCar from "@/assets/home-hero-editorial.png";
import fordEverestImage from "@/assets/home-vehicle-everest.png";
import hondaCityImage from "@/assets/home-vehicle-city.png";
import toyotaViosImage from "@/assets/home-vehicle-vios.png";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CustomerPage,
} from "@/components/customer/CustomerPrimitives";
import {
  ApiRequestError,
  encodeSearch,
  fetchJson,
  type CustomerVehicle,
} from "@/lib/customer-data";
import { getClientPrincipal } from "@/lib/auth-client";
import { manilaDateTimeLocalToInstant } from "@/lib/business-time";

const featuredVehicleImages: Record<string, string> = {
  "Toyota Vios": toyotaViosImage,
  "Honda City": hondaCityImage,
  "Ford Everest": fordEverestImage,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find the right car for your trip | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Choose a car for your dates, then send a rental request for review.",
      },
    ],
  }),
  component: HomePage,
});

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

function formatDateRange(start: string, end: string) {
  const from = dateFromDateTimeLocal(start);
  const to = dateFromDateTimeLocal(end);
  if (!from || !to) return "Select your dates";
  const formatter = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function HomePage() {
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [featuredVehicles, setFeaturedVehicles] = useState<CustomerVehicle[]>(
    [],
  );
  const [featuredVehiclesLoading, setFeaturedVehiclesLoading] = useState(true);
  const [featuredVehiclesError, setFeaturedVehiclesError] = useState("");
  const featuredRailRef = useRef<HTMLDivElement>(null);

  const firstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    if (getClientPrincipal()?.role === "Customer/Renter") {
      window.location.replace("/vehicles");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchJson<CustomerVehicle[]>("/api/vehicles")
      .then((vehicles) => {
        if (cancelled) return;
        setFeaturedVehicles(vehicles);
      })
      .catch((error) => {
        if (cancelled) return;
        setFeaturedVehiclesError(
          error instanceof ApiRequestError
            ? error.message
            : "Cars cannot be loaded right now.",
        );
      })
      .finally(() => {
        if (!cancelled) setFeaturedVehiclesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function submitFinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const start = manilaDateTimeLocalToInstant(rentalStart);
    const end = manilaDateTimeLocalToInstant(rentalEnd);

    if (
      !start ||
      !end ||
      start.getTime() < Date.now() - 60_000 ||
      start >= end
    ) {
      openDatePicker();
      return;
    }

    window.location.assign(
      `/vehicles${encodeSearch({
        finderStart: start!.toISOString(),
        finderEnd: end!.toISOString(),
      })}`,
    );
  }

  function openDatePicker() {
    setDraftRange({
      from: dateFromDateTimeLocal(rentalStart),
      to: dateFromDateTimeLocal(rentalEnd),
    });
    setPickupTime(timeFromDateTimeLocal(rentalStart, "10:00"));
    setReturnTime(timeFromDateTimeLocal(rentalEnd, "18:00"));
    setDatePickerOpen(true);
  }

  function applyDates() {
    if (!draftRange?.from || !draftRange.to) return;
    setRentalStart(dateTimeLocalForDate(draftRange.from, pickupTime));
    setRentalEnd(dateTimeLocalForDate(draftRange.to, returnTime));
    setDatePickerOpen(false);
  }

  function scrollFeatured(direction: "previous" | "next") {
    const rail = featuredRailRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: (direction === "next" ? 1 : -1) * rail.clientWidth * 0.82,
      behavior: "smooth",
    });
  }

  return (
    <CustomerPage>
      <Header homeMarketing />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-visual" aria-hidden="true">
            <img
              src={heroCar}
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
            />
          </div>
          <div className="home-hero-content">
            <svg
              className="home-hero-shape"
              viewBox="0 0 1600 800"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 0H1020C935 120 920 240 970 390C1015 525 1025 665 940 800H0Z" />
            </svg>
            <div className="home-hero-paper">
              <div className="home-hero-copy">
                <p className="home-service-kicker">Manila and Rizal</p>
                <h1 id="home-title">Your trip starts with the right car.</h1>
              <p className="home-hero-lede">
                  Reliable self-drive cars for Manila, Rizal, and the road
                  between.
              </p>
              </div>
              <div className="home-search-zone">
                <form
                  className="home-search-rail"
                  onSubmit={submitFinder}
                  noValidate
                >
                  <div className="home-service-area">
                    <MapPin size={22} aria-hidden="true" />
                    <span>
                      <small>Pick-up location</small>
                      <strong>Manila, Rizal or nearby</strong>
                    </span>
                  </div>
                  <div className="home-date-field">
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={(open) => {
                      if (open) openDatePicker();
                      else setDatePickerOpen(false);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        id="rental-dates"
                        className="home-date-trigger"
                        type="button"
                        onClick={openDatePicker}
                      >
                        <CalendarDays size={20} aria-hidden="true" />
                        <span>
                          <small>Rental dates</small>
                          <strong>
                            {formatDateRange(rentalStart, rentalEnd)}
                          </strong>
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="home-date-picker-popover"
                      align="start"
                      sideOffset={12}
                      onOpenAutoFocus={(event) => event.preventDefault()}
                    >
                      <div className="home-date-picker-layout">
                        <Calendar
                          className="home-date-calendar"
                          mode="range"
                          selected={draftRange}
                          onSelect={setDraftRange}
                          numberOfMonths={2}
                          disabled={{ before: firstAvailableDate }}
                        />
                        <div className="home-date-times">
                          <p>Set your times</p>
                          <label htmlFor="pickup-time">Pickup time</label>
                          <select
                            id="pickup-time"
                            value={pickupTime}
                            onChange={(event) =>
                              setPickupTime(event.target.value)
                            }
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {formatTime(time)}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="return-time">Return time</label>
                          <select
                            id="return-time"
                            value={returnTime}
                            onChange={(event) =>
                              setReturnTime(event.target.value)
                            }
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {formatTime(time)}
                              </option>
                            ))}
                          </select>
                          <button
                            className="customer-primary-button"
                            type="button"
                            onClick={applyDates}
                            disabled={!draftRange?.from || !draftRange.to}
                          >
                            Apply dates
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  </div>
                  <button className="customer-primary-button" type="submit">
                    Find a car <ArrowRight size={20} aria-hidden="true" />
                  </button>
                </form>
                <div className="home-search-helper" aria-label="Rental assurances">
                  <span><ShieldCheck size={21} aria-hidden="true" /> Fully insured</span>
                  <span><Tag size={21} aria-hidden="true" /> Clear daily rates</span>
                  <span><Headphones size={21} aria-hidden="true" /> Support when you need it</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-featured" aria-labelledby="available-cars">
          <div className="customer-container">
            <div className="home-section-heading">
              <div>
                <h2 id="available-cars">Available Cars</h2>
                <p className="home-section-lede">
                  Popular choices for your next trip.
                </p>
                <a className="customer-link home-featured-all-link" href="/vehicles">
                  Explore all cars <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
              <div className="home-featured-actions">
                <div className="home-gallery-pager" aria-label="Fleet gallery navigation">
                  <button
                    type="button"
                    className="home-gallery-control"
                    onClick={() => scrollFeatured("previous")}
                    aria-label="Show previous cars"
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="home-gallery-control"
                    onClick={() => scrollFeatured("next")}
                    aria-label="Show next cars"
                  >
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {featuredVehiclesLoading ? (
              <p className="home-featured-status" aria-live="polite">
                Loading available cars…
              </p>
            ) : null}
            {featuredVehiclesError ? (
              <div className="home-featured-status" role="status">
                <p>{featuredVehiclesError}</p>
                <a className="customer-link" href="/vehicles">
                  Browse the fleet <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            ) : null}
            {!featuredVehiclesLoading &&
            !featuredVehiclesError &&
            featuredVehicles.length > 0 ? (
              <div ref={featuredRailRef} className="home-featured-grid">
                {featuredVehicles.map((vehicle) => (
                  <HomeVehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : null}
            {!featuredVehiclesLoading &&
            !featuredVehiclesError &&
            featuredVehicles.length === 0 ? (
              <div className="home-featured-status" role="status">
                <p>There are no cars available to browse right now.</p>
                <a className="customer-link" href="/vehicles">
                  Check the fleet <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            ) : null}
          </div>
        </section>

        <section id="rental-assurances" className="home-trust" aria-label="Rental assurances">
          <div className="customer-container home-trust-list">
            <p>
              <ShieldCheck size={22} aria-hidden="true" /> Active fleet
            </p>
            <p>
              <Tag size={22} aria-hidden="true" /> Clear daily rates
            </p>
            <p>
              <FileCheck2 size={22} aria-hidden="true" /> Booking review before
              payment
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function HomeVehicleCard({ vehicle }: { vehicle: CustomerVehicle }) {
  const image = vehicle.image_url || featuredVehicleImages[vehicle.name];

  return (
    <a
      className="home-vehicle-card"
      href={`/booking${encodeSearch({ vehicle: vehicle.id })}`}
      aria-label={`View ${vehicle.name}`}
    >
      <div className="home-vehicle-media">
        {image ? (
          <img
            src={image}
            alt={vehicle.name}
            width={1254}
            height={1254}
            loading="lazy"
            sizes="(max-width: 700px) 86vw, (max-width: 1100px) 44vw, 28vw"
          />
        ) : (
          <div className="home-vehicle-image-fallback" aria-hidden="true">
            <CarFront size={38} strokeWidth={1.4} />
          </div>
        )}
      </div>
      <div className="home-vehicle-card-body">
        <div className="home-vehicle-card-title">
          <h3>{vehicle.name}</h3>
          <p>
            {vehicle.daily_rate === null
              ? "Rate not listed"
              : new Intl.NumberFormat("en-PH", {
                  style: "currency",
                  currency: "PHP",
                  maximumFractionDigits: 0,
                }).format(vehicle.daily_rate)}
            {vehicle.daily_rate !== null ? <small>per day</small> : null}
          </p>
        </div>
        <ul
          className="home-vehicle-facts"
          aria-label={`${vehicle.name} details`}
        >
          <li>
            <Users size={17} aria-hidden="true" />
            {vehicle.seat_capacity ? `${vehicle.seat_capacity} seats` : "Seats"}
          </li>
          <li>
            <Settings2 size={17} aria-hidden="true" />
            {vehicle.transmission || "Transmission"}
          </li>
          <li>
            <Fuel size={17} aria-hidden="true" />
            {vehicle.fuel_type || "Fuel"}
          </li>
        </ul>
      </div>
    </a>
  );
}
