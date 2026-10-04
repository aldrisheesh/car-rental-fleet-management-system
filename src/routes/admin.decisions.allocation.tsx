import { createFileRoute } from "@tanstack/react-router";

// The parent owns the shared DSS controller and remains mounted between screens.
export const Route = createFileRoute("/admin/decisions/allocation")({
  component: () => null,
});
