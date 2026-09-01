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
import { vehicles as fallbackVehicles } from "@/data/vehicles";
import { CANCELLATION_POLICY, RENTAL_DONTS, RENTAL_DOS } from "@/data/rental-policy";
import { calculateRentalDays } from "@/lib/rental-duration";
import { finderBookingPrefill, finderContextForSubmission, finderProvenanceMatchesBooking, parseFinderBookingHandoff, validateFinderBookingSearch } from "@/lib/finder-booking";
import { instantToManilaDateTimeLocal, manilaDateTimeLocalToInstant } from "@/lib/business-time";

type BookingErrors = Partial<
  Record<"pickup" | "dropoff" | "name" | "email" | "phone" | "purpose" | "locations" | "terms", string>
>;
type CanonicalVehicle = { id: string; name: string; seat_capacity: number | null; image_url: string | null; branch_id: string; category?: { id: string; name: string } | null };

export const Route = createFileRoute("/booking")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    if (getAdminSession()) {
      throw redirect({ to: "/admin" });
    }
  },
  validateSearch: validateFinderBookingSearch,
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
  const search = Route.useSearch();
  const { vehicle } = search;
  const finderHandoff = useMemo(() => parseFinderBookingHandoff(search), [search]);
  const finderPrefill = finderHandoff ? finderBookingPrefill(finderHandoff) : null;
  const [authOpen, setAuthOpen] = useState(false);
  const [customerSession, setCustomerSession] = useState(() => getCustomerSession());
  const initial = fallbackVehicles.find((v) => v.id === vehicle) ?? fallbackVehicles[0];
  const [masterData, setMasterData] = useState<{ branches: { id: string; name: string }[]; vehicles: CanonicalVehicle[] }>({ branches: [], vehicles: [] });
  const [masterDataLoading, setMasterDataLoading] = useState(true);
  const [masterDataError, setMasterDataError] = useState("");

  const [vehicleId, setVehicleId] = useState(vehicle ?? initial.id);
  const [branch, setBranch] = useState<string>(initial.branch);
  const [returnBranch, setReturnBranch] = useState("Same as pickup");
  const [pickup, setPickup] = useState(finderPrefill?.pickup ?? "");
  const [dropoff, setDropoff] = useState(finderPrefill?.dropoff ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState(finderPrefill?.destination ?? "");
  const [purpose, setPurpose] = useState("");
  const [pickupDeliveryOption, setPickupDeliveryOption] = useState<"pickup" | "delivery">("pickup");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [preferredSeatCount, setPreferredSeatCount] = useState(finderPrefill?.passengerCount ?? "");
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

  function loadMasterData() {
    setMasterDataLoading(true); setMasterDataError("");
    fetch("/api/booking-master-data", { credentials: "same-origin" })
      .then(async (response) => { const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Unable to load booking options."); return data; })
      .then((data) => { setMasterData(data); setMasterDataLoading(false); })
      .catch((error) => { setMasterDataLoading(false); setMasterDataError(error instanceof Error ? error.message : "Unable to load booking options."); });
  }
  useEffect(() => { loadMasterData(); }, [customerSession]);
  useEffect(() => {
    if (!masterData.vehicles.length) return;
    const incoming = fallbackVehicles.find((v) => v.id === vehicle);
    const mapped = masterData.vehicles.find((v) => v.id === vehicle) ?? (incoming && masterData.vehicles.find((v) => v.name === incoming.name));
    setVehicleId((current) => masterData.vehicles.some((v) => v.id === current) ? current : (mapped?.id ?? masterData.vehicles[0].id));
  }, [masterData.vehicles, vehicle]);
  useEffect(() => {
    if (!masterData.branches.length) return;
    setBranch((current) => masterData.branches.some((b) => b.id === current) ? current : masterData.branches[0].id);
  }, [masterData.branches]);

  const selectedCanonical = masterData.vehicles.find((v) => v.id === vehicleId);
  const selected = selectedCanonical ?? initial;
  const bookingOptionsReady = !masterDataLoading && !masterDataError && Boolean(selectedCanonical) && masterData.branches.length > 0;
  const effectiveName = customerSession?.name ?? name;
  const effectiveEmail = customerSession?.email ?? email;
  const finderProvenanceValid = Boolean(finderHandoff && finderProvenanceMatchesBooking(finderHandoff, { vehicleId, pickup, dropoff, passengerCount: preferredSeatCount, destination }));

  const days = useMemo(() => {
    if (!pickup || !dropoff) return 1;
    try {
      const pickupInstant = manilaDateTimeLocalToInstant(pickup);
      const dropoffInstant = manilaDateTimeLocalToInstant(dropoff);
      if (!pickupInstant || !dropoffInstant) return 1;
      return calculateRentalDays(pickupInstant, dropoffInstant);
    } catch {
      return 1;
    }
  }, [pickup, dropoff]);
  const minDateTime = instantToManilaDateTimeLocal(new Date());

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
      purpose,
      pickupDeliveryOption,
      pickupLocation,
      dropoffLocation,
      acceptTerms: nextAcceptTerms,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please review the highlighted fields.");
      return;
    }

    setSubmitting(true);
    fetch("/api/bookings", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestedVehicleId: vehicleId, pickupBranchId: branch, returnBranchId: returnBranch === "Same as pickup" ? branch : returnBranch, pickupAt: pickup, returnAt: dropoff, destination, purposeOfUse: purpose, pickupDeliveryOption, pickupLocation, dropoffLocation, preferredSeatCount, finderContext: finderHandoff && finderProvenanceValid ? finderContextForSubmission(finderHandoff) : undefined }) })
      .then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "Unable to submit booking request."); return data; })
      .then((data) => { setSubmitting(false); setSubmitted(true); setSuccessNotice({ vehicleName: selected.name, days }); void data; window.setTimeout(() => void navigate({ to: "/customer" }), 1400); })
      .catch((error) => { setSubmitting(false); toast.error(error instanceof Error ? error.message : "Unable to submit booking request."); });
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
        customerSuccessSearch={vehicle ? search : undefined}
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

            {finderHandoff && finderProvenanceValid && (
              <div className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary"><Car className="h-4 w-4" /> Selected with Smart Vehicle Finder</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {finderHandoff.passengerCount} passenger{finderHandoff.passengerCount === 1 ? "" : "s"} · maximum base-rental budget {formatPeso(finderHandoff.maximumBudget)}
                  {finderHandoff.preferredCategory ? ` · ${finderHandoff.preferredCategory} preferred` : ""}
                  {finderHandoff.destination ? ` · destination ${finderHandoff.destination}` : ""}
                </p>
              </div>
            )}
            {finderHandoff && !finderProvenanceValid && (
              <div role="status" className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                Finder details changed. This booking will be submitted as a normal vehicle selection.
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Vehicle" id="booking-vehicle">
                <select
                  id="booking-vehicle"
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  className="input-control"
                >
                  {masterData.vehicles.map((v) => (
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
                  {masterData.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Return branch" id="booking-return-branch">
                <select
                  id="booking-return-branch"
                  value={returnBranch}
                  onChange={(event) => setReturnBranch(event.target.value)}
                  className="input-control"
                >
                  <option value="Same as pickup">Same as pickup</option>
                  {masterData.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                {customerSession ? (
                  <div className="input-control flex items-center bg-secondary/40 text-muted-foreground"><span className="text-foreground">{phone || "No phone number on profile"}</span></div>
                ) : <input
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
                />}
              </Field>
              <Field label="Destination (optional)" id="booking-destination">
                  <input
                    id="booking-destination"
                    className="input-control"
                    placeholder="e.g. Baguio, La Union"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                  />
                </Field>
              <Field label="Purpose of use" id="booking-purpose" error={errors.purpose}><input id="booking-purpose" className="input-control" value={purpose} onChange={(e) => setPurpose(e.target.value)} required /></Field>
              <Field label="Preferred seats (optional)" id="booking-seats"><input id="booking-seats" type="number" min="1" className="input-control" value={preferredSeatCount} onChange={(e) => setPreferredSeatCount(e.target.value)} /></Field>
              <Field label="Pickup or delivery" id="booking-option"><select id="booking-option" className="input-control" value={pickupDeliveryOption} onChange={(e) => setPickupDeliveryOption(e.target.value as "pickup" | "delivery")}><option value="pickup">Pickup at branch</option><option value="delivery">Delivery / drop-off</option></select></Field>
              {pickupDeliveryOption === "delivery" && <><Field label="Pickup location" id="booking-pickup-location" error={errors.locations}><input id="booking-pickup-location" className="input-control" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} /></Field><Field label="Drop-off location" id="booking-dropoff-location"><input id="booking-dropoff-location" className="input-control" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} /></Field></>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
              <img
                src={"image_url" in selected ? (selected.image_url ?? "/assets/car-sedan.jpg") : selected.image}
                alt={selected.name}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {"category" in selected
                    ? typeof selected.category === "string"
                      ? selected.category
                      : selected.category?.name ?? "Vehicle"
                    : String(selected.category)}
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

                {!masterDataLoading && masterDataError && <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-200">{masterDataError} <button type="button" className="ml-2 underline" onClick={loadMasterData}>Retry</button></div>}
                {masterDataLoading && <div className="mt-4 text-center text-xs text-muted-foreground">Loading current vehicles and branches…</div>}
                <button
                  type="submit"
                  disabled={submitting || !bookingOptionsReady}
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
              {successNotice.days > 1 ? "s" : ""}. Your request is Submitted and awaiting review.
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
  purpose,
  pickupDeliveryOption,
  pickupLocation,
  dropoffLocation,
  acceptTerms,
}: {
  pickup: string;
  dropoff: string;
  name: string;
  email: string;
  phone: string;
  purpose: string;
  pickupDeliveryOption: "pickup" | "delivery";
  pickupLocation: string;
  dropoffLocation: string;
  acceptTerms: boolean;
}) {
  const nextErrors: BookingErrors = {};

  if (!pickup) nextErrors.pickup = "Choose a pickup date and time.";
  if (!dropoff) nextErrors.dropoff = "Choose a return date and time.";
  const pickupInstant = manilaDateTimeLocalToInstant(pickup);
  const dropoffInstant = manilaDateTimeLocalToInstant(dropoff);
  if (pickup && !pickupInstant) nextErrors.pickup = "Choose a valid pickup date and time.";
  if (dropoff && !dropoffInstant) nextErrors.dropoff = "Choose a valid return date and time.";
  if (pickupInstant && dropoffInstant && dropoffInstant <= pickupInstant) {
    nextErrors.dropoff = "Return must be after pickup.";
  }
  if (!name.trim()) nextErrors.name = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
  if (phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Enter a valid phone number.";
  if (!purpose.trim()) nextErrors.purpose = "Enter the purpose of use.";
  if (pickupDeliveryOption === "delivery" && (!pickupLocation.trim() || !dropoffLocation.trim())) nextErrors.locations = "Provide pickup and drop-off locations.";
  if (!acceptTerms) nextErrors.terms = "Please accept the rental policies to continue.";

  return nextErrors;
}

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value);
}
