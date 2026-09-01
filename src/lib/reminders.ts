import { instantToManilaCalendarDate } from "./business-time.ts";

const REMINDER_LEAD_MILLISECONDS = 24 * 60 * 60 * 1000;

export type ReminderBooking = {
  id: string;
  customerId: string;
  bookingStatus: string;
  pickupAt: string;
};

export type ReminderRental = {
  id: string;
  bookingId: string;
  customerId: string;
  scheduledReturnAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

export type ReminderProfile = {
  id: string;
  userType: string;
  accountStatus: string;
};

export type ReminderSnapshot = {
  bookings: ReminderBooking[];
  rentals: ReminderRental[];
  profiles: ReminderProfile[];
};

export type ReminderNotification = {
  recipientId: string;
  notificationType: "upcoming_pickup" | "upcoming_return" | "rental_overdue";
  title: string;
  message: string;
  relatedEntityType: "booking" | "rental";
  relatedEntityId: string;
  eventKey: string;
};

export type ReminderProcessingSummary = {
  candidateCount: number;
  notificationCount: number;
  createdCount: number;
  deduplicatedCount: number;
  failedCount: number;
};

export type ReminderNotificationStore = {
  insertMissing(notifications: ReminderNotification[]): Promise<number>;
};

export function deriveReminderNotifications(
  snapshot: ReminderSnapshot,
  now: Date,
) {
  const nowMilliseconds = now.getTime();
  if (Number.isNaN(nowMilliseconds)) throw new Error("invalid_trusted_now");

  const activeOwnerAdminIds = snapshot.profiles
    .filter(
      (profile) =>
        profile.userType === "Owner/Admin" &&
        profile.accountStatus === "Active",
    )
    .map((profile) => profile.id);
  const startedBookingIds = new Set(
    snapshot.rentals
      .filter((rental) => parseInstant(rental.startedAt) !== null)
      .map((rental) => rental.bookingId),
  );
  const notifications: ReminderNotification[] = [];
  let candidateCount = 0;

  for (const booking of snapshot.bookings) {
    const pickupAt = parseInstant(booking.pickupAt);
    if (
      booking.bookingStatus !== "Confirmed" ||
      pickupAt === null ||
      pickupAt <= nowMilliseconds ||
      pickupAt - REMINDER_LEAD_MILLISECONDS > nowMilliseconds ||
      startedBookingIds.has(booking.id)
    ) {
      continue;
    }

    candidateCount += 1;
    addForRecipients(
      notifications,
      booking.customerId,
      activeOwnerAdminIds,
      (recipientId, isCustomer) => ({
        recipientId,
        notificationType: "upcoming_pickup",
        title: "Upcoming booking pickup",
        message: isCustomer
          ? "Your confirmed booking pickup is coming up. Review your booking details before pickup."
          : "A confirmed booking pickup is coming up and remains pending release.",
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        eventKey: `pickup-reminder:${booking.id}:24h`,
      }),
    );
  }

  const manilaDate = instantToManilaCalendarDate(now);
  for (const rental of snapshot.rentals) {
    const startedAt = parseInstant(rental.startedAt);
    const scheduledReturnAt = parseInstant(rental.scheduledReturnAt);
    if (
      startedAt === null ||
      rental.endedAt !== null ||
      scheduledReturnAt === null
    ) {
      continue;
    }

    if (
      scheduledReturnAt > nowMilliseconds &&
      scheduledReturnAt - REMINDER_LEAD_MILLISECONDS <= nowMilliseconds
    ) {
      candidateCount += 1;
      addForRecipients(
        notifications,
        rental.customerId,
        activeOwnerAdminIds,
        (recipientId, isCustomer) => ({
          recipientId,
          notificationType: "upcoming_return",
          title: "Upcoming vehicle return",
          message: isCustomer
            ? "Your scheduled vehicle return is coming up. Review your rental details and return schedule."
            : "An active rental is approaching its scheduled return.",
          relatedEntityType: "rental",
          relatedEntityId: rental.id,
          eventKey: `return-reminder:${rental.id}:24h`,
        }),
      );
    } else if (nowMilliseconds > scheduledReturnAt) {
      candidateCount += 1;
      addForRecipients(
        notifications,
        rental.customerId,
        activeOwnerAdminIds,
        (recipientId, isCustomer) => ({
          recipientId,
          notificationType: "rental_overdue",
          title: "Rental overdue",
          message: isCustomer
            ? "Your rental is overdue. Please contact Briah's regarding the vehicle return."
            : "A rental is overdue and has not yet been recorded as returned.",
          relatedEntityType: "rental",
          relatedEntityId: rental.id,
          eventKey: `overdue-rental:${rental.id}:${manilaDate}`,
        }),
      );
    }
  }

  return { candidateCount, notifications };
}

export async function processReminderSnapshot(
  snapshot: ReminderSnapshot,
  now: Date,
  store: ReminderNotificationStore,
): Promise<ReminderProcessingSummary> {
  const { candidateCount, notifications } = deriveReminderNotifications(
    snapshot,
    now,
  );
  const createdCount = notifications.length
    ? await store.insertMissing(notifications)
    : 0;
  return {
    candidateCount,
    notificationCount: notifications.length,
    createdCount,
    deduplicatedCount: notifications.length - createdCount,
    failedCount: 0,
  };
}

function addForRecipients(
  target: ReminderNotification[],
  customerId: string,
  activeOwnerAdminIds: string[],
  create: (recipientId: string, isCustomer: boolean) => ReminderNotification,
) {
  const recipientIds = new Set([customerId, ...activeOwnerAdminIds]);
  for (const recipientId of recipientIds) {
    target.push(create(recipientId, recipientId === customerId));
  }
}

function parseInstant(value: string | null) {
  if (value === null) return null;
  const milliseconds = Date.parse(value);
  return Number.isNaN(milliseconds) ? null : milliseconds;
}
