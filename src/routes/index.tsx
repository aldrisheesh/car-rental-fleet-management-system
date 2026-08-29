import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar,
  Car,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import heroImg from "@/assets/hero-car.jpg";
import baguioImg from "@/assets/destinations/bagui.webp";
import elyuImg from "@/assets/destinations/elyu.jpg";
import pampangaImg from "@/assets/destinations/pampanga.webp";
import subicImg from "@/assets/destinations/subic.jpg";
import tagaytayImg from "@/assets/destinations/tagaytay.avif";
import viganImg from "@/assets/destinations/vigan.webp";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VehicleCard } from "@/components/site/VehicleCard";
import { peso, vehicles } from "@/data/vehicles";
import { getAdminSession } from "@/lib/admin-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Briah's Car Rental — Affordable Rentals Across Luzon" },
      {
        name: "description",
        content:
          "Self-drive or with-driver car rentals from Taft, Manila and Antipolo, Rizal. Economy from ₱1,000/day. Hassle-free booking, flexible rates, trips anywhere in Luzon.",
      },
      { property: "og:title", content: "Briah's Car Rental" },
      { property: "og:description", content: "Reliable, affordable car rentals across Luzon." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const tiers = [
  { label: "Economy", from: 1000, sub: "Wigo, Mirage", icon: Car },
  { label: "Sedan", from: 1800, sub: "Vios, City", icon: Car },
  { label: "SUV", from: 2500, sub: "Rush, Everest", icon: Car },
  { label: "Van", from: 3500, sub: "Urvan, Hiace", icon: Car },
];

const pickupBranches = ["Taft, Manila", "Antipolo, Rizal"] as const;
const vehicleCategories = ["Any type", "Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"] as const;

const destinations = [
  {
    name: "Baguio",
    note: "Pine-city escape, 4–5 hrs north",
    img: baguioImg,
  },
  {
    name: "La Union",
    note: "Surf town weekends",
    img: elyuImg,
  },
  {
    name: "Tagaytay",
    note: "Ridge views &amp; bulalo",
    img: tagaytayImg,
  },
  {
    name: "Subic & Zambales",
    note: "Coastline cruises",
    img: subicImg,
  },
  {
    name: "Vigan",
    note: "Heritage road trips",
    img: viganImg,
  },
  {
    name: "Pampanga",
    note: "Food &amp; sunsets",
    img: pampangaImg,
  },
];

const testimonials = [
  {
    name: "Marco D.",
    role: "Weekend driver, Manila",
    text: "Booked a Vios for our Tagaytay trip — pickup at Taft was smooth, car was spotless, and the rate beat every other rental I checked.",
  },
  {
    name: "Rhea S.",
    role: "Family of six, Antipolo",
    text: "Got the Innova with a driver for our Baguio run. Kuya was on time, calm in traffic, and the whole experience felt safe.",
  },
  {
    name: "Jen P.",
    role: "Small business owner",
    text: "I've rented an Urvan three weekends in a row for our team. Flexible rates, no hidden fees, and Briah's team actually picks up the phone.",
  },
];

const faqs = [
  {
    q: "Are all rentals self-drive?",
    a: "Yes — every Briah's vehicle is self-drive only. You'll need a valid LTO driver's license and one valid government ID at pickup.",
  },
  {
    q: "Where can I pick up and drop off the car?",
    a: "We operate out of Taft, Manila and Antipolo, Rizal. Deliveries within Metro Manila can be arranged for a small fee.",
  },
  {
    q: "How far can I take the car?",
    a: "Anywhere in Luzon. For trips beyond Luzon (Visayas or Mindanao), please contact us in advance for special arrangements.",
  },
  {
    q: "What's included in the rate?",
    a: "Comprehensive insurance, basic roadside assistance, and 24/7 support. Fuel is on the renter.",
  },
  {
    q: "Is a deposit required?",
    a: "Yes — a refundable security deposit is collected at pickup. The amount depends on the vehicle category and is returned in full after a clean inspection.",
  },
];

function Home() {
  const navigate = useNavigate();
  const featured = vehicles.slice(0, 6);
  const [pickupBranch, setPickupBranch] = useState<(typeof pickupBranches)[number]>("Taft, Manila");
  const [pickupDate, setPickupDate] = useState("");
  const [vehicleCategory, setVehicleCategory] =
    useState<(typeof vehicleCategories)[number]>("Any type");
  const minPickupDate = getTodayInputValue();

  useEffect(() => {
    if (getAdminSession()) return;
  }, [navigate]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void navigate({
      to: "/vehicles",
      search: {
        branch: pickupBranch,
        category: vehicleCategory === "Any type" ? undefined : vehicleCategory,
        pickup: pickupDate || undefined,
      },
    });
  }

  return (
    <div>
      <Header />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/85 via-background/70 to-background" />

        <div className="container-page pt-24 pb-32 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Now serving all of Luzon
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Drive anywhere in Luzon, <span className="text-primary">on your terms.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/80">
            Reliable, affordable self-drive car rentals from Briah's. Take the wheel, set your pace,
            and own the road — booked in minutes.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-3xl rounded-xl border border-white/10 bg-card p-2 shadow-card md:rounded-full"
          >
            <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <label className="flex min-h-14 items-center gap-2 rounded-xl px-4 py-2 text-left text-foreground transition-colors hover:bg-secondary focus-within:bg-secondary md:rounded-full">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Pickup
                  </span>
                  <select
                    aria-label="Pickup branch"
                    value={pickupBranch}
                    onChange={(event) =>
                      setPickupBranch(event.target.value as (typeof pickupBranches)[number])
                    }
                    className="mt-0.5 w-full bg-transparent font-medium text-foreground outline-none"
                  >
                    {pickupBranches.map((branch) => (
                      <option key={branch} value={branch} className="bg-card text-foreground">
                        {branch}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex min-h-14 items-center gap-2 rounded-xl px-4 py-2 text-left text-foreground transition-colors hover:bg-secondary focus-within:bg-secondary md:rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    When
                  </span>
                  <input
                    aria-label="Pickup date"
                    type="date"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                    min={minPickupDate}
                    className="mt-0.5 w-full bg-transparent font-medium text-foreground outline-none [color-scheme:dark]"
                  />
                </span>
              </label>
              <label className="flex min-h-14 items-center gap-2 rounded-xl px-4 py-2 text-left text-foreground transition-colors hover:bg-secondary focus-within:bg-secondary md:rounded-full">
                <Car className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Vehicle
                  </span>
                  <select
                    aria-label="Vehicle category"
                    value={vehicleCategory}
                    onChange={(event) =>
                      setVehicleCategory(event.target.value as (typeof vehicleCategories)[number])
                    }
                    className="mt-0.5 w-full bg-transparent font-medium text-foreground outline-none"
                  >
                    {vehicleCategories.map((category) => (
                      <option key={category} value={category} className="bg-card text-foreground">
                        {category}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button
                type="submit"
                className="touch-target inline-flex items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search cars
              </button>
            </div>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/70">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Fully insured fleet
            </span>
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> No hidden fees
            </span>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> 4.9 / 5 from 800+ trips
            </span>
          </div>
        </div>
      </section>

      {/* TIERS / PRICING STRIP */}
      <section className="container-page -mt-16 relative z-10">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-card md:grid-cols-4 md:p-6">
          {tiers.map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-secondary"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.label}
                </div>
                <div className="font-display text-lg font-semibold">
                  From {peso(t.from)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/day</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED VEHICLES */}
      <section className="container-page mt-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Our fleet</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Find your perfect ride
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              A curated mix of economy, sedans, SUVs, MPVs, and vans — all maintained, inspected,
              and ready for the road.
            </p>
          </div>
          <Link
            to="/vehicles"
            className="hidden text-sm font-medium text-primary hover:underline md:block"
          >
            View all vehicles →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link to="/vehicles" className="text-sm font-medium text-primary">
            View all vehicles →
          </Link>
        </div>
      </section>

      {/* WHY SELF-DRIVE */}
      <section className="container-page mt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Self-drive freedom
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            Your trip, your wheel
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every Briah's rental is self-drive. Pick up the keys, set your own pace, and own the
            road across Luzon.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Car,
              title: "Unlimited Luzon mileage",
              body: "No per-kilometer caps. Drive from Manila to Baguio, La Union, Bicol — your itinerary, no surprises.",
            },
            {
              icon: ShieldCheck,
              title: "Fully insured fleet",
              body: "Comprehensive insurance and 24/7 roadside assistance are built into every rate.",
            },
            {
              icon: Wallet,
              title: "Transparent rates",
              body: "One clear daily price. No hidden fees, no surge pricing — just honest premium service.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition hover:border-primary/40 hover:shadow-card"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-primary/25 bg-gradient-to-r from-card to-primary/10 p-6 text-sm leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">Requirements:</span> valid LTO driver's
          license, one valid government ID, and a refundable security deposit at pickup.
        </div>
      </section>

      {/* DESTINATIONS */}
      <section id="destinations" className="container-page mt-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Where to next?
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Popular Luzon destinations
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <article
              key={d.name}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            >
              <img
                src={d.img}
                alt={d.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-xl font-semibold">{d.name}</h3>
                <p
                  className="mt-1 text-xs text-white/80"
                  dangerouslySetInnerHTML={{ __html: d.note }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mt-28 bg-secondary py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Loved by renters
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Stories from the road
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page mt-28">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Good to know
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Can't find what you're looking for? Our team replies within a few hours — most days,
              within minutes.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Talk to our team →
            </Link>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-10 cursor-pointer items-center justify-between gap-4 rounded-md">
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-28">
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-card via-background to-card px-6 py-14 text-center shadow-card md:px-16 md:py-16">
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold md:text-4xl">
            Ready to hit the road?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Reserve in minutes. Self-drive across Luzon. We'll have your car ready in Taft or
            Antipolo.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/vehicles"
              className="touch-target inline-flex items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse the fleet
            </Link>
            <Link
              to="/booking"
              className="touch-target inline-flex items-center rounded-full border border-primary/40 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
            >
              Start a booking
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function getTodayInputValue() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
