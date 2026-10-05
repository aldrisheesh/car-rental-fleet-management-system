import { bookingReference } from "./booking-reference.ts";
import { bookingPath } from "./customer-data.ts";

export type NotificationType =
  | "date_change_requested"
  | "date_change_approved"
  | "date_change_rejected"
  | "requirements_needs_resubmission"
  | "requirements_verified"
  | "payment_needs_resubmission"
  | "booking_cancelled"
  | "booking_rejected"
  | "quote_issued"
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
  customerBindings?: CustomerNotificationBinding[];
  adminBindings?: AdminNotificationBinding[];
};

export type AdminNotificationBinding = {
  notificationId: string;
  bookingId?: string | null;
};

export type CustomerNotificationBinding = {
  bookingId: string;
  requirementSetId?: string | null;
  paymentId?: string | null;
  rentalId?: string | null;
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
    message:
      row.notification_type === "payment_verified" &&
      row.message ===
        "Your payment was verified. Booking confirmation is a separate step."
        ? "Your payment was verified. Open your booking details to check its current confirmation status."
        : String(row.message),
    relatedEntityType: row.related_entity_type as NotificationEntityType,
    relatedEntityId: String(row.related_entity_id),
    createdAt: String(row.created_at),
    readAt: row.read_at == null ? null : String(row.read_at),
  };
}

export function notificationRoute(
  notification: CanonicalNotification,
  audience: "admin" | "customer",
  customerBindings: readonly CustomerNotificationBinding[] = [],
  adminBindings: readonly AdminNotificationBinding[] = [],
  staffView = false,
) {
  if (audience === "customer") {
    const bookingId = customerBookingId(notification, customerBindings);
    return bookingId ? bookingPath(bookingId) : "/customer";
  }
  if (notification.notificationType === "maintenance_attention")
    return staffView ? "/admin" : "/admin/maintenance";
  if (notification.notificationType === "low_availability") return "/admin";
  if (notification.notificationType === "backup_attention")
    return "/admin/notifications";
  if (notification.relatedEntityType === "payment" && !staffView)
    return `/admin/payments/${encodeURIComponent(notification.relatedEntityId)}`;
  const binding = adminBindings.find(
    (candidate) => candidate.notificationId === notification.id,
  );
  if (notification.relatedEntityType === "booking")
    return `/admin/bookings/${encodeURIComponent(notification.relatedEntityId)}`;
  return binding?.bookingId
    ? `/admin/bookings/${encodeURIComponent(binding.bookingId)}`
    : "/admin/bookings";
}

export function customerBookingId(
  notification: CanonicalNotification,
  customerBindings: readonly CustomerNotificationBinding[],
) {
  const entityId = notification.relatedEntityId.trim();
  if (!entityId) return null;
  if (notification.relatedEntityType === "booking") return entityId;

  const matchingBindings = customerBindings.filter((binding) => {
    if (!binding.bookingId.trim()) return false;
    if (notification.relatedEntityType === "requirements")
      return binding.requirementSetId === entityId;
    if (notification.relatedEntityType === "payment")
      return binding.paymentId === entityId;
    if (notification.relatedEntityType === "rental")
      return binding.rentalId === entityId;
    return false;
  });

  return matchingBindings.length === 1 ? matchingBindings[0].bookingId : null;
}

/** Validate entity projections at the API boundary instead of trusting generated inference. */
export function notificationEntityBindings(
  rows: unknown,
): Array<{ id: string; booking_id: string }> {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => {
    if (
      !row ||
      typeof row !== "object" ||
      !("id" in row) ||
      !("booking_id" in row)
    )
      return [];
    return typeof row.id === "string" &&
      row.id.trim() &&
      typeof row.booking_id === "string" &&
      row.booking_id.trim()
      ? [{ id: row.id, booking_id: row.booking_id }]
      : [];
  });
}

export function notificationReference(
  notification: CanonicalNotification,
  customerBindings: readonly CustomerNotificationBinding[] = [],
  adminBindings: readonly AdminNotificationBinding[] = [],
) {
  const bookingId =
    notification.relatedEntityType === "booking"
      ? notification.relatedEntityId
      : (customerBookingId(notification, customerBindings) ??
        adminBindings.find((item) => item.notificationId === notification.id)
          ?.bookingId);
  if (bookingId) return `Booking ${bookingReference(bookingId)}`;
  const entity =
    notification.relatedEntityType === "backup_run"
      ? "Backup run"
      : notification.relatedEntityType[0].toUpperCase() +
        notification.relatedEntityType.slice(1);
  return `${entity} ${bookingReference(notification.relatedEntityId)}`;
}
