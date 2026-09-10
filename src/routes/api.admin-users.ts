import { createFileRoute } from "@tanstack/react-router";

import {
  ADMIN_USER_PROFILE_COLUMNS,
  parseAdminUserRole,
  toAdminUserAccount,
  type CanonicalAdminProfile,
} from "@/lib/admin-users";
import { AuthBoundaryError, requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function unauthorizedResponse(error: unknown) {
  if (!(error instanceof AuthBoundaryError)) return null;
  if (error.reason === "forbidden")
    return Response.json(
      { message: "Owner/Admin access is required." },
      { status: 403 },
    );
  return Response.json(
    { message: "Authentication required." },
    { status: 401 },
  );
}

function parseUserId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function handleAdminUsers({ request }: { request: Request }) {
  try {
    await requireRole("Owner/Admin");
    const client = getSupabaseServerClient();

    if (request.method === "GET") {
      const { data, error } = await client
        .from("profiles")
        .select(ADMIN_USER_PROFILE_COLUMNS)
        .order("created_at", { ascending: true })
        .order("full_name", { ascending: true });
      if (error) {
        return Response.json(
          { message: "Unable to load application accounts." },
          { status: 503 },
        );
      }

      const accounts = (data as CanonicalAdminProfile[])
        .map(toAdminUserAccount)
        .filter(
          (account): account is NonNullable<typeof account> => account !== null,
        );
      return Response.json({ accounts });
    }

    if (request.method === "PATCH") {
      const body = (await request.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      const userId = parseUserId(body?.userId);
      const role = parseAdminUserRole(body?.role);
      if (!userId || !role) {
        return Response.json(
          { message: "A valid account and canonical role are required." },
          { status: 400 },
        );
      }

      const { data, error } = await client
        .from("profiles")
        .update({ user_type: role })
        .eq("id", userId)
        .select(ADMIN_USER_PROFILE_COLUMNS)
        .maybeSingle();
      if (error) {
        return Response.json(
          { message: "Unable to update the application account role." },
          { status: 503 },
        );
      }
      if (!data) {
        return Response.json(
          { message: "Application account not found." },
          { status: 404 },
        );
      }

      const account = toAdminUserAccount(data as CanonicalAdminProfile);
      if (!account) {
        return Response.json(
          { message: "The account has an invalid canonical role." },
          { status: 503 },
        );
      }
      return Response.json({ account });
    }

    return new Response(null, {
      status: 405,
      headers: { Allow: "GET, PATCH" },
    });
  } catch (error) {
    return (
      unauthorizedResponse(error) ??
      Response.json(
        { message: "Unable to access application accounts." },
        { status: 503 },
      )
    );
  }
}

export const Route = createFileRoute("/api/admin-users")({
  server: { handlers: { GET: handleAdminUsers, PATCH: handleAdminUsers } },
});
