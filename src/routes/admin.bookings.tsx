import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Download } from "lucide-react";
import { Badge, Btn, Card, PageHeader, TInput, TSelect, Toolbar } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

const statuses = ["All", "Submitted"] as const;
const branches = ["All branches", "Taft, Manila", "Antipolo, Rizal"];

function BookingsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [branch, setBranch] = useState<(typeof branches)[number]>("All branches");
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => { fetch("/api/bookings", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : []).then(setBookings).catch(() => undefined); }, []);

  const rows = useMemo(
    () =>
      bookings.filter((b) => {
        if (status !== "All" && b.booking_status !== status) return false;
        if (branch !== "All branches" && b.pickup_branch?.name !== branch) return false;
        if (
          q &&
          ![b.id, b.customer?.full_name, b.requested_vehicle?.name, b.requested_vehicle?.license_plate].join(" ").toLowerCase().includes(q.toLowerCase())
        )
          return false;
        return true;
      }),
    [q, status, branch],
  );

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Approve, modify, and monitor every reservation across branches."
        actions={
          <>
            <Btn>
              <Download className="h-4 w-4" /> Export
            </Btn>
          </>
        }
      />

      <Toolbar>
        <TInput
          placeholder="Search ID, customer, vehicle, plate…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-80"
        />
        <TSelect value={status} onChange={(e) => setStatus(e.target.value as never)}>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </TSelect>
        <TSelect value={branch} onChange={(e) => setBranch(e.target.value as never)}>
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </TSelect>
        <Btn variant="ghost">
          <Filter className="h-4 w-4" /> More filters
        </Btn>
        <span className="ml-auto text-xs text-muted-foreground">
          {rows.length} of {bookings.length} bookings
        </span>
      </Toolbar>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <Th>ID</Th>
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th>Branch</Th>
                <Th>Dates</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border/60 transition-colors hover:bg-secondary/40"
                >
                  <Td className="font-mono text-xs text-muted-foreground">{b.id}</Td>
                  <Td className="font-medium">{b.customer?.full_name ?? "—"}</Td>
                  <Td>
                    <div>{b.requested_vehicle?.name ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{b.requested_vehicle?.license_plate ?? ""}</div>
                  </Td>
                  <Td className="text-muted-foreground">{b.pickup_branch?.name ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {new Date(b.pickup_at).toLocaleString()} → {new Date(b.return_at).toLocaleString()}
                  </Td>
                  <Td>
                    <Badge>{b.booking_status}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <RequirementReviewQueue />
    </div>
  );
}

function RequirementReviewQueue() {
  const [sets, setSets] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/requirements", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : null).then((d) => setSets(d?.requirementSets ?? [])).catch(() => undefined);
  useEffect(() => { load(); }, []);
  async function open(set: any) { const d = await fetch(`/api/requirements?bookingId=${set.booking_id}`, { credentials: "same-origin" }).then((r) => r.json()); setSelected({ ...set, ...d }); }
  async function review(status: string) {
    if (!selected) return; const gov = selected.documents.find((d: any) => d.requirement_type === "Valid Government ID" && d.is_current); const lic = selected.documents.find((d: any) => d.requirement_type === "Driver's License" && d.is_current); const needs = status === "Needs Resubmission"; const body = { action: "review", requirementSetId: selected.id, governmentIdDocumentId: gov.id, governmentIdVersion: gov.version, governmentIdOutcome: needs ? "Needs Replacement" : "Accepted", governmentIdReason: needs ? "Please upload a clearer, complete document." : "", driversLicenseDocumentId: lic.id, driversLicenseVersion: lic.version, driversLicenseOutcome: needs ? "Accepted" : "Accepted", driversLicenseReason: "", identityConsistency: "Consistent", ltoOutcome: needs ? "Concern" : "Clear", resultingStatus: status }; setBusy(true); const r = await fetch("/api/requirements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" }); setBusy(false); if (!r.ok) { const e = await r.json(); alert(e.message); return; } setSelected(null); load(); }
  return <Card><div className="p-4"><h2 className="font-display text-lg font-semibold">Requirement review queue</h2>{sets.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No pending requirement reviews.</p> : <div className="mt-3 space-y-2">{sets.map((s) => <button key={s.id} onClick={() => open(s)} className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-secondary/40"><span>{s.booking?.customer?.full_name ?? "Customer"} · {s.booking_id.slice(0,8)}</span><Badge>Pending Review</Badge></button>)}</div>}{selected && <div className="mt-4 rounded-md border border-primary/30 p-4"><p className="text-sm font-semibold">Review {selected.booking?.customer?.full_name ?? "customer"}</p><div className="mt-3 space-y-2 text-xs">{selected.documents.filter((d: any) => d.is_current).map((d: any) => <div key={d.id} className="flex items-center justify-between"><span>{d.requirement_type} · v{d.version}</span><button className="text-primary underline" onClick={() => window.open(`/api/requirements?documentId=${d.id}`, "_blank")}>Open securely</button></div>)}</div><div className="mt-4 flex gap-2"><Btn disabled={busy} onClick={() => review("Needs Resubmission")}>Request resubmission</Btn><Btn disabled={busy} onClick={() => review("Verified")}>Verify (LTO Clear)</Btn><Btn variant="ghost" onClick={() => setSelected(null)}>Cancel</Btn></div></div>}</div></Card>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
