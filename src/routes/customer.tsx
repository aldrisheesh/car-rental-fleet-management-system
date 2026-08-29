import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, FileCheck2, FileUp, History, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { bookings, type Booking } from "@/data/admin";
import { peso } from "@/data/vehicles";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerSession, type CustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/customer")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    if (getAdminSession()) {
      throw redirect({ to: "/admin" });
    }

    if (!getCustomerSession()) {
      throw redirect({ to: "/sign-in" });
    }
  },
  head: () => ({
    meta: [
      { title: "Customer View - Briah's Car Rental" },
      {
        name: "description",
        content: "Customer portal for requirement uploads and payment status tracking.",
      },
    ],
    links: [{ rel: "canonical", href: "/customer" }],
  }),
  component: CustomerViewPage,
});

type PaymentStatus = "Pending" | "Verified" | "Invalid";

const paymentRows: { ref: string; amount: number; method: string; status: PaymentStatus }[] = [
  { ref: "PAY-4502", amount: 5000, method: "GCash", status: "Pending" },
  { ref: "PAY-4487", amount: 7200, method: "BDO", status: "Verified" },
  { ref: "PAY-4469", amount: 3000, method: "BPI", status: "Invalid" },
];

function CustomerViewPage() {
  const navigate = useNavigate();
  const hash = useRouterState({ select: (s) => s.location.hash });
  const normalizedHash = hash?.startsWith("#") ? hash.slice(1) : (hash ?? "");
  const showRequirementsOnly = normalizedHash === "post-booking";
  const [session, setSession] = useState<CustomerSession | null | undefined>(undefined);
  const [idFileName, setIdFileName] = useState("");
  const [licenseFileName, setLicenseFileName] = useState("");
  const [ltoLicenseScreenshotFileName, setLtoLicenseScreenshotFileName] = useState("");
  const customerName = session?.name ?? "";
  const pastCustomerBookings = useMemo(() => {
    if (!customerName) return [];

    const normalizedCustomerName = normalizeCustomerName(customerName);
    return bookings
      .filter((booking) => normalizeCustomerName(booking.customer) === normalizedCustomerName)
      .filter((booking) => booking.status === "Completed" || booking.status === "Cancelled")
      .sort((a, b) => bookingDateValue(b.to) - bookingDateValue(a.to));
  }, [customerName]);

  useEffect(() => {
    const activeSession = getCustomerSession();
    if (!activeSession) {
      void navigate({ to: "/sign-in", replace: true });
      setSession(null);
      return;
    }
    setSession(activeSession);
  }, [navigate]);

  if (session === undefined) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">
            Briah&apos;s Car Rental
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Checking customer session...</p>
        </div>
      </div>
    );
  }

  if (session === null) return null;

  if (showRequirementsOnly) {
    return (
      <div>
        <Header />

        <section className="border-b border-border bg-secondary/60">
          <div className="container-page py-14 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Next step</p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
              Requirement Submission
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Upload your valid ID and driver&apos;s license to speed up approval.
            </p>
          </div>
        </section>

        <section className="container-page mt-10">
          <Card
            title="Requirement Submission"
            icon={<FileCheck2 className="h-4 w-4 text-primary" />}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();

                const missing: string[] = [];
                if (!idFileName) missing.push("Valid ID");
                if (!licenseFileName) missing.push("Driver's License");
                if (!ltoLicenseScreenshotFileName) {
                  missing.push("Screenshot of License on LTO portal");
                }

                if (missing.length > 0) {
                  toast.error("Please upload the required documents.", {
                    description: `Missing: ${missing.join(" and ")}.`,
                  });
                  return;
                }

                toast.success("Requirements uploaded", {
                  description: "Your documents are queued for verification.",
                });

                window.setTimeout(() => {
                  void navigate({ to: "/payment-details" });
                }, 700);
              }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <UploadField
                label="Valid ID"
                helper={idFileName || "Upload government ID"}
                onFilePick={(name) => setIdFileName(name)}
              />
              <UploadField
                label="Driver's License"
                helper={licenseFileName || "Upload front/back copy"}
                onFilePick={(name) => setLicenseFileName(name)}
              />
              <UploadField
                label="Screenshot of License on LTO portal"
                helper={ltoLicenseScreenshotFileName || "Upload LTO portal screenshot"}
                onFilePick={(name) => setLtoLicenseScreenshotFileName(name)}
              />
              <button
                type="submit"
                className="touch-target inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2 lg:col-span-3"
              >
                <FileUp className="h-4 w-4" />
                Submit Requirements
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link
                to="/customer"
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Go to Customer Dashboard
              </Link>
            </div>
          </Card>
        </section>

        <Footer />
      </div>
    );
  }

  const highlightedPayment = paymentRows.find((row) => row.ref === "PAY-4487") ?? paymentRows[0];

  return (
    <div>
      <Header />

      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Your booking details are in the QR code
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Show this when asked during verification or vehicle pickup.
              </p>
            </div>
            <Link
              to="/customer/profile"
              className="touch-target inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <UserRound className="h-4 w-4 text-primary" />
              Edit Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex justify-center pt-2">
            <div className="w-full max-w-[260px]">
              <div className="aspect-square rounded-xl border-2 border-border bg-card shadow-soft">
                <div className="grid h-full place-items-center px-5 text-center">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      QR code
                    </div>
                    <div className="mt-3 rounded-lg border border-border bg-background p-3">
                      <FakeQrCode seed={session.email} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-soft">
                <div className="text-xs font-semibold text-foreground">
                  {highlightedPayment.ref} {"\u2022"} {peso(highlightedPayment.amount)}
                </div>
                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                  {highlightedPayment.method}
                </div>
                <div className="mt-2">
                  <span
                    className={[
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      highlightedPayment.status === "Verified"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : highlightedPayment.status === "Invalid"
                          ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-300",
                    ].join(" ")}
                  >
                    {highlightedPayment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Card title="Payment status" icon={<CreditCard className="h-4 w-4 text-primary" />}>
            <div className="space-y-2">
              {paymentRows.map((row) => (
                <Row
                  key={row.ref}
                  title={`${row.ref} \u2022 ${peso(row.amount)}`}
                  subtitle={row.method}
                  status={row.status}
                  action={
                    row.status === "Invalid" ? (
                      <Link
                        to="/payment-details"
                        search={{ resubmit: "invalid" }}
                        className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        Resubmit
                      </Link>
                    ) : null
                  }
                />
              ))}
            </div>
          </Card>

          <Card title="Past bookings" icon={<History className="h-4 w-4 text-primary" />}>
            <PastBookings rows={pastCustomerBookings} />
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PastBookings({ rows }: { rows: Booking[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-secondary/20 px-4 py-5 text-center">
        <p className="text-sm font-medium text-foreground">No past bookings yet</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Completed and cancelled reservations will appear here after your trips are finalized.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((booking) => (
        <div key={booking.id} className="rounded-md border border-border bg-secondary/30 px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {booking.id} - {booking.vehicle}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {booking.branch} - {formatBookingRange(booking.from, booking.to)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Plate {booking.plate} - {peso(booking.amount)}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <StatusPill status={booking.status} />
              <StatusPill status={booking.payment} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const style =
    status === "Completed" || status === "Paid"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
      : status === "Invalid"
        ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
        : status === "Cancelled"
          ? "bg-zinc-500/10 text-zinc-300 border-zinc-500/25"
          : "bg-amber-500/10 text-amber-300 border-amber-500/25";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {status}
    </span>
  );
}

function UploadField({
  label,
  helper,
  onFilePick,
}: {
  label: string;
  helper: string;
  onFilePick: (name: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="file"
        onChange={(event) => {
          const fileName = event.target.files?.[0]?.name ?? "";
          onFilePick(fileName);
        }}
        className="input-control py-2.5 file:mr-2 file:rounded-md file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-primary"
      />
      <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>
    </label>
  );
}

function Row({
  title,
  subtitle,
  status,
  action,
}: {
  title: string;
  subtitle: string;
  status: string;
  action?: React.ReactNode;
}) {
  const style =
    status === "Verified"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
      : status === "Invalid"
        ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
        : "bg-amber-500/10 text-amber-300 border-amber-500/25";

  return (
    <div className="rounded-md border border-border bg-secondary/30 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
            {status}
          </span>
          {action}
        </div>
      </div>
    </div>
  );
}

function FakeQrCode({ seed, size = 21 }: { seed: string; size?: number }) {
  const cells = useMemo(() => buildFakeQrCells(seed, size), [seed, size]);
  const gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  return (
    <div className="mx-auto w-full max-w-[200px] rounded-lg border border-border bg-white p-2.5">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns }}>
        {cells.map((on, idx) => (
          <div
            key={idx}
            className={on ? "bg-black" : "bg-white"}
            style={{ aspectRatio: "1 / 1", borderRadius: 2 }}
          />
        ))}
      </div>
    </div>
  );
}

function buildFakeQrCells(seed: string, size: number) {
  const rand = mulberry32(hashString(seed));
  const cells: boolean[] = new Array(size * size).fill(false);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const finder = finderValue(x, y, size);
      if (finder !== null) {
        cells[idx] = finder;
        continue;
      }

      const timing = (x === 6 && y >= 8 && y <= size - 9) || (y === 6 && x >= 8 && x <= size - 9);
      if (timing) {
        cells[idx] = (x + y) % 2 === 0;
        continue;
      }

      const quietZone = x < 1 || y < 1 || x > size - 2 || y > size - 2;
      if (quietZone) {
        cells[idx] = false;
        continue;
      }

      cells[idx] = rand() > 0.54;
    }
  }

  return cells;
}

function finderValue(x: number, y: number, size: number) {
  const finderSize = 7;
  const positions: Array<[number, number]> = [
    [0, 0],
    [size - finderSize, 0],
    [0, size - finderSize],
  ];

  for (const [x0, y0] of positions) {
    const dx = x - x0;
    const dy = y - y0;
    if (dx < 0 || dy < 0 || dx >= finderSize || dy >= finderSize) continue;

    const outer = dx === 0 || dx === finderSize - 1 || dy === 0 || dy === finderSize - 1;
    const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return outer || inner;
  }

  return null;
}

function normalizeCustomerName(name: string) {
  return name.trim().toLowerCase();
}

function bookingDateValue(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

function formatBookingRange(from: string, to: string) {
  return `${formatBookingDate(from)} to ${formatBookingDate(to)}`;
}

function formatBookingDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
