import { HANDOVER_TIMES } from "@/lib/handover-times";
import {
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import {
  ArrowRight,
  CarFront,
  FileText,
  CreditCard,
  CircleCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Tag,
  Pause,
  Play,
} from "lucide-react";

import handoverPhoto from "@/assets/home-personal-handover.jpg";
import heroCar from "@/assets/home-hero-daylight.jpg";
import fordEverestImage from "@/assets/home-vehicle-everest.webp";
import hondaCityImage from "@/assets/home-vehicle-city.webp";
import toyotaViosImage from "@/assets/home-vehicle-vios.webp";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { DateRangePicker } from "@/components/site/DateRangePicker";
import { RentalDateTrigger } from "@/components/site/RentalDateTrigger";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomerPage } from "@/components/customer/CustomerPrimitives";
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

const timeOptions = HANDOVER_TIMES;

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

function formatRentalDateTime(value: string) {
  const date = dateFromDateTimeLocal(value);
  if (!date) return "Select a date";

  const dateLabel = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const time = timeFromDateTimeLocal(value, "");

  return time ? `${dateLabel} at ${formatTime(time)}` : dateLabel;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function HomePage() {
  const navigate = useNavigate();
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [featuredVehicles, setFeaturedVehicles] = useState<CustomerVehicle[]>(
    [],
  );
  const [featuredVehiclesLoading, setFeaturedVehiclesLoading] = useState(true);
  const [featuredVehiclesError, setFeaturedVehiclesError] = useState("");
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [filmstripHovered, setFilmstripHovered] = useState(false);
  const [filmstripFocused, setFilmstripFocused] = useState(false);
  const filmstripPaused =
    rotationPaused || filmstripHovered || filmstripFocused || signInOpen;
  const galleryRef = useRef<HTMLDivElement>(null);
  const detailRailRef = useRef<HTMLDivElement>(null);
  const shiftDirection = useRef(1);
  const previousOffset = useRef(0);
  const shiftAnimations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    if (signInOpen) {
      shiftAnimations.current.forEach((animation) => animation.cancel());
    }
  }, [signInOpen]);

  useLayoutEffect(() => {
    if (previousOffset.current === featuredOffset) return;
    previousOffset.current = featuredOffset;
    const elements = [galleryRef.current, detailRailRef.current];
    const starts = elements.map((element, index) => {
      if (!element || shiftAnimations.current[index]?.playState !== "running") {
        return {
          opacity: "0.85",
          transform: `translateX(${shiftDirection.current * 8}px)`,
        };
      }
      const style = getComputedStyle(element);
      return { opacity: style.opacity, transform: style.transform };
    });
    shiftAnimations.current.forEach((animation) => animation.cancel());
    shiftAnimations.current = [];
    if (
      document.documentElement.dataset.inputModality === "keyboard" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    shiftAnimations.current = elements.flatMap((element, index) =>
      element
        ? [
            element.animate(
              [starts[index], { opacity: "1", transform: "translateX(0)" }],
              {
                duration: 220,
                easing: "cubic-bezier(0.23, 1, 0.32, 1)",
              },
            ),
          ]
        : [],
    );
  }, [featuredOffset]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancelMotion = () =>
      shiftAnimations.current.forEach((animation) => animation.cancel());
    const preferenceChanged = () => {
      if (media.matches) cancelMotion();
    };
    document.addEventListener("keydown", cancelMotion, true);
    media.addEventListener("change", preferenceChanged);
    return () => {
      cancelMotion();
      document.removeEventListener("keydown", cancelMotion, true);
      media.removeEventListener("change", preferenceChanged);
    };
  }, []);

  const firstAvailableDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  const visibleFeaturedVehicles = useMemo(() => {
    if (!featuredVehicles.length) return [];
    return Array.from(
      { length: Math.min(3, featuredVehicles.length) },
      (_, index) =>
        featuredVehicles[(featuredOffset + index) % featuredVehicles.length],
    );
  }, [featuredOffset, featuredVehicles]);

  const filmstripColumnStyle = {
    "--filmstrip-columns": visibleFeaturedVehicles.length,
  } as CSSProperties;

  useEffect(() => {
    if (getClientPrincipal()?.role === "Customer/Renter") {
      window.location.replace("/vehicles");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setFeaturedVehiclesLoading(true);
    setFeaturedVehiclesError("");
    setFeaturedOffset(0);

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

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const syncRotation = () => {
      window.clearInterval(timer);
      if (
        filmstripPaused ||
        featuredVehicles.length < 2 ||
        media.matches ||
        document.hidden
      )
        return;
      timer = window.setInterval(() => {
        shiftDirection.current = 1;
        setFeaturedOffset((offset) => (offset + 1) % featuredVehicles.length);
      }, 6000);
    };
    syncRotation();
    media.addEventListener("change", syncRotation);
    document.addEventListener("visibilitychange", syncRotation);
    return () => {
      window.clearInterval(timer);
      media.removeEventListener("change", syncRotation);
      document.removeEventListener("visibilitychange", syncRotation);
    };
  }, [featuredVehicles.length, filmstripPaused]);

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

    void navigate({
      to: "/vehicles",
      search: {
        finderStart: rentalStart,
        finderEnd: rentalEnd,
        finderIntent: "trip",
      } as never,
    });
  }

  function openDatePicker() {
    const pickupDate = dateFromDateTimeLocal(rentalStart);
    const returnDate = dateFromDateTimeLocal(rentalEnd);
    const hasBookableRange =
      pickupDate &&
      returnDate &&
      pickupDate >= firstAvailableDate &&
      returnDate >= firstAvailableDate;

    setDraftRange(
      hasBookableRange ? { from: pickupDate, to: returnDate } : undefined,
    );
    setPickupTime(
      hasBookableRange ? timeFromDateTimeLocal(rentalStart, "") : "",
    );
    setReturnTime(hasBookableRange ? timeFromDateTimeLocal(rentalEnd, "") : "");
    setDatePickerOpen(true);
  }

  function applyDates() {
    if (!draftRange?.from || !draftRange.to) return;
    setRentalStart(dateTimeLocalForDate(draftRange.from, pickupTime));
    setRentalEnd(dateTimeLocalForDate(draftRange.to, returnTime));
    setDatePickerOpen(false);
  }

  function cycleFeaturedVehicles(direction: "previous" | "next") {
    if (featuredVehicles.length < 2) return;
    shiftDirection.current = direction === "next" ? 1 : -1;
    setFeaturedOffset(
      (offset) =>
        (offset + (direction === "next" ? 1 : -1) + featuredVehicles.length) %
        featuredVehicles.length,
    );
  }

  return (
    <CustomerPage>
      <Header homeMarketing onSignInOpenChange={setSignInOpen} />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-visual" aria-hidden="true">
            <img
              src={heroCar}
              alt=""
              width={1672}
              height={941}
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
              <path
                className="home-hero-shape-narrow"
                d="M0 0H860C795 120 770 240 790 390C815 525 800 665 715 800H0Z"
              />
              <path
                className="home-hero-shape-wide"
                d="M0 0H1080C1015 120 990 240 1010 390C1035 525 1020 665 935 800H0Z"
              />
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
                  <div className="home-date-field home-date-field--rental">
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={(open) => {
                        if (open) openDatePicker();
                        else setDatePickerOpen(false);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <RentalDateTrigger
                          id="rental-dates"
                          pickupValue={formatRentalDateTime(rentalStart)}
                          returnValue={formatRentalDateTime(rentalEnd)}
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
                          pickupTimeId="pickup-time"
                          returnTimeId="return-time"
                          onApply={applyDates}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <button className="customer-primary-button" type="submit">
                    Find a car <ArrowRight size={20} aria-hidden="true" />
                  </button>
                </form>
                <div
                  className="home-search-helper"
                  aria-label="Rental assurances"
                >
                  <span>
                    <ShieldCheck size={21} aria-hidden="true" /> Fully insured
                  </span>
                  <span>
                    <Tag size={21} aria-hidden="true" /> Clear daily rates
                  </span>
                  <span>
                    <Headphones size={21} aria-hidden="true" /> Support when you
                    need it
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="home-featured home-filmstrip"
          aria-labelledby="fleet-showcase"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setFilmstripHovered(true);
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setFilmstripHovered(false);
          }}
          onFocusCapture={() => setFilmstripFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setFilmstripFocused(false);
          }}
        >
          <div className="home-filmstrip-masthead">
            <div className="customer-container home-filmstrip-masthead-inner">
              <h2 id="fleet-showcase">Find your next ride</h2>
              <p>
                The right car changes everything. Browse the fleet, then choose
                your dates to check availability.
              </p>
              <a className="home-filmstrip-all-link" href="/vehicles">
                Browse the fleet <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>

          {featuredVehiclesLoading ? <HomeFilmstripSkeleton /> : null}
          {featuredVehiclesError ? (
            <div
              className="customer-container home-featured-status"
              role="status"
            >
              <p>{featuredVehiclesError}</p>
              <a className="customer-link" href="/vehicles">
                Browse the fleet <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          ) : null}
          {!featuredVehiclesLoading &&
          !featuredVehiclesError &&
          visibleFeaturedVehicles.length > 0 ? (
            <>
              <div
                className="home-filmstrip-gallery"
                ref={galleryRef}
                style={filmstripColumnStyle}
              >
                {visibleFeaturedVehicles.map((vehicle) => (
                  <FilmstripVehicle key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
              <div
                className="home-filmstrip-detail-rail"
                ref={detailRailRef}
                style={filmstripColumnStyle}
              >
                {visibleFeaturedVehicles.map((vehicle) => (
                  <FilmstripVehicleDetails key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
              <div className="customer-container home-filmstrip-footer">
                <span className="home-filmstrip-route">Manila and Rizal</span>
                <span aria-live={filmstripPaused ? "polite" : "off"}>
                  {String(featuredOffset + 1).padStart(2, "0")} /{" "}
                  {String(featuredVehicles.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  className="home-gallery-rotation"
                  aria-label={
                    rotationPaused
                      ? "Resume car rotation"
                      : "Pause car rotation"
                  }
                  aria-pressed={rotationPaused}
                  disabled={featuredVehicles.length < 2}
                  onClick={() => setRotationPaused((paused) => !paused)}
                >
                  {rotationPaused ? (
                    <Play size={15} aria-hidden="true" />
                  ) : (
                    <Pause size={15} aria-hidden="true" />
                  )}
                  {rotationPaused ? "Resume" : "Pause"}
                </button>
                <div
                  className="home-gallery-pager"
                  aria-label="Fleet gallery navigation"
                >
                  <button
                    type="button"
                    className="home-gallery-control"
                    onClick={() => cycleFeaturedVehicles("previous")}
                    aria-label="Show previous cars"
                    disabled={featuredVehicles.length < 2}
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="home-gallery-control"
                    onClick={() => cycleFeaturedVehicles("next")}
                    aria-label="Show next cars"
                    disabled={featuredVehicles.length < 2}
                  >
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {!featuredVehiclesLoading &&
          !featuredVehiclesError &&
          featuredVehicles.length === 0 ? (
            <div
              className="customer-container home-featured-status"
              role="status"
            >
              <p>
                There are no active cars in the fleet to showcase right now.
              </p>
              <a className="customer-link" href="/vehicles">
                Check the fleet <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          ) : null}
        </section>

        <section
          id="rental-assurances"
          className="home-rental-journey"
          aria-labelledby="home-how-it-works-title"
        >
          <div className="home-rental-journey__layout">
            <div className="home-rental-journey__photo">
              <img
                src={handoverPhoto}
                width={1024}
                height={1536}
                loading="lazy"
                decoding="async"
                alt="Illustration of a friendly car-key handover beside a white SUV."
              />
            </div>
            <div className="home-rental-journey__content">
              <div className="home-rental-journey__heading">
                <h2 id="home-how-it-works-title">How it works</h2>
                <p>
                  From your first request to the drive home, here’s what to
                  expect.
                </p>
              </div>
              <ol className="home-rental-journey__steps">
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <CarFront size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      1
                    </span>
                    <h3>Choose your car and dates</h3>
                    <p>
                      Sign in and send your rental request with pickup or
                      delivery details.
                    </p>
                  </div>
                </li>
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <FileText size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      2
                    </span>
                    <h3>Submit your documents</h3>
                    <p>
                      Upload your documents. Check your booking for review
                      updates or corrections.
                    </p>
                  </div>
                </li>
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <CreditCard size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      3
                    </span>
                    <h3>Review your quote and pay</h3>
                    <p>
                      Review the charges and terms. Pay 50% down payment and
                      upload payment proof.
                    </p>
                  </div>
                </li>
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <CircleCheck size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      4
                    </span>
                    <h3>Wait for confirmation</h3>
                    <p>
                      Payment verification and final approval confirm your
                      booking.
                    </p>
                  </div>
                </li>
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <Users size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      5
                    </span>
                    <h3>Meet the team and start your trip</h3>
                    <p>
                      Bring your driver’s license and government-issued ID. Pay
                      the balance and deposit, then inspect the car together.
                    </p>
                  </div>
                </li>
                <li>
                  <span
                    className="home-rental-journey__icon"
                    aria-hidden="true"
                  >
                    <CarFront size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <span
                      className="home-rental-journey__number"
                      aria-hidden="true"
                    >
                      6
                    </span>
                    <h3>Return the car with the team</h3>
                    <p>
                      Return as agreed. Inspection and any agreed deductions
                      settle your refundable deposit.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="home-rental-journey__next">
                <a href="/vehicles">
                  Find your car <ArrowRight size={22} aria-hidden="true" />
                </a>
                <p>Sending a request does not reserve the car yet.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </CustomerPage>
  );
}

function HomeFilmstripSkeleton() {
  return (
    <div
      className="home-filmstrip-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading fleet showcase"
    >
      <span className="sr-only">Loading fleet showcase</span>
      <div className="home-filmstrip-gallery" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="home-filmstrip-skeleton__media" key={index} />
        ))}
      </div>
      <div className="home-filmstrip-detail-rail" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="home-filmstrip-skeleton__detail" key={index}>
            <i />
            <i />
            <span>
              <i />
              <i />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilmstripVehicle({ vehicle }: { vehicle: CustomerVehicle }) {
  const image = vehicle.image_url || featuredVehicleImages[vehicle.name];
  const dailyRate =
    vehicle.daily_rate === null
      ? "Rate not listed"
      : new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        }).format(vehicle.daily_rate);

  return (
    <a
      className="home-filmstrip-vehicle"
      href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
      aria-label={`View ${vehicle.name}`}
    >
      <div className="home-filmstrip-media">
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
          <div className="home-filmstrip-image-fallback" aria-hidden="true">
            <CarFront size={36} />
          </div>
        )}
        <span className="home-filmstrip-image-note">
          {vehicle.category?.name ?? "Self-drive car"}
        </span>
      </div>
      <div className="home-filmstrip-mobile-details">
        <span className="home-filmstrip-category">
          {vehicle.category?.name ?? "Self-drive car"}
        </span>
        <h3>{vehicle.name}</h3>
        <span>{vehicle.seat_capacity ?? "—"} seats</span>
        <span>{vehicle.transmission ?? "Transmission not listed"}</span>
        <strong>{dailyRate}</strong>
      </div>
    </a>
  );
}

function FilmstripVehicleDetails({ vehicle }: { vehicle: CustomerVehicle }) {
  const dailyRate =
    vehicle.daily_rate === null
      ? "Rate not listed"
      : new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 0,
        }).format(vehicle.daily_rate);

  return (
    <a
      className="home-filmstrip-details"
      href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
      aria-label={`View details for ${vehicle.name}`}
    >
      <span className="home-filmstrip-title">
        <h3>{vehicle.name}</h3>
        <small>{vehicle.category?.name ?? "Self-drive car"}</small>
      </span>
      <span>{vehicle.seat_capacity ?? "—"} seats</span>
      <span>{vehicle.transmission ?? "Transmission not listed"}</span>
      <strong>
        {dailyRate}
        {vehicle.daily_rate !== null ? <small>per day</small> : null}
      </strong>
    </a>
  );
}
