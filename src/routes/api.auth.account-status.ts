import { createFileRoute } from "@tanstack/react-router";

import { getAccountNextStep } from "@/lib/auth-account-discovery";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/auth/account-status")({
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

        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return Response.json(
            { message: "Enter a valid email address." },
            { status: 400 },
          );
        }

        const { data: profile, error } = await getSupabaseServerClient()
          .from("profiles")
          .select("id, user_type, account_status")
          .eq("email", email)
          .limit(1)
          .maybeSingle();

        if (error) {
          return Response.json(
            { message: "We could not check this email. Please try again." },
            { status: 503 },
          );
        }

        const next = getAccountNextStep(
          profile ? { accountStatus: profile.account_status } : null,
        );

        return Response.json({ next });
      },
    },
  },
});
