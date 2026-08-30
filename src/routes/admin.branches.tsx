import { createFileRoute, redirect } from "@tanstack/react-router";
import { MapPin, Plus, TrendingUp } from "lucide-react";
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
import { branchPerformance, peso } from "@/data/admin";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import { fetchMasterData, saveMasterData } from "@/lib/master-data-client";

type BranchRecord = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
};

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
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchError, setBranchError] = useState("");
  useEffect(() => {
    void fetchMasterData<BranchRecord>("branches")
      .then(setBranches)
      .catch(() => undefined);
  }, []);
  const displayedBranches = branches.length
    ? branches.map((record) => ({
        ...(branchPerformance.find((branch) => branch.name === record.name) ?? {
          name: record.name,
          active: 0,
          fleet: 0,
          demand: 0,
          revenue: 0,
        }),
        record,
      }))
    : branchPerformance.map((record) => ({ ...record, record: null }));
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
        subtitle="Manage operations and growth across Luzon."
        actions={
          <Btn variant="primary" onClick={() => openBranchDialog()}>
            <Plus className="h-4 w-4" /> New branch
          </Btn>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {displayedBranches.map((b) => (
          <Card key={b.name}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />{" "}
                    {b.name === "Taft, Manila" ? "Flagship" : "Suburban hub"}
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-semibold">
                    {b.name}
                  </h3>
                </div>
                <Badge>{b.demand >= 70 ? "High demand" : "Steady"}</Badge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-y border-border py-4">
                <Stat label="Active rentals" value={String(b.active)} />
                <Stat label="Fleet on-site" value={String(b.fleet)} />
                <Stat label="Demand score" value={`${b.demand}%`} accent />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Monthly revenue
                  </div>
                  <div className="font-display text-2xl font-semibold text-primary">
                    {peso(b.revenue)}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" /> +
                  {b.name === "Taft, Manila" ? "11.2" : "8.4"}% MoM
                </span>
              </div>
              {b.record && (
                <div className="mt-4 flex gap-2">
                  <Btn
                    variant="ghost"
                    onClick={() => openBranchDialog(b.record)}
                  >
                    Edit
                  </Btn>
                  <Btn variant="ghost" onClick={() => toggleBranch(b.record)}>
                    {b.record.is_active ? "Deactivate" : "Activate"}
                  </Btn>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display text-xl font-semibold ${accent ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
