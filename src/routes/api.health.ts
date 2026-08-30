import { createFileRoute } from "@tanstack/react-router";

import { SupabaseEnvError } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const checkedAt = new Date().toISOString();

        try {
          const supabase = getSupabaseServerClient();
          const { error } = await supabase
            .from("branches")
            .select("id")
            .limit(1);

          if (error) {
            return Response.json(
              {
                ok: false,
                service: "supabase",
                database: "unavailable",
                checkedAt,
              },
              { status: 503 },
            );
          }

          return Response.json(
            { ok: true, service: "supabase", database: "connected", checkedAt },
            { status: 200 },
          );
        } catch (error) {
          if (error instanceof SupabaseEnvError) {
            return Response.json(
              {
                ok: false,
                service: "supabase",
                database: "not_configured",
                checkedAt,
              },
              { status: 503 },
            );
          }

          return Response.json(
            {
              ok: false,
              service: "supabase",
              database: "unavailable",
              checkedAt,
            },
            { status: 503 },
          );
        }
      },
    },
  },
});
