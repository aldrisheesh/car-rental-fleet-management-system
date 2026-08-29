import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Briah's Car Rental" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminShell,
});
