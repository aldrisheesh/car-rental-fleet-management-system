import { createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Upload } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/payment-details")({
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
      { title: "Payment Details - Briah's Car Rental" },
      {
        name: "description",
        content:
          "View business payment details and submit proof of payment for Briah's Car Rental bookings.",
      },
    ],
    links: [{ rel: "canonical", href: "/payment-details" }],
  }),
  component: PaymentDetailsPage,
});

const paymentMethods = [
  {
    id: "gcash",
    label: "GCash",
    accountName: "Briah's Car Rental",
    accountNumber: "09XX XXX XXXX",
  },
  {
    id: "bpi",
    label: "BPI",
    accountName: "Briah's Car Rental",
    accountNumber: "XXXX-XXXX-XX",
  },
  {
    id: "bdo",
    label: "BDO",
    accountName: "Briah's Car Rental",
    accountNumber: "XXXX-XXXX-XXXX",
  },
] as const;

function PaymentDetailsPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const resubmitReason = search?.resubmit;
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFileName, setProofFileName] = useState("");

  useEffect(() => {
    if (resubmitReason !== "invalid") return;

    setResubmitModalOpen(true);

    void navigate({
      to: "/payment-details",
      replace: true,
      search: (prev) => {
        if (!prev || typeof prev !== "object") return {};
        const next = { ...(prev as Record<string, unknown>) };
        delete next.resubmit;
        return next;
      },
    });
  }, [navigate, resubmitReason]);

  function submitProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!referenceNumber.trim()) {
      toast.error("Reference number is required.");
      return;
    }

    if (!proofFileName) {
      toast.error("Please attach your proof of payment.");
      return;
    }

    toast.success("Proof of payment submitted", {
      description: "We will verify your payment and update your booking status shortly.",
    });

    window.setTimeout(() => {
      void navigate({ to: "/customer", replace: true });
    }, 700);
  }

  return (
    <div>
      <Header />

      <Dialog open={resubmitModalOpen} onOpenChange={setResubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalid details</DialogTitle>
            <DialogDescription>
              Invalid details, make sure details are readable, and reference match the transaction
              id.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setResubmitModalOpen(false)}
              className="touch-target inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="border-b border-border bg-secondary/60">
        <div className="container-page py-14 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Payment</p>
          <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Payment Details</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use the payment methods below to settle your reservation. After payment, submit your proof of payment using the QR codes provided. We will verify your payment and update your booking status accordingly.
          </p>
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              title={method.label}
              icon={<CreditCard className="h-4 w-4 text-primary" />}
            >
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account name
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">{method.accountName}</div>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account / number
                  </div>
                  <div className="mt-1 font-mono text-sm text-foreground">{method.accountNumber}</div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4 shadow-soft">
                  <FakeQrCode seed={method.id} />
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Scan to pay ({method.label})
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page mt-10">
        <div className="mx-auto max-w-2xl">
          <Card title="Submit Proof of Payment" icon={<Upload className="h-4 w-4 text-primary" />}>
            <form onSubmit={submitProof} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Reference number
                </span>
                <input
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  className="input-control"
                  placeholder="Enter reference number"
                />
              </label>

              <UploadField
                label="Proof of payment"
                helper={proofFileName || "Upload screenshot or receipt"}
                onFilePick={(name) => setProofFileName(name)}
              />

              <button
                type="submit"
                className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Submit Proof
              </button>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
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

function FakeQrCode({ seed, size = 29 }: { seed: string; size?: number }) {
  const cells = useMemo(() => buildFakeQrCells(seed, size), [seed, size]);
  const gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

  return (
    <div className="mx-auto w-full max-w-[260px] rounded-lg border border-border bg-white p-3">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns,
        }}
      >
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

      const timing =
        (x === 6 && y >= 8 && y <= size - 9) || (y === 6 && x >= 8 && x <= size - 9);
      if (timing) {
        cells[idx] = (x + y) % 2 === 0;
        continue;
      }

      const quietZone = x < 1 || y < 1 || x > size - 2 || y > size - 2;
      if (quietZone) {
        cells[idx] = false;
        continue;
      }

      cells[idx] = rand() > 0.52;
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
