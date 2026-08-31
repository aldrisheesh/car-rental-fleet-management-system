import { createFileRoute } from "@tanstack/react-router";
import { requirePrincipal } from "@/lib/auth.server";
import { getVehicleAnalytics } from "@/lib/vehicle-analytics.server";

export const Route = createFileRoute("/api/vehicle-analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const principal = await requirePrincipal();
          if (principal.role === "Customer/Renter")
            return Response.json({ message: "Forbidden." }, { status: 403 });
          const url = new URL(request.url);
          const now = new Date();
          const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
          }).format(now);
          const end = url.searchParams.get("end") ?? today;
          const start =
            url.searchParams.get("start") ??
            (() => {
              const d = new Date(`${end}T00:00:00+08:00`);
              d.setUTCDate(d.getUTCDate() - 29);
              return new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Manila",
              }).format(d);
            })();
          return Response.json({
            startDate: start,
            endDate: end,
            vehicles: await getVehicleAnalytics(start, end, now),
          });
        } catch (e) {
          return Response.json(
            {
              message:
                e instanceof Error ? e.message : "Unable to load analytics.",
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
