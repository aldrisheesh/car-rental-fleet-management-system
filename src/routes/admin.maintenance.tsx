import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, CarFront, ChevronRight, Fuel, Gauge, Plus, RefreshCw, Search, UsersRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaintenanceRecordDialog,
  type MaintenanceVehicleOption,
} from "@/components/admin/MaintenanceRecordDialog";
import {
  Btn,
  Card,
  TInput,
} from "@/components/admin/ui";
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

export const Route = createFileRoute("/admin/maintenance")({
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
  status: "Completed" | "Cancelled";
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
    serviceStartedAt: localDateTimeValue(),
    odometerAtService: "",
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
  };
}

function valueOrEmpty(value: number | null) {
  return value == null ? "" : String(value);
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
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>([]);
  const [vehicleRows, setVehicleRows] = useState<VehicleResponse[]>([]);
  const [readiness, setReadiness] = useState<ReadinessItem[]>([]);
  const [query, setQuery] = useState("");
  const [queueFilter, setQueueFilter] = useState<"All" | "Open" | "Completed">("All");
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
      setVehicles(
        vehicleRows.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.license_plate,
          branch: vehicle.branch?.name,
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
  const selectedRecord = useMemo(
    () =>
      records.find((record) => record.id === selectedRecordId) ??
      active[0] ??
      maintenanceHistory[0] ??
      null,
    [active, maintenanceHistory, records, selectedRecordId],
  );
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...active, ...maintenanceHistory].filter((record) => {
      const matchesFilter = queueFilter === "All" || record.status === queueFilter;
      const haystack = [record.vehicle?.name, record.vehicle?.license_plate, record.maintenance_type].filter(Boolean).join(" ").toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [active, maintenanceHistory, query, queueFilter]);
  const vehicleById = useMemo(() => new Map(vehicleRows.map((vehicle) => [vehicle.id, vehicle])), [vehicleRows]);

  useEffect(() => {
    setSelectedRecordId((current) =>
      current && records.some((record) => record.id === current)
        ? current
        : (active[0]?.id ?? maintenanceHistory[0]?.id ?? null),
    );
  }, [active, maintenanceHistory, records]);

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
    status: "Completed" | "Cancelled",
  ) {
    if (record.status !== "Open") return;
    setCompletionDraft(finalDraft(record));
    setMutationError(null);
    setTransition({ record, status });
  }

  async function submitTransition() {
    if (!transition || transition.record.status !== "Open") return;
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
          completedStatus === "Completed"
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

  const header = (
    <header className="admin-maintenance-heading">
      <div>
        <h1>Maintenance</h1>
        <p>Review service records and vehicle readiness before the next booking.</p>
      </div>
      <Btn variant="primary" onClick={openCreateDialog} disabled={loading}>
        <Plus className="h-4 w-4" /> Add maintenance record
      </Btn>
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

      <div className="admin-maintenance-layout">
        <section className="admin-maintenance-queue" aria-label="Service records">
          <header>
            <div><h2>Service records</h2><p>Select a record to inspect the work and its rental impact.</p></div>
          </header>
          <label className="admin-maintenance-search"><Search aria-hidden="true" /><input aria-label="Search service records" name="service-record-search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vehicle, plate or service type…" /></label>
          <div className="admin-maintenance-filters" aria-label="Filter service records">
            {(["All", "Open", "Completed"] as const).map((filter) => <button key={filter} type="button" className={queueFilter === filter ? "is-active" : ""} onClick={() => setQueueFilter(filter)}>{filter}<span>{filter === "All" ? records.length : filter === "Open" ? active.length : maintenanceHistory.filter((record) => record.status === "Completed").length}</span></button>)}
          </div>
          {records.length === 0 ? (
            <p className="admin-maintenance-empty">No service records yet. Add the first maintenance record to begin tracking readiness.</p>
          ) : (
            <div className="admin-maintenance-records">
              {filteredRecords.map((record) => (
                <button key={record.id} type="button" onClick={() => setSelectedRecordId(record.id)} className={`admin-maintenance-record ${selectedRecord?.id === record.id ? "is-selected" : ""}`} aria-pressed={selectedRecord?.id === record.id}>
                  <span className="admin-maintenance-record__vehicle">{vehicleById.get(record.vehicle_id)?.image_url ? <img src={vehicleById.get(record.vehicle_id)?.image_url ?? ""} alt="" width="50" height="50" loading="lazy" /> : <Wrench aria-hidden="true" />}<span><strong>{record.vehicle?.name ?? "Unknown vehicle"}</strong><small>{record.vehicle?.license_plate ?? "Plate unavailable"}</small></span></span>
                  <span className="admin-maintenance-record__service"><strong>{record.maintenance_type}</strong><small>{record.next_service_date ? `Due ${formatDate(record.next_service_date)}` : formatDate(record.service_started_at)}</small></span>
                  <span className={`admin-maintenance-record__state is-${record.status.toLowerCase()}`}>{record.status}</span>
                  <ChevronRight className="admin-maintenance-record__arrow" />
                </button>
              ))}
              {filteredRecords.length === 0 ? <p className="admin-maintenance-empty">No records match this filter.</p> : null}
            </div>
          )}
        </section>
        <MaintenanceWorkspaceDetail record={selectedRecord} vehicle={selectedRecord ? vehicleById.get(selectedRecord.vehicle_id) ?? null : null} history={selectedRecord ? records.filter((item) => item.vehicle_id === selectedRecord.vehicle_id && item.id !== selectedRecord.id).slice(0, 3) : []} readiness={readiness} onComplete={(record) => openTransition(record, "Completed")} onCancel={(record) => openTransition(record, "Cancelled")} />
      </div>

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
    </div>
  );
}

function MaintenanceWorkspaceDetail({ record, vehicle, history, readiness, onComplete, onCancel }: { record: MaintenanceRecord | null; vehicle: VehicleResponse | null; history: MaintenanceRecord[]; readiness: ReadinessItem[]; onComplete: (record: MaintenanceRecord) => void; onCancel: (record: MaintenanceRecord) => void; }) {
  const recordReadiness = record ? readiness.find((item) => item.vehicleId === record.vehicle_id) : null;
  return (
    <aside className="admin-maintenance-detail">
      {!record ? (
        <p className="admin-maintenance-empty">Select a service record to inspect its work and rental impact.</p>
      ) : (
        <>
          <header className="admin-maintenance-detail__hero">
            <div className="admin-maintenance-detail__image">{vehicle?.image_url ? <img src={vehicle.image_url} alt="" width="520" height="320" fetchPriority="high" /> : <CarFront aria-hidden="true" />}</div>
            <div className="admin-maintenance-detail__identity"><div><h2>{record.vehicle?.name ?? "Unknown vehicle"}</h2><span>{record.vehicle?.license_plate ?? "Plate unavailable"}</span></div><strong className={`is-${record.status.toLowerCase()}`}>{record.status}</strong><dl><Detail label="Vehicle"><CarFront aria-hidden="true" /> {vehicle?.category?.name ?? "Vehicle"}</Detail><Detail label="Fuel"><Fuel aria-hidden="true" /> {vehicle?.fuel_type ?? "—"}</Detail><Detail label="Capacity"><UsersRound aria-hidden="true" /> {vehicle?.seat_capacity ? `${vehicle.seat_capacity} seats` : "—"}</Detail>{record.odometer_at_service != null ? <Detail label="Service odometer"><Gauge aria-hidden="true" /> {formatOdometer(record.odometer_at_service)}</Detail> : null}</dl></div>
            <section className="admin-maintenance-detail__readiness"><h3>Current readiness</h3><div><span className={recordReadiness?.maintenanceReady ? "is-ready" : "is-attention"} /><p><strong>{recordReadiness?.maintenanceReady ? "Ready for service" : "Needs attention"}</strong><small>{recordReadiness?.maintenanceReady ? "No active maintenance issues." : (recordReadiness?.reasons.join(" ") ?? "Readiness information is unavailable.")}</small></p></div></section>
          </header>
          <div className="admin-maintenance-detail__body">
            <section><div className="admin-maintenance-detail__section-title"><h3>Service details</h3><span>{record.id.slice(0, 8)}</span></div><dl>
              <Detail label="Service type">{record.maintenance_type}</Detail><Detail label="Started">{formatDate(record.service_started_at, true)}</Detail><Detail label="Description">{record.description}</Detail><Detail label="Odometer">{formatOdometer(record.odometer_at_service)}</Detail><Detail label="Next service">{formatDate(record.next_service_date)} · {formatOdometer(record.next_service_odometer)}</Detail><Detail label="Cost">{formatMoney(record.cost_php)}</Detail>
            </dl></section>
            <div className="admin-maintenance-detail__side"><section><h3>Record notes</h3><p>{record.remarks || "No additional notes were recorded."}</p>{record.completed_at ? <p className="admin-maintenance-detail__completion">{record.status} {formatDate(record.completed_at, true)}</p> : null}</section><section><h3>Rental impact</h3><p>{record.blocks_rental_use ? "This record blocks rental use until the work is closed." : "This record does not block rental use."}</p></section></div>
          </div>
          <section className="admin-maintenance-detail__history-list"><div className="admin-maintenance-detail__section-title"><h3>Service history</h3><span>{history.length ? `${history.length} recent record${history.length === 1 ? "" : "s"}` : "No earlier records"}</span></div>{history.map((item) => <div key={item.id}><span className={`is-${item.status.toLowerCase()}`} /><time>{formatDate(item.completed_at ?? item.service_started_at)}</time><strong>{item.maintenance_type}</strong><small>{item.status}</small></div>)}</section>
          {record.status === "Open" ? <footer className="admin-maintenance-detail__actions"><Btn variant="danger" onClick={() => onCancel(record)}>Cancel record</Btn><Btn variant="primary" onClick={() => onComplete(record)}>Complete service</Btn></footer> : <footer className="admin-maintenance-detail__history">This record is retained in maintenance history.</footer>}
        </>
      )}
    </aside>
  );
}

function MaintenanceWorkspaceLoading() {
  return <div className="admin-maintenance-loading" role="status" aria-label="Loading maintenance data"><div className="admin-maintenance-loading__ledger">{Array.from({ length: 3 }, (_, index) => <i key={index} />)}</div><div className="admin-maintenance-loading__layout"><section><header><i /><i /></header>{Array.from({ length: 5 }, (_, index) => <div key={index}><i /><i /><i /></div>)}</section><aside><i className="is-title" /><i className="is-impact" /><div>{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</div><footer><i /><i /></footer></aside></div></div>;
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
      <dt>{label}</dt><dd>{children}</dd>
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {completing ? "Complete maintenance" : "Cancel maintenance"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {transition?.record.maintenance_type} —{" "}
          {transition?.record.vehicle?.name}
        </p>
        {completing && (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <TransitionField label="Final odometer at service (km)">
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
            <TransitionField label="Cost (PHP)">
              <TInput
                type="number"
                min="0"
                step="0.01"
                value={draft.costPhp}
                onChange={(event) => update("costPhp", event.target.value)}
              />
            </TransitionField>
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
          </div>
        )}
        <TransitionField
          label={completing ? "Final remarks" : "Cancellation remarks"}
        >
          <textarea
            className="input-control min-h-24 w-full py-2.5"
            value={draft.remarks}
            onChange={(event) => update("remarks", event.target.value)}
          />
        </TransitionField>
        {!completing && (
          <p className="text-sm text-muted-foreground">
            The record will be retained in maintenance history.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}
        <DialogFooter>
          <Btn disabled={saving} onClick={onClose}>
            Keep open
          </Btn>
          <Btn
            variant={completing ? "primary" : "danger"}
            disabled={saving}
            onClick={onSubmit}
          >
            {saving
              ? "Saving…"
              : completing
                ? "Complete maintenance"
                : "Cancel maintenance"}
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
