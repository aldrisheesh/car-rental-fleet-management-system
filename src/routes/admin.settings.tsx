import { createFileRoute, redirect } from "@tanstack/react-router";
import { Building2, CreditCard, Mail, Plug, Shield } from "lucide-react";
import { Btn, Card, CardHeader, PageHeader, TInput, TSelect } from "@/components/admin/ui";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Operational policies, integrations, and security." />

      <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
        <Card className="self-start p-2">
          {[
            { icon: Building2, label: "Business" },
            { icon: CreditCard, label: "Pricing & fees" },
            { icon: Mail, label: "Notifications" },
            { icon: Plug, label: "Integrations" },
            { icon: Shield, label: "Security" },
          ].map((t, i) => (
            <button key={t.label} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Business profile" hint="Brand details shown on receipts and invoices" />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <Field label="Company name"><TInput defaultValue="Briah's Car Rental" /></Field>
              <Field label="Trade name"><TInput defaultValue="Briah's Car Rental" /></Field>
              <Field label="TIN"><TInput defaultValue="009-284-661-000" /></Field>
              <Field label="Default currency"><TSelect defaultValue="PHP"><option>PHP</option></TSelect></Field>
              <Field label="Head office"><TInput defaultValue="Taft Ave, Manila 1004" /></Field>
              <Field label="Contact email"><TInput defaultValue="ops@briahsrental.ph" /></Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Btn>Discard</Btn>
              <Btn variant="primary">Save changes</Btn>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pricing & fees" />
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <Field label="Late return fee (₱/hr)"><TInput defaultValue="250" /></Field>
              <Field label="Cleaning fee (₱)"><TInput defaultValue="500" /></Field>
              <Field label="Security deposit (₱)"><TInput defaultValue="5000" /></Field>
              <Field label="Cancellation window"><TSelect><option>24 hours</option><option>48 hours</option></TSelect></Field>
              <Field label="Min rental days"><TInput defaultValue="1" /></Field>
              <Field label="Max rental days"><TInput defaultValue="30" /></Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Integrations" />
            <ul className="divide-y divide-border">
              {[
                { name: "Waze API", status: "Not connected" },
              ].map((i) => (
                <li key={i.name} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.status}</div>
                  </div>
                  <Btn variant={i.status === "Connected" ? "default" : "primary"}>{i.status === "Connected" ? "Manage" : "Connect"}</Btn>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="[&>*]:w-full">{children}</div>
    </label>
  );
}
