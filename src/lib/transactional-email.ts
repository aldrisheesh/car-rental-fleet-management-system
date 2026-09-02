import {
  EmailProviderError,
  type EmailProvider,
  type EmailProviderErrorCode,
} from "./email-provider.ts";
import { buildTransactionalEmail } from "./email-templates.ts";
import type { NotificationType } from "./notifications.ts";

export const EMAIL_ELIGIBLE_NOTIFICATION_TYPES = [
  "requirements_needs_resubmission",
  "requirements_verified",
  "payment_needs_resubmission",
  "payment_verified",
  "booking_confirmed",
  "upcoming_pickup",
  "upcoming_return",
  "rental_overdue",
] as const satisfies readonly NotificationType[];

export type EmailEligibleNotificationType =
  (typeof EMAIL_ELIGIBLE_NOTIFICATION_TYPES)[number];

const ELIGIBLE_TYPES = new Set<NotificationType>(
  EMAIL_ELIGIBLE_NOTIFICATION_TYPES,
);

export const MAX_EMAIL_DELIVERY_ATTEMPTS = 4;

export type ClaimedEmailDelivery = {
  id: string;
  recipientUserId: string;
  notificationId: string;
  emailType: EmailEligibleNotificationType;
  attemptCount: number;
  recipientEmail: string | null;
  recipientName: string | null;
  emailNotificationsEnabled: boolean;
  scheduledAt: string | null;
};

export type EmailDeliveryStore = {
  claim(limit: number, now: Date): Promise<ClaimedEmailDelivery[]>;
  markSent(
    id: string,
    providerMessageId: string | null,
    now: Date,
  ): Promise<void>;
  markSkipped(
    id: string,
    code: "RecipientUnavailable" | "PreferenceDisabled",
  ): Promise<void>;
  markFailed(
    id: string,
    code: EmailProviderErrorCode,
    nextAttemptAt: Date | null,
  ): Promise<void>;
};

export type EmailProcessingSummary = {
  claimedCount: number;
  sentCount: number;
  retryScheduledCount: number;
  failedCount: number;
  skippedCount: number;
};

export function isEmailEligibleNotificationType(
  value: NotificationType,
): value is EmailEligibleNotificationType {
  return ELIGIBLE_TYPES.has(value);
}

export function normalizeCanonicalRecipientEmail(value: string | null) {
  if (!value) return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return null;
  return email;
}

export async function processEmailDeliveries(options: {
  store: EmailDeliveryStore;
  provider: EmailProvider | null;
  now: Date;
  appBaseUrl?: string | null;
  limit?: number;
}): Promise<EmailProcessingSummary> {
  const deliveries = await options.store.claim(
    options.limit ?? 25,
    options.now,
  );
  const summary: EmailProcessingSummary = {
    claimedCount: deliveries.length,
    sentCount: 0,
    retryScheduledCount: 0,
    failedCount: 0,
    skippedCount: 0,
  };

  for (const delivery of deliveries) {
    if (!delivery.emailNotificationsEnabled) {
      await options.store.markSkipped(delivery.id, "PreferenceDisabled");
      summary.skippedCount += 1;
      continue;
    }
    const recipient = normalizeCanonicalRecipientEmail(delivery.recipientEmail);
    if (!recipient) {
      await options.store.markSkipped(delivery.id, "RecipientUnavailable");
      summary.skippedCount += 1;
      continue;
    }
    if (!options.provider) {
      await options.store.markFailed(delivery.id, "ConfigurationError", null);
      summary.failedCount += 1;
      continue;
    }

    try {
      const template = buildTransactionalEmail({
        emailType: delivery.emailType,
        recipientName: delivery.recipientName,
        scheduledAt: delivery.scheduledAt,
        appBaseUrl: options.appBaseUrl,
      });
      const result = await options.provider.send({
        to: recipient,
        ...template,
      });
      await options.store.markSent(
        delivery.id,
        result.providerMessageId,
        options.now,
      );
      summary.sentCount += 1;
    } catch (error) {
      const providerError = normalizeProviderError(error);
      const nextAttemptAt =
        providerError.retryable &&
        delivery.attemptCount < MAX_EMAIL_DELIVERY_ATTEMPTS
          ? calculateNextAttempt(options.now, delivery.attemptCount)
          : null;
      await options.store.markFailed(
        delivery.id,
        providerError.code,
        nextAttemptAt,
      );
      if (nextAttemptAt) summary.retryScheduledCount += 1;
      else summary.failedCount += 1;
    }
  }
  return summary;
}

export function calculateNextAttempt(now: Date, attemptCount: number) {
  const minutes = [1, 5, 15][Math.max(0, Math.min(attemptCount - 1, 2))];
  return new Date(now.getTime() + minutes * 60_000);
}

function normalizeProviderError(error: unknown) {
  return error instanceof EmailProviderError
    ? error
    : new EmailProviderError("UnknownProviderError", false);
}
