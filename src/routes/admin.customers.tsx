import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileText, Mail, Phone, Search, UserPlus } from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  PageHeader,
  TInput,
  TSelect,
  Toolbar,
} from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customers, peso } from "@/data/admin";
import { useState } from "react";

export const Route = createFileRoute("/admin/customers")({ component: CustomersPage });

type RequirementStatus = "Verified" | "Pending";
type RequirementFile = {
  fileName: string;
  label: string;
  fallbackStatus: RequirementStatus;
};

function CustomersPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(customers[0]);
  const [requirementStatuses, setRequirementStatuses] = useState<Record<string, RequirementStatus>>(
    {},
  );
  const [quickViewFile, setQuickViewFile] = useState<RequirementFile | null>(null);

  const rows = customers.filter(
    (c) => !q || [c.id, c.name, c.email, c.phone].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  const selectedRequirements = getRequirementFiles(selected.verification);

  function requirementKey(fileName: string) {
    return `${selected.id}:${fileName}`;
  }

  function getRequirementStatus(file: RequirementFile) {
    return requirementStatuses[requirementKey(file.fileName)] ?? file.fallbackStatus;
  }

  function updateRequirementStatus(fileName: string, status: RequirementStatus) {
    setRequirementStatuses((current) => ({
      ...current,
      [`${selected.id}:${fileName}`]: status,
    }));
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Verify identities, monitor rental behavior, manage histories."
        actions={
          <Btn variant="primary">
            <UserPlus className="h-4 w-4" /> Add customer
          </Btn>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div>
          <Toolbar>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <TInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-full pl-9"
              />
            </div>
            <span className="text-xs text-muted-foreground">{rows.length} customers</span>
          </Toolbar>

          <Card>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Trips</th>
                  <th className="px-4 py-3 text-right font-semibold">Lifetime spend</th>
                  <th className="px-4 py-3 text-left font-semibold">Verification</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40 ${selected.id === c.id ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                    <td className="px-4 py-3 text-right">{c.trips}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold">
                      {peso(c.spent)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{c.verification}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="self-start">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 font-display text-lg font-semibold text-primary">
                {selected.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">{selected.name}</h3>
                <div className="mt-1">
                  <Badge>{selected.verification}</Badge>
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <Row
                icon={<Mail className="h-4 w-4 text-primary" />}
                label="Email"
                value={selected.email}
              />
              <Row
                icon={<Phone className="h-4 w-4 text-primary" />}
                label="Phone"
                value={selected.phone}
              />
              <Row label="Customer ID" value={selected.id} />
              <Row label="Joined" value={selected.joined} />
              <Row label="Total trips" value={String(selected.trips)} />
              <Row label="Lifetime spend" value={peso(selected.spent)} />
            </dl>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5">
              <KPIish label="Ongoing" value="1" />
              <KPIish label="Completed" value={String(selected.trips - 1)} />
              <KPIish label="Cancelled" value="0" />
            </div>
          </div>

          <CardHeader title="Uploaded requirements" />
          <ul className="divide-y divide-border text-sm">
            {selectedRequirements.map((file) => (
              <li key={file.fileName} className="px-5 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate font-mono text-xs">{file.fileName}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{file.label}</div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Btn type="button" variant="ghost" onClick={() => setQuickViewFile(file)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Btn>
                    <TSelect
                      aria-label={`Status for ${file.fileName}`}
                      value={getRequirementStatus(file)}
                      onChange={(event) =>
                        updateRequirementStatus(
                          file.fileName,
                          event.target.value as RequirementStatus,
                        )
                      }
                      className="min-h-9 w-32 text-xs"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                    </TSelect>
                    <Badge>{getRequirementStatus(file)}</Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex gap-2 border-t border-border p-4">
            <Btn variant="primary" className="flex-1">
              Approve
            </Btn>
            <Btn variant="danger" className="flex-1">
              Reject
            </Btn>
          </div>
        </Card>
      </div>

      <Dialog open={quickViewFile != null} onOpenChange={(open) => !open && setQuickViewFile(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Requirement quick view</DialogTitle>
            <DialogDescription>{quickViewFile?.fileName}</DialogDescription>
          </DialogHeader>

          {quickViewFile && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="aspect-[4/3] rounded-md border border-dashed border-border bg-card p-5">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="mt-3 font-mono text-sm font-semibold">
                      {quickViewFile.fileName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Preview placeholder for uploaded customer file
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <PreviewMeta label="Customer" value={selected.name} />
                <PreviewMeta label="Document" value={quickViewFile.label} />
                <PreviewMeta label="Customer ID" value={selected.id} />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </div>
                  <div className="mt-1">
                    <Badge>{getRequirementStatus(quickViewFile)}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getRequirementFiles(verification: string): RequirementFile[] {
  const pendingState: RequirementStatus = verification === "Verified" ? "Verified" : "Pending";

  return [
    {
      fileName: "drivers_license.jpg",
      label: "Driver's license",
      fallbackStatus: "Verified",
    },
    {
      fileName: "valid_id_back.jpg",
      label: "Valid ID",
      fallbackStatus: "Verified",
    },
    {
      fileName: "lto_license_portal_screenshot.png",
      label: "Screenshot of License on LTO portal",
      fallbackStatus: pendingState,
    },
    {
      fileName: "secondary_id_front.jpg",
      label: "Secondary ID front",
      fallbackStatus: pendingState,
    },
    {
      fileName: "secondary_id_back.jpg",
      label: "Secondary ID back",
      fallbackStatus: pendingState,
    },
  ];
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function KPIish({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/60 p-3 text-center">
      <div className="font-display text-lg font-semibold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
