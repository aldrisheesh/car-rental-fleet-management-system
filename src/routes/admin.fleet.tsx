import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, LayoutGrid, List, Wrench } from "lucide-react";
import {
  MaintenanceRecordDialog,
  type MaintenanceRecordDraft,
} from "@/components/admin/MaintenanceRecordDialog";
import { Badge, Btn, Card, KPI, PageHeader, TInput, TSelect, Toolbar } from "@/components/admin/ui";
import { bookings, fleet, peso, type FleetVehicle, type VehicleStatus } from "@/data/admin";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/fleet")({ component: FleetPage });

const statuses: (VehicleStatus | "All")[] = [
  "All",
  "Available",
  "Reserved",
  "Rented",
  "Maintenance",
  "Inactive",
];

const vehicleStatuses: VehicleStatus[] = [
  "Available",
  "Reserved",
  "Rented",
  "Maintenance",
  "Inactive",
];

const vehicleCategories = ["Economy", "Sedan", "SUV", "MPV", "Van", "Pickup"] as const;
const transmissionOptions = ["Automatic", "Manual"] as const;
const conditionOptions: FleetVehicle["condition"][] = ["Excellent", "Good", "Needs service"];
const branchOptions = ["Taft, Manila", "Antipolo, Rizal"] as const;

type AddVehicleDraft = {
  plate: string;
  make: string;
  model: string;
  color: string;
  seats: string;
  category: string;
  branch: string;
  status: VehicleStatus;
  chassisNumber: string;
  transmission: "Automatic" | "Manual";
  pricePerDay: string;
  condition: FleetVehicle["condition"];
};

function createAddVehicleDraft(): AddVehicleDraft {
  return {
    plate: "",
    make: "",
    model: "",
    color: "",
    seats: "",
    category: "Economy",
    branch: "Taft, Manila",
    status: "Available",
    chassisNumber: "",
    transmission: "Automatic",
    pricePerDay: "",
    condition: "Good",
  };
}

function FleetPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [q, setQ] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [draft, setDraft] = useState<MaintenanceRecordDraft>(() =>
    createDraftFromVehicle(fleet, 0),
  );
  const [fleetRows, setFleetRows] = useState<FleetVehicle[]>(fleet);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addVehicleDraft, setAddVehicleDraft] = useState<AddVehicleDraft>(() =>
    createAddVehicleDraft(),
  );
  const [addVehicleError, setAddVehicleError] = useState("");

  function getEffectiveStatus(vehicle: FleetVehicle) {
    return vehicle.status;
  }

  function handleVehicleBranchChange(vehicleId: string, branch: FleetVehicle["branch"]) {
    setFleetRows((prev) =>
      prev.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, branch } : vehicle)),
    );
  }

  const countAvailable = fleetRows.filter((v) => getEffectiveStatus(v) === "Available").length;
  const countReserved = fleetRows.filter((v) => getEffectiveStatus(v) === "Reserved").length;
  const countOngoing = fleetRows.filter((v) => getEffectiveStatus(v) === "Rented").length;
  const countUnderMaintenance = fleetRows.filter(
    (v) => getEffectiveStatus(v) === "Maintenance",
  ).length;
  const countCompletedRentals = bookings.filter((b) => b.status === "Completed").length;

  const rows = fleetRows
    .filter((vehicle) => {
      const effectiveStatus = getEffectiveStatus(vehicle);
      if (status !== "All" && effectiveStatus !== status) return false;
      if (
        q &&
        ![
          vehicle.name,
          vehicle.plate,
          vehicle.category,
          vehicle.make,
          vehicle.model,
          vehicle.color,
          vehicle.chassisNumber ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      return true;
    })
    .map((vehicle) => ({ ...vehicle, effectiveStatus: getEffectiveStatus(vehicle) }));

  function createDraftFromVehicle(sourceRows: FleetVehicle[], index = 0): MaintenanceRecordDraft {
    const vehicle = sourceRows[index] ?? sourceRows[0];
    const numericId = Number(vehicle?.id?.replace(/\D/g, "") || 1001);

    return {
      maintenance_id: String(numericId),
      vehicle_id: vehicle?.id ?? "",
      maintenance_type: "Preventive Maintenance",
      description: `${vehicle?.name ?? ""} (${vehicle?.plate ?? ""})`,
      maintenance_status: "Scheduled",
      scheduled_date: new Date().toISOString().slice(0, 10),
      completed_date: "",
      cost: "",
      performed_by: "",
      recorded_by: "1",
      created_at: new Date().toISOString(),
    };
  }

  function openServiceModalByVehicle(vehicleId: string) {
    const index = fleetRows.findIndex((vehicle) => vehicle.id === vehicleId);
    setDraft(createDraftFromVehicle(fleetRows, index >= 0 ? index : 0));
    setServiceModalOpen(true);
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
      addVehicleDraft.color,
      addVehicleDraft.seats,
      addVehicleDraft.category,
      addVehicleDraft.branch,
      addVehicleDraft.chassisNumber,
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

    const maxFleetId = fleetRows.reduce((maxId, vehicle) => {
      const numericId = Number(vehicle.id.replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
    }, 0);
    const nextNumericId = maxFleetId + 1;
    const generatedId = `F-${String(nextNumericId).padStart(3, "0")}`;

    const nextVehicle: FleetVehicle = {
      id: generatedId,
      name: `${addVehicleDraft.make.trim()} ${addVehicleDraft.model.trim()}`.trim(),
      plate: addVehicleDraft.plate.trim(),
      make: addVehicleDraft.make.trim(),
      model: addVehicleDraft.model.trim(),
      color: addVehicleDraft.color.trim(),
      category: addVehicleDraft.category.trim(),
      transmission: addVehicleDraft.transmission,
      seats,
      branch: addVehicleDraft.branch,
      pricePerDay,
      condition: addVehicleDraft.condition,
      status: addVehicleDraft.status,
      chassisNumber: addVehicleDraft.chassisNumber.trim(),
    };

    setFleetRows((prev) => [...prev, nextVehicle]);
    setAddVehicleOpen(false);
    setAddVehicleError("");
  }

  return (
    <div>
      <PageHeader
        title="Fleet management"
        subtitle="56 total vehicles across two branches — track condition, assignment, and pricing."
        actions={
          <Btn variant="primary" onClick={openAddVehicleModal}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Btn>
        }
      />

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
          label="Under maintenance"
          value={String(countUnderMaintenance)}
          delta="In service"
          icon={<Wrench className="h-4 w-4" />}
        />
        <KPI
          label="Completed rentals"
          value={String(countCompletedRentals)}
          delta="Bookings"
          icon={<Wrench className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4">
        <Toolbar>
          <TInput
            placeholder="Search vehicle or plate…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-72"
          />
          <TSelect value={status} onChange={(e) => setStatus(e.target.value as never)}>
            {statuses.map((currentStatus) => (
              <option key={currentStatus}>{currentStatus}</option>
            ))}
          </TSelect>
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("table")}
              className={`grid h-7 w-7 place-items-center rounded ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </Toolbar>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-secondary to-background">
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                  <TSelect
                    value={vehicle.branch}
                    onChange={(e) =>
                      handleVehicleBranchChange(
                        vehicle.id,
                        e.target.value as FleetVehicle["branch"],
                      )
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
                    {vehicle.category[0]}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {vehicle.category}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold">{vehicle.name}</h3>
                    <div className="font-mono text-xs text-muted-foreground">{vehicle.plate}</div>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                  <dt className="text-muted-foreground">Make</dt>
                  <dd className="text-right">{vehicle.make}</dd>
                  <dt className="text-muted-foreground">Model</dt>
                  <dd className="text-right">{vehicle.model}</dd>
                  <dt className="text-muted-foreground">Color</dt>
                  <dd className="text-right">{vehicle.color}</dd>
                  <dt className="text-muted-foreground">Chassis No.</dt>
                  <dd className="text-right font-mono text-[11px]">{vehicle.chassisNumber}</dd>
                  <dt className="text-muted-foreground">Transmission</dt>
                  <dd className="text-right">{vehicle.transmission}</dd>
                  <dt className="text-muted-foreground">Seats</dt>
                  <dd className="text-right">{vehicle.seats}</dd>
                  <dt className="text-muted-foreground">Condition</dt>
                  <dd className="text-right">{vehicle.condition}</dd>
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <div className="font-display text-lg font-semibold text-primary">
                      {peso(vehicle.pricePerDay)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      per day
                    </div>
                  </div>
                  <button
                    onClick={() => openServiceModalByVehicle(vehicle.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs hover:bg-secondary"
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
                <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
                <th className="px-4 py-3 text-left font-semibold">Plate</th>
                <th className="px-4 py-3 text-left font-semibold">Branch</th>
                <th className="px-4 py-3 text-left font-semibold">Condition</th>
                <th className="px-4 py-3 text-right font-semibold">Rate / day</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-border/60 hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.category} • {vehicle.transmission} • {vehicle.seats} seats
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {vehicle.make} • {vehicle.model} • {vehicle.color} • Chassis:{" "}
                      {vehicle.chassisNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{vehicle.plate}</td>
                  <td className="px-4 py-3">
                    <TSelect
                      value={vehicle.branch}
                      onChange={(e) =>
                        handleVehicleBranchChange(
                          vehicle.id,
                          e.target.value as FleetVehicle["branch"],
                        )
                      }
                      className="h-8 min-w-40 rounded-full text-xs"
                    >
                      {branchOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </TSelect>
                  </td>
                  <td className="px-4 py-3">{vehicle.condition}</td>
                  <td className="px-4 py-3 text-right font-display font-semibold">
                    {peso(vehicle.pricePerDay)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{vehicle.effectiveStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Btn variant="primary" onClick={() => openServiceModalByVehicle(vehicle.id)}>
                      Service now
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <MaintenanceRecordDialog
        open={serviceModalOpen}
        draft={draft}
        vehicles={fleetRows}
        onDraftChange={setDraft}
        onOpenChange={setServiceModalOpen}
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
                Chassis number
              </span>
              <TInput
                value={addVehicleDraft.chassisNumber}
                onChange={(e) => handleAddVehicleField("chassisNumber", e.target.value)}
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
                Color
              </span>
              <TInput
                value={addVehicleDraft.color}
                onChange={(e) => handleAddVehicleField("color", e.target.value)}
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
                onChange={(e) => handleAddVehicleField("category", e.target.value)}
              >
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
                onChange={(e) => handleAddVehicleField("branch", e.target.value)}
              >
                {branchOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </TSelect>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <TSelect
                value={addVehicleDraft.status}
                onChange={(e) => handleAddVehicleField("status", e.target.value as VehicleStatus)}
              >
                {vehicleStatuses.map((item) => (
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
                  handleAddVehicleField("transmission", e.target.value as "Automatic" | "Manual")
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
                onChange={(e) => handleAddVehicleField("pricePerDay", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Condition
              </span>
              <TSelect
                value={addVehicleDraft.condition}
                onChange={(e) =>
                  handleAddVehicleField("condition", e.target.value as FleetVehicle["condition"])
                }
              >
                {conditionOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </TSelect>
            </label>
          </div>

          {addVehicleError ? <p className="text-sm text-rose-400">{addVehicleError}</p> : null}

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
