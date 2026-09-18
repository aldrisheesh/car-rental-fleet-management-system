import { Btn, TInput, TSelect } from "@/components/admin/ui";
import {
  isMaintenanceDraftValid,
  type MaintenanceDraft,
} from "@/lib/maintenance-admin";
import type { MaintenanceReadinessReason } from "@/lib/maintenance-readiness";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type { MaintenanceDraft as MaintenanceRecordDraft };

export type MaintenanceVehicleOption = {
  id: string;
  name: string;
  plate: string;
  branch?: string;
  currentOdometer?: number | null;
  conditionBlocksRentalUse?: boolean;
  maintenanceReady?: boolean;
  readinessReasons?: MaintenanceReadinessReason[];
};

const typeOptions = [
  "Preventive Maintenance",
  "Brake Service",
  "Engine Oil & Filter",
  "Tire Rotation",
  "Aircon Service",
  "Suspension Check",
  "General Repair",
];

export function MaintenanceRecordDialog({
  open,
  draft,
  vehicles,
  saving,
  error,
  onDraftChange,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  draft: MaintenanceDraft;
  vehicles: MaintenanceVehicleOption[];
  saving: boolean;
  error?: string | null;
  onDraftChange: (draft: MaintenanceDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  function updateDraft<K extends keyof MaintenanceDraft>(
    key: K,
    value: MaintenanceDraft[K],
  ) {
    onDraftChange({ ...draft, [key]: value });
  }

  const canSave = isMaintenanceDraftValid(draft);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === draft.vehicleId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}
    >
      <DialogContent className="maintenance-record-dialog max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule maintenance</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Vehicle *">
            <TSelect
              value={draft.vehicleId}
              onChange={(event) => {
                const vehicle = vehicles.find(
                  (option) => option.id === event.target.value,
                );
                onDraftChange({
                  ...draft,
                  vehicleId: event.target.value,
                  currentOdometer:
                    vehicle?.currentOdometer == null
                      ? ""
                      : String(vehicle.currentOdometer),
                });
              }}
              required
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.plate})
                  {vehicle.branch ? ` — ${vehicle.branch}` : ""}
                </option>
              ))}
            </TSelect>
          </Field>
          {selectedVehicle && (
            <section className="sm:col-span-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-semibold">Vehicle maintenance context</p>
              <div className="mt-2 grid gap-1 sm:grid-cols-3">
                <span>Current odometer: {selectedVehicle.currentOdometer == null ? "Not recorded" : `${selectedVehicle.currentOdometer.toLocaleString()} km`}</span>
                <span>Condition: {selectedVehicle.conditionBlocksRentalUse ? "Unsuitable for rental" : "No recorded block"}</span>
                <span>Maintenance: {selectedVehicle.maintenanceReady ? "Maintenance-ready" : "Not maintenance-ready"}</span>
              </div>
              {!selectedVehicle.maintenanceReady && selectedVehicle.readinessReasons?.length ? (
                <p className="mt-2 text-muted-foreground">{selectedVehicle.readinessReasons.join(" · ")}</p>
              ) : null}
            </section>
          )}
          <Field label="Maintenance type *">
            <TSelect
              value={draft.maintenanceType}
              onChange={(event) =>
                updateDraft("maintenanceType", event.target.value)
              }
              required
            >
              <option value="">Select maintenance type</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Scheduled service date/time">
            <TInput
              type="datetime-local"
              value={draft.scheduledFor}
              onChange={(event) =>
                updateDraft("scheduledFor", event.target.value)
              }
            />
          </Field>
          <Field label="Current odometer (km)">
            <TInput
              type="number"
              min="0"
              step="0.1"
              value={draft.currentOdometer}
              readOnly
            />
          </Field>
          <Field label="Next service date">
            <TInput
              type="date"
              value={draft.nextServiceDate}
              onChange={(event) =>
                updateDraft("nextServiceDate", event.target.value)
              }
            />
          </Field>
          <Field label="Next service odometer (km)">
            <TInput
              type="number"
              min="0"
              step="0.1"
              value={draft.nextServiceOdometer}
              onChange={(event) =>
                updateDraft("nextServiceOdometer", event.target.value)
              }
            />
          </Field>
          <Field label="Estimated cost (PHP)">
            <TInput
              type="number"
              min="0"
              step="0.01"
              value={draft.costPhp}
              onChange={(event) => updateDraft("costPhp", event.target.value)}
            />
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border px-3 text-sm">
            <input
              type="checkbox"
              checked={draft.blocksRentalUse}
              onChange={(event) =>
                updateDraft("blocksRentalUse", event.target.checked)
              }
            />
            Unresolved concern prevents rental use
          </label>
          <Field label="Description *" className="sm:col-span-2">
            <textarea
              value={draft.description}
              onChange={(event) =>
                updateDraft("description", event.target.value)
              }
              rows={3}
              className="input-control min-h-20 w-full py-2.5"
              placeholder="Describe the maintenance work required"
              required
            />
          </Field>
          <Field label="Remarks" className="sm:col-span-2">
            <textarea
              value={draft.remarks}
              onChange={(event) => updateDraft("remarks", event.target.value)}
              rows={3}
              className="input-control min-h-20 w-full py-2.5"
              placeholder="Optional observations or service notes"
            />
          </Field>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}

        <DialogFooter>
          <Btn disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            disabled={!canSave || saving}
            title={
              canSave ? "Schedule maintenance" : "Complete all required fields"
            }
            onClick={onSave}
          >
            {saving ? "Scheduling…" : "Schedule maintenance"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </label>
  );
}
