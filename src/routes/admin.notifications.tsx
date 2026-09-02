import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/ui";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Recipient-specific booking, rental, maintenance, fleet, requirement, and payment updates."
      />
      <NotificationsPanel audience="admin" />
    </div>
  );
}
