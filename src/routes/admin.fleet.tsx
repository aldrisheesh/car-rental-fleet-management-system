import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Image,
  MapPin,
  Plus,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaintenanceRecordDialog,
  type MaintenanceRecordDraft,
} from "@/components/admin/MaintenanceRecordDialog";
import { Btn, TInput, TSelect } from "@/components/admin/ui";
import {
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

const vehicleTabs: { label: string; status: FleetStatus | "All" }[] = [
  { label: "All vehicles", status: "All" },
  { label: "Available", status: "Available" },
  { label: "Reserved", status: "Reserved" },
  { label: "On rental", status: "Rented" },
  { label: "For/Under Maintenance", status: "Maintenance" },
];
// Keep every fleet state on the same calm, non-scrolling canvas. More vehicles
// are deliberately reached through the pager instead of extending the register.
const pageSize = 4;
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
    scheduledFor: new Date(
      Date.now() - new Date().getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16),
    currentOdometer: "",
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

function matchesFleetSearch(vehicle: FleetVehicleRow, normalizedQuery: string) {
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
    .includes(normalizedQuery);
}

function FleetPage() {
  const [snapshot, setSnapshot] = useState<AdminFleetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FleetStatus | "All">("All");
  const [page, setPage] = useState(1);
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
  const [inspectionRemarks, setInspectionRemarks] = useState("");
  const [inspectionSaving, setInspectionSaving] = useState(false);

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
    const filtered = (snapshot?.vehicles ?? []).filter((vehicle) =>
      normalized
        ? matchesFleetSearch(vehicle, normalized)
        : status === "All" || vehicle.status === status,
    );
    return [...filtered].sort((left, right) => {
      if (branch !== "All") {
        const leftPreferred = left.branchId === branch ? 0 : 1;
        const rightPreferred = right.branchId === branch ? 0 : 1;
        if (leftPreferred !== rightPreferred) return leftPreferred - rightPreferred;
      }
      return (left.branch ?? "").localeCompare(right.branch ?? "") ||
        left.name.localeCompare(right.name);
    });
  }, [branch, query, snapshot, status]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [page, rows],
  );

  useEffect(() => {
    setPage(1);
  }, [branch, query, status]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedId((current) =>
      current && pageRows.some((vehicle) => vehicle.id === current)
        ? current
        : (pageRows[0]?.id ?? null),
    );
  }, [pageRows]);

  const selectedVehicle =
    pageRows.find((vehicle) => vehicle.id === selectedId) ?? null;

  function handleSearchChange(value: string) {
    setQuery(value);
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      setStatus("All");
      return;
    }

    const matches = (snapshot?.vehicles ?? []).filter((vehicle) =>
      matchesFleetSearch(vehicle, normalized),
    );
    const matchedStatuses = new Set(matches.map((vehicle) => vehicle.status));
    setStatus(
      matchedStatuses.size === 1 ? (matches[0]?.status ?? "All") : "All",
    );
  }

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
      setImageError(
        "Enter a complete public image URL, starting with https://.",
      );
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
      if (!canonicalVehicle)
        throw new Error(
          "The selected vehicle is no longer available. Reload the fleet and try again.",
        );
      await saveMasterData({
        resource: "vehicles",
        id: selectedVehicle.id,
        input: buildVehicleImageUpdateInput(
          canonicalVehicle,
          normalizedUrl || null,
        ),
      });
      setImageOpen(false);
      setMutationFeedback(`${selectedVehicle.name} image updated.`);
      await loadFleet();
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : "Unable to update the vehicle image.",
      );
    } finally {
      setImageSaving(false);
    }
  }

  async function resolveInspection(
    outcome: "Cleared" | "Maintenance scheduled",
  ) {
    if (!selectedVehicle?.pendingInspection) return;
    setInspectionSaving(true);
    setMutationError("");
    setMutationFeedback("");
    try {
      const response = await fetch("/api/admin-fleet", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "resolve-inspection",
          rentalId: selectedVehicle.pendingInspection.rentalId,
          outcome,
          remarks: inspectionRemarks,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(
          body?.message ?? "Unable to update the return inspection.",
        );
      if (outcome === "Maintenance scheduled") {
        setServiceDraft({
          ...emptyMaintenanceDraft(selectedVehicle),
          blocksRentalUse: true,
          remarks: inspectionRemarks,
        });
        setServiceOpen(true);
        setMutationFeedback(
          "Inspection recorded. Schedule the maintenance work to keep the vehicle unavailable.",
        );
      } else {
        setMutationFeedback(
          `${selectedVehicle.name} was cleared and is available when no other operational constraint applies.`,
        );
      }
      setInspectionRemarks("");
      await loadFleet();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to update the return inspection.",
      );
    } finally {
      setInspectionSaving(false);
    }
  }

  const branches = snapshot?.branches ?? [];
  const categories = snapshot?.categories ?? [];
  const showRentalReadiness = status !== "Reserved" && status !== "Rented";
  const tabCount = (tabStatus: FleetStatus | "All") =>
    tabStatus === "All"
      ? (snapshot?.vehicles.length ?? 0)
      : (snapshot?.vehicles.filter((vehicle) => vehicle.status === tabStatus)
          .length ?? 0);

  return (
    <div className="admin-fleet-workspace">
      <header className="admin-fleet-heading">
        <div>
          <h1>Fleet Management</h1>
        </div>
        <div className="admin-fleet-heading__actions">
          <label className="admin-fleet-search">
            <span className="sr-only">Search fleet</span>
            <TInput value={query} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search vehicle or plate…" aria-label="Search fleet" />
          </label>
          {status === "Maintenance" ? <Link to="/admin/maintenance" className="admin-fleet-maintenance-link"><Wrench className="h-4 w-4" /> Manage maintenance</Link> : null}
          <Btn variant="primary" onClick={() => { setAddError(""); setAddDraft(emptyAddVehicleDraft()); setAddOpen(true); }}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Btn>
        </div>
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
      ) : (
        <>
          <section
            className="admin-fleet-ledger"
            aria-label="Vehicle status filters"
          >
            {vehicleTabs.map((tab) => (
              <button
                key={tab.status}
                type="button"
                className={`admin-fleet-status-tab ${status === tab.status ? "is-active" : ""}`}
                onClick={() => setStatus(tab.status)}
                aria-pressed={status === tab.status}
              >
                <span>{tab.label}</span>
                <strong>{tabCount(tab.status)}</strong>
              </button>
            ))}
          </section>

          <div className="admin-fleet-layout">
            <section
              className="admin-fleet-register"
              aria-labelledby="fleet-register-heading"
            >
              <header className="admin-fleet-register__heading">
                <div>
                  <h2 id="fleet-register-heading">Vehicle register</h2>
                  <p>
                    {rows.length} matching vehicle{rows.length === 1 ? "" : "s"}{" "}
                    · page {page} of {totalPages}
                  </p>
                </div>
                <label className="admin-fleet-branch-sort">
                  <span>Sort by branch</span>
                  <TSelect value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Sort fleet by branch">
                    <option value="All">All branches</option>
                    {branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </TSelect>
                </label>
              </header>
              {rows.length ? (
                <>
                  <div className="admin-fleet-register__rows hidden overflow-hidden lg:block">
                    <table className="w-full text-sm">
                  <caption className="sr-only">
                    Canonical fleet vehicles
                  </caption>
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left font-semibold">
                        Vehicle / plate
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        Branch location
                      </th>
                      <th className="px-5 py-3 text-left font-semibold">
                        State
                      </th>
                      {showRentalReadiness ? (
                        <th className="px-5 py-3 text-left font-semibold">
                          Rental readiness
                        </th>
                      ) : null}
                      <th className="px-5 py-3 text-right font-semibold">
                        Open
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((vehicle) => (
                      <FleetRow
                        key={vehicle.id}
                        vehicle={vehicle}
                        selected={selectedId === vehicle.id}
                        showRentalReadiness={showRentalReadiness}
                        onSelect={() => setSelectedId(vehicle.id)}
                      />
                    ))}
                  </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-border lg:hidden">
                    {pageRows.map((vehicle) => (
                  <FleetDisclosure
                    key={vehicle.id}
                    vehicle={vehicle}
                    branches={branches}
                    branchSaving={branchSavingId === vehicle.id}
                    onSelect={() => setSelectedId(vehicle.id)}
                    onBranchChange={(value) =>
                      void changeBranch(vehicle, value)
                    }
                    onService={() => openService(vehicle)}
                  />
                    ))}
                  </div>
                  <FleetPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </>
              ) : (
                <FleetEmptyState
                  hasVehicles={Boolean(snapshot?.vehicles.length)}
                  status={status}
                  onReset={() => {
                    setQuery("");
                    setStatus("All");
                    setBranch("All");
                  }}
                />
              )}
            </section>

            <FleetDetail
              vehicle={rows.length ? selectedVehicle : null}
              inspectionRemarks={inspectionRemarks}
              inspectionSaving={inspectionSaving}
              onInspectionRemarksChange={setInspectionRemarks}
              onResolveInspection={resolveInspection}
              onService={openService}
              onEditImage={openImageEditor}
            />
          </div>
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
  showRentalReadiness,
  onSelect,
}: {
  vehicle: FleetVehicleRow;
  selected: boolean;
  showRentalReadiness: boolean;
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
        <span className="admin-fleet-location">
          <MapPin className="h-3.5 w-3.5" /> {displayValue(vehicle.branch)}
        </span>
      </td>
      <td className="px-5 py-4">
        <FleetStatusMark status={vehicle.status} />
        <span className="mt-1 block text-xs text-muted-foreground">
          {currentUse(vehicle.status)}
        </span>
      </td>
      {showRentalReadiness ? (
        <td className="max-w-56 px-5 py-4">
          <Readiness vehicle={vehicle} />
        </td>
      ) : null}
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          className="admin-fleet-row__open"
          onClick={onSelect}
        >
          View
        </button>
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
}: {
  vehicle: FleetVehicleRow;
  branches: AdminFleetResponse["branches"];
  branchSaving: boolean;
  onSelect: () => void;
  onBranchChange: (branchId: string) => void;
  onService: () => void;
}) {
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
          {vehicle.status === "Available" ? (
            <Btn variant="ghost" onClick={onService}>
              <Wrench className="h-4 w-4" /> Service
            </Btn>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function Readiness({ vehicle }: { vehicle: FleetVehicleRow }) {
  return (
    <span
      className="admin-fleet-readiness-summary"
      title={vehicle.readinessReasons.join("; ")}
    >
      <span
        className={`admin-fleet-readiness ${vehicle.maintenanceReady ? "is-ready" : "is-not-ready"}`}
      >
        <i /> {vehicle.maintenanceReady ? "Available for rental" : "Unavailable for rental"}
      </span>
      {!vehicle.maintenanceReady ? (
        <small>{vehicle.readinessReasons[0] ?? "Maintenance conditions require review."}</small>
      ) : null}
    </span>
  );
}

function FleetStatusMark({ status }: { status: FleetStatus }) {
  const tone =
    status === "Available"
      ? "is-available"
      : status === "Rented"
        ? "is-rented"
        : status === "Reserved"
          ? "is-reserved"
          : "is-attention";
  return (
    <span className={`admin-fleet-status ${tone}`}>
      <i /> {status}
    </span>
  );
}

function FleetPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <footer
      className="admin-fleet-pagination"
      aria-label="Vehicle register pages"
    >
      <span>
        Page {page} of {totalPages}
      </span>
      <div>
        <Btn
          variant="ghost"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Btn>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`admin-fleet-pagination__page ${pageNumber === page ? "is-current" : ""}`}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ),
        )}
        <Btn
          variant="ghost"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Btn>
      </div>
    </footer>
  );
}

function FleetEmptyState({
  hasVehicles,
  status,
  onReset,
}: {
  hasVehicles: boolean;
  status: FleetStatus | "All";
  onReset: () => void;
}) {
  return (
    <div className="admin-fleet-empty-state" role="status">
      <h3>{hasVehicles ? "No vehicles in this view" : "No vehicles yet"}</h3>
      <p>
        {hasVehicles
          ? "Try another status, location, or search term to see matching vehicles."
          : "Add the first vehicle to begin managing its availability and readiness."}
      </p>
      {hasVehicles ? (
        <Btn variant="ghost" onClick={onReset}>
          Show all vehicles
        </Btn>
      ) : null}
    </div>
  );
}

function FleetLoading() {
  return (
    <div
      className="admin-fleet-loading"
      role="status"
      aria-label="Loading fleet data"
    >
      <div className="admin-fleet-loading__metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <i />
            <span />
            <strong />
          </div>
        ))}
      </div>
      <div className="admin-fleet-loading__workspace">
        <section>
          <header>
            <i />
            <span>
              <i />
              <i />
              <i />
            </span>
          </header>
          {Array.from({ length: 7 }, (_, index) => (
            <div className="admin-fleet-loading__row" key={index}>
              <i />
              <i />
              <i />
              <i />
            </div>
          ))}
        </section>
        <aside>
          <i className="admin-fleet-loading__image" />
          <i className="admin-fleet-loading__vehicle" />
          <span>
            <i />
            <i />
          </span>
          <div>
            {Array.from({ length: 6 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
          <footer>
            <i />
            <i />
          </footer>
        </aside>
      </div>
    </div>
  );
}

function FleetDetail({
  vehicle,
  inspectionRemarks,
  inspectionSaving,
  onInspectionRemarksChange,
  onResolveInspection,
  onService,
  onEditImage,
}: {
  vehicle: FleetVehicleRow | null;
  inspectionRemarks: string;
  inspectionSaving: boolean;
  onInspectionRemarksChange: (value: string) => void;
  onResolveInspection: (outcome: "Cleared" | "Maintenance scheduled") => void;
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
            {vehicle.imageUrl ? (
              <img src={vehicle.imageUrl} alt="" />
            ) : (
              <div className="admin-fleet-detail__image-fallback">
                <CarFront />
              </div>
            )}
            <div>
              <h2>{vehicle.name}</h2>
              <p>{displayValue(vehicle.plate)}</p>
            </div>
          </div>
          <div className="admin-fleet-detail__states">
            <div>
              <span>State</span>
              <FleetStatusMark status={vehicle.status} />
            </div>
            <div>
              <span>Rental readiness</span>
              <Readiness vehicle={vehicle} />
            </div>
          </div>
          <dl className="admin-fleet-detail__facts">
            <Detail label="Allocation location">
              <MapPin className="h-4 w-4" /> {displayValue(vehicle.branch)}
            </Detail>
            <Detail label="Daily rate">
              {formatPeso(vehicle.pricePerDay)}
            </Detail>
            <Detail label="Category">{displayValue(vehicle.category)}</Detail>
            <Detail label="Seats">{displayValue(vehicle.seats)} seats</Detail>
            <Detail label="Transmission">
              {displayValue(vehicle.transmission)}
            </Detail>
            <Detail label="Status note">{currentUse(vehicle.status)}</Detail>
          </dl>
          <div className="admin-fleet-detail__actions">
            {vehicle.pendingInspection ? (
              <section
                className="admin-fleet-inspection"
                aria-labelledby="return-inspection-heading"
              >
                <h3 id="return-inspection-heading">Return inspection</h3>
                <p>
                  This vehicle was returned and must be cleared or sent to
                  maintenance before it can be allocated again.
                </p>
                <label>
                  <span>Inspection remarks</span>
                  <textarea
                    value={inspectionRemarks}
                    onChange={(event) =>
                      onInspectionRemarksChange(event.target.value)
                    }
                    placeholder="Damage, cleaning, or service notes…"
                  />
                </label>
                <div>
                  <Btn
                    variant="ghost"
                    disabled={inspectionSaving}
                    onClick={() => onResolveInspection("Cleared")}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Clear vehicle
                  </Btn>
                  <Btn
                    variant="primary"
                    disabled={inspectionSaving}
                    onClick={() => onResolveInspection("Maintenance scheduled")}
                  >
                    <Wrench className="h-4 w-4" /> Schedule maintenance
                  </Btn>
                </div>
                {vehicle.pendingInspection.remarks ? (
                  <p className="admin-fleet-inspection__previous">
                    Return note: {vehicle.pendingInspection.remarks}
                  </p>
                ) : null}
              </section>
            ) : null}
            <div className="admin-fleet-detail__action-group">
              {["Reserved", "Rented"].includes(vehicle.status) ? (
                <a
                  href="/admin/calendar"
                  className="admin-fleet-detail__schedule"
                >
                  <CalendarDays className="h-4 w-4" /> View schedule
                </a>
              ) : null}
              {vehicle.status === "Maintenance" || !vehicle.maintenanceReady ? (
                <Link
                  to="/admin/maintenance"
                  search={{ vehicleId: vehicle.id }}
                  className="admin-fleet-detail__schedule"
                >
                  <Wrench className="h-4 w-4" /> View maintenance
                </Link>
              ) : null}
              {vehicle.status === "Available" ? (
                <Btn
                  variant="ghost"
                  className="admin-fleet-detail__service"
                  onClick={() => onService(vehicle)}
                >
                  <Wrench className="h-4 w-4" /> Schedule maintenance
                </Btn>
              ) : null}
            </div>
            <div className="admin-fleet-detail__asset-action">
              <span>Vehicle image</span>
              <button
                type="button"
                className="admin-fleet-detail__image-link"
                onClick={() => onEditImage(vehicle)}
              >
                <Image className="h-4 w-4" /> Update image
              </button>
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
      <DialogContent className="admin-fleet-vehicle-dialog max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
              onChange={(event) =>
                onDraftChange("imageUrl", event.target.value)
              }
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
          <DialogTitle>Update vehicle image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <p className="text-sm text-muted-foreground">
            Paste a public image URL for {vehicleName}. Leave it blank to remove
            the image.
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
