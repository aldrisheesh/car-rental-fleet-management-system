import { createFileRoute } from "@tanstack/react-router";
import { handleAdminReportsRequest } from "@/lib/admin-reports";
import { loadAdminReport } from "@/lib/admin-reports.server";
import { requirePrincipal } from "@/lib/auth.server";
import { loadQueryReport } from "@/lib/report-query.server";
import { ReportValidationError } from "@/lib/admin-reports";

export const Route = createFileRoute("/api/admin-reports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (params.has("query")) {
          const principal = await requirePrincipal().catch(() => null);
          if (!principal)
            return Response.json(
              { message: "Authentication required." },
              { status: 401 },
            );
          if (
            principal.role !== "Owner/Admin" &&
            principal.role !== "Operations Staff"
          )
            return Response.json({ message: "Forbidden." }, { status: 403 });
          if (
            params.get("query") === "forecast" &&
            principal.role !== "Owner/Admin"
          )
            return Response.json(
              {
                message: "Forecast reports are available to Owner/Admin only.",
              },
              { status: 403 },
            );
          try {
            return Response.json(
              await loadQueryReport(params, principal.role),
              { headers: { "Cache-Control": "private, no-store" } },
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "report_source_failed";
            const invalid =
              message === "invalid_report_query" ||
              error instanceof ReportValidationError;
            return Response.json(
              {
                message: invalid
                  ? "Choose valid report filters."
                  : "Unable to generate the report.",
              },
              { status: invalid ? 400 : 503 },
            );
          }
        }
        return handleAdminReportsRequest(request, {
          getRole: async () => (await requirePrincipal()).role,
          loadReport: loadAdminReport,
        });
      },
    },
  },
});
