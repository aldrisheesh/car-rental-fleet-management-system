export type NotificationType =
  | "requirements_needs_resubmission"
  | "requirements_verified"
  | "payment_needs_resubmission"
  | "payment_verified"
  | "booking_confirmed"
  | "new_booking_request"
  | "requirements_submitted"
  | "payment_proof_submitted"
  | "upcoming_pickup"
  | "upcoming_return"
  | "rental_overdue"
  | "maintenance_attention"
  | "low_availability"
  | "backup_attention";

export type NotificationEntityType =
  | "booking"
  | "requirements"
  | "payment"
  | "rental"
  | "vehicle"
  | "branch"
  | "backup_run";

export type CanonicalNotification = {
  id: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  relatedEntityType: NotificationEntityType;
  relatedEntityId: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationsResponse = {
  notifications: CanonicalNotification[];
  unreadCount: number;
  emailNotificationsEnabled: boolean;
};

type NotificationRow = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  related_entity_type: string;
  related_entity_id: string;
  created_at: string;
  read_at: string | null;
};

export const NOTIFICATIONS_CHANGED_EVENT = "briahs-notifications-changed";

export function isUnread(notification: CanonicalNotification) {
  return notification.readAt === null;
}

export function projectNotification(
  row: NotificationRow,
): CanonicalNotification {
  return {
    id: String(row.id),
    notificationType: row.notification_type as NotificationType,
    title: String(row.title),
    message: String(row.message),
    relatedEntityType: row.related_entity_type as NotificationEntityType,
    relatedEntityId: String(row.related_entity_id),
    createdAt: String(row.created_at),
    readAt: row.read_at == null ? null : String(row.read_at),
  };
}

export function notificationRoute(
  notification: CanonicalNotification,
  audience: "admin" | "customer",
) {
  if (audience === "customer")
    return notification.relatedEntityType === "payment"
      ? "/payment-details"
      : "/customer";
  if (notification.notificationType === "maintenance_attention")
    return "/admin/maintenance";
  if (notification.notificationType === "low_availability") return "/admin";
  if (notification.notificationType === "backup_attention")
    return "/admin/notifications";
  return notification.relatedEntityType === "payment"
    ? "/admin/payments"
    : "/admin/bookings";
}
