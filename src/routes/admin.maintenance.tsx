import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Fuel,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaintenanceRecordDialog,
  type MaintenanceVehicleOption,
} from "@/components/admin/MaintenanceRecordDialog";
import { Btn, Card, TInput } from "@/components/admin/ui";
import {
  createMaintenancePayload,
  partitionMaintenanceRecords,
  transitionMaintenancePayload,
  type MaintenanceDraft,
  type MaintenanceFinalDraft,
  type MaintenanceRecord,
} from "@/lib/maintenance-admin";
import type { MaintenanceReadinessReason } from "@/lib/maintenance-readiness";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

type MaintenanceSearch = {
  vehicleId?: string;
};

export const Route = createFileRoute("/admin/maintenance")({
  validateSearch: (search: Record<string, unknown>): MaintenanceSearch => ({
    vehicleId: typeof search.vehicleId === "string" ? search.vehicleId : undefined,
  }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: MaintenancePage,
});

type VehicleResponse = {
  id: string;
  name: string;
  license_plate: string;
  image_url: string | null;
  transmission: string | null;
  fuel_type: string | null;
  seat_capacity: number | null;
  daily_rate: number | null;
  current_odometer_km: number | null;
  condition_blocks_rental_use: boolean;
  category: { name: string } | null;
  branch: { name: string } | null;
};

type ReadinessItem = {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  maintenanceReady: boolean;
  reasons: MaintenanceReadinessReason[];
};

type Transition = {
  record: MaintenanceRecord;
  status: "In Progress" | "Completed" | "Cancelled";
};

function localDateTimeValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function emptyDraft(): MaintenanceDraft {
  return {
    vehicleId: "",
    maintenanceType: "Preventive Maintenance",
    description: "",
    blocksRentalUse: false,
    scheduledFor: localDateTimeValue(),
    currentOdometer: "",
    nextServiceOdometer: "",
    nextServiceDate: "",
    costPhp: "",
    remarks: "",
  };
}

function finalDraft(record: MaintenanceRecord): MaintenanceFinalDraft {
  return {
    odometerAtService: valueOrEmpty(record.odometer_at_service),
    nextServiceOdometer: valueOrEmpty(record.next_service_odometer),
    nextServiceDate: record.next_service_date ?? "",
    costPhp: valueOrEmpty(record.cost_php),
    remarks: record.remarks ?? "",
    cancellationReason: "",
  };
}

function valueOrEmpty(value: number | null) {
  return value == null ? "" : String(value);
}

function rentalReadinessState(readiness: ReadinessItem | null) {
  return readiness?.maintenanceReady
    ? "Available for rental"
    : "Unavailable for rental";
}

function rentalReadinessReasons(readiness: ReadinessItem | null) {
  const labels: Record<MaintenanceReadinessReason, string> = {
    "Vehicle inactive": "The vehicle is inactive.",
    "Active blocking maintenance":
      "An active maintenance concern prevents rental use.",
    "Unresolved maintenance concern prevents rental use":
      "Unresolved maintenance concern.",
    "Active maintenance in progress": "Maintenance is currently in progress.",
    "Preventive maintenance due by date":
      "Preventive maintenance is due by date.",
    "Preventive maintenance due by odometer":
      "Preventive maintenance is due by odometer.",
    "Vehicle condition blocks rental use":
      "Vehicle condition is unsuitable for rental.",
    "Current odometer unavailable for recorded service target":
      "Current odometer is unavailable for required service monitoring.",
  };
  return readiness?.reasons.map((reason) => labels[reason]) ?? [];
}

function matchesMaintenanceSearch(record: MaintenanceRecord, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    record.vehicle?.name,
    record.vehicle?.license_plate,
    record.maintenance_type,
    record.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok)
    throw new Error(body.message ?? "The maintenance request failed.");
  return body;
}

function MaintenancePage() {
  const { vehicleId: preselectedVehicleId } = Route.useSearch();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>([]);
  const [vehicleRows, setVehicleRows] = useState<VehicleResponse[]>([]);
  const [readiness, setReadiness] = useState<ReadinessItem[]>([]);
  const [query, setQuery] = useState("");
  const [queueFilter, setQueueFilter] = useState<"Scheduled" | "In Progress" | "Overdue" | "Completed" | "Cancelled">("In Progress");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<MaintenanceDraft>(emptyDraft);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [completionDraft, setCompletionDraft] = useState<MaintenanceFinalDraft>(
    finalDraftPlaceholder,
  );
  const [mutationPending, setMutationPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "warning";
    message: string;
  } | null>(null);

  const loadCanonicalData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [recordsResponse, vehiclesResponse, readinessResponse] =
        await Promise.all([
          fetch("/api/maintenance"),
          fetch("/api/vehicles"),
          fetch("/api/maintenance?readiness=summary"),
        ]);
      const [nextRecords, vehicleRows, nextReadiness] = await Promise.all([
        responseJson<MaintenanceRecord[]>(recordsResponse),
        responseJson<VehicleResponse[]>(vehiclesResponse),
        responseJson<ReadinessItem[]>(readinessResponse),
      ]);
      setRecords(nextRecords);
      const readinessByVehicle = new Map(
        nextReadiness.map((item) => [item.vehicleId, item]),
      );
      setVehicles(
        vehicleRows.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.license_plate,
          branch: vehicle.branch?.name,
          currentOdometer: vehicle.current_odometer_km,
          conditionBlocksRentalUse: vehicle.condition_blocks_rental_use,
          maintenanceReady:
            readinessByVehicle.get(vehicle.id)?.maintenanceReady ?? false,
          readinessReasons: readinessByVehicle.get(vehicle.id)?.reasons ?? [],
        })),
      );
      setVehicleRows(vehicleRows);
      setReadiness(nextReadiness);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load maintenance records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCanonicalData();
  }, [loadCanonicalData]);

  const { active, history: maintenanceHistory } = useMemo(
    () => partitionMaintenanceRecords(records),
    [records],
  );
  const attention = useMemo(
    () => readiness.filter((item) => !item.maintenanceReady),
    [readiness],
  );
  const closedRecords = useMemo(
    () => records.filter((record) => record.status === "Completed" || record.status === "Cancelled"),
    [records],
  );
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesFilter = !record.archived_at && record.status === queueFilter;
      return matchesFilter && matchesMaintenanceSearch(record, query);
    });
  }, [query, queueFilter, records]);
  const selectedRecord = useMemo(
    () =>
      records.find((record) => record.id === selectedRecordId) ??
      active[0] ??
      maintenanceHistory[0] ??
      null,
    [active, maintenanceHistory, records, selectedRecordId],
  );
  const previewRecord = useMemo(
    () =>
      filteredRecords.find((record) => record.id === selectedRecordId) ??
      filteredRecords[0] ??
      null,
    [filteredRecords, selectedRecordId],
  );
  const vehicleById = useMemo(
    () => new Map(vehicleRows.map((vehicle) => [vehicle.id, vehicle])),
    [vehicleRows],
  );

  useEffect(() => {
    setSelectedRecordId((current) =>
      current && records.some((record) => record.id === current)
        ? current
        : (active[0]?.id ?? maintenanceHistory[0]?.id ?? null),
    );
  }, [active, maintenanceHistory, records]);

  useEffect(() => {
    if (!preselectedVehicleId || records.length === 0) return;
    const matchingRecord =
      records.find(
        (record) =>
          record.vehicle_id === preselectedVehicleId &&
          !record.archived_at &&
          record.status === "In Progress",
      ) ??
      records.find(
        (record) =>
          record.vehicle_id === preselectedVehicleId &&
          !record.archived_at &&
          ["Overdue", "Scheduled"].includes(record.status),
      ) ??
      records.find(
        (record) => record.vehicle_id === preselectedVehicleId && !record.archived_at,
      );
    if (!matchingRecord) return;
    setQueueFilter(matchingRecord.status as typeof queueFilter);
    setSelectedRecordId(matchingRecord.id);
  }, [preselectedVehicleId, records]);

  useEffect(() => {
    if (!query.trim()) return;
    const matchingRecord = records.find(
      (record) => !record.archived_at && matchesMaintenanceSearch(record, query),
    );
    if (!matchingRecord) return;
    setQueueFilter(matchingRecord.status as typeof queueFilter);
    setSelectedRecordId(matchingRecord.id);
  }, [query, records]);

  function openCreateDialog() {
    setDraft(emptyDraft());
    setMutationError(null);
    setCreateOpen(true);
  }

  async function createRecord() {
    setMutationPending(true);
    setMutationError(null);
    setFeedback(null);
    try {
      const result = await responseJson<{ active_rental_conflict?: boolean }>(
        await fetch("/api/maintenance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(createMaintenancePayload(draft)),
        }),
      );
      setCreateOpen(false);
      setFeedback(
        result.active_rental_conflict
          ? {
              kind: "warning",
              message:
                "Maintenance was recorded, but this vehicle currently has an active rental. Review the rental before taking the vehicle out of service.",
            }
          : { kind: "success", message: "Maintenance record created." },
      );
      await loadCanonicalData();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to create maintenance record.",
      );
    } finally {
      setMutationPending(false);
    }
  }

  function openTransition(
    record: MaintenanceRecord,
    status: "In Progress" | "Completed" | "Cancelled",
  ) {
    if (
      status === "In Progress"
        ? !["Scheduled", "Overdue"].includes(record.status)
        : status === "Cancelled"
          ? !["Scheduled", "Overdue"].includes(record.status)
          : record.status !== "In Progress"
    ) return;
    setCompletionDraft({
      ...finalDraft(record),
      ...(status === "Cancelled" ? { remarks: "" } : {}),
    });
    setMutationError(null);
    setTransition({ record, status });
  }

  async function submitTransition() {
    if (
      !transition ||
      (transition.status === "In Progress"
        ? !["Scheduled", "Overdue"].includes(transition.record.status)
        : transition.status === "Cancelled"
          ? !["Scheduled", "Overdue"].includes(transition.record.status)
          : transition.record.status !== "In Progress")
    ) return;
    setMutationPending(true);
    setMutationError(null);
    setFeedback(null);
    try {
      await responseJson(
        await fetch("/api/maintenance", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            transitionMaintenancePayload(
              transition.record.id,
              transition.status,
              completionDraft,
            ),
          ),
        }),
      );
      const completedStatus = transition.status;
      setTransition(null);
      setFeedback({
        kind: "success",
        message:
          completedStatus === "In Progress"
            ? "Maintenance service started."
            : completedStatus === "Completed"
            ? "Maintenance record completed."
            : "Maintenance record cancelled and retained in history.",
      });
      await loadCanonicalData();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Unable to update maintenance record.",
      );
    } finally {
      setMutationPending(false);
    }
  }

  function selectQueueFilter(
    filter: "Scheduled" | "In Progress" | "Overdue" | "Completed" | "Cancelled",
  ) {
    setQueueFilter(filter);
    setSelectedRecordId(
      records.find(
        (record) =>
          !record.archived_at &&
          record.status === filter &&
          matchesMaintenanceSearch(record, query),
      )?.id ?? null,
    );
  }

  const header = (
    <header className="admin-maintenance-heading">
      <div>
        <h1>Maintenance Management</h1>
      </div>
      <div className="admin-maintenance-heading__actions">
        <label className="admin-maintenance-header-search">
          <span className="sr-only">Search maintenance records</span>
          <Search aria-hidden="true" />
          <input
            aria-label="Search maintenance records"
            name="service-record-search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vehicle or plate…"
          />
        </label>
        <Btn variant="primary" onClick={openCreateDialog} disabled={loading}>
          <Plus className="h-4 w-4" /> Schedule maintenance
        </Btn>
      </div>
    </header>
  );

  if (loading && records.length === 0)
    return (
      <div className="admin-maintenance-workspace">
        {header}
        <MaintenanceWorkspaceLoading />
      </div>
    );

  if (loadError)
    return (
      <div className="admin-maintenance-workspace">
        {header}
        <Card className="p-8 text-center">
          <p role="alert" className="text-sm text-rose-400">
            Unable to load maintenance records. {loadError}
          </p>
          <Btn className="mt-4" onClick={() => void loadCanonicalData()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Btn>
        </Card>
      </div>
    );

  return (
    <div className="admin-maintenance-workspace">
      {header}

      {feedback && (
        <div
          role={feedback.kind === "warning" ? "alert" : "status"}
          aria-live="polite"
          className={`admin-maintenance-feedback ${
            feedback.kind === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section
        className="admin-maintenance-ledger"
        aria-label="Maintenance lifecycle filters"
      >
        {(
          [
            ["Scheduled", "Scheduled"],
            ["In Progress", "In progress"],
            ["Overdue", "Overdue"],
            ["Completed", "Completed"],
            ["Cancelled", "Cancelled"],
          ] as const
        ).map(([filter, label]) => (
          <button
            key={filter}
            type="button"
            className={`admin-maintenance-status-tab ${
              queueFilter === filter ? "is-active" : ""
            }`}
            onClick={() => selectQueueFilter(filter)}
            aria-pressed={queueFilter === filter}
          >
            <span>{label}</span>
            <strong>
              {records.filter(
                (record) => !record.archived_at && record.status === filter,
              ).length}
            </strong>
          </button>
        ))}
      </section>

      <div className="admin-maintenance-layout">
        <section
          className="admin-maintenance-queue"
          aria-label="Service records"
        >
          <header>
            <div>
              <h2>
                {(
                  {
                    Scheduled: "Vehicle Maintenance Scheduled",
                    "In Progress": "Vehicle Maintenance in Progress",
                    Overdue: "Vehicle Maintenance Overdue",
                    Completed: "Vehicle Maintenance Completed",
                    Cancelled: "Vehicle Maintenance Cancelled",
                  } as const
                )[queueFilter]}
              </h2>
              <p>
                {filteredRecords.length} matching record
                {filteredRecords.length === 1 ? "" : "s"}
              </p>
            </div>
          </header>
          {records.length === 0 ? (
            <p className="admin-maintenance-empty">
              No service records yet. Schedule maintenance to begin tracking
              vehicle readiness.
            </p>
          ) : (
            <div className="admin-maintenance-records">
              {filteredRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`admin-maintenance-record ${previewRecord?.id === record.id ? "is-selected" : ""}`}
                  aria-pressed={previewRecord?.id === record.id}
                >
                  <span className="admin-maintenance-record__vehicle">
                    {vehicleById.get(record.vehicle_id)?.image_url ? (
                      <img
                        src={
                          vehicleById.get(record.vehicle_id)?.image_url ?? ""
                        }
                        alt=""
                        width="50"
                        height="50"
                        loading="lazy"
                      />
                    ) : (
                      <Wrench aria-hidden="true" />
                    )}
                    <span>
                      <strong>
                        {record.vehicle?.name ?? "Unknown vehicle"}
                      </strong>
                      <small>
                        {record.vehicle?.license_plate ?? "Plate unavailable"}
                      </small>
                    </span>
                  </span>
                  <span className="admin-maintenance-record__service">
                    <strong>{record.maintenance_type}</strong>
                    <small>
                      {record.status === "Scheduled" && record.scheduled_for
                        ? `Scheduled ${formatDate(record.scheduled_for, true)}`
                        : record.status === "In Progress"
                          ? `Started ${formatDate(record.service_started_at, true)}`
                          : record.next_service_date
                            ? `PMS due ${formatDate(record.next_service_date)}`
                            : formatDate(record.completed_at ?? record.service_started_at)}
                    </small>
                  </span>
                  <span
                    className={`admin-maintenance-record__state is-${record.status.toLowerCase()}`}
                  >
                    {record.status}
                  </span>
                  <ChevronRight className="admin-maintenance-record__arrow" />
                </button>
              ))}
              {filteredRecords.length === 0 ? (
                <MaintenanceQueueEmpty
                  filter={queueFilter}
                  onSchedule={openCreateDialog}
                />
              ) : null}
            </div>
          )}
        </section>
        <MaintenancePreview
          record={previewRecord}
          readiness={readiness}
          onViewDetails={() => setDetailsOpen(true)}
        />
      </div>

      <section className="admin-maintenance-history" aria-labelledby="maintenance-history-heading">
        <div className="admin-maintenance-history__heading">
          <div>
            <h2 id="maintenance-history-heading">Maintenance history</h2>
            <p>Closed maintenance remains available for accountability and review.</p>
          </div>
          <span>{closedRecords.length} record{closedRecords.length === 1 ? "" : "s"}</span>
        </div>
        {closedRecords.length ? (
          <div className="admin-maintenance-history__rows">
            {closedRecords.map((record) => (
              <button key={record.id} type="button" onClick={() => { setSelectedRecordId(record.id); setDetailsOpen(true); }}>
                <span><strong>{record.vehicle?.name ?? "Unknown vehicle"}</strong><small>{record.vehicle?.license_plate ?? "Plate unavailable"}</small></span>
                <span><strong>{record.maintenance_type}</strong><small>{formatDate(record.completed_at ?? record.created_at)}</small></span>
                <span className={`is-${record.status.toLowerCase()}`}>{record.status}</span>
              </button>
            ))}
          </div>
        ) : <p className="admin-maintenance-empty">No closed maintenance records yet.</p>}
      </section>

      <MaintenanceRecordDialog
        open={createOpen}
        draft={draft}
        vehicles={vehicles}
        saving={mutationPending}
        error={createOpen ? mutationError : null}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setMutationError(null);
        }}
        onSave={() => void createRecord()}
      />

      <TransitionDialog
        transition={transition}
        draft={completionDraft}
        saving={mutationPending}
        error={transition ? mutationError : null}
        onDraftChange={setCompletionDraft}
        onClose={() => {
          if (!mutationPending) {
            setTransition(null);
            setMutationError(null);
          }
        }}
        onSubmit={() => void submitTransition()}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="admin-maintenance-details-dialog max-h-[88vh] overflow-y-auto p-0 sm:max-w-5xl">
          <MaintenanceWorkspaceDetail
            record={selectedRecord}
            vehicle={selectedRecord ? (vehicleById.get(selectedRecord.vehicle_id) ?? null) : null}
            history={selectedRecord ? records.filter((item) => item.vehicle_id === selectedRecord.vehicle_id && item.id !== selectedRecord.id).slice(0, 5) : []}
            readiness={readiness}
            onStart={(record) => openTransition(record, "In Progress")}
            onComplete={(record) => openTransition(record, "Completed")}
            onCancel={(record) => openTransition(record, "Cancelled")}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaintenanceQueueEmpty({
  filter,
  onSchedule,
}: {
  filter: "Scheduled" | "In Progress" | "Overdue" | "Completed" | "Cancelled";
  onSchedule: () => void;
}) {
  const copy = {
    Scheduled: {
      title: "No scheduled maintenance",
      description:
        "There are no upcoming maintenance services scheduled. Schedule maintenance when a vehicle needs planned service.",
    },
    "In Progress": {
      title: "No maintenance in progress",
      description:
        "There are no vehicles currently undergoing service. Started maintenance will appear here until it is completed or cancelled.",
    },
    Overdue: {
      title: "No overdue maintenance",
      description:
        "There are no scheduled maintenance services past their planned service date. Continue monitoring PMS due dates and odometer thresholds.",
    },
    Completed: {
      title: "No completed maintenance to review",
      description:
        "Completed services are retained in Maintenance History after they are closed from this lifecycle queue.",
    },
    Cancelled: {
      title: "No cancelled maintenance to review",
      description:
        "Cancelled records remain available in Maintenance History after they are closed from this lifecycle queue.",
    },
  }[filter];
  return (
    <div className="admin-maintenance-empty admin-maintenance-empty--lifecycle">
      <strong>{copy.title}</strong>
      <p>{copy.description}</p>
      {filter === "Scheduled" ? (
        <Btn variant="primary" onClick={onSchedule}>
          <Plus className="h-4 w-4" /> Schedule maintenance
        </Btn>
      ) : null}
    </div>
  );
}

function MaintenancePreview({
  record,
  readiness,
  onViewDetails,
}: {
  record: MaintenanceRecord | null;
  readiness: ReadinessItem[];
  onViewDetails: () => void;
}) {
  const recordReadiness = record
    ? readiness.find((item) => item.vehicleId === record.vehicle_id)
    : null;
  return (
    <aside className="admin-maintenance-preview">
      {!record ? <p className="admin-maintenance-empty">Select a maintenance record to preview it.</p> : <>
        <div className="admin-maintenance-preview__heading">
          <div><h2>{record.vehicle?.name ?? "Unknown vehicle"}</h2><span>{record.vehicle?.license_plate ?? "Plate unavailable"}</span></div>
          <strong className={`is-${record.status.toLowerCase()}`}>{record.status}</strong>
        </div>
        <dl>
          <Detail label="Service">{record.maintenance_type}</Detail>
          <Detail label={record.scheduled_for ? "Scheduled" : "Started"}>{formatDate(record.scheduled_for ?? record.service_started_at, true)}</Detail>
          <Detail label="Rental readiness">{rentalReadinessState(recordReadiness)}</Detail>
        </dl>
        {!recordReadiness?.maintenanceReady && recordReadiness?.reasons.length ? <p>{rentalReadinessReasons(recordReadiness).join(" ")}</p> : null}
        <Btn variant="primary" onClick={onViewDetails}>View details</Btn>
      </>}
    </aside>
  );
}

function MaintenanceWorkspaceDetail({
  record,
  vehicle,
  history,
  readiness,
  onStart,
  onComplete,
  onCancel,
}: {
  record: MaintenanceRecord | null;
  vehicle: VehicleResponse | null;
  history: MaintenanceRecord[];
  readiness: ReadinessItem[];
  onStart: (record: MaintenanceRecord) => void;
  onComplete: (record: MaintenanceRecord) => void;
  onCancel: (record: MaintenanceRecord) => void;
}) {
  const recordReadiness = record
    ? readiness.find((item) => item.vehicleId === record.vehicle_id)
    : null;
  return (
    <aside className="admin-maintenance-detail">
      {!record ? (
        <p className="admin-maintenance-empty">
          Select a service record to inspect its work and rental impact.
        </p>
      ) : (
        <>
          <header className="admin-maintenance-detail__hero">
            <div className="admin-maintenance-detail__image">
              {vehicle?.image_url ? (
                <img
                  src={vehicle.image_url}
                  alt=""
                  width="520"
                  height="320"
                  fetchPriority="high"
                />
              ) : (
                <CarFront aria-hidden="true" />
              )}
            </div>
            <div className="admin-maintenance-detail__identity">
              <div>
                <h2>{record.vehicle?.name ?? "Unknown vehicle"}</h2>
                <span>
                  {record.vehicle?.license_plate ?? "Plate unavailable"}
                </span>
              </div>
              <strong className={`is-${record.status.toLowerCase()}`}>
                {record.status}
              </strong>
              <dl>
                <Detail label="Vehicle">
                  <CarFront aria-hidden="true" />{" "}
                  {vehicle?.category?.name ?? "Vehicle"}
                </Detail>
                <Detail label="Fuel">
                  <Fuel aria-hidden="true" /> {vehicle?.fuel_type ?? "—"}
                </Detail>
                <Detail label="Capacity">
                  <UsersRound aria-hidden="true" />{" "}
                  {vehicle?.seat_capacity
                    ? `${vehicle.seat_capacity} seats`
                    : "—"}
                </Detail>
                {record.odometer_at_service != null ? (
                  <Detail label="Service odometer">
                    <Gauge aria-hidden="true" />{" "}
                    {formatOdometer(record.odometer_at_service)}
                  </Detail>
                ) : null}
              </dl>
            </div>
            <section className="admin-maintenance-detail__readiness">
              <h3>Rental readiness</h3>
              <div>
                <span
                  className={
                    recordReadiness?.maintenanceReady
                      ? "is-ready"
                      : "is-attention"
                  }
                />
                <p>
                  <strong>
                    {rentalReadinessState(recordReadiness)}
                  </strong>
                  <small>
                    {recordReadiness?.maintenanceReady
                      ? "No recorded maintenance condition is preventing rental use."
                      : (rentalReadinessReasons(recordReadiness).join(" ") ||
                        "Rental readiness information is unavailable.")}
                  </small>
                </p>
              </div>
            </section>
          </header>
          <div className="admin-maintenance-detail__body">
            <section>
              <div className="admin-maintenance-detail__section-title">
                <h3>Service details</h3>
                <span>{record.id.slice(0, 8)}</span>
              </div>
              <dl>
                <Detail label="Service type">{record.maintenance_type}</Detail>
                {record.scheduled_for ? <Detail label="Scheduled service">
                  {formatDate(record.scheduled_for, true)}
                </Detail> : null}
                {record.service_started_at ? <Detail label="Actual service started">
                  {formatDate(record.service_started_at, true)}
                </Detail> : null}
                <Detail label="Description">{record.description}</Detail>
                <Detail label="Odometer">
                  {formatOdometer(record.odometer_at_service)}
                </Detail>
                <Detail label="Next service">
                  {formatDate(record.next_service_date)} ·{" "}
                  {formatOdometer(record.next_service_odometer)}
                </Detail>
                <Detail label="Cost">{formatMoney(record.cost_php)}</Detail>
              </dl>
            </section>
            <div className="admin-maintenance-detail__side">
              <section>
                <h3>Record notes</h3>
                <p>{record.remarks || "No additional notes were recorded."}</p>
                {record.completed_at ? (
                  <p className="admin-maintenance-detail__completion">
                    {record.status} {formatDate(record.completed_at, true)}
                  </p>
                ) : null}
              </section>
              <section>
                <h3>Rental impact</h3>
                <p>
                  {recordReadiness?.maintenanceReady
                    ? "This vehicle is currently available for rental."
                    : `This vehicle is currently unavailable for rental. ${rentalReadinessReasons(recordReadiness).join(" ") || "Maintenance conditions require review."}`}
                </p>
              </section>
            </div>
          </div>
          <section className="admin-maintenance-detail__history-list">
            <div className="admin-maintenance-detail__section-title">
              <h3>Service history</h3>
              <span>
                {history.length
                  ? `${history.length} prior record${history.length === 1 ? "" : "s"}`
                  : "No earlier records"}
              </span>
            </div>
            {history.map((item) => (
              <div key={item.id}>
                <span className={`is-${item.status.toLowerCase()}`} />
                <time>
                  {formatDate(item.completed_at ?? item.service_started_at)}
                </time>
                <strong>{item.maintenance_type}</strong>
                <small>{item.status}</small>
              </div>
            ))}
          </section>
          {record.status === "Scheduled" || record.status === "Overdue" ? (
            <footer className="admin-maintenance-detail__actions">
              <Btn variant="danger" onClick={() => onCancel(record)}>Cancel maintenance</Btn>
              <Btn variant="primary" onClick={() => onStart(record)}>Start service</Btn>
            </footer>
          ) : record.status === "In Progress" ? (
            <footer className="admin-maintenance-detail__actions">
              <Btn variant="primary" onClick={() => onComplete(record)}>
                Complete service
              </Btn>
            </footer>
          ) : null}
        </>
      )}
    </aside>
  );
}

function MaintenanceWorkspaceLoading() {
  return (
    <div
      className="admin-maintenance-loading"
      role="status"
      aria-label="Loading maintenance data"
    >
      <div className="admin-maintenance-loading__ledger">
        {Array.from({ length: 3 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <div className="admin-maintenance-loading__layout">
        <section>
          <header>
            <i />
            <i />
          </header>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <i />
              <i />
              <i />
            </div>
          ))}
        </section>
        <aside>
          <i className="is-title" />
          <i className="is-impact" />
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
      <dd>{children}</dd>
    </div>
  );
}

function TransitionDialog({
  transition,
  draft,
  saving,
  error,
  onDraftChange,
  onClose,
  onSubmit,
}: {
  transition: Transition | null;
  draft: MaintenanceFinalDraft;
  saving: boolean;
  error: string | null;
  onDraftChange: (draft: MaintenanceFinalDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const completing = transition?.status === "Completed";
  const starting = transition?.status === "In Progress";
  const cancelling = transition?.status === "Cancelled";
  const scheduledCancellation =
    cancelling && transition?.record.status === "Scheduled";
  function update<K extends keyof MaintenanceFinalDraft>(
    key: K,
    value: MaintenanceFinalDraft[K],
  ) {
    onDraftChange({ ...draft, [key]: value });
  }

  return (
    <Dialog
      open={Boolean(transition)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="admin-maintenance-transition-dialog sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {completing ? "Complete maintenance" : starting ? "Start maintenance" : "Cancel maintenance"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {transition?.record.maintenance_type} —{" "}
          {transition?.record.vehicle?.name}
        </p>
        {(completing || starting) && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <TransitionField label={starting ? "Actual odometer at service start (km)" : "Final odometer at service (km)"}>
              <TInput
                type="number"
                min="0"
                step="0.1"
                value={draft.odometerAtService}
                onChange={(event) =>
                  update("odometerAtService", event.target.value)
                }
              />
            </TransitionField>
            {completing && <TransitionField label="Actual cost (PHP)">
              <TInput
                type="number"
                min="0"
                step="0.01"
                value={draft.costPhp}
                onChange={(event) => update("costPhp", event.target.value)}
              />
            </TransitionField>}
            {completing && <>
            <TransitionField label="Next service date">
              <TInput
                type="date"
                value={draft.nextServiceDate}
                onChange={(event) =>
                  update("nextServiceDate", event.target.value)
                }
              />
            </TransitionField>
            <TransitionField label="Next service odometer (km)">
              <TInput
                type="number"
                min="0"
                step="0.1"
                value={draft.nextServiceOdometer}
                onChange={(event) =>
                  update("nextServiceOdometer", event.target.value)
                }
              />
            </TransitionField>
            </>}
          </div>
        )}
        {cancelling ? (
          <>
            <p className="text-sm text-muted-foreground">
              {scheduledCancellation
                ? "This will cancel the scheduled maintenance for this vehicle. The record will remain in maintenance history."
                : "This will cancel the maintenance event for this vehicle. The record will remain in maintenance history."}
            </p>
            <TransitionField label="Reason for cancellation">
              <select
                className="input-control w-full"
                value={draft.cancellationReason ?? ""}
                onChange={(event) => update("cancellationReason", event.target.value)}
              >
                <option value="">Select a reason</option>
                <option>Service appointment rescheduled</option>
                <option>Service provider unavailable</option>
                <option>Maintenance no longer required after review</option>
                <option>Record created by mistake</option>
                <option>Other</option>
              </select>
            </TransitionField>
          </>
        ) : null}
        <TransitionField
          label={completing ? "Final remarks" : starting ? "Service-start remarks" : cancelling ? "Additional remarks (optional)" : "Remarks"}
        >
          <textarea
            className="input-control min-h-24 w-full py-2.5"
            value={draft.remarks}
            onChange={(event) => update("remarks", event.target.value)}
          />
        </TransitionField>
        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}
        <DialogFooter>
          <Btn disabled={saving} onClick={onClose}>
            {scheduledCancellation ? "Keep schedule" : "Keep open"}
          </Btn>
          <Btn
            variant={completing || starting ? "primary" : "danger"}
            disabled={saving}
            onClick={onSubmit}
          >
            {saving
              ? "Saving…"
              : completing
                ? "Complete maintenance"
                : starting ? "Start maintenance" : "Cancel maintenance"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransitionField({
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

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatOdometer(value: number | null) {
  return value == null ? "—" : `${Number(value).toLocaleString("en-PH")} km`;
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value));
}

const finalDraftPlaceholder: MaintenanceFinalDraft = {
  odometerAtService: "",
  nextServiceOdometer: "",
  nextServiceDate: "",
  costPhp: "",
  remarks: "",
};
