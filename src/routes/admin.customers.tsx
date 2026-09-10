import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
  TInput,
  Toolbar,
} from "@/components/admin/ui";
import { customers, peso } from "@/data/admin";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(customers[0]);

  const rows = customers.filter(
    (c) =>
      !q ||
      [c.id, c.name, c.email, c.phone]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Verify identities, monitor rental behavior, manage histories."
        actions={
          <Btn variant="primary">
            <UserPlus className="h-4 w-4" /> Add customer
          </Btn>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <Toolbar>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <TInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-full pl-9"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {rows.length} customers
            </span>
          </Toolbar>

          <Card>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Trips</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Lifetime spend
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40 ${selected.id === c.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.joined}
                    </td>
                    <td className="px-4 py-3 text-right">{c.trips}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold">
                      {peso(c.spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="self-start">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 font-display text-lg font-semibold text-primary">
                {selected.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {selected.name}
                </h3>
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <Row
                icon={<Mail className="h-4 w-4 text-primary" />}
                label="Email"
                value={selected.email}
              />
              <Row
                icon={<Phone className="h-4 w-4 text-primary" />}
                label="Phone"
                value={selected.phone}
              />
              <Row label="Customer ID" value={selected.id} />
              <Row label="Joined" value={selected.joined} />
              <Row label="Total trips" value={String(selected.trips)} />
              <Row label="Lifetime spend" value={peso(selected.spent)} />
            </dl>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
              <KPIish label="Ongoing" value="1" />
              <KPIish label="Completed" value={String(selected.trips - 1)} />
              <KPIish label="Cancelled" value="0" />
            </div>
          </div>

          <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
            Requirement documents and review decisions are shown below from the
            canonical, booking-linked workflow.
          </div>
        </Card>
      </div>
      <CanonicalRequirementReview />
    </div>
  );
}

type RequirementSetSummary = {
  id: string;
  booking_id: string;
  status:
    | "Not Submitted"
    | "Pending Review"
    | "Needs Resubmission"
    | "Verified";
  submitted_at: string | null;
  updated_at: string;
  booking?: {
    customer?: { id: string; full_name: string; email: string } | null;
    requested_vehicle?: { name: string } | null;
  } | null;
};

type RequirementDocument = {
  id: string;
  requirement_type: "Valid Government ID" | "Driver's License";
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  is_current: boolean;
  uploaded_at: string;
};

type RequirementReview = {
  government_id_outcome: string;
  government_id_reason: string | null;
  drivers_license_outcome: string;
  drivers_license_reason: string | null;
  identity_consistency: string;
  lto_outcome: string;
  resulting_status: string;
  reviewed_at: string;
};

type RequirementDetails = {
  requirementSet: RequirementSetSummary;
  documents: RequirementDocument[];
  reviews: RequirementReview[];
};

async function responseJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;
  if (!response.ok)
    throw new Error(body?.message ?? "Unable to load requirements.");
  if (!body) throw new Error("The requirements response was empty.");
  return body;
}

function CanonicalRequirementReview() {
  const [sets, setSets] = useState<RequirementSetSummary[]>([]);
  const [selected, setSelected] = useState<
    (RequirementSetSummary & RequirementDetails) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [governmentIdOutcome, setGovernmentIdOutcome] = useState("Accepted");
  const [governmentIdReason, setGovernmentIdReason] = useState("");
  const [driversLicenseOutcome, setDriversLicenseOutcome] =
    useState("Accepted");
  const [driversLicenseReason, setDriversLicenseReason] = useState("");
  const [identityConsistency, setIdentityConsistency] = useState("Consistent");
  const [ltoOutcome, setLtoOutcome] = useState("Not Checked");

  const loadSets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await responseJson<{
        requirementSets: RequirementSetSummary[];
      }>(
        await fetch("/api/requirements?view=all", {
          credentials: "same-origin",
        }),
      );
      setSets(data.requirementSets);
      return data.requirementSets;
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load requirements.",
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  async function openSet(set: RequirementSetSummary) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const details = await responseJson<RequirementDetails>(
        await fetch(
          `/api/requirements?bookingId=${encodeURIComponent(set.booking_id)}`,
          {
            credentials: "same-origin",
          },
        ),
      );
      setSelected({ ...set, ...details, ...details.requirementSet });
      setGovernmentIdOutcome("Accepted");
      setGovernmentIdReason("");
      setDriversLicenseOutcome("Accepted");
      setDriversLicenseReason("");
      setIdentityConsistency("Consistent");
      setLtoOutcome("Not Checked");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load requirements.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(documentId: string) {
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      const data = await responseJson<{ url: string }>(
        await fetch(
          `/api/requirements?documentId=${encodeURIComponent(documentId)}`,
          {
            credentials: "same-origin",
          },
        ),
      );
      if (popup) popup.location.href = data.url;
      else setError("Allow pop-ups to open this protected document.");
    } catch (documentError) {
      popup?.close();
      setError(
        documentError instanceof Error
          ? documentError.message
          : "Unable to open document.",
      );
    }
  }

  async function submitReview(
    resultingStatus: "Needs Resubmission" | "Verified",
  ) {
    if (!selected) return;
    const currentDocuments = selected.documents.filter(
      (document) => document.is_current,
    );
    const governmentId = currentDocuments.find(
      (document) => document.requirement_type === "Valid Government ID",
    );
    const driversLicense = currentDocuments.find(
      (document) => document.requirement_type === "Driver's License",
    );
    if (!governmentId || !driversLicense) {
      setError(
        "Both current requirement documents are required before review.",
      );
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      await responseJson(
        await fetch("/api/requirements", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "review",
            requirementSetId: selected.id,
            governmentIdDocumentId: governmentId.id,
            governmentIdVersion: governmentId.version,
            governmentIdOutcome,
            governmentIdReason,
            driversLicenseDocumentId: driversLicense.id,
            driversLicenseVersion: driversLicense.version,
            driversLicenseOutcome,
            driversLicenseReason,
            identityConsistency,
            ltoOutcome,
            resultingStatus,
          }),
        }),
      );
      const refreshedSets = await loadSets();
      const refreshed = refreshedSets.find((set) => set.id === selected.id);
      if (refreshed) await openSet(refreshed);
      setNotice(`Canonical requirement status saved as ${resultingStatus}.`);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to save review.",
      );
    } finally {
      setBusy(false);
    }
  }

  const currentDocuments =
    selected?.documents.filter((document) => document.is_current) ?? [];
  const latestReview = selected?.reviews[0];
  const canReview = selected?.status === "Pending Review";

  return (
    <Card className="mt-4">
      <CardHeader
        title="Canonical renter requirements"
        right={
          <Btn
            type="button"
            variant="ghost"
            disabled={loading || busy}
            onClick={() => void loadSets()}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Btn>
        }
      />
      <div className="grid lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.5fr)]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          {loading && (
            <p className="p-5 text-sm text-muted-foreground">
              Loading canonical requirements…
            </p>
          )}
          {!loading && sets.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No canonical requirement sets found.
            </p>
          )}
          <div className="max-h-[36rem] divide-y divide-border overflow-y-auto">
            {sets.map((set) => (
              <button
                key={set.id}
                type="button"
                onClick={() => void openSet(set)}
                className={`w-full p-4 text-left transition-colors hover:bg-secondary/40 ${selected?.id === set.id ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {set.booking?.customer?.full_name ?? "Customer"}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {set.booking?.customer?.email ?? "Email not available"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {set.booking?.requested_vehicle?.name ??
                        "Vehicle not available"}{" "}
                      · Booking …{set.booking_id.slice(-6)}
                    </div>
                  </div>
                  <Badge>{set.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm"
            >
              {notice}
            </div>
          )}
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              Select a booking-linked requirement set to inspect its canonical
              state and files.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    {selected.booking?.customer?.full_name ??
                      "Customer requirements"}
                  </h3>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    Booking {selected.booking_id}
                  </p>
                </div>
                <Badge>{selected.status}</Badge>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current submitted documents
                </h4>
                {currentDocuments.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No current documents submitted.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                    {currentDocuments.map((document) => (
                      <li
                        key={document.id}
                        className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            {document.requirement_type}
                          </div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {document.original_filename} · version{" "}
                            {document.version}
                          </div>
                        </div>
                        <Btn
                          type="button"
                          variant="ghost"
                          onClick={() => void openDocument(document.id)}
                        >
                          <Eye className="h-4 w-4" /> Open securely
                        </Btn>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {canReview ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReviewOutcomeField
                      label="Valid Government ID"
                      outcome={governmentIdOutcome}
                      setOutcome={setGovernmentIdOutcome}
                      reason={governmentIdReason}
                      setReason={setGovernmentIdReason}
                    />
                    <ReviewOutcomeField
                      label="Driver's License"
                      outcome={driversLicenseOutcome}
                      setOutcome={setDriversLicenseOutcome}
                      reason={driversLicenseReason}
                      setReason={setDriversLicenseReason}
                    />
                    <label className="text-xs font-medium text-muted-foreground">
                      Identity consistency
                      <select
                        className="input-control mt-1"
                        value={identityConsistency}
                        onChange={(event) =>
                          setIdentityConsistency(event.target.value)
                        }
                      >
                        <option>Consistent</option>
                        <option>Concern</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-muted-foreground">
                      Manual LTO check outcome (no document upload required)
                      <select
                        className="input-control mt-1"
                        value={ltoOutcome}
                        onChange={(event) => setLtoOutcome(event.target.value)}
                      >
                        <option>Not Checked</option>
                        <option>Clear</option>
                        <option>Concern</option>
                        <option>Unavailable</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      type="button"
                      variant="danger"
                      disabled={busy || currentDocuments.length < 2}
                      onClick={() => void submitReview("Needs Resubmission")}
                    >
                      Request resubmission
                    </Btn>
                    <Btn
                      type="button"
                      variant="primary"
                      disabled={busy || currentDocuments.length < 2}
                      onClick={() => void submitReview("Verified")}
                    >
                      Verify requirements
                    </Btn>
                  </div>
                </div>
              ) : latestReview ? (
                <div className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                  <ReviewResult
                    label="Government ID"
                    value={latestReview.government_id_outcome}
                    reason={latestReview.government_id_reason}
                  />
                  <ReviewResult
                    label="Driver's License"
                    value={latestReview.drivers_license_outcome}
                    reason={latestReview.drivers_license_reason}
                  />
                  <ReviewResult
                    label="Identity"
                    value={latestReview.identity_consistency}
                  />
                  <ReviewResult
                    label="LTO check"
                    value={latestReview.lto_outcome}
                  />
                </div>
              ) : (
                <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                  This requirement set is not currently reviewable.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReviewOutcomeField({
  label,
  outcome,
  setOutcome,
  reason,
  setReason,
}: {
  label: string;
  outcome: string;
  setOutcome: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="input-control mt-1"
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
      >
        <option>Accepted</option>
        <option>Needs Replacement</option>
      </select>
      {outcome === "Needs Replacement" && (
        <input
          className="input-control mt-2"
          placeholder="Customer-facing replacement reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      )}
    </label>
  );
}

function ReviewResult({
  label,
  value,
  reason,
}: {
  label: string;
  value: string;
  reason?: string | null;
}) {
  return (
    <div className="rounded-md bg-secondary/40 p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
      {reason && (
        <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function KPIish({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/60 p-3 text-center">
      <div className="font-display text-lg font-semibold text-primary">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
