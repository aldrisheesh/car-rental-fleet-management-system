import { createFileRoute, redirect } from "@tanstack/react-router";
import { MapPin, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import {
  buildAdminBranchRows,
  type CanonicalBranchRecord,
} from "@/lib/admin-branches";
import {
  fetchMasterData,
  saveMasterData,
  type ApiMasterVehicle,
} from "@/lib/master-data-client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type BranchRecord = CanonicalBranchRecord;

export const Route = createFileRoute("/admin/branches")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: BranchesPage,
});

function BranchesPage() {
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [vehicles, setVehicles] = useState<ApiMasterVehicle[]>([]);
  const [branchLoading, setBranchLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState("");
  const [vehicleLoadError, setVehicleLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchError, setBranchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deactivationBranch, setDeactivationBranch] =
    useState<BranchRecord | null>(null);
  const [deactivationSaving, setDeactivationSaving] = useState(false);
  const deactivationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deactivationSubmissionRef = useRef(false);
  const [feedback, setFeedback] = useState("");

  const loadBranches = useCallback(async () => {
    setBranchLoading(true);
    setBranchLoadError("");
    try {
      const nextBranches = await fetchMasterData<BranchRecord>("branches");
      setBranches(nextBranches);
    } catch (error) {
      setBranchLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load canonical branch data.",
      );
    } finally {
      setBranchLoading(false);
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    setVehicleLoading(true);
    setVehicleLoadError("");
    try {
      const nextVehicles = await fetchMasterData<ApiMasterVehicle>("vehicles");
      setVehicles(nextVehicles);
    } catch (error) {
      setVehicleLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load canonical vehicle assignments.",
      );
    } finally {
      setVehicleLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBranches();
    void loadVehicles();
  }, [loadBranches, loadVehicles]);

  const displayedBranches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return buildAdminBranchRows(branches, vehicles).filter((row) => {
      if (
        status !== "All" &&
        (row.record.is_active ? "Active" : "Inactive") !== status
      )
        return false;
      if (!normalized) return true;
      return `${row.record.name} ${row.record.address ?? ""}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [branches, query, status, vehicles]);

  function openBranchDialog(branch?: BranchRecord) {
    setEditingBranch(branch ?? null);
    setBranchName(branch?.name ?? "");
    setBranchAddress(branch?.address ?? "");
    setBranchError("");
    setDialogOpen(true);
  }

  async function saveBranch() {
    if (!branchName.trim()) {
      setBranchError("Branch name is required.");
      return;
    }
    setSaving(true);
    setBranchError("");
    setFeedback("");
    try {
      const saved = await saveMasterData<BranchRecord>({
        resource: "branches",
        ...(editingBranch ? { id: editingBranch.id } : {}),
        input: {
          name: branchName.trim(),
          address: branchAddress.trim() || null,
          isActive: editingBranch?.is_active ?? true,
        },
      });
      setBranches((current) =>
        editingBranch
          ? current.map((row) => (row.id === saved.id ? saved : row))
          : [...current, saved],
      );
      setDialogOpen(false);
      setFeedback(
        editingBranch ? "Branch details updated." : "Branch created.",
      );
    } catch (error) {
      setBranchError(
        error instanceof Error ? error.message : "Unable to save branch.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleBranch(branch: BranchRecord): Promise<boolean> {
    setSavingId(branch.id);
    setBranchError("");
    setFeedback("");
    try {
      const saved = await saveMasterData<BranchRecord>({
        resource: "branches",
        id: branch.id,
        input: {
          name: branch.name,
          address: branch.address,
          isActive: !branch.is_active,
        },
      });
      setBranches((current) =>
        current.map((row) => (row.id === saved.id ? saved : row)),
      );
      setFeedback(
        `${saved.name} is now ${saved.is_active ? "active" : "inactive"}.`,
      );
      return true;
    } catch (error) {
      setBranchError(
        error instanceof Error ? error.message : "Unable to update branch.",
      );
      return false;
    } finally {
      setSavingId(null);
    }
  }

  function requestBranchToggle(
    branch: BranchRecord,
    trigger: HTMLButtonElement,
  ) {
    if (branch.is_active) {
      deactivationTriggerRef.current = trigger;
      setDeactivationBranch(branch);
      setBranchError("");
      setFeedback("");
      return;
    }
    void toggleBranch(branch);
  }

  async function confirmBranchDeactivation() {
    const branch = deactivationBranch;
    if (!branch || deactivationSubmissionRef.current) return;

    deactivationSubmissionRef.current = true;
    setDeactivationSaving(true);
    try {
      const succeeded = await toggleBranch(branch);
      if (succeeded) setDeactivationBranch(null);
    } finally {
      deactivationSubmissionRef.current = false;
      setDeactivationSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Operational locations"
        subtitle="Manage internal allocation locations and their active state. These locations support operations; they are not customer delivery addresses."
        actions={
          <Btn variant="primary" onClick={() => openBranchDialog()}>
            <Plus className="h-4 w-4" /> New location
          </Btn>
        }
      />
      {feedback ? (
        <p
          className="mb-4 rounded-md border border-[#267a55]/30 bg-[#267a55]/5 px-4 py-3 text-sm text-[#267a55]"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}
      {branchError && !dialogOpen && !deactivationBranch ? (
        <p
          className="mb-4 rounded-md border border-[#b43b3b]/30 bg-[#b43b3b]/5 px-4 py-3 text-sm text-[#b43b3b]"
          role="alert"
        >
          {branchError}
        </p>
      ) : null}

      <Toolbar>
        <label className="min-w-60 flex-1">
          <span className="sr-only">Search operational locations</span>
          <TInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search location or address…"
            aria-label="Search operational locations"
          />
        </label>
        <label>
          <span className="sr-only">Filter location status</span>
          <TSelect
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter location status"
          >
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </TSelect>
        </label>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          {branchLoading
            ? "Loading operational locations…"
            : `${displayedBranches.length} canonical locations`}
        </span>
      </Toolbar>

      {branchLoading ? (
        <div role="status">
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Loading canonical operational locations…
          </Card>
        </div>
      ) : branchLoadError ? (
        <Card className="p-8 text-center">
          <p role="alert" className="text-sm text-[#b43b3b]">
            {branchLoadError}
          </p>
          <Btn className="mt-4" onClick={() => void loadBranches()}>
            <RefreshCw className="h-4 w-4" /> Retry locations
          </Btn>
        </Card>
      ) : !displayedBranches.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {branches.length
            ? "No locations match these filters."
            : "No canonical operational locations are available."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Operational location register"
            hint="Vehicle totals reflect each vehicle's current operational allocation location."
          />
          {vehicleLoadError ? (
            <p
              className="border-b border-border px-5 py-3 text-sm text-[#a45b13]"
              role="status"
            >
              Vehicle assignments unavailable: {vehicleLoadError}
            </p>
          ) : null}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Canonical branch management list
              </caption>
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">Location</th>
                  <th className="px-5 py-3 text-left font-semibold">Address</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Assigned vehicles
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedBranches.map((row) => (
                  <BranchRow
                    key={row.record.id}
                    row={row}
                    saving={savingId === row.record.id}
                    assignmentsUnavailable={
                      vehicleLoading || Boolean(vehicleLoadError)
                    }
                    onEdit={() => openBranchDialog(row.record)}
                    onToggle={(trigger) =>
                      requestBranchToggle(row.record, trigger)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border lg:hidden">
            {displayedBranches.map((row) => (
              <BranchDisclosure
                key={row.record.id}
                row={row}
                saving={savingId === row.record.id}
                assignmentsUnavailable={
                  vehicleLoading || Boolean(vehicleLoadError)
                }
                onEdit={() => openBranchDialog(row.record)}
                onToggle={(trigger) => requestBranchToggle(row.record, trigger)}
              />
            ))}
          </div>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !saving && setDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit operational location" : "New operational location"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Name *">
              <TInput
                value={branchName}
                onChange={(event) => setBranchName(event.target.value)}
              />
            </Field>
            <Field label="Operations address (optional)">
              <TInput
                value={branchAddress}
                onChange={(event) => setBranchAddress(event.target.value)}
              />
            </Field>
          </div>
          {branchError ? (
            <p className="text-sm text-[#b43b3b]" role="alert">
              {branchError}
            </p>
          ) : null}
          <DialogFooter>
            <Btn disabled={saving} onClick={() => setDialogOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              disabled={saving}
              onClick={() => void saveBranch()}
            >
              {saving ? "Saving…" : "Save location"}
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deactivationBranch)}
        onOpenChange={(open) => {
          if (!open && !deactivationSaving) setDeactivationBranch(null);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = deactivationTriggerRef.current;
            deactivationTriggerRef.current = null;
            if (trigger?.isConnected) {
              trigger.focus();
            } else {
              document
                .querySelector<HTMLElement>('[aria-label="Search branches"]')
                ?.focus();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Deactivate {deactivationBranch?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This branch will become inactive. Existing historical records
              remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {branchError && deactivationBranch ? (
            <p className="text-sm text-[#b43b3b]" role="alert">
              {branchError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deactivationSaving}
              className="min-h-11"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivationSaving}
              onClick={(event) => {
                event.preventDefault();
                void confirmBranchDeactivation();
              }}
              className="min-h-11 border border-[#b43b3b] bg-white px-4 text-sm font-semibold text-[#b43b3b] shadow-none hover:bg-[#fff2f1] focus-visible:ring-2 focus-visible:ring-[#0b6158] focus-visible:ring-offset-2"
            >
              {deactivationSaving ? "Deactivating…" : "Deactivate branch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BranchRow({
  row,
  saving,
  assignmentsUnavailable,
  onEdit,
  onToggle,
}: {
  row: ReturnType<typeof buildAdminBranchRows>[number];
  saving: boolean;
  assignmentsUnavailable: boolean;
  onEdit: () => void;
  onToggle: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <tr className="border-b border-border/60 align-top hover:bg-secondary/30">
      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <div className="font-medium">{row.record.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.record.id}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-muted-foreground">
        {row.record.address || "Address unavailable"}
      </td>
      <td className="px-5 py-4">
        <AssignmentCount
          label="Assigned vehicles"
          value={
            assignmentsUnavailable
              ? "Unavailable"
              : String(row.assignedVehicleCount)
          }
        />
      </td>
      <td className="px-5 py-4">
        <Badge>{row.record.is_active ? "Active" : "Inactive"}</Badge>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onEdit}>
            Edit
          </Btn>
          <Btn
            variant="ghost"
            disabled={saving}
            onClick={(event) => onToggle(event.currentTarget)}
          >
            {saving
              ? "Saving…"
              : row.record.is_active
                ? "Deactivate"
                : "Activate"}
          </Btn>
        </div>
      </td>
    </tr>
  );
}

function BranchDisclosure({
  row,
  saving,
  assignmentsUnavailable,
  onEdit,
  onToggle,
}: {
  row: ReturnType<typeof buildAdminBranchRows>[number];
  saving: boolean;
  assignmentsUnavailable: boolean;
  onEdit: () => void;
  onToggle: (trigger: HTMLButtonElement) => void;
}) {
  return (
    <details className="group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-medium">{row.record.name}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {row.record.address || "Address unavailable"}
          </div>
        </div>
        <Badge>{row.record.is_active ? "Active" : "Inactive"}</Badge>
      </summary>
      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Assigned vehicles
          </dt>
          <dd className="mt-1">
            <AssignmentCount
              label="Assigned vehicles"
              value={
                assignmentsUnavailable
                  ? "Unavailable"
                  : String(row.assignedVehicleCount)
              }
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Canonical id
          </dt>
          <dd className="mt-1 font-mono text-xs">{row.record.id}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="ghost" onClick={onEdit}>
          Edit
        </Btn>
        <Btn
          variant="ghost"
          disabled={saving}
          onClick={(event) => onToggle(event.currentTarget)}
        >
          {saving
            ? "Saving…"
            : row.record.is_active
              ? "Deactivate"
              : "Activate"}
        </Btn>
      </div>
    </details>
  );
}

function AssignmentCount({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <span className="tabular-nums">{value}</span>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
