import { createFileRoute } from "@tanstack/react-router";
import { evaluateCanonicalVehicleFinder } from "@/lib/vehicle-finder.server";

const errorResponse = (message: string, status: number) =>
  Response.json({ message }, { status });

export const Route = createFileRoute("/api/vehicle-finder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        if (!body) return errorResponse("Invalid Finder request.", 400);

        try {
          const evaluation = await evaluateCanonicalVehicleFinder(body);
          if (!evaluation.ok)
            return Response.json(
              { message: evaluation.message, errors: evaluation.errors },
              { status: evaluation.status },
            );
          return Response.json({ ...evaluation.result, criteria: evaluation.input });
        } catch {
          return errorResponse("Unable to find vehicles right now.", 503);
        }
      },
    },
  },
});
