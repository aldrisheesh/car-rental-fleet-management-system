import { createFileRoute } from "@tanstack/react-router";

import {
  clearAuthSession,
  getServerAuthClient,
  resolvePrincipalForAccessToken,
  setAuthSession,
} from "@/lib/auth.server";
import {
  canEstablishOAuthSession,
  oauthDestinationForPrincipal,
} from "@/lib/auth-oauth";

export const Route = createFileRoute("/api/auth/oauth/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const accessToken =
          typeof body?.accessToken === "string" ? body.accessToken : "";
        const refreshToken =
          typeof body?.refreshToken === "string" ? body.refreshToken : "";

        if (!accessToken || !refreshToken) {
          return Response.json(
            { message: "Invalid sign-in response." },
            { status: 400 },
          );
        }

        const principal = await resolvePrincipalForAccessToken(accessToken);
        if (!canEstablishOAuthSession(principal)) {
          await getServerAuthClient(accessToken).auth.signOut({
            scope: "local",
          });
          clearAuthSession();
          return Response.json(
            { message: "This account is not available." },
            { status: 403 },
          );
        }

        setAuthSession(
          { access_token: accessToken, refresh_token: refreshToken },
          principal,
        );
        return Response.json({
          destination: oauthDestinationForPrincipal(principal, body?.next),
        });
      },
    },
  },
});
