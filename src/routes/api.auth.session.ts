import { createFileRoute } from "@tanstack/react-router";

import { getCurrentPrincipal } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async () => {
        const principal = await getCurrentPrincipal();
        if (!principal || principal.accountStatus !== "Active") {
          return Response.json(
            { message: "No active session." },
            { status: 401 },
          );
        }
        return Response.json({ principal });
      },
    },
  },
});
