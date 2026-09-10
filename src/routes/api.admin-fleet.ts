import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalAdminFleet } from "@/lib/admin-fleet.server";
import { requireRole } from "@/lib/auth.server";

export async function readAdminFleet() {
  try {
    await requireRole("Owner/Admin");
    return Response.json(await getCanonicalAdminFleet());
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "forbidden")
      return Response.json({ message: "Forbidden." }, { status: 403 });
    if (reason === "unauthenticated")
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    return Response.json(
      { message: "Unable to load the canonical fleet." },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/admin-fleet")({
  server: { handlers: { GET: readAdminFleet } },
});
