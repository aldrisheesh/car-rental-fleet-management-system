import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, LayoutGrid, List, Wrench } from "lucide-react";
import {
  MaintenanceRecordDialog,
  type MaintenanceRecordDraft,
} from "@/components/admin/MaintenanceRecordDialog";
import {
  Badge,
  Btn,
  Card,
  KPI,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";
import {
  FLEET_STATUSES,
  type AdminFleetResponse,
  type FleetStatus,
  type FleetVehicleRow,
} from "@/lib/admin-fleet";
import { createMaintenancePayload } from "@/lib/maintenance-admin";
import { fetchMasterData, saveMasterData } from "@/lib/master-data-client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/fleet")({ component: FleetPage });

const statuses: (FleetStatus | "All")[] = ["All", ...FLEET_STATUSES];

const transmissionOptions = ["Automatic", "Manual"] as const;

type AddVehicleDraft = {
  plate: string;
  make: string;
  model: string;
  seats: string;
  category: string;
  branch: string;
  transmission: "Automatic" | "Manual";
  pricePerDay: string;
};

function createAddVehicleDraft(): AddVehicleDraft {
  return {
    plate: "",
    make: "",
    model: "",
    seats: "",
    category: "",
    branch: "",
    transmission: "Automatic",
    pricePerDay: "",
  };
}

function displayValue(value: string | number | null) {
  return value == null || value === "" ? "Unavailable" : String(value);
}

function formatPeso(value: number | null) {
  return value == null
    ? "Unavailable"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(value);
}

function FleetPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [q, setQ] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [draft, setDraft] = useState<MaintenanceRecordDraft>(() =>
    createDraftFromVehicle([], 0),
  );
  const [fleetSnapshot, setFleetSnapshot] = useState<AdminFleetResponse | null>(
    null,
  );
  const [fleetRows, setFleetRows] = useState<FleetVehicleRow[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetError, setFleetError] = useState("");
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addVehicleDraft, setAddVehicleDraft] = useState<AddVehicleDraft>(() =>
    createAddVehicleDraft(),
  );
  const [addVehicleError, setAddVehicleError] = useState("");
  const [branchUpdateError, setBranchUpdateError] = useState("");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState("");

  const loadFleet = useCallback(async () => {
    setFleetLoading(true);
    setFleetError("");
    try {
      const response = await fetch("/api/admin-fleet", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as
        | AdminFleetResponse
        | { message?: string }
        | null;
      if (
        !response.ok ||
        !body ||
        !("vehicles" in body) ||
        !Array.isArray(body.vehicles)
      )
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load the canonical fleet.",
        );
      const snapshot = body as AdminFleetResponse;
      setFleetSnapshot(snapshot);
      setFleetRows(snapshot.vehicles);
    } catch (error) {
      setFleetError(
        error instanceof Error
          ? error.message
          : "Unable to load the canonical fleet.",
      );
    } finally {
      setFleetLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFleet();
  }, [loadFleet]);

  const branchOptions = fleetSnapshot?.branches.map((item) => item.name) ?? [];
  const vehicleCategories =
    fleetSnapshot?.categories.map((item) => item.name) ?? [];

  function handleVehicleBranchChange(vehicleId: string, branch: string) {
    const vehicle = fleetRows.find((item) => item.id === vehicleId);
    if (!vehicle) return;
    setBranchUpdateError("");
    void Promise.all([
      fetchMasterData<{ id: string; name: string }>("branches"),
      fetchMasterData<{ id: string; name: string }>("categories"),
    ])
      .then(([branches, categories]) => {
        const branchRecord = branches.find((item) => item.name === branch);
        const categoryRecord = categories.find(
          (item) => item.id === vehicle.categoryId,
        );
        if (!branchRecord || !categoryRecord)
          throw new Error("Invalid branch or category.");
        return saveMasterData({
          resource: "vehicles",
          id: vehicleId,
          input: {
            name: vehicle.name,
            branchId: branchRecord.id,
            categoryId: categoryRecord.id,
            licensePlate: vehicle.plate,
            transmission: vehicle.transmission,
            seatCapacity: vehicle.seats,
            dailyRate: vehicle.pricePerDay,
            isActive: vehicle.isActive,
          },
        }).then(() => branchRecord.id);
      })
      .then((branchId) => {
        setFleetRows((prev) =>
          prev.map((item) =>
            item.id === vehicleId ? { ...item, branch, branchId } : item,
          ),
        );
      })
      .catch((error: unknown) => {
        setBranchUpdateError(
          error instanceof Error
            ? error.message
            : "Unable to update vehicle branch.",
        );
      });
  }

  const countAvailable = fleetRows.filter(
    (v) => v.status === "Available",
  ).length;
  const countReserved = fleetRows.filter((v) => v.status === "Reserved").length;
  const countOngoing = fleetRows.filter((v) => v.status === "Rented").length;
  const countUnderMaintenance = fleetRows.filter(
    (v) => !v.maintenanceReady,
  ).length;
  const countCompletedRentals =
    fleetSnapshot?.operational.completedRentals ?? 0;

  const rows = fleetRows
    .filter((vehicle) => {
      if (status !== "All" && vehicle.status !== status) return false;
      if (
        q &&
        ![
          vehicle.name,
          vehicle.plate ?? "",
          vehicle.category,
          vehicle.make,
          vehicle.model,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      return true;
    })
    .map((vehicle) => ({
      ...vehicle,
      effectiveStatus: vehicle.status,
    }));

  function createDraftFromVehicle(
    sourceRows: FleetVehicleRow[],
    index = 0,
  ): MaintenanceRecordDraft {
    const vehicle = sourceRows[index] ?? sourceRows[0];

    return {
      vehicleId: vehicle?.id ?? "",
      maintenanceType: "Preventive Maintenance",
      description: `${vehicle?.name ?? ""} (${vehicle?.plate ?? "No license plate"})`,
      blocksRentalUse: false,
      serviceStartedAt: "",
      odometerAtService: "",
      nextServiceOdometer: "",
      nextServiceDate: "",
      costPhp: "",
      remarks: "",
    };
  }

  function openServiceModalByVehicle(vehicleId: string) {
    const index = fleetRows.findIndex((vehicle) => vehicle.id === vehicleId);
    setMaintenanceError("");
    setDraft(createDraftFromVehicle(fleetRows, index >= 0 ? index : 0));
    setServiceModalOpen(true);
  }

  async function handleMaintenanceSave() {
    setMaintenanceSaving(true);
    setMaintenanceError("");
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(createMaintenancePayload(draft)),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(body?.message ?? "Unable to save maintenance record.");
      setServiceModalOpen(false);
      await loadFleet();
    } catch (error) {
      setMaintenanceError(
        error instanceof Error
          ? error.message
          : "Unable to save maintenance record.",
      );
    } finally {
      setMaintenanceSaving(false);
    }
  }

  function openAddVehicleModal() {
    setAddVehicleError("");
    setAddVehicleDraft(createAddVehicleDraft());
    setAddVehicleOpen(true);
  }

  function handleAddVehicleField<K extends keyof AddVehicleDraft>(
    key: K,
    value: AddVehicleDraft[K],
  ) {
    setAddVehicleDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddVehicleSubmit() {
    const required = [
      addVehicleDraft.plate,
      addVehicleDraft.make,
      addVehicleDraft.model,
      addVehicleDraft.seats,
      addVehicleDraft.category,
      addVehicleDraft.branch,
      addVehicleDraft.pricePerDay,
    ];
    if (required.some((value) => !String(value).trim())) {
      setAddVehicleError("Please fill in all required fields.");
      return;
    }

    const seats = Number(addVehicleDraft.seats);
    const pricePerDay = Number(addVehicleDraft.pricePerDay);
    if (!Number.isFinite(seats) || seats <= 0 || !Number.isInteger(seats)) {
      setAddVehicleError("Number of seats must be a valid whole number.");
      return;
    }
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
      setAddVehicleError("Rate per day must be greater than zero.");
      return;
    }

    const nextVehicle = {
      name: `${addVehicleDraft.make.trim()} ${addVehicleDraft.model.trim()}`.trim(),
      plate: addVehicleDraft.plate.trim(),
      category: addVehicleDraft.category.trim(),
      transmission: addVehicleDraft.transmission,
      seats,
      branch: addVehicleDraft.branch,
      pricePerDay,
    };

    void Promise.all([
      fetchMasterData<{ id: string; name: string }>("branches"),
      fetchMasterData<{ id: string; name: string }>("categories"),
    ])
      .then(([branches, categories]) => {
        const branch = branches.find(
          (item) => item.name === addVehicleDraft.branch,
        );
        const category = categories.find(
          (item) => item.name === addVehicleDraft.category,
        );
        if (!branch || !category)
          throw new Error("Select a valid branch and category.");
        return saveMasterData({
          resource: "vehicles",
          input: {
            name: nextVehicle.name,
            branchId: branch.id,
            categoryId: category.id,
            licensePlate: nextVehicle.plate,
            transmission: nextVehicle.transmission,
            seatCapacity: nextVehicle.seats,
            dailyRate: nextVehicle.pricePerDay,
            isActive: true,
          },
        });
      })
      .then(async () => {
        await loadFleet();
        setAddVehicleOpen(false);
        setAddVehicleError("");
      })
      .catch((error: unknown) =>
        setAddVehicleError(
          error instanceof Error ? error.message : "Unable to save vehicle.",
        ),
      );
  }

  return (
    <div>
      <PageHeader
        title="Fleet management"
        subtitle={
          fleetSnapshot
            ? `${fleetSnapshot.operational.totalVehicles} canonical vehicle${fleetSnapshot.operational.totalVehicles === 1 ? "" : "s"} across ${fleetSnapshot.operational.assignedBranches} assigned branch${fleetSnapshot.operational.assignedBranches === 1 ? "" : "es"}.`
            : "Loading the current canonical fleet state."
        }
        actions={
          <Btn variant="primary" onClick={openAddVehicleModal}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Btn>
        }
      />

      {fleetLoading && !fleetSnapshot && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading canonical fleet data…
        </Card>
      )}
      {fleetError && (
        <div
          className="mb-4 rounded-xl border border-destructive/40 bg-card p-4 text-sm"
          role="alert"
        >
          <p>{fleetError}</p>
          <Btn className="mt-3" onClick={() => void loadFleet()}>
            Retry loading fleet
          </Btn>
        </div>
      )}

      {fleetSnapshot ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KPI
              accent
              label="Available vehicles"
              value={String(countAvailable)}
              delta="Ready"
              icon={<Wrench className="h-4 w-4" />}
            />
            <KPI
              label="Reserved vehicles"
              value={String(countReserved)}
              delta="Queued"
              icon={<Wrench className="h-4 w-4" />}
            />
            <KPI
              label="Ongoing rentals"
              value={String(countOngoing)}
              delta="Out"
              icon={<Wrench className="h-4 w-4" />}
            />
            <KPI
              label="Readiness attention"
              value={String(countUnderMaintenance)}
              delta="Canonical state"
              icon={<Wrench className="h-4 w-4" />}
            />
            <KPI
              label="Completed rentals"
              value={String(countCompletedRentals)}
              delta="Canonical returns"
              icon={<Wrench className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4">
            <Toolbar>
              <TInput
                placeholder="Search vehicle or plate…"
                aria-label="Search fleet vehicles"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-72"
              />
              <TSelect
                aria-label="Filter fleet by status"
                value={status}
                onChange={(e) => setStatus(e.target.value as never)}
              >
                {statuses.map((currentStatus) => (
                  <option key={currentStatus}>{currentStatus}</option>
                ))}
              </TSelect>
              <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
                <button
                  aria-label="Switch to grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={`touch-target grid place-items-center rounded ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Switch to list view"
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                  className={`touch-target grid place-items-center rounded ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </Toolbar>
            {branchUpdateError && (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {branchUpdateError}
              </p>
            )}
          </div>

          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-secondary to-background">
                    <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                      <TSelect
                        aria-label={`Assign ${vehicle.name} to a branch`}
                        value={vehicle.branch ?? ""}
                        onChange={(e) =>
                          handleVehicleBranchChange(vehicle.id, e.target.value)
                        }
                        className="h-8 max-w-40 rounded-full border-white/15 bg-background/90 px-3 text-xs shadow-sm backdrop-blur"
                      >
                        {branchOptions.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </TSelect>
                      <Badge>{vehicle.effectiveStatus}</Badge>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl font-bold text-primary/70">
                        {(vehicle.category ?? "Unavailable")[0]}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {displayValue(vehicle.category)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold">
                          {vehicle.name}
                        </h3>
                        <div className="font-mono text-xs text-muted-foreground">
                          {displayValue(vehicle.plate)}
                        </div>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                      <dt className="text-muted-foreground">Make</dt>
                      <dd className="text-right">
                        {displayValue(vehicle.make)}
                      </dd>
                      <dt className="text-muted-foreground">Model</dt>
                      <dd className="text-right">
                        {displayValue(vehicle.model)}
                      </dd>
                      <dt className="text-muted-foreground">Transmission</dt>
                      <dd className="text-right">
                        {displayValue(vehicle.transmission)}
                      </dd>
                      <dt className="text-muted-foreground">Seats</dt>
                      <dd className="text-right">
                        {displayValue(vehicle.seats)}
                      </dd>
                      <dt className="text-muted-foreground">Readiness</dt>
                      <dd className="text-right">
                        {vehicle.maintenanceReady ? "Ready" : "Attention"}
                      </dd>
                      {!vehicle.maintenanceReady && (
                        <>
                          <dt className="text-muted-foreground">Reason</dt>
                          <dd className="text-right">
                            {vehicle.readinessReasons.join(", ")}
                          </dd>
                        </>
                      )}
                    </dl>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <div>
                        <div className="font-display text-lg font-semibold text-primary">
                          {formatPeso(vehicle.pricePerDay)}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          per day
                        </div>
                      </div>
                      <button
                        aria-label={`Schedule service for ${vehicle.name}`}
                        onClick={() => openServiceModalByVehicle(vehicle.id)}
                        className="touch-target inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs hover:bg-secondary"
                      >
                        <Wrench className="h-3.5 w-3.5" /> Service now
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Plate</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Readiness
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Rate / day
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-border/60 hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{vehicle.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {displayValue(vehicle.category)} •{" "}
                          {displayValue(vehicle.transmission)} •{" "}
                          {displayValue(vehicle.seats)} seats
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {displayValue(vehicle.make)} •{" "}
                          {displayValue(vehicle.model)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {displayValue(vehicle.plate)}
                      </td>
                      <td className="px-4 py-3">
                        <TSelect
                          aria-label={`Assign ${vehicle.name} to a branch`}
                          value={vehicle.branch ?? ""}
                          onChange={(e) =>
                            handleVehicleBranchChange(
                              vehicle.id,
                              e.target.value,
                            )
                          }
                          className="h-8 min-w-40 rounded-full text-xs"
                        >
                          {branchOptions.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </TSelect>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          {vehicle.maintenanceReady ? "Ready" : "Attention"}
                        </div>
                        {!vehicle.maintenanceReady && (
                          <div className="text-xs text-muted-foreground">
                            {vehicle.readinessReasons.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-display font-semibold">
                        {formatPeso(vehicle.pricePerDay)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{vehicle.effectiveStatus}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Btn
                          aria-label={`Schedule service for ${vehicle.name}`}
                          variant="primary"
                          onClick={() => openServiceModalByVehicle(vehicle.id)}
                        >
                          Service now
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : null}

      <MaintenanceRecordDialog
        open={serviceModalOpen}
        draft={draft}
        vehicles={fleetRows.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.plate ?? "No license plate",
          branch: vehicle.branch ?? undefined,
        }))}
        saving={maintenanceSaving}
        error={maintenanceError}
        onDraftChange={setDraft}
        onOpenChange={setServiceModalOpen}
        onSave={() => void handleMaintenanceSave()}
      />

      <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add vehicle</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plate number
              </span>
              <TInput
                value={addVehicleDraft.plate}
                onChange={(e) => handleAddVehicleField("plate", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Make
              </span>
              <TInput
                value={addVehicleDraft.make}
                onChange={(e) => handleAddVehicleField("make", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Model
              </span>
              <TInput
                value={addVehicleDraft.model}
                onChange={(e) => handleAddVehicleField("model", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Number of seats
              </span>
              <TInput
                type="number"
                min="1"
                value={addVehicleDraft.seats}
                onChange={(e) => handleAddVehicleField("seats", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vehicle type
              </span>
              <TSelect
                value={addVehicleDraft.category}
                onChange={(e) =>
                  handleAddVehicleField("category", e.target.value)
                }
              >
                <option value="">Select vehicle type</option>
                {vehicleCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </TSelect>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Branch
              </span>
              <TSelect
                value={addVehicleDraft.branch}
                onChange={(e) =>
                  handleAddVehicleField("branch", e.target.value)
                }
              >
                <option value="">Select branch</option>
                {branchOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </TSelect>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Transmission
              </span>
              <TSelect
                value={addVehicleDraft.transmission}
                onChange={(e) =>
                  handleAddVehicleField(
                    "transmission",
                    e.target.value as "Automatic" | "Manual",
                  )
                }
              >
                {transmissionOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </TSelect>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rate per day
              </span>
              <TInput
                type="number"
                min="1"
                value={addVehicleDraft.pricePerDay}
                onChange={(e) =>
                  handleAddVehicleField("pricePerDay", e.target.value)
                }
              />
            </label>
          </div>

          {addVehicleError ? (
            <p className="text-sm text-rose-400">{addVehicleError}</p>
          ) : null}

          <DialogFooter>
            <Btn onClick={() => setAddVehicleOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleAddVehicleSubmit}>
              Add vehicle
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
