import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Check, ImageIcon, X } from "lucide-react";
import { Badge, Btn, Card, CardHeader, KPI, PageHeader } from "@/components/admin/ui";
import { payments, peso } from "@/data/admin";
import { useEffect, useState } from "react";
import { canAccessPayments, getAdminSession } from "@/lib/admin-auth";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const navigate = useNavigate();
  const session = getAdminSession();
  const canViewPayments = canAccessPayments(session?.role);
  const [selected, setSelected] = useState(payments[2]);
  const pending = payments.filter((p) => p.status === "Pending");
  const invalid = payments.filter((p) => p.status === "Invalid");
  const totalPaid = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);
  const totalInvalid = invalid.reduce((s, p) => s + p.amount, 0);

  useEffect(() => {
    if (!session) return;
    if (!canViewPayments) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [canViewPayments, navigate, session]);

  if (!canViewPayments) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Verify proofs, reconcile balances, and track every peso."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI accent label="Verified today" value={peso(totalPaid)} icon={<Banknote className="h-4 w-4" />} />
        <KPI
          label="Pending review"
          value={peso(totalPending)}
          icon={<Banknote className="h-4 w-4" />}
          delta={`${pending.length} proofs`}
        />
        <KPI
          label="Invalid proofs"
          value={peso(totalInvalid)}
          icon={<Banknote className="h-4 w-4" />}
          delta={`${invalid.length} proofs`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader title="Payment queue" hint="Pending proofs at the top" />
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Payment</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Method</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)}
                    className={`cursor-pointer border-b border-border/60 hover:bg-secondary/40 ${selected.id === p.id ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{p.id}</div>
                    <div className="text-[11px] text-muted-foreground">{p.booking} • {p.date}</div>
                  </td>
                  <td className="px-4 py-3">{p.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold">{peso(p.amount)}</td>
                  <td className="px-4 py-3"><Badge>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Proof of payment" hint={`${selected.id} • ${selected.customer}`} />
          <div className="p-5">
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50 text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 opacity-60" />
                <div className="mt-2 text-xs">Receipt_{selected.id}.jpg</div>
              </div>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Line label="Booking" value={selected.booking} />
              <Line label="Method" value={selected.method} />
              <Line label="Submitted" value={selected.date} />
              <Line label="Reference" value={`REF-${selected.id.slice(3)}-PH`} />
            </dl>

            <div className="mt-5 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Amount due</span><span>Paid</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-display text-lg font-semibold">
                <span>{peso(selected.amount)}</span>
                <span className="text-primary">{peso(selected.status === "Paid" ? selected.amount : selected.amount * 0.5)}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Btn variant="primary" className="flex-1"><Check className="h-4 w-4" /> Verify payment</Btn>
              <Btn variant="danger"><X className="h-4 w-4" /></Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
