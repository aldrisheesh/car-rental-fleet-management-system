import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalAdminDashboard } from "@/lib/admin-dashboard.server";
import { requirePrincipal } from "@/lib/auth.server";

export async function readAdminDashboard() {
  try {
    const principal = await requirePrincipal();
    if (principal.role === "Customer/Renter")
      return Response.json({ message: "Forbidden." }, { status: 403 });

    return Response.json(await getCanonicalAdminDashboard(principal.role));
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
      { message: "Unable to load the operational dashboard." },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/admin-dashboard")({
  server: { handlers: { GET: readAdminDashboard } },
});
