import { createFileRoute } from "@tanstack/react-router";

import {
  resolvePrincipalForAccessToken,
  setAuthSession,
  getServerAuthClient,
} from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/sign-in")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const email =
          typeof body?.email === "string"
            ? body.email.trim().toLowerCase()
            : "";
        const password =
          typeof body?.password === "string" ? body.password : "";
        if (!email || !password) {
          return Response.json(
            { message: "Email and password are required." },
            { status: 400 },
          );
        }

        const { data, error } =
          await getServerAuthClient().auth.signInWithPassword({
            email,
            password,
          });
        if (error || !data.session) {
          return Response.json(
            { message: "Invalid email or password." },
            { status: 401 },
          );
        }

        const principal = await resolvePrincipalForAccessToken(
          data.session.access_token,
        );
        if (!principal || principal.accountStatus !== "Active") {
          return Response.json(
            { message: "This account is not available." },
            { status: 403 },
          );
        }

        setAuthSession(data.session, principal);
        return Response.json({ principal });
      },
    },
  },
});
