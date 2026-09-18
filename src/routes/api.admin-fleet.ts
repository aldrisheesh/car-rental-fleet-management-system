import { createFileRoute } from "@tanstack/react-router";
import { getCanonicalAdminFleet } from "@/lib/admin-fleet.server";
import { requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  server: {
    handlers: {
      GET: readAdminFleet,
      PATCH: async ({ request }) => {
        try {
          const actor = await requireRole("Owner/Admin");
          const body = (await request.json().catch(() => null)) as {
            action?: unknown;
            rentalId?: unknown;
            outcome?: unknown;
            remarks?: unknown;
          } | null;
          if (body?.action !== "resolve-inspection")
            return Response.json(
              { message: "Unsupported fleet action." },
              { status: 400 },
            );
          if (typeof body.rentalId !== "string")
            return Response.json(
              { message: "A return inspection is required." },
              { status: 400 },
            );
          if (
            body.outcome !== "Cleared" &&
            body.outcome !== "Maintenance scheduled"
          )
            return Response.json(
              { message: "Choose a valid inspection outcome." },
              { status: 400 },
            );
          const result = await getSupabaseServerClient().rpc(
            "resolve_return_inspection",
            {
              p_rental_id: body.rentalId,
              p_outcome: body.outcome,
              p_remarks:
                typeof body.remarks === "string"
                  ? body.remarks.trim() || null
                  : null,
              p_actor_id: actor.userId,
            },
          );
          if (result.error)
            return Response.json(
              { message: "Unable to resolve the return inspection." },
              { status: 400 },
            );
          return Response.json(result.data);
        } catch (error) {
          const reason = error instanceof Error ? error.message : "";
          return Response.json(
            {
              message:
                reason === "forbidden"
                  ? "Forbidden."
                  : "Authentication required.",
            },
            { status: reason === "forbidden" ? 403 : 401 },
          );
        }
      },
    },
  },
});
