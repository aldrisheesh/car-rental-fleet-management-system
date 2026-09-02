import { createFileRoute } from "@tanstack/react-router";
import { handleAdminReportsRequest } from "@/lib/admin-reports";
import { loadAdminReport } from "@/lib/admin-reports.server";
import { requirePrincipal } from "@/lib/auth.server";

export const Route = createFileRoute("/api/admin-reports")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleAdminReportsRequest(request, {
          getRole: async () => (await requirePrincipal()).role,
          loadReport: loadAdminReport,
        }),
    },
  },
});
