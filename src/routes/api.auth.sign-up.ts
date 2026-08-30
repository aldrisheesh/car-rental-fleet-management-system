import { createFileRoute } from "@tanstack/react-router";

import {
  resolvePrincipalForAccessToken,
  setAuthSession,
  getServerAuthClient,
} from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/sign-up")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const fullName =
          typeof body?.fullName === "string" ? body.fullName.trim() : "";
        const phoneNumber =
          typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
        const email =
          typeof body?.email === "string"
            ? body.email.trim().toLowerCase()
            : "";
        const password =
          typeof body?.password === "string" ? body.password : "";
        if (!fullName || !email || !phoneNumber || password.length < 8) {
          return Response.json(
            {
              message:
                "Name, phone number, email, and an 8-character password are required.",
            },
            { status: 400 },
          );
        }

        const { data, error } = await getServerAuthClient().auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone_number: phoneNumber } },
        });
        if (error) {
          return Response.json(
            { message: "Unable to create account. Please check your details." },
            { status: 400 },
          );
        }

        if (!data.session) {
          return Response.json({
            principal: null,
            requiresEmailConfirmation: true,
          });
        }

        const principal = await resolvePrincipalForAccessToken(
          data.session.access_token,
        );
        if (!principal || principal.role !== "Customer/Renter") {
          return Response.json(
            { message: "Unable to establish the customer account." },
            { status: 500 },
          );
        }
        setAuthSession(data.session, principal);
        return Response.json({ principal, requiresEmailConfirmation: false });
      },
    },
  },
});
