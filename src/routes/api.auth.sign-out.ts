import { createFileRoute } from "@tanstack/react-router";

import { clearAuthSession, getServerAuthClient } from "@/lib/auth.server";
import { getCookie } from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/auth/sign-out")({
  server: {
    handlers: {
      POST: async () => {
        const accessToken = getCookie("briahs-auth-access");
        if (accessToken)
          await getServerAuthClient(accessToken).auth.signOut({
            scope: "local",
          });
        clearAuthSession();
        return Response.json({ ok: true });
      },
    },
  },
});
