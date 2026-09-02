import { createFileRoute } from "@tanstack/react-router";

import { AuthBoundaryError, requireRole } from "@/lib/auth.server";
import { readBackupStatus } from "@/lib/backup/backup-status.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/backup-status")({
  server: { handlers: { GET: getBackupStatus } },
});

async function getBackupStatus() {
  try {
    await requireRole("Owner/Admin");
    return Response.json(
      await readBackupStatus(
        getSupabaseServerClient(),
        process.env.BACKUP_RETENTION_DAYS,
      ),
    );
  } catch (error) {
    if (error instanceof AuthBoundaryError) {
      return Response.json(
        {
          message:
            error.reason === "forbidden"
              ? "Forbidden."
              : "Authentication required.",
        },
        { status: error.reason === "forbidden" ? 403 : 401 },
      );
    }
    return Response.json(
      { message: "Unable to load backup status." },
      { status: 503 },
    );
  }
}
