import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { ExternalContextService } from "@/lib/external-context.server";
import {
  signLocationMatch,
  verifyLocationMatch,
} from "@/lib/dss-location-token.server";
import { getSupabaseServerEnv } from "@/lib/supabase/env.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PointRow = Database["public"]["Tables"]["branch_route_points"]["Row"];
function present(p: PointRow | null) {
  return p
    ? {
        latitude: p.latitude,
        longitude: p.longitude,
        label: p.label,
        query: p.query,
        provider: p.provider,
        resultType: p.result_type,
        kind: p.kind,
        confirmedAt: p.confirmed_at,
      }
    : null;
}
export const Route = createFileRoute("/api/dss-locations")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
async function handle(request: Request) {
  try {
    const principal = await requireRole("Owner/Admin");
    const client = getSupabaseServerClient();
    if (request.method === "GET") {
      const id = new URL(request.url).searchParams.get("branchId");
      let query = client.from("branch_route_points").select("*");
      if (id) query = query.eq("branch_id", id);
      const saved = await query;
      if (saved.error) throw new Error("Unable to load confirmed map points.");
      return Response.json(
        id
          ? { point: present(saved.data[0] ?? null) }
          : {
              points: Object.fromEntries(
                saved.data.map((p) => [p.branch_id, present(p)]),
              ),
            },
      );
    }
    const body = await request.json().catch(() => null);
    const branchId = body?.branchId;
    if (
      typeof branchId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        branchId,
      )
    )
      return Response.json(
        { message: "Select a valid location." },
        { status: 400 },
      );
    const branch = await client
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .maybeSingle();
    if (branch.error) throw new Error("Unable to load location.");
    if (body.create !== true && !branch.data)
      return Response.json(
        { message: "Location no longer exists." },
        { status: 404 },
      );
    if (body.create === true && branch.data)
      return Response.json(
        { message: "This location already exists. Reload before editing." },
        { status: 409 },
      );
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const secret = getSupabaseServerEnv().serviceRoleKey;
    if (body.action === "lookup") {
      if (query.length < 5 || query.length > 500)
        return Response.json(
          { message: "Enter a complete address, up to 500 characters." },
          { status: 400 },
        );
      const result = await new ExternalContextService().geocode({ query });
      if (result.status !== "available" || !result.data)
        return Response.json(
          {
            message:
              "We couldn't find that location on the map. Choose one of the suggested addresses, or add a street, barangay, city or landmark and try Find address again.",
          },
          { status: 422 },
        );
      const match = {
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        label: result.data.label,
        query,
        provider: result.providerUsed ?? "unknown",
        resultType: result.data.providerMetadata.resultType ?? "unknown",
      };
      return Response.json({
        match,
        token: signLocationMatch(match, branchId, secret),
      });
    }
    if (
      body.action !== "save" ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 120 ||
      query.length > 500 ||
      typeof body.isActive !== "boolean"
    )
      return Response.json(
        { message: "Enter a location name and valid active state." },
        { status: 400 },
      );
    let point = null;
    if (body.token) {
      const match =
        typeof body.token === "string"
          ? verifyLocationMatch(body.token, branchId, secret)
          : null;
      if (!match || match.query !== query)
        return Response.json(
          {
            message:
              "This match expired or the address changed. Find the address again.",
          },
          { status: 409 },
        );
      if (
        body.acknowledged !== true ||
        !["area_reference", "movement_point"].includes(body.kind)
      )
        return Response.json(
          {
            message:
              "Confirm the matched address and map pin for the selected purpose.",
          },
          { status: 400 },
        );
      point = { ...match, kind: body.kind };
    }
    const saved = await client.rpc("save_operational_location", {
      p_id: branchId,
      p_create: body.create === true,
      p_name: body.name.trim(),
      p_address: query,
      p_active: body.isActive,
      p_point: point,
      p_actor: principal.userId,
    });
    if (saved.error)
      return Response.json(
        {
          message: saved.error.message.includes("Confirm the map point")
            ? "Find and confirm the map point before saving this active location."
            : "Unable to save the location. Reload and try again.",
        },
        { status: 409 },
      );
    const result = saved.data as unknown as {
      branch: Database["public"]["Tables"]["branches"]["Row"];
      point: PointRow | null;
    };
    return Response.json({
      branch: result.branch,
      point: present(result.point),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check this location.";
    const status =
      message === "forbidden" ? 403 : message === "unauthenticated" ? 401 : 503;
    return Response.json(
      {
        message:
          status === 403
            ? "Owner/Admin access is required."
            : status === 401
              ? "Sign in again."
              : message,
      },
      { status },
    );
  }
}
