import { createFileRoute, redirect } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Btn, Card, PageHeader } from "@/components/admin/ui";
import { TInput } from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [branchLoadError, setBranchLoadError] = useState("");
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleLoadError, setVehicleLoadError] = useState("");
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchError, setBranchError] = useState("");
  useEffect(() => {
    void fetchMasterData<BranchRecord>("branches")
      .then(setBranches)
      .catch((error: unknown) =>
        setBranchLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load canonical branch data.",
        ),
      )
      .finally(() => setBranchLoading(false));
    void fetchMasterData<ApiMasterVehicle>("vehicles")
      .then(setVehicles)
      .catch((error: unknown) =>
        setVehicleLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load canonical vehicle assignments.",
        ),
      )
      .finally(() => setVehicleLoading(false));
  }, []);
  const displayedBranches = buildAdminBranchRows(branches, vehicles);
  function openBranchDialog(branch?: BranchRecord) {
    setEditingBranch(branch ?? null);
    setBranchName(branch?.name ?? "");
    setBranchAddress(branch?.address ?? "");
    setBranchError("");
    setBranchDialogOpen(true);
  }
  function saveBranch() {
    void saveMasterData<BranchRecord>({
      resource: "branches",
      ...(editingBranch ? { id: editingBranch.id } : {}),
      input: {
        name: branchName,
        address: branchAddress,
        isActive: editingBranch?.is_active ?? true,
      },
    })
      .then((saved) => {
        setBranches((current) =>
          editingBranch
            ? current.map((row) => (row.id === saved.id ? saved : row))
            : [...current, saved],
        );
        setBranchDialogOpen(false);
      })
      .catch((error: unknown) =>
        setBranchError(
          error instanceof Error ? error.message : "Unable to save branch.",
        ),
      );
  }
  function toggleBranch(branch: BranchRecord) {
    void saveMasterData<BranchRecord>({
      resource: "branches",
      id: branch.id,
      input: {
        name: branch.name,
        address: branch.address,
        isActive: !branch.is_active,
      },
    })
      .then((saved) =>
        setBranches((current) =>
          current.map((row) => (row.id === saved.id ? saved : row)),
        ),
      )
      .catch((error: unknown) =>
        setBranchError(
          error instanceof Error ? error.message : "Unable to update branch.",
        ),
      );
  }
  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Manage canonical branches and their assigned vehicles."
        actions={
          <Btn variant="primary" onClick={() => openBranchDialog()}>
            <Plus className="h-4 w-4" /> New branch
          </Btn>
        }
      />

      {branchLoading || vehicleLoading ? (
        <Card>
          <p className="p-6 text-sm text-muted-foreground">
            Loading canonical branch data…
          </p>
        </Card>
      ) : branchLoadError ? (
        <Card>
          <p className="p-6 text-sm text-destructive" role="alert">
            {branchLoadError}
          </p>
        </Card>
      ) : displayedBranches.length === 0 ? (
        <Card>
          <p className="p-6 text-sm text-muted-foreground">
            No canonical branches are available.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {displayedBranches.map((branch) => (
            <Card key={branch.record.id}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> Branch
                    </div>
                    <h3 className="mt-1 break-words font-display text-2xl font-semibold">
                      {branch.record.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {branch.record.address ?? "Address unavailable"}
                    </p>
                  </div>
                  <Badge>
                    {branch.record.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-5 border-y border-border py-4">
                  <Stat
                    label="Assigned vehicles"
                    value={
                      vehicleLoadError
                        ? "Unavailable"
                        : String(branch.assignedVehicleCount)
                    }
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Btn
                    variant="ghost"
                    onClick={() => openBranchDialog(branch.record)}
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => toggleBranch(branch.record)}
                  >
                    {branch.record.is_active ? "Deactivate" : "Activate"}
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit branch" : "New branch"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <label className="text-sm">
              Name
              <TInput
                value={branchName}
                onChange={(event) => setBranchName(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Address
              <TInput
                value={branchAddress}
                onChange={(event) => setBranchAddress(event.target.value)}
              />
            </label>
            {branchError && (
              <p className="text-sm text-destructive" role="alert">
                {branchError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Btn onClick={() => setBranchDialogOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={saveBranch}>
              Save branch
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-xl font-semibold">{value}</div>
    </div>
  );
}
