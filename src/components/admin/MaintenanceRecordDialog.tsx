import { Btn, TInput, TSelect } from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed" | "Overdue";

export type MaintenanceRecordDraft = {
  maintenance_id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  maintenance_status: MaintenanceStatus;
  scheduled_date: string;
  completed_date: string;
  cost: string;
  performed_by: string;
  recorded_by: string;
  created_at: string;
};

export type MaintenanceVehicleOption = {
  id: string;
  name: string;
  plate: string;
  branch: string;
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
  onDraftChange,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  draft: MaintenanceRecordDraft;
  vehicles: MaintenanceVehicleOption[];
  onDraftChange: (draft: MaintenanceRecordDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}) {
  function updateDraft<K extends keyof MaintenanceRecordDraft>(
    key: K,
    value: MaintenanceRecordDraft[K],
  ) {
    onDraftChange({ ...draft, [key]: value });
  }

  const canSave = Boolean(draft.vehicle_id);
  const saveTitle = canSave ? "Save record" : "Select a vehicle first";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Service now</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Vehicle">
            <TSelect
              value={draft.vehicle_id}
              onChange={(event) => {
                const nextVehicleId = event.target.value;
                const selected = vehicles.find((v) => v.id === nextVehicleId);

                onDraftChange({
                  ...draft,
                  vehicle_id: nextVehicleId,
                  description:
                    draft.description.trim() || !selected
                      ? draft.description
                      : `${selected.name} (${selected.plate}) - ${draft.maintenance_type}`,
                });
              }}
            >
              <option value="" disabled>
                Select vehicle
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate}) — {v.branch}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Maintenance Type">
            <TSelect
              value={draft.maintenance_type}
              onChange={(event) => updateDraft("maintenance_type", event.target.value)}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </TSelect>
          </Field>
          <Field label="Maintenance Status">
            <TSelect
              value={draft.maintenance_status}
              onChange={(event) =>
                updateDraft("maintenance_status", event.target.value as MaintenanceStatus)
              }
            >
              <option>Scheduled</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Overdue</option>
            </TSelect>
          </Field>
          <Field label="Scheduled Date">
            <TInput
              type="date"
              value={draft.scheduled_date}
              onChange={(event) => updateDraft("scheduled_date", event.target.value)}
            />
          </Field>
          <Field label="Completed Date">
            <TInput
              type="date"
              value={draft.completed_date}
              onChange={(event) => updateDraft("completed_date", event.target.value)}
            />
          </Field>
          <Field label="Cost">
            <TInput
              type="number"
              min="0"
              step="0.01"
              value={draft.cost}
              onChange={(event) => updateDraft("cost", event.target.value)}
            />
          </Field>
          <Field label="Performed By">
            <TInput
              value={draft.performed_by}
              onChange={(event) => updateDraft("performed_by", event.target.value)}
              placeholder="Mechanic name"
            />
          </Field>
          <Field label="Recorded By">
            <TInput
              type="number"
              value={draft.recorded_by}
              onChange={(event) => updateDraft("recorded_by", event.target.value)}
            />
          </Field>
          <Field label="Date recorded">
            <TInput value={draft.created_at} readOnly />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              rows={4}
              className="input-control min-h-24 w-full py-2.5"
              placeholder="Service notes and findings"
            />
          </Field>
        </div>

        <DialogFooter>
          <Btn onClick={() => onOpenChange(false)}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!canSave}
            title={saveTitle}
            onClick={() => {
              onSave?.();
              onOpenChange(false);
            }}
          >
            Save record
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
