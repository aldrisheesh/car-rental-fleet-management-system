import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Download } from "lucide-react";
import { Badge, Btn, Card, PageHeader, TInput, TSelect, Toolbar } from "@/components/admin/ui";
import { OperationalContextPanel, type OperationalContextView } from "@/components/admin/operational-context-panel";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

const statuses = ["All", "Submitted"] as const;
const branches = ["All branches", "Taft, Manila", "Antipolo, Rizal"];

function BookingsPage() {
  const session = getAdminSession();
  const staffView = isStaffRole(session?.role);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [branch, setBranch] = useState<(typeof branches)[number]>("All branches");
  const [bookings, setBookings] = useState<any[]>([]);
  const [releaseOdometer, setReleaseOdometer] = useState(""); const [releaseFuel, setReleaseFuel] = useState("Other/Unknown"); const [releaseCondition, setReleaseCondition] = useState(""); const [damageNotes, setDamageNotes] = useState(""); const [agreementAck, setAgreementAck] = useState(false); const [conditionAck, setConditionAck] = useState(false); const [returnAck, setReturnAck] = useState(false);
  const [returnOdometer, setReturnOdometer] = useState(""); const [returnFuel, setReturnFuel] = useState("Other/Unknown"); const [returnCondition, setReturnCondition] = useState(""); const [returnDamage, setReturnDamage] = useState(""); const [returnRemarks, setReturnRemarks] = useState("");
  const [candidateVehicles, setCandidateVehicles] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [vehicleId, setVehicleId] = useState(""); const [note, setNote] = useState(""); const [subAck, setSubAck] = useState(false); const [branchAck, setBranchAck] = useState(false); const [busy, setBusy] = useState(false);
  const [operationalContext, setOperationalContext] = useState<OperationalContextView | null>(null); const [contextLoading, setContextLoading] = useState(false); const [contextError, setContextError] = useState("");
  const load = () => fetch("/api/bookings", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : null).then((d) => { setBookings(d?.bookings ?? []); setCandidateVehicles(d?.candidateVehicles ?? []); }).catch(() => undefined);
  useEffect(() => { load(); }, []);

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
  const conflictingCandidateIds = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(bookings.filter((booking) => booking.id !== selected.id && booking.booking_status === "Confirmed" && booking.assigned_vehicle_id && new Date(selected.pickup_at) < new Date(booking.return_at) && new Date(selected.return_at) > new Date(booking.pickup_at)).map((booking) => booking.assigned_vehicle_id));
  }, [bookings, selected]);
  const selectedCandidate = candidateVehicles.find((vehicle) => vehicle.id === vehicleId);
  const substitutionWarning = Boolean(vehicleId && vehicleId !== selected?.requested_vehicle_id);
  const crossBranchWarning = Boolean(vehicleId && selectedCandidate?.branch_id !== selected?.pickup_branch_id);
  useEffect(() => {
    if (staffView || !selected?.id || selected.booking_status !== "Submitted") { setOperationalContext(null); setContextError(""); setContextLoading(false); return; }
    const controller = new AbortController();
    setContextLoading(true); setContextError("");
    fetch("/api/operational-context", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "booking_assignment", bookingId: selected.id, ...(vehicleId ? { vehicleId } : {}) }), signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Operational context could not be loaded."); return body; })
      .then((body) => { setOperationalContext(body); setContextLoading(false); })
      .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setOperationalContext(null); setContextError("Operational context could not be verified."); setContextLoading(false); });
    return () => controller.abort();
  }, [selected?.id, selected?.booking_status, staffView, vehicleId]);

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
                  onClick={() => { setSelected(b); setVehicleId(b.assigned_vehicle_id ?? ""); setNote(b.assignment_note ?? ""); setSubAck(Boolean(b.substitution_acknowledged)); setBranchAck(Boolean(b.cross_branch_acknowledged)); setReleaseOdometer(""); setReleaseFuel("Other/Unknown"); setReleaseCondition(""); setDamageNotes(""); setAgreementAck(false); setConditionAck(false); setReturnAck(false); setReturnOdometer(""); setReturnFuel("Other/Unknown"); setReturnCondition(""); setReturnDamage(""); setReturnRemarks(""); }}
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
      {selected?.finder_context && <Card><div className="p-4"><h2 className="font-display text-lg font-semibold">Customer selection</h2><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><ReadOnlyFinderDetail label="Selection source" value="Smart Vehicle Finder" /><ReadOnlyFinderDetail label="Recommendation rank" value={`#${selected.finder_context.recommendation_rank}`} /><ReadOnlyFinderDetail label="Selected vehicle" value={selected.finder_context.selected_vehicle?.name ?? "—"} /><ReadOnlyFinderDetail label="Passenger requirement" value={String(selected.finder_context.passenger_count)} /><ReadOnlyFinderDetail label="Maximum Finder budget" value={formatFinderBudget(selected.finder_context.maximum_budget)} />{selected.finder_context.preferred_category?.name && <ReadOnlyFinderDetail label="Preferred category" value={selected.finder_context.preferred_category.name} />}{selected.finder_context.destination && <ReadOnlyFinderDetail label="Destination" value={selected.finder_context.destination} />}</div></div></Card>}
      {!staffView && selected?.booking_status === "Submitted" && <OperationalContextPanel context={operationalContext} loading={contextLoading} error={contextError} advisoryNote="Advisory only. Existing assignment and confirmation checks remain authoritative." />}
      {selected?.booking_status === "Submitted" && <Card><div className="space-y-3 p-4"><h2 className="font-display text-lg font-semibold">Assignment & confirmation</h2><p className="text-sm">Requested: {selected.requested_vehicle?.name ?? "—"} · {new Date(selected.pickup_at).toLocaleString()} → {new Date(selected.return_at).toLocaleString()}</p><p className="text-xs">Requirements: <b>{selected.requirement_status}</b> · Payment: <b>{selected.payment_status}</b></p><select className="input-control" value={vehicleId} onChange={(e) => { const nextVehicleId = e.target.value; if (nextVehicleId !== vehicleId) { setSubAck(false); setBranchAck(false); setNote(""); } setVehicleId(nextVehicleId); }}><option value="">Select active vehicle</option>{candidateVehicles.map((v) => { const conflicting = conflictingCandidateIds.has(v.id); return <option key={v.id} value={v.id} disabled={conflicting}>{v.name} · {v.license_plate ?? "No plate"} · {v.branch?.name ?? ""}{conflicting ? " — Conflicting confirmed booking" : " — Conflict-free"}</option>; })}</select>{vehicleId && conflictingCandidateIds.has(vehicleId) && <p className="text-xs text-destructive">This candidate conflicts with a confirmed booking and cannot be assigned.</p>}{substitutionWarning && <label className="block text-xs"><input type="checkbox" checked={subAck} onChange={(e) => setSubAck(e.target.checked)} /> I acknowledge this provisional substitution (CQ-007).</label>}{crossBranchWarning && <label className="block text-xs"><input type="checkbox" checked={branchAck} onChange={(e) => setBranchAck(e.target.checked)} /> I acknowledge this provisional cross-branch assignment (CQ-017).</label>}{(substitutionWarning || crossBranchWarning) && <textarea className="input-control" placeholder="Assignment note (required for this warning)" value={note} onChange={(e) => setNote(e.target.value)} />}<div className="flex gap-2"><Btn disabled={busy || !vehicleId || conflictingCandidateIds.has(vehicleId)} onClick={async () => { setBusy(true); const r = await fetch("/api/bookings", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body:JSON.stringify({action:"assign",bookingId:selected.id,vehicleId,assignmentNote:note,substitutionAcknowledged:subAck,crossBranchAcknowledged:branchAck}) }); setBusy(false); if (!r.ok) { alert((await r.json()).message); return; } await load(); setSelected(null); }}>Assign / Change</Btn><Btn disabled={busy || !selected.assigned_vehicle_id || !selected.assigned_at || selected.requirement_status !== "Verified" || selected.payment_status !== "Verified"} onClick={async () => { setBusy(true); const r = await fetch("/api/bookings", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body:JSON.stringify({action:"confirm",bookingId:selected.id,expectedAssignedVehicleId:selected.assigned_vehicle_id,expectedAssignedAt:selected.assigned_at}) }); setBusy(false); if (!r.ok) { alert((await r.json()).message); return; } await load(); setSelected(null); }}>Confirm booking</Btn><Btn variant="ghost" onClick={() => setSelected(null)}>Close</Btn></div><p className="text-[11px] text-muted-foreground">Maintenance readiness is not digitally available; no readiness pass is claimed.</p></div></Card>}
      {selected?.booking_status === "Confirmed" && <Card><div className="space-y-3 p-4"><h2 className="font-display text-lg font-semibold">Vehicle release / rental start</h2>{selected.rental ? selected.rental.ended_at ? <div className="space-y-2 text-sm"><p className="text-emerald-600">Vehicle returned {new Date(selected.rental.ended_at).toLocaleString()}</p><p>Release: {selected.rental.release_fuel_level} · {selected.rental.release_condition_summary}</p><p>Return: {selected.rental.return_fuel_level} · {selected.rental.return_condition_summary}</p>{selected.rental.return_odometer != null && selected.rental.release_odometer != null && <p>Driven: {(Number(selected.rental.return_odometer)-Number(selected.rental.release_odometer)).toFixed(2)} km</p>}<p className="text-xs">{new Date(selected.rental.ended_at) > new Date(selected.rental.scheduled_return_at) ? "Late return (informational)" : "Returned on time"}</p></div> : <div className="space-y-3"><p className="text-sm text-emerald-600">Released {new Date(selected.rental.started_at).toLocaleString()} · Active rental</p><p className="text-xs">Release: {selected.rental.release_odometer ?? "—"} km · {selected.rental.release_fuel_level} · {selected.rental.release_condition_summary}</p><div className="grid gap-2 sm:grid-cols-2"><input className="input-control" type="number" min="0" step="0.01" placeholder="Return odometer (optional)" value={returnOdometer} onChange={(e)=>setReturnOdometer(e.target.value)} /><select className="input-control" value={returnFuel} onChange={(e)=>setReturnFuel(e.target.value)}>{["Empty","1/4","1/2","3/4","Full","Other/Unknown"].map((x)=><option key={x}>{x}</option>)}</select></div><textarea className="input-control" placeholder="Return condition summary (required)" value={returnCondition} onChange={(e)=>setReturnCondition(e.target.value)} /><textarea className="input-control" placeholder="Observed damage / condition notes (optional)" value={returnDamage} onChange={(e)=>setReturnDamage(e.target.value)} /><textarea className="input-control" placeholder="Return remarks (optional)" value={returnRemarks} onChange={(e)=>setReturnRemarks(e.target.value)} /><div className="flex gap-2"><Btn disabled={busy || !returnCondition.trim()} onClick={async()=>{setBusy(true); const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action:"return",bookingId:selected.id,rentalId:selected.rental.id,expectedBookingId:selected.id,expectedVehicleId:selected.rental.vehicle_id,expectedStartedAt:selected.rental.started_at,returnOdometer:returnOdometer||null,returnFuelLevel:returnFuel,returnConditionSummary:returnCondition,observedDamageNotes:returnDamage,returnRemarks})}); setBusy(false); if(!r.ok){alert((await r.json()).message);return;} await load(); setSelected(null);}}>Record Vehicle Return</Btn><Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn></div><p className="text-[11px] text-muted-foreground">Physical return only; settlement, charges, and vehicle readiness remain separate.</p></div> : <><p className="text-sm">Assigned: {selected.assigned_vehicle?.name ?? "—"} · Pickup {new Date(selected.pickup_at).toLocaleString()} · Return {new Date(selected.return_at).toLocaleString()}</p><div className="grid gap-2 sm:grid-cols-2"><input className="input-control" type="number" min="0" step="0.01" placeholder="Release odometer (optional)" value={releaseOdometer} onChange={(e)=>setReleaseOdometer(e.target.value)} /><select className="input-control" value={releaseFuel} onChange={(e)=>setReleaseFuel(e.target.value)}>{["Empty","1/4","1/2","3/4","Full","Other/Unknown"].map((x)=><option key={x}>{x}</option>)}</select></div><textarea className="input-control" placeholder="Release condition summary (required)" value={releaseCondition} onChange={(e)=>setReleaseCondition(e.target.value)} /><textarea className="input-control" placeholder="Existing damage / condition notes (optional)" value={damageNotes} onChange={(e)=>setDamageNotes(e.target.value)} /><div className="space-y-1 text-xs"><label><input type="checkbox" checked={agreementAck} onChange={(e)=>setAgreementAck(e.target.checked)} /> Agreement coordinated</label><br/><label><input type="checkbox" checked={conditionAck} onChange={(e)=>setConditionAck(e.target.checked)} /> Existing condition reviewed</label><br/><label><input type="checkbox" checked={returnAck} onChange={(e)=>setReturnAck(e.target.checked)} /> Return schedule/reminders explained</label></div><div className="flex gap-2"><Btn disabled={busy || !releaseCondition.trim()} onClick={async()=>{setBusy(true); const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action:"release",bookingId:selected.id,expectedAssignedVehicleId:selected.assigned_vehicle_id,expectedConfirmedAt:selected.confirmed_at,releaseOdometer:releaseOdometer||null,releaseFuelLevel:releaseFuel,releaseConditionSummary:releaseCondition,existingDamageNotes:damageNotes,agreementAcknowledged:agreementAck,conditionAcknowledged:conditionAck,returnScheduleAcknowledged:returnAck})}); setBusy(false); if(!r.ok){alert((await r.json()).message);return;} await load(); setSelected(null);}}>Release Vehicle</Btn><Btn variant="ghost" onClick={()=>setSelected(null)}>Close</Btn></div><p className="text-[11px] text-muted-foreground">Provisional turnover fields; no settlement or return workflow is started.</p></>}</div></Card>}
      <RequirementReviewQueue />
    </div>
  );
}

function RequirementReviewQueue() {
  const [sets, setSets] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [busy, setBusy] = useState(false);
  const [govOutcome, setGovOutcome] = useState("Accepted"); const [govReason, setGovReason] = useState(""); const [licOutcome, setLicOutcome] = useState("Accepted"); const [licReason, setLicReason] = useState(""); const [identity, setIdentity] = useState("Consistent"); const [lto, setLto] = useState("Not Checked");
  const load = () => fetch("/api/requirements", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : null).then((d) => setSets(d?.requirementSets ?? [])).catch(() => undefined);
  useEffect(() => { load(); }, []);
  async function open(set: any) { const d = await fetch(`/api/requirements?bookingId=${set.booking_id}`, { credentials: "same-origin" }).then((r) => r.json()); setSelected({ ...set, ...d }); }
  async function review(status: string) {
    if (!selected) return; const gov = selected.documents.find((d: any) => d.requirement_type === "Valid Government ID" && d.is_current); const lic = selected.documents.find((d: any) => d.requirement_type === "Driver's License" && d.is_current); const body = { action: "review", requirementSetId: selected.id, governmentIdDocumentId: gov.id, governmentIdVersion: gov.version, governmentIdOutcome: govOutcome, governmentIdReason: govReason, driversLicenseDocumentId: lic.id, driversLicenseVersion: lic.version, driversLicenseOutcome: licOutcome, driversLicenseReason: licReason, identityConsistency: identity, ltoOutcome: lto, resultingStatus: status }; setBusy(true); const r = await fetch("/api/requirements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" }); setBusy(false); if (!r.ok) { const e = await r.json(); alert(e.message); return; } setSelected(null); load(); }
  const select = (value: string, onChange: (v: string) => void, options: string[]) => <select value={value} onChange={(e) => onChange(e.target.value)} className="input-control">{options.map((option) => <option key={option}>{option}</option>)}</select>;
  return <Card><div className="p-4"><h2 className="font-display text-lg font-semibold">Requirement review queue</h2>{sets.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No pending requirement reviews.</p> : <div className="mt-3 space-y-2">{sets.map((s) => <button key={s.id} onClick={() => open(s)} className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-secondary/40"><span>{s.booking?.customer?.full_name ?? "Customer"} · {s.booking_id.slice(0,8)}</span><Badge>Pending Review</Badge></button>)}</div>}{selected && <div className="mt-4 rounded-md border border-primary/30 p-4"><p className="text-sm font-semibold">Review {selected.booking?.customer?.full_name ?? "customer"}</p><div className="mt-3 space-y-2 text-xs">{selected.documents.filter((d: any) => d.is_current).map((d: any) => <div key={d.id} className="flex items-center justify-between"><span>{d.requirement_type} · v{d.version}</span><button className="text-primary underline" onClick={async () => { const w = window.open("about:blank", "_blank"); const r = await fetch(`/api/requirements?documentId=${d.id}`, { credentials: "same-origin" }); const x = await r.json(); if (r.ok && w) w.location.href = x.url; else w?.close(); }}>Open securely</button></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><label>Government ID {select(govOutcome, setGovOutcome, ["Accepted", "Needs Replacement"])}{govOutcome === "Needs Replacement" && <input className="input-control mt-1" placeholder="Customer-facing reason" value={govReason} onChange={(e) => setGovReason(e.target.value)} />}</label><label>Driver's License {select(licOutcome, setLicOutcome, ["Accepted", "Needs Replacement"])}{licOutcome === "Needs Replacement" && <input className="input-control mt-1" placeholder="Customer-facing reason" value={licReason} onChange={(e) => setLicReason(e.target.value)} />}</label><label>Identity {select(identity, setIdentity, ["Consistent", "Concern"])}</label><label>LTO {select(lto, setLto, ["Not Checked", "Clear", "Concern", "Unavailable"])}</label></div><div className="mt-4 flex gap-2"><Btn disabled={busy} onClick={() => review("Pending Review")}>Save Pending Review</Btn><Btn disabled={busy} onClick={() => review("Needs Resubmission")}>Request Resubmission</Btn><Btn disabled={busy} onClick={() => review("Verified")}>Verify</Btn><Btn variant="ghost" onClick={() => setSelected(null)}>Cancel</Btn></div></div>}</div></Card>;
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
function ReadOnlyFinderDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-secondary/30 p-3"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}
function formatFinderBudget(value: unknown) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value));
}
