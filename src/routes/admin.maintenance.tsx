import { createFileRoute, redirect } from "@tanstack/react-router";
import { History, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MaintenanceRecordDialog,
  type MaintenanceVehicleOption,
} from "@/components/admin/MaintenanceRecordDialog";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
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
  const [readiness, setReadiness] = useState<ReadinessItem[]>([]);
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
    <PageHeader
      title="Maintenance"
      subtitle="Preventive maintenance, service records, and vehicle readiness."
      actions={
        <Btn variant="primary" onClick={openCreateDialog} disabled={loading}>
          <Plus className="h-4 w-4" /> Add maintenance record
        </Btn>
      }
    />
  );

  if (loading && records.length === 0)
    return (
      <div>
        {header}
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading maintenance data…
        </Card>
      </div>
    );

  if (loadError)
    return (
      <div>
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
    <div>
      {header}

      {feedback && (
        <div
          role={feedback.kind === "warning" ? "alert" : "status"}
          aria-live="polite"
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            feedback.kind === "warning"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {records.length === 0 && (
        <p className="mb-5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No maintenance records yet.
        </p>
      )}

      <p className="mb-5 text-sm text-muted-foreground">
        {active.length} open record{active.length === 1 ? "" : "s"} ·{" "}
        {attention.length} vehicle{attention.length === 1 ? "" : "s"} with
        derived readiness attention. Record status is canonical; readiness is
        derived and is not persisted.
      </p>

      <Card className="mt-6">
        <CardHeader
          title="Maintenance / readiness attention"
          hint="Canonical PMS and vehicle readiness checks"
        />
        <div className="overflow-x-auto">
          {attention.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              All vehicles are maintenance-ready.
            </p>
          ) : (
            <table className="w-full min-w-[620px] text-sm">
              <caption className="sr-only">
                Vehicles with maintenance readiness attention
              </caption>
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">Vehicle</th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Readiness
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    Canonical evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {attention.map((item) => (
                  <tr
                    key={item.vehicleId}
                    className="border-b border-border/60 align-top"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium">{item.vehicleName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.licensePlate}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge>Not maintenance-ready</Badge>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {item.reasons.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <Card>
          <CardHeader
            title="Active maintenance"
            hint="Open records; blocking work is prioritized"
          />
          {active.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No active maintenance.
            </p>
          ) : (
            <MaintenanceTable
              records={active}
              active
              selectedId={selectedRecord?.id}
              onSelect={setSelectedRecordId}
              onComplete={(record) => openTransition(record, "Completed")}
              onCancel={(record) => openTransition(record, "Cancelled")}
            />
          )}
        </Card>
        <MaintenanceDetail record={selectedRecord} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Maintenance history"
          hint="Completed and cancelled records"
          right={<History className="h-4 w-4 text-muted-foreground" />}
        />
        {maintenanceHistory.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No maintenance history.
          </p>
        ) : (
          <MaintenanceTable records={maintenanceHistory} />
        )}
      </Card>

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

function MaintenanceTable({
  records,
  active = false,
  selectedId,
  onSelect,
  onComplete,
  onCancel,
}: {
  records: MaintenanceRecord[];
  active?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onComplete?: (record: MaintenanceRecord) => void;
  onCancel?: (record: MaintenanceRecord) => void;
}) {
  return (
    <div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Canonical maintenance records</caption>
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-semibold">Vehicle</th>
              <th className="px-5 py-3 text-left font-semibold">
                Service facts
              </th>
              <th className="px-5 py-3 text-left font-semibold">
                Due evidence
              </th>
              <th className="px-5 py-3 text-left font-semibold">Status</th>
              {active ? (
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <MaintenanceRow
                key={record.id}
                record={record}
                active={active}
                selected={selectedId === record.id}
                onSelect={onSelect}
                onComplete={onComplete}
                onCancel={onCancel}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-border lg:hidden">
        {records.map((record) => (
          <MaintenanceDisclosure
            key={record.id}
            record={record}
            active={active}
            selected={selectedId === record.id}
            onSelect={onSelect}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
}

function MaintenanceRow({
  record,
  active,
  selected,
  onSelect,
  onComplete,
  onCancel,
}: {
  record: MaintenanceRecord;
  active: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onComplete?: (record: MaintenanceRecord) => void;
  onCancel?: (record: MaintenanceRecord) => void;
}) {
  return (
    <tr
      className={`border-b border-border/60 align-top ${selected ? "bg-secondary/50" : "hover:bg-secondary/30"}`}
    >
      <td className="px-5 py-4">
        {onSelect ? (
          <button
            className="min-h-11 text-left"
            onClick={() => onSelect(record.id)}
            aria-label={`View maintenance record for ${record.vehicle?.name ?? "vehicle"}`}
          >
            <span className="block font-medium">
              {record.vehicle?.name ?? "Unknown vehicle"}
            </span>
            <span className="block font-mono text-xs text-muted-foreground">
              {record.vehicle?.license_plate ?? "Plate unavailable"}
            </span>
          </button>
        ) : (
          <>
            <div className="font-medium">
              {record.vehicle?.name ?? "Unknown vehicle"}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {record.vehicle?.license_plate ?? "Plate unavailable"}
            </div>
          </>
        )}
        {record.blocks_rental_use ? (
          <div className="mt-2 text-xs font-semibold text-[#a45b13]">
            Blocks rental use
          </div>
        ) : null}
      </td>
      <td className="max-w-md px-5 py-4">
        <div className="font-medium">{record.maintenance_type}</div>
        <div className="mt-1 text-muted-foreground">{record.description}</div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          <span>Started: {formatDate(record.service_started_at, true)}</span>
          <span>Odometer: {formatOdometer(record.odometer_at_service)}</span>
          <span>Cost: {formatMoney(record.cost_php)}</span>
          {record.completed_at ? (
            <span>Completed: {formatDate(record.completed_at, true)}</span>
          ) : null}
        </div>
        {record.remarks ? (
          <div className="mt-2 text-xs text-muted-foreground">
            Remarks: {record.remarks}
          </div>
        ) : null}
      </td>
      <td className="px-5 py-4 text-sm text-muted-foreground">
        <div>{formatDate(record.next_service_date)}</div>
        <div className="mt-1 text-xs">
          {formatOdometer(record.next_service_odometer)}
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge>{record.status}</Badge>
      </td>
      {active ? (
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            <Btn variant="primary" onClick={() => onComplete?.(record)}>
              Complete
            </Btn>
            <Btn variant="danger" onClick={() => onCancel?.(record)}>
              Cancel
            </Btn>
          </div>
        </td>
      ) : null}
    </tr>
  );
}

function MaintenanceDisclosure({
  record,
  active,
  selected,
  onSelect,
  onComplete,
  onCancel,
}: {
  record: MaintenanceRecord;
  active: boolean;
  selected: boolean;
  onSelect?: (id: string) => void;
  onComplete?: (record: MaintenanceRecord) => void;
  onCancel?: (record: MaintenanceRecord) => void;
}) {
  return (
    <details
      className={`group px-5 py-4 ${selected ? "bg-secondary/50" : ""}`}
      onToggle={() => onSelect?.(record.id)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <div className="font-medium">
            {record.vehicle?.name ?? "Unknown vehicle"}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {record.vehicle?.license_plate ?? "Plate unavailable"}
          </div>
        </div>
        <Badge>{record.status}</Badge>
      </summary>
      <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Service
          </span>
          <p className="mt-1 font-medium">{record.maintenance_type}</p>
          <p className="text-muted-foreground">{record.description}</p>
        </div>
        <dl className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <div>
            <dt>Started</dt>
            <dd className="text-foreground">
              {formatDate(record.service_started_at, true)}
            </dd>
          </div>
          <div>
            <dt>Odometer</dt>
            <dd className="text-foreground">
              {formatOdometer(record.odometer_at_service)}
            </dd>
          </div>
          <div>
            <dt>Next service</dt>
            <dd className="text-foreground">
              {formatDate(record.next_service_date)} ·{" "}
              {formatOdometer(record.next_service_odometer)}
            </dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd className="text-foreground">{formatMoney(record.cost_php)}</dd>
          </div>
        </dl>
        {record.blocks_rental_use ? (
          <p className="text-xs font-semibold text-[#a45b13]">
            Blocks rental use
          </p>
        ) : null}
        {record.remarks ? (
          <p className="text-xs text-muted-foreground">
            Remarks: {record.remarks}
          </p>
        ) : null}
        {active ? (
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={() => onComplete?.(record)}>
              Complete
            </Btn>
            <Btn variant="danger" onClick={() => onCancel?.(record)}>
              Cancel
            </Btn>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function MaintenanceDetail({ record }: { record: MaintenanceRecord | null }) {
  return (
    <Card as="aside" className="h-fit xl:sticky xl:top-6">
      {!record ? (
        <p className="p-6 text-sm text-muted-foreground">
          Select a maintenance record to inspect its canonical service facts.
        </p>
      ) : (
        <>
          <div className="border-b border-border px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Selected record
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {record.vehicle?.name ?? "Unknown vehicle"}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {record.vehicle?.license_plate ?? "Plate unavailable"} ·{" "}
              {record.id}
            </p>
            <div className="mt-3">
              <Badge>{record.status}</Badge>
            </div>
          </div>
          <dl className="grid gap-3 px-5 py-5 text-sm sm:grid-cols-2 xl:grid-cols-1">
            <Detail label="Maintenance type">{record.maintenance_type}</Detail>
            <Detail label="Description">{record.description}</Detail>
            <Detail label="Started">
              {formatDate(record.service_started_at, true)}
            </Detail>
            <Detail label="Next service">
              {formatDate(record.next_service_date)} ·{" "}
              {formatOdometer(record.next_service_odometer)}
            </Detail>
            <Detail label="Odometer">
              {formatOdometer(record.odometer_at_service)}
            </Detail>
            <Detail label="Cost">{formatMoney(record.cost_php)}</Detail>
            <Detail label="Rental use">
              {record.blocks_rental_use
                ? "Blocks rental use"
                : "Does not block rental use"}
            </Detail>
            {record.remarks ? (
              <Detail label="Remarks">{record.remarks}</Detail>
            ) : null}
          </dl>
          <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground">
            Record facts are read from the canonical maintenance API. State
            transitions remain limited to the supported Open → Completed or Open
            → Cancelled mutations.
          </p>
        </>
      )}
    </Card>
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
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words">{children}</dd>
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
