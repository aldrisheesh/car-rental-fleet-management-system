import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";

import { getCurrentPrincipal, getServerAuthClient } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/profile")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const principal = await getCurrentPrincipal();
        const accessToken = getCookie("briahs-auth-access");
        if (
          !principal ||
          !accessToken ||
          principal.accountStatus !== "Active"
        ) {
          return Response.json(
            { message: "You must be signed in." },
            { status: 401 },
          );
        }

        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const fullName =
          typeof body?.fullName === "string" ? body.fullName.trim() : "";
        const phoneNumber =
          typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
        if (!fullName)
          return Response.json(
            { message: "Full name is required." },
            { status: 400 },
          );

        const { error } = await getServerAuthClient(accessToken)
          .from("profiles")
          .update({ full_name: fullName, phone_number: phoneNumber })
          .eq("id", principal.userId);
        if (error)
          return Response.json(
            { message: "Unable to update your profile." },
            { status: 400 },
          );

        const updated = await getCurrentPrincipal();
        return updated
          ? Response.json({ principal: updated })
          : Response.json({ message: "Session expired." }, { status: 401 });
      },
    },
  },
});
