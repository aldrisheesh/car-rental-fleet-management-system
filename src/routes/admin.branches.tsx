import { createFileRoute, redirect } from "@tanstack/react-router";
import { MapPin, Plus, TrendingUp } from "lucide-react";
import { Badge, Btn, Card, PageHeader } from "@/components/admin/ui";
import { branchPerformance, peso } from "@/data/admin";
import { getAdminSession, isStaffRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/branches")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = getAdminSession();
    if (!session) throw redirect({ to: "/sign-in" });
    if (isStaffRole(session.role)) throw redirect({ to: "/admin" });
  },
  component: BranchesPage,
});

function BranchesPage() {
  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Manage operations and growth across Luzon."
        actions={<Btn variant="primary"><Plus className="h-4 w-4" /> New branch</Btn>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {branchPerformance.map((b) => (
          <Card key={b.name}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {b.name === "Taft, Manila" ? "Flagship" : "Suburban hub"}
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-semibold">{b.name}</h3>
                </div>
                <Badge>{b.demand >= 70 ? "High demand" : "Steady"}</Badge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-y border-border py-4">
                <Stat label="Active rentals" value={String(b.active)} />
                <Stat label="Fleet on-site" value={String(b.fleet)} />
                <Stat label="Demand score" value={`${b.demand}%`} accent />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly revenue</div>
                  <div className="font-display text-2xl font-semibold text-primary">{peso(b.revenue)}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" /> +{b.name === "Taft, Manila" ? "11.2" : "8.4"}% MoM
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
