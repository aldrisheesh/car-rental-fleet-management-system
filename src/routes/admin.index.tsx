import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarRange,
  Car,
  CheckCircle2,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  Badge,
  Btn,
  Card,
  CardHeader,
  KPI,
  PageHeader,
} from "@/components/admin/ui";
import type { AdminDashboardResponse } from "@/lib/admin-dashboard";

export const Route = createFileRoute("/admin/")({
  component: DashboardOverview,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: AdminDashboardResponse };

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const shortReference = (id: string) => id.slice(0, 8).toUpperCase();

function DashboardOverview() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const loadDashboard = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/admin-dashboard", {
        credentials: "same-origin",
      });
      const body = (await response.json().catch(() => null)) as
        | AdminDashboardResponse
        | { message?: string }
        | null;
      if (!response.ok || !body || !("operational" in body))
        throw new Error(
          body && "message" in body && body.message
            ? body.message
            : "Unable to load the operational dashboard.",
        );
      setState({ status: "ready", data: body });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load the operational dashboard.",
      });
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (state.status === "loading")
    return (
      <div>
        <PageHeader
          title="Operations dashboard"
          subtitle="Loading the current canonical operational snapshot."
        />
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading operational dashboard...
        </Card>
      </div>
    );
  if (state.status === "error")
    return (
      <div>
        <PageHeader
          title="Operations dashboard"
          subtitle="The current operational snapshot is temporarily unavailable."
        />
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-amber-400" />
          <p className="mt-3 text-sm">{state.message}</p>
          <Btn className="mt-4" onClick={() => void loadDashboard()}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Btn>
        </Card>
      </div>
    );

  const { data } = state;
  const staffView = data.role === "Operations Staff";
  const kpis = data.operational;
  return (
    <div>
      <PageHeader
        title={staffView ? "Staff operations dashboard" : "Operations overview"}
        subtitle={`Current canonical snapshot · Updated ${formatDateTime(data.generatedAt)}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          label="Submitted bookings"
          value={String(kpis.submittedBookings)}
          icon={<CalendarRange className="h-4 w-4" />}
          accent
        />
        <KPI
          label="Active rentals"
          value={String(kpis.activeRentals)}
          icon={<Car className="h-4 w-4" />}
        />
        <KPI
          label="Available now"
          value={String(kpis.availableVehicles)}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KPI
          label="Readiness attention"
          value={String(kpis.readinessAttention)}
          icon={<Wrench className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Operational attention"
            hint="Derived from current booking and fleet-readiness state"
          />
          <div className="divide-y divide-border">
            <AttentionRow
              label="Bookings awaiting action"
              detail="Canonical booking status: Submitted"
              count={kpis.submittedBookings}
            />
            <AttentionRow
              label="Vehicles requiring readiness attention"
              detail="Canonical maintenance readiness is false"
              count={kpis.readinessAttention}
            />
          </div>
          {kpis.submittedBookings === 0 && kpis.readinessAttention === 0 ? (
            <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
              No booking or fleet-readiness attention is currently required.
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            title="Fleet readiness attention"
            hint="Vehicles that are not currently maintenance-ready"
          />
          {data.readinessAttention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No vehicles currently require readiness attention.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.readinessAttention.map((item) => (
                <li key={item.vehicleId} className="px-5 py-3.5">
                  <div className="text-sm font-medium">{item.vehicleName}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {item.licensePlate || "No license plate"} ·{" "}
                    {item.reasons.join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Latest bookings"
          hint="Most recently created canonical booking records"
        />
        {data.recentBookings.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No booking records yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    Booking {shortReference(booking.id)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {booking.vehicleName ?? "Vehicle not assigned"} ·{" "}
                    {formatDateTime(booking.pickupAt)} to{" "}
                    {formatDateTime(booking.returnAt)}
                  </div>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AttentionRow({
  label,
  detail,
  count,
}: {
  label: string;
  detail: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div>
      </div>
      <span className="font-display text-xl font-semibold">{count}</span>
    </div>
  );
}
