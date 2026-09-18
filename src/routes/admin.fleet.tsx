import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, CarFront, Image, MapPin, Plus, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaintenanceRecordDialog,
  type MaintenanceRecordDraft,
} from "@/components/admin/MaintenanceRecordDialog";
import {
  Btn,
  TInput,
  TSelect,
} from "@/components/admin/ui";
import {
  FLEET_STATUSES,
  type AdminFleetResponse,
  type FleetStatus,
  type FleetVehicleRow,
} from "@/lib/admin-fleet";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";
import { createMaintenancePayload } from "@/lib/maintenance-admin";
import {
  buildVehicleBranchUpdateInput,
  buildVehicleImageUpdateInput,
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

export const Route = createFileRoute("/admin/fleet")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: FleetPage,
});

const statuses: (FleetStatus | "All")[] = ["All", ...FLEET_STATUSES];
const transmissionOptions = ["Automatic", "Manual"] as const;

type AddVehicleDraft = {
  plate: string;
  make: string;
  model: string;
  seats: string;
  categoryId: string;
  branchId: string;
  transmission: (typeof transmissionOptions)[number];
  pricePerDay: string;
  imageUrl: string;
};

function emptyAddVehicleDraft(): AddVehicleDraft {
  return {
    plate: "",
    make: "",
    model: "",
    seats: "",
    categoryId: "",
    branchId: "",
    transmission: "Automatic",
    pricePerDay: "",
    imageUrl: "",
  };
}

function emptyMaintenanceDraft(
  vehicle?: FleetVehicleRow,
): MaintenanceRecordDraft {
  return {
    vehicleId: vehicle?.id ?? "",
    maintenanceType: "Preventive Maintenance",
    description: vehicle
      ? `${vehicle.name} (${vehicle.plate ?? "No license plate"})`
      : "",
    blocksRentalUse: false,
    serviceStartedAt: "",
    odometerAtService: "",
    nextServiceOdometer: "",
    nextServiceDate: "",
    costPhp: "",
    remarks: "",
  };
}

function displayValue(value: string | number | null | undefined) {
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
  const [snapshot, setSnapshot] = useState<AdminFleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [branch, setBranch] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [branchSavingId, setBranchSavingId] = useState<string | null>(null);
  const [mutationFeedback, setMutationFeedback] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceDraft, setServiceDraft] = useState<MaintenanceRecordDraft>(() =>
    emptyMaintenanceDraft(),
  );
  const [serviceSaving, setServiceSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<AddVehicleDraft>(() =>
    emptyAddVehicleDraft(),
  );
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSaving, setImageSaving] = useState(false);
  const [imageError, setImageError] = useState("");

  const loadFleet = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin-fleet", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as
        | AdminFleetResponse
        | { message?: string }
        | null;
      if (!response.ok || !body || !("vehicles" in body)) {
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load the canonical fleet.",
        );
      }
      setSnapshot(body);
      setSelectedId((current) =>
        current && body.vehicles.some((vehicle) => vehicle.id === current)
          ? current
          : (body.vehicles[0]?.id ?? null),
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load the canonical fleet.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFleet();
  }, [loadFleet]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (snapshot?.vehicles ?? []).filter((vehicle) => {
      if (status !== "All" && vehicle.status !== status) return false;
      if (branch !== "All" && vehicle.branchId !== branch) return false;
      if (!normalized) return true;
      return [
        vehicle.name,
        vehicle.plate,
        vehicle.category,
        vehicle.branch,
        vehicle.make,
        vehicle.model,
      ]
        .map((value) => value ?? "")
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [branch, query, snapshot, status]);

  const selectedVehicle =
    rows.find((vehicle) => vehicle.id === selectedId) ??
    snapshot?.vehicles.find((vehicle) => vehicle.id === selectedId) ??
    null;

  function openService(vehicle?: FleetVehicleRow) {
    setMutationError("");
    setServiceDraft(emptyMaintenanceDraft(vehicle));
    setServiceOpen(true);
  }

  async function saveService() {
    setServiceSaving(true);
    setMutationError("");
    setMutationFeedback("");
    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createMaintenancePayload(serviceDraft)),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
        active_rental_conflict?: boolean;
      } | null;
      if (!response.ok)
        throw new Error(
          body?.message ?? "Unable to create maintenance record.",
        );
      setServiceOpen(false);
      setMutationFeedback(
        body?.active_rental_conflict
          ? "Maintenance was recorded. The server reported an active-rental conflict; review the vehicle before taking it out of service."
          : "Maintenance record created.",
      );
      await loadFleet();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to create maintenance record.",
      );
    } finally {
      setServiceSaving(false);
    }
  }

  async function changeBranch(vehicle: FleetVehicleRow, branchId: string) {
    if (!branchId || branchId === vehicle.branchId) return;
    setBranchSavingId(vehicle.id);
    setMutationError("");
    setMutationFeedback("");
    try {
      const canonicalVehicle = (
        await fetchMasterData<ApiMasterVehicle>("vehicles")
      ).find((candidate) => candidate.id === vehicle.id);
      if (!canonicalVehicle) {
        throw new Error(
          "The selected vehicle is no longer available in canonical data. Reload the fleet before changing its branch.",
        );
      }
      await saveMasterData({
        resource: "vehicles",
        id: vehicle.id,
        input: buildVehicleBranchUpdateInput(canonicalVehicle, branchId),
      });
      setMutationFeedback(`${vehicle.name} allocation location updated.`);
      await loadFleet();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
            : "Unable to update the allocation location.",
      );
    } finally {
      setBranchSavingId(null);
    }
  }

  function updateAddDraft<K extends keyof AddVehicleDraft>(
    key: K,
    value: AddVehicleDraft[K],
  ) {
    setAddDraft((current) => ({ ...current, [key]: value }));
  }

  async function addVehicle() {
    const required = [
      addDraft.plate,
      addDraft.make,
      addDraft.model,
      addDraft.seats,
      addDraft.categoryId,
      addDraft.branchId,
      addDraft.pricePerDay,
    ];
    if (required.some((value) => !String(value).trim())) {
      setAddError("Complete the required vehicle fields before saving.");
      return;
    }
    const seats = Number(addDraft.seats);
    const dailyRate = Number(addDraft.pricePerDay);
    if (!Number.isInteger(seats) || seats <= 0) {
      setAddError("Seat capacity must be a positive whole number.");
      return;
    }
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      setAddError("Daily rate must be greater than zero.");
      return;
    }
    setAddSaving(true);
    setAddError("");
    try {
      await saveMasterData({
        resource: "vehicles",
        input: {
          name: `${addDraft.make.trim()} ${addDraft.model.trim()}`.trim(),
          branchId: addDraft.branchId,
          categoryId: addDraft.categoryId,
          licensePlate: addDraft.plate.trim(),
          transmission: addDraft.transmission,
          seatCapacity: seats,
          dailyRate,
          isActive: true,
          imageUrl: addDraft.imageUrl.trim() || null,
        },
      });
      await loadFleet();
      setAddOpen(false);
      setMutationFeedback("Vehicle added to the canonical fleet.");
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Unable to add vehicle.",
      );
    } finally {
      setAddSaving(false);
    }
  }

  function openImageEditor(vehicle: FleetVehicleRow) {
    setImageError("");
    setImageUrl(vehicle.imageUrl ?? "");
    setImageOpen(true);
  }

  async function saveVehicleImage() {
    if (!selectedVehicle) return;
    const normalizedUrl = imageUrl.trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      setImageError("Enter a complete public image URL, starting with https://.");
      return;
    }
    setImageSaving(true);
    setImageError("");
    setMutationError("");
    setMutationFeedback("");
    try {
      const canonicalVehicle = (
        await fetchMasterData<ApiMasterVehicle>("vehicles")
      ).find((candidate) => candidate.id === selectedVehicle.id);
      if (!canonicalVehicle) throw new Error("The selected vehicle is no longer available. Reload the fleet and try again.");
      await saveMasterData({
        resource: "vehicles",
        id: selectedVehicle.id,
        input: buildVehicleImageUpdateInput(canonicalVehicle, normalizedUrl || null),
      });
      setImageOpen(false);
      setMutationFeedback(`${selectedVehicle.name} image updated.`);
      await loadFleet();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Unable to update the vehicle image.");
    } finally {
      setImageSaving(false);
    }
  }

  const branches = snapshot?.branches ?? [];
  const categories = snapshot?.categories ?? [];
  const readinessExceptions = (snapshot?.vehicles ?? []).filter(
    (vehicle) => !vehicle.maintenanceReady,
  );

  return (
    <div className="admin-fleet-workspace">
      <header className="admin-fleet-heading">
        <div>
          <h1>Fleet</h1>
          <p>Review vehicle identity, current state, and readiness before the next booking.</p>
        </div>
        <Btn variant="primary" onClick={() => { setAddError(""); setAddDraft(emptyAddVehicleDraft()); setAddOpen(true); }}>
          <Plus className="h-4 w-4" /> Add vehicle
        </Btn>
      </header>

      {mutationFeedback ? (
        <p
          className="mb-4 rounded-md border border-[#267a55]/30 bg-[#267a55]/5 px-4 py-3 text-sm text-[#267a55]"
          role="status"
          aria-live="polite"
        >
          {mutationFeedback}
        </p>
      ) : null}
      {mutationError ? (
        <p
          className="mb-4 rounded-md border border-[#b43b3b]/30 bg-[#b43b3b]/5 px-4 py-3 text-sm text-[#b43b3b]"
          role="alert"
        >
          {mutationError}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <FleetLoading />
      ) : loadError ? (
        <section className="admin-fleet-message">
          <p className="text-sm text-[#b43b3b]" role="alert">
            {loadError}
          </p>
          <Btn className="mt-4" onClick={() => void loadFleet()}>
            Retry loading fleet
          </Btn>
        </section>
      ) : !rows.length ? (
        <section className="admin-fleet-message text-sm text-muted-foreground">
          {snapshot?.vehicles.length
            ? "No vehicles match these filters."
            : "No canonical vehicles are available."}
        </section>
      ) : (
        <>
          <section className="admin-fleet-ledger" aria-label="Fleet availability summary">
            <FleetMetric label="Available now" value={snapshot?.operational.availableVehicles ?? 0} tone="is-available" />
            <FleetMetric label="On rental" value={snapshot?.operational.ongoingRentals ?? 0} tone="is-rented" />
            <FleetMetric label="Reserved" value={snapshot?.operational.reservedVehicles ?? 0} tone="is-reserved" />
            <FleetMetric label="Needs attention" value={snapshot?.operational.readinessAttention ?? 0} tone="is-attention" />
          </section>

          <div className="admin-fleet-layout">
            <section className="admin-fleet-register" aria-labelledby="fleet-register-heading">
              <header className="admin-fleet-register__heading">
                <div>
                  <h2 id="fleet-register-heading">Vehicle register</h2>
                  <p>{rows.length} of {snapshot?.vehicles.length ?? 0} canonical vehicles</p>
                </div>
                <div className="admin-fleet-register__filters">
                  <label className="min-w-52 flex-1"><span className="sr-only">Search fleet</span><TInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vehicle or plate…" aria-label="Search fleet" /></label>
                  <label><span className="sr-only">Filter by state</span><TSelect value={status} onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])} aria-label="Filter fleet by state">{statuses.map((item) => <option key={item} value={item}>{item === "All" ? "All states" : item}</option>)}</TSelect></label>
                  <label><span className="sr-only">Filter by allocation location</span><TSelect value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Filter fleet by allocation location"><option value="All">All locations</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</TSelect></label>
                </div>
              </header>
              <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Canonical fleet vehicles</caption>
                <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-semibold">
                      Vehicle / plate
                    </th>
                    <th className="px-5 py-3 text-left font-semibold">Location</th>
                    <th className="px-5 py-3 text-left font-semibold">State</th>
                    <th className="px-5 py-3 text-left font-semibold">
                      Readiness
                    </th>
                    <th className="px-5 py-3 text-right font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((vehicle) => (
                    <FleetRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      selected={selectedId === vehicle.id}
                      onSelect={() => setSelectedId(vehicle.id)}
                    />
                  ))}
                </tbody>
              </table>
              </div>
            <div className="divide-y divide-border lg:hidden">
              {rows.map((vehicle) => (
                <FleetDisclosure
                  key={vehicle.id}
                  vehicle={vehicle}
                  branches={branches}
                  branchSaving={branchSavingId === vehicle.id}
                  onSelect={() => setSelectedId(vehicle.id)}
                  onBranchChange={(value) => void changeBranch(vehicle, value)}
                  onService={() => openService(vehicle)}
                />
              ))}
            </div>
            </section>

            <FleetDetail vehicle={selectedVehicle} onService={openService} onEditImage={openImageEditor} />
          </div>

          <FleetExceptions vehicles={readinessExceptions} onService={openService} />
        </>
      )}

      <MaintenanceRecordDialog
        open={serviceOpen}
        draft={serviceDraft}
        vehicles={(snapshot?.vehicles ?? []).map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.plate ?? "No license plate",
          branch: vehicle.branch ?? undefined,
        }))}
        saving={serviceSaving}
        error={serviceOpen ? mutationError : null}
        onDraftChange={setServiceDraft}
        onOpenChange={setServiceOpen}
        onSave={() => void saveService()}
      />

      <AddVehicleDialog
        open={addOpen}
        draft={addDraft}
        branches={branches}
        categories={categories}
        saving={addSaving}
        error={addError}
        onDraftChange={updateAddDraft}
        onOpenChange={setAddOpen}
        onSave={() => void addVehicle()}
      />

      <ImageUrlDialog
        open={imageOpen}
        vehicleName={selectedVehicle?.name ?? "vehicle"}
        value={imageUrl}
        saving={imageSaving}
        error={imageError}
        onChange={setImageUrl}
        onOpenChange={setImageOpen}
        onSave={() => void saveVehicleImage()}
      />
    </div>
  );
}

function FleetRow({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: FleetVehicleRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr className={`admin-fleet-row ${selected ? "is-selected" : ""}`}>
      <td className="px-5 py-4">
        <button
          className="admin-fleet-row__vehicle"
          onClick={onSelect}
          aria-label={`View details for ${vehicle.name}`}
        >
          <span className="font-medium">{vehicle.name}</span>
          <span className="mt-1 block font-mono text-xs text-muted-foreground">
            {displayValue(vehicle.plate)}
          </span>
        </button>
      </td>
      <td className="px-5 py-4 text-muted-foreground">
        <span className="admin-fleet-location"><MapPin className="h-3.5 w-3.5" /> {displayValue(vehicle.branch)}</span>
        <span className="mt-1 block text-xs">{displayValue(vehicle.category)} · {displayValue(vehicle.seats)} seats</span>
      </td>
      <td className="px-5 py-4">
        <FleetStatusMark status={vehicle.status} />
        <span className="mt-1 block text-xs text-muted-foreground">{currentUse(vehicle.status)}</span>
      </td>
      <td className="max-w-56 px-5 py-4">
        <Readiness vehicle={vehicle} />
      </td>
      <td className="px-5 py-4 text-right">
        <button type="button" className="admin-fleet-row__open" onClick={onSelect}>View</button>
      </td>
    </tr>
  );
}

function FleetDisclosure({
  vehicle,
  branches,
  branchSaving,
  onSelect,
  onBranchChange,
  onService,
}: Omit<Parameters<typeof FleetRow>[0], "selected">) {
  return (
    <details className="group px-5 py-4">
      <summary
        className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden"
        onClick={onSelect}
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-medium">{vehicle.name}</span>
          <span className="mt-1 block font-mono text-xs text-muted-foreground">
            {displayValue(vehicle.plate)}
          </span>
        </span>
        <span className="shrink-0">
          <FleetStatusMark status={vehicle.status} />
        </span>
      </summary>
      <div className="mt-4 grid gap-4 border-t border-border pt-4 text-sm">
        <Readiness vehicle={vehicle} />
        <div className="grid gap-1 text-muted-foreground">
          <span>Category</span>
          <strong className="font-medium text-foreground">
            {displayValue(vehicle.category)} ·{" "}
            {displayValue(vehicle.transmission)} · {displayValue(vehicle.seats)}{" "}
            seats
          </strong>
        </div>
        <div className="grid gap-1">
          <span className="text-muted-foreground">Allocation location</span>
          <TSelect
            value={vehicle.branchId ?? ""}
            disabled={branchSaving || !vehicle.categoryId}
            onChange={(event) => onBranchChange(event.target.value)}
            aria-label={`Allocation location for ${vehicle.name}`}
          >
            <option value="">Unassigned location</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </TSelect>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {currentUse(vehicle.status)}
          </span>
          <Btn variant="ghost" onClick={onService}>
            <Wrench className="h-4 w-4" /> Service
          </Btn>
        </div>
      </div>
    </details>
  );
}

function Readiness({ vehicle }: { vehicle: FleetVehicleRow }) {
  return (
    <span
      className={`admin-fleet-readiness ${vehicle.maintenanceReady ? "is-ready" : "is-not-ready"}`}
      title={vehicle.readinessReasons.join("; ")}
    >
      <i /> {vehicle.maintenanceReady ? "Ready" : "Needs attention"}
    </span>
  );
}

function FleetStatusMark({ status }: { status: FleetStatus }) {
  const tone = status === "Available" ? "is-available" : status === "Rented" ? "is-rented" : status === "Reserved" ? "is-reserved" : "is-attention";
  return <span className={`admin-fleet-status ${tone}`}><i /> {status}</span>;
}

function FleetMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={tone}>
      <i />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FleetExceptions({ vehicles, onService }: { vehicles: FleetVehicleRow[]; onService: (vehicle?: FleetVehicleRow) => void }) {
  return (
    <section className="admin-fleet-exceptions" aria-labelledby="fleet-exceptions-heading">
      <header>
        <div>
          <h2 id="fleet-exceptions-heading">Readiness exceptions</h2>
          <p>Vehicles that need attention before their next booking.</p>
        </div>
        <span>{vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}</span>
      </header>
      {vehicles.length ? (
        <ul>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <div><strong>{vehicle.name}</strong><span>{displayValue(vehicle.plate)} · {displayValue(vehicle.branch)}</span></div>
              <p>{vehicle.readinessReasons.join("; ")}</p>
              <Btn variant="ghost" onClick={() => onService(vehicle)}><Wrench className="h-4 w-4" /> Record service</Btn>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-fleet-exceptions__empty">Every vehicle is currently ready under the available maintenance data.</p>
      )}
    </section>
  );
}

function FleetLoading() {
  return (
    <div className="admin-fleet-loading" role="status" aria-label="Loading fleet data">
      <div className="admin-fleet-loading__metrics">{Array.from({ length: 4 }, (_, index) => <div key={index}><i /><span /><strong /></div>)}</div>
      <div className="admin-fleet-loading__workspace"><section><header><i /><span><i /><i /><i /></span></header>{Array.from({ length: 7 }, (_, index) => <div className="admin-fleet-loading__row" key={index}><i /><i /><i /><i /></div>)}</section><aside><i className="admin-fleet-loading__image" /><i className="admin-fleet-loading__vehicle" /><span><i /><i /></span><div>{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</div><footer><i /><i /></footer></aside></div>
    </div>
  );
}

function FleetDetail({
  vehicle,
  onService,
  onEditImage,
}: {
  vehicle: FleetVehicleRow | null;
  onService: (vehicle?: FleetVehicleRow) => void;
  onEditImage: (vehicle: FleetVehicleRow) => void;
}) {
  return (
    <aside className="admin-fleet-detail">
      {!vehicle ? (
        <p className="p-6 text-sm text-muted-foreground">
          Select a vehicle to inspect its canonical details.
        </p>
      ) : (
        <>
          <div className="admin-fleet-detail__identity">
            {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt="" /> : <div className="admin-fleet-detail__image-fallback"><CarFront /></div>}
            <div>
              <h2>{vehicle.name}</h2>
              <p>{displayValue(vehicle.plate)}</p>
            </div>
          </div>
          <div className="admin-fleet-detail__states">
            <FleetStatusMark status={vehicle.status} />
            <Readiness vehicle={vehicle} />
          </div>
          <dl className="admin-fleet-detail__facts">
            <Detail label="Allocation location"><MapPin className="h-4 w-4" /> {displayValue(vehicle.branch)}</Detail>
            <Detail label="Daily rate">{formatPeso(vehicle.pricePerDay)}</Detail>
            <Detail label="Category">{displayValue(vehicle.category)}</Detail>
            <Detail label="Seats">{displayValue(vehicle.seats)} seats</Detail>
            <Detail label="Transmission">{displayValue(vehicle.transmission)}</Detail>
            <Detail label="Status note">{currentUse(vehicle.status)}</Detail>
          </dl>
          <div className="admin-fleet-detail__actions">
            <div className="admin-fleet-detail__action-group">
              <a href="/admin/calendar" className="admin-fleet-detail__schedule"><CalendarDays className="h-4 w-4" /> View schedule</a>
              <Btn variant="ghost" className="admin-fleet-detail__service" onClick={() => onService(vehicle)}><Wrench className="h-4 w-4" /> Record service</Btn>
            </div>
            <div className="admin-fleet-detail__asset-action">
              <span>Vehicle image</span>
              <button type="button" className="admin-fleet-detail__image-link" onClick={() => onEditImage(vehicle)}><Image className="h-4 w-4" /> Change image</button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="mt-1 min-w-0 break-words">{children}</dd>
    </div>
  );
}

function currentUse(status: FleetStatus) {
  if (status === "Rented") return "Current rental activity";
  if (status === "Reserved") return "Confirmed reservation allocation";
  if (status === "Maintenance") return "Maintenance/readiness attention";
  if (status === "Inactive") return "Inactive in canonical vehicle data";
  return "No active rental or confirmed reservation";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function AddVehicleDialog({
  open,
  draft,
  branches,
  categories,
  saving,
  error,
  onDraftChange,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  draft: AddVehicleDraft;
  branches: AdminFleetResponse["branches"];
  categories: AdminFleetResponse["categories"];
  saving: boolean;
  error: string;
  onDraftChange: <K extends keyof AddVehicleDraft>(
    key: K,
    value: AddVehicleDraft[K],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !saving && onOpenChange(value)}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Plate number *">
            <TInput
              value={draft.plate}
              onChange={(event) => onDraftChange("plate", event.target.value)}
            />
          </Field>
          <Field label="Make *">
            <TInput
              value={draft.make}
              onChange={(event) => onDraftChange("make", event.target.value)}
            />
          </Field>
          <Field label="Model *">
            <TInput
              value={draft.model}
              onChange={(event) => onDraftChange("model", event.target.value)}
            />
          </Field>
          <Field label="Seat capacity *">
            <TInput
              type="number"
              min="1"
              value={draft.seats}
              onChange={(event) => onDraftChange("seats", event.target.value)}
            />
          </Field>
          <Field label="Category *">
            <TSelect
              value={draft.categoryId}
              onChange={(event) =>
                onDraftChange("categoryId", event.target.value)
              }
            >
              <option value="">Select category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Allocation location *">
            <TSelect
              value={draft.branchId}
              onChange={(event) =>
                onDraftChange("branchId", event.target.value)
              }
            >
              <option value="">Select branch</option>
              {branches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Transmission">
            <TSelect
              value={draft.transmission}
              onChange={(event) =>
                onDraftChange(
                  "transmission",
                  event.target.value as AddVehicleDraft["transmission"],
                )
              }
            >
              {transmissionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Daily rate (PHP) *">
            <TInput
              type="number"
              min="1"
              step="0.01"
              value={draft.pricePerDay}
              onChange={(event) =>
                onDraftChange("pricePerDay", event.target.value)
              }
            />
          </Field>
          <Field label="Vehicle image URL">
            <TInput
              type="url"
              value={draft.imageUrl}
              placeholder="https://…"
              onChange={(event) => onDraftChange("imageUrl", event.target.value)}
            />
          </Field>
        </div>
        {error ? (
          <p className="text-sm text-[#b43b3b]" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Btn disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Btn>
          <Btn variant="primary" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Add vehicle"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageUrlDialog({
  open,
  vehicleName,
  value,
  saving,
  error,
  onChange,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  vehicleName: string;
  value: string;
  saving: boolean;
  error: string;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change vehicle image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <p className="text-sm text-muted-foreground">
            Paste a public image URL for {vehicleName}. Leave it blank to remove the image.
          </p>
          <Field label="Public image URL">
            <TInput
              type="url"
              value={value}
              placeholder="https://…"
              onChange={(event) => onChange(event.target.value)}
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-[#b43b3b]" role="alert">{error}</p> : null}
        <DialogFooter>
          <Btn disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save image"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
