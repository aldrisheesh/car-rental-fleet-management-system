import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="admin-notifications-workspace">
      <NotificationsPanel audience="admin" />
    </div>
  );
}
