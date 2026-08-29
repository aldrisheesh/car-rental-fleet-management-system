import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { VehicleCard } from "@/components/site/VehicleCard";
import { vehicles } from "@/data/vehicles";

const categories = ["All", "Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"] as const;
const branches = ["All branches", "Taft, Manila", "Antipolo, Rizal"] as const;

type VehicleSearch = {
  category?: string;
  branch?: string;
  pickup?: string;
};

function isCategory(value: unknown): value is (typeof categories)[number] {
  return typeof value === "string" && categories.includes(value as (typeof categories)[number]);
}

function isBranch(value: unknown): value is (typeof branches)[number] {
  return typeof value === "string" && branches.includes(value as (typeof branches)[number]);
}

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const Route = createFileRoute("/vehicles")({
  validateSearch: (search: Record<string, unknown>): VehicleSearch => ({
    category:
      isCategory(search.category) && search.category !== "All" ? search.category : undefined,
    branch: isBranch(search.branch) && search.branch !== "All branches" ? search.branch : undefined,
    pickup: isDateValue(search.pickup) ? search.pickup : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vehicles — Briah's Car Rental" },
      {
        name: "description",
        content:
          "Browse our full fleet of cars, SUVs, MPVs, vans, and pickups available for rent across Luzon.",
      },
      { property: "og:title", content: "Vehicles — Briah's Car Rental" },
      {
        property: "og:description",
        content: "Browse our full fleet of cars, SUVs, MPVs, vans, and pickups.",
      },
    ],
    links: [{ rel: "canonical", href: "/vehicles" }],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const search = Route.useSearch();
  const [cat, setCat] = useState<(typeof categories)[number]>(
    isCategory(search.category) ? search.category : "All",
  );
  const [branch, setBranch] = useState<(typeof branches)[number]>(
    isBranch(search.branch) ? search.branch : "All branches",
  );

  const filtered = vehicles.filter((v) => {
    if (cat !== "All" && v.category !== cat) return false;
    if (branch !== "All branches" && v.branch !== branch) return false;
    return true;
  });

  return (
    <div>
      <Header />
      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-16 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Our fleet</p>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">All vehicles</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Every car is self-drive. Filter by type or branch to find your ride.
          </p>
          {search.pickup && (
            <p className="mt-3 text-xs font-medium text-primary">
              Showing options for pickup on {formatPickupDate(search.pickup)}
            </p>
          )}
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
          <FilterGroup label="Type" options={categories} value={cat} onChange={setCat} />
          <div className="hidden h-6 w-px bg-border md:block" />
          <FilterGroup label="Branch" options={branches} value={branch} onChange={setBranch} />
          <div className="ml-auto rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {filtered.length} vehicle{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-soft md:p-12">
            <h2 className="font-display text-xl font-semibold text-foreground">
              No vehicles found
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              No vehicles match those filters yet. Try another branch or browse the full fleet.
            </p>
            <button
              type="button"
              onClick={() => {
                setCat("All");
                setBranch("All branches");
              }}
              className="touch-target mt-5 inline-flex items-center justify-center rounded-full border border-primary/40 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
            >
              Clear filters
            </button>
            <Link
              to="/booking"
              className="touch-target mt-3 inline-flex items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:ml-3"
            >
              Request help booking
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function formatPickupDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label} filter`}>
        {options.map((o) => (
          <button
            type="button"
            key={o}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors ${
              value === o
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
