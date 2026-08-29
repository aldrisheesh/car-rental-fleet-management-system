import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SignInDialog } from "@/components/site/SignInDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerProfile, getCustomerSession } from "@/lib/customer-auth";
import { vehicles } from "@/data/vehicles";
import { CANCELLATION_POLICY, RENTAL_DONTS, RENTAL_DOS } from "@/data/rental-policy";

type Search = { vehicle?: string };
type BookingErrors = Partial<
  Record<"pickup" | "dropoff" | "name" | "email" | "phone" | "terms", string>
>;

export const Route = createFileRoute("/booking")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    if (getAdminSession()) {
      throw redirect({ to: "/admin" });
    }
  },
  validateSearch: (s: Record<string, unknown>): Search => ({
    vehicle: typeof s.vehicle === "string" ? s.vehicle : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a car - Briah's Car Rental" },
      {
        name: "description",
        content: "Reserve your car in minutes. Self-drive rentals with pickup in Taft or Antipolo.",
      },
    ],
    links: [{ rel: "canonical", href: "/booking" }],
  }),
  component: BookingPage,
});

function BookingPage() {
  const navigate = useNavigate();
  const { vehicle } = Route.useSearch();
  const [authOpen, setAuthOpen] = useState(false);
  const [customerSession, setCustomerSession] = useState(() => getCustomerSession());
  const initial = vehicles.find((v) => v.id === vehicle) ?? vehicles[0];

  const [vehicleId, setVehicleId] = useState(initial.id);
  const [branch, setBranch] = useState(initial.branch);
  const [returnBranch, setReturnBranch] = useState("Same as pickup");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successNotice, setSuccessNotice] = useState<{
    vehicleName: string;
    days: number;
  } | null>(null);

  useEffect(() => {
    if (!authOpen) {
      setCustomerSession(getCustomerSession());
    }
  }, [authOpen]);

  useEffect(() => {
    if (!customerSession) return;
    const profile = getCustomerProfile(customerSession);
    setName((prev) => (prev ? prev : customerSession.name));
    setEmail((prev) => (prev ? prev : customerSession.email));
    setPhone((prev) => (prev ? prev : profile.phone));
    setErrors((current) => ({ ...current, name: undefined, email: undefined }));
  }, [customerSession]);

  const selected = vehicles.find((v) => v.id === vehicleId) ?? initial;
  const effectiveName = customerSession?.name ?? name;
  const effectiveEmail = customerSession?.email ?? email;

  const days = useMemo(() => {
    if (!pickup || !dropoff) return 1;
    const ms = new Date(dropoff).getTime() - new Date(pickup).getTime();
    return Math.max(1, Math.ceil(ms / 86400000));
  }, [pickup, dropoff]);
  const minDateTime = getNowInputValue();

  function performSubmit(nextAcceptTerms = acceptTerms) {
    setSubmitted(false);

    if (!getCustomerSession()) {
      toast.error("Please sign in to submit your booking request.");
      setAuthOpen(true);
      return;
    }

    const nextErrors = validateBooking({
      pickup,
      dropoff,
      name: effectiveName,
      email: effectiveEmail,
      phone,
      acceptTerms: nextAcceptTerms,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please review the highlighted fields.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setSuccessNotice({ vehicleName: selected.name, days });
      window.setTimeout(() => {
        void navigate({ to: "/customer", hash: "post-booking" });
      }, 1400);
    }, 650);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    performSubmit();
  }

  return (
    <div>
      <Header />

      <SignInDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        customerSuccessTo="/booking"
        customerSuccessSearch={vehicle ? { vehicle } : undefined}
        customerSuccessNavigate={false}
      />

      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Rental do&apos;s and don&apos;ts</DialogTitle>
            <DialogDescription>
              Please review these guidelines. Tap &quot;I agree&quot; to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                Do&apos;s
              </div>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {RENTAL_DOS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-400">
                Don&apos;ts
              </div>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                {RENTAL_DONTS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {CANCELLATION_POLICY}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setAcceptTerms(false);
                setTermsModalOpen(false);
              }}
              className="touch-target inline-flex items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setAcceptTerms(true);
                setErrors((current) => ({ ...current, terms: undefined }));
                setTermsModalOpen(false);
              }}
              className="touch-target inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              I agree
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-14 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Reserve your car
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Booking</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Tell us where you're going. We'll confirm availability within a few hours.
          </p>
          {!customerSession && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-left text-sm text-foreground shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Sign in required:</span> You can browse and fill
                  out this form, but you must sign in to submit your booking request.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="touch-target inline-flex items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-page mt-10">
        <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Trip details</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Choose your vehicle, schedule, and pickup branch.
                </p>
              </div>
              {submitted && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-medium text-emerald-950">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Request sent
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Vehicle" id="booking-vehicle">
                <select
                  id="booking-vehicle"
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  className="input-control"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pickup branch" id="booking-branch">
                <select
                  id="booking-branch"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value as never)}
                  className="input-control"
                >
                  <option>Taft, Manila</option>
                  <option>Antipolo, Rizal</option>
                </select>
              </Field>
              <Field label="Return branch" id="booking-return-branch">
                <select
                  id="booking-return-branch"
                  value={returnBranch}
                  onChange={(event) => setReturnBranch(event.target.value)}
                  className="input-control"
                >
                  <option>Same as pickup</option>
                  <option>Taft, Manila</option>
                  <option>Antipolo, Rizal</option>
                </select>
              </Field>
              <Field label="Pickup date and time" id="booking-pickup" error={errors.pickup}>
                <input
                  id="booking-pickup"
                  type="datetime-local"
                  value={pickup}
                  min={minDateTime}
                  onChange={(event) => {
                    setPickup(event.target.value);
                    setErrors((current) => ({ ...current, pickup: undefined }));
                  }}
                  aria-invalid={Boolean(errors.pickup)}
                  aria-describedby={errors.pickup ? "booking-pickup-error" : undefined}
                  className="input-control [color-scheme:dark]"
                  required
                />
              </Field>
              <Field label="Return date and time" id="booking-dropoff" error={errors.dropoff}>
                <input
                  id="booking-dropoff"
                  type="datetime-local"
                  value={dropoff}
                  min={pickup || minDateTime}
                  onChange={(event) => {
                    setDropoff(event.target.value);
                    setErrors((current) => ({ ...current, dropoff: undefined }));
                  }}
                  aria-invalid={Boolean(errors.dropoff)}
                  aria-describedby={errors.dropoff ? "booking-dropoff-error" : undefined}
                  className="input-control [color-scheme:dark]"
                  required
                />
              </Field>
            </div>

            <h2 className="mt-10 font-display text-2xl font-semibold">Your details</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Full name" id="booking-name" error={errors.name}>
                {customerSession ? (
                  <div className="input-control flex items-center bg-secondary/40 text-muted-foreground">
                    <span className="text-foreground">{customerSession.name}</span>
                  </div>
                ) : (
                  <input
                    id="booking-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({ ...current, name: undefined }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "booking-name-error" : undefined}
                    className="input-control"
                    autoComplete="name"
                    required
                  />
                )}
              </Field>
              <Field label="Email" id="booking-email" error={errors.email}>
                {customerSession ? (
                  <div className="input-control flex items-center bg-secondary/40 text-muted-foreground">
                    <span className="text-foreground">{customerSession.email}</span>
                  </div>
                ) : (
                  <input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrors((current) => ({ ...current, email: undefined }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "booking-email-error" : undefined}
                    className="input-control"
                    autoComplete="email"
                    required
                  />
                )}
              </Field>
              <Field label="Phone (PH)" id="booking-phone" error={errors.phone}>
                <input
                  id="booking-phone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setErrors((current) => ({ ...current, phone: undefined }));
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "booking-phone-error" : undefined}
                  className="input-control"
                  placeholder="+63 917 000 0000"
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field label="Destination (optional)" id="booking-destination">
                <input
                  id="booking-destination"
                  className="input-control"
                  placeholder="e.g. Baguio, La Union"
                />
              </Field>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
              <img
                src={selected.image}
                alt={selected.name}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {selected.category}
                </div>
                <h3 className="font-display text-xl font-semibold">{selected.name}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <Row
                    icon={<MapPin className="h-4 w-4 text-primary" />}
                    label="Branch"
                    value={branch}
                  />
                  <Row
                    icon={<Calendar className="h-4 w-4 text-primary" />}
                    label="Duration"
                    value={`${days} day${days > 1 ? "s" : ""}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="touch-target mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Sending request..." : "Request booking"}
                </button>

                <label className="mt-4 flex items-start justify-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(event) => {
                      setErrors((current) => ({ ...current, terms: undefined }));
                      if (event.target.checked) {
                        setTermsModalOpen(true);
                        return;
                      }
                      setAcceptTerms(false);
                    }}
                    aria-invalid={Boolean(errors.terms)}
                    className="mt-0.5 h-4 w-4 rounded border-border bg-background accent-primary"
                  />
                  <span>
                    I agree to the rental do&apos;s and don&apos;ts and cancellation policy.
                  </span>
                </label>
                {errors.terms && (
                  <div className="mt-2 text-center text-rose-300">{errors.terms}</div>
                )}

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  You won't be charged yet - we'll confirm availability first.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary p-5 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                What's included
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
                <li>Comprehensive insurance</li>
                <li>24/7 roadside assistance</li>
                <li>Reservation payments are non-refundable once paid.</li>
              </ul>
            </div>
          </div>
        </form>
      </section>

      <Footer />

      {successNotice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-[min(92vw,720px)] rounded-xl border border-emerald-500/30 bg-emerald-950 px-6 py-6 text-center shadow-card">
            <p className="font-display text-3xl font-semibold text-emerald-200">
              Booking request received
            </p>
            <p className="mt-2 text-base text-emerald-100/90">
              {successNotice.vehicleName} - {successNotice.days} day
              {successNotice.days > 1 ? "s" : ""}. We&apos;ll confirm by email shortly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function validateBooking({
  pickup,
  dropoff,
  name,
  email,
  phone,
  acceptTerms,
}: {
  pickup: string;
  dropoff: string;
  name: string;
  email: string;
  phone: string;
  acceptTerms: boolean;
}) {
  const nextErrors: BookingErrors = {};

  if (!pickup) nextErrors.pickup = "Choose a pickup date and time.";
  if (!dropoff) nextErrors.dropoff = "Choose a return date and time.";
  if (pickup && dropoff && new Date(dropoff).getTime() <= new Date(pickup).getTime()) {
    nextErrors.dropoff = "Return must be after pickup.";
  }
  if (!name.trim()) nextErrors.name = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
  if (phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Enter a valid phone number.";
  if (!acceptTerms) nextErrors.terms = "Please accept the rental policies to continue.";

  return nextErrors;
}

function getNowInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
