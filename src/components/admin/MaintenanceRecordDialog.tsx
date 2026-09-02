import { Btn, TInput, TSelect } from "@/components/admin/ui";
import {
  isMaintenanceDraftValid,
  type MaintenanceDraft,
} from "@/lib/maintenance-admin";
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add maintenance record</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Vehicle *">
            <TSelect
              value={draft.vehicleId}
              onChange={(event) => updateDraft("vehicleId", event.target.value)}
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
          <Field label="Service started">
            <TInput
              type="datetime-local"
              value={draft.serviceStartedAt}
              onChange={(event) =>
                updateDraft("serviceStartedAt", event.target.value)
              }
            />
          </Field>
          <Field label="Odometer at service (km)">
            <TInput
              type="number"
              min="0"
              step="0.1"
              value={draft.odometerAtService}
              onChange={(event) =>
                updateDraft("odometerAtService", event.target.value)
              }
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
          <Field label="Cost (PHP)">
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
            Blocks rental use
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
            title={canSave ? "Save record" : "Complete all required fields"}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save record"}
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
