import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BrevoEmailProvider,
  readBrevoEmailConfig,
} from "./brevo-email-provider.server.ts";
import type { EmailProvider } from "./email-provider.ts";
import { normalizeAppBaseUrl } from "./email-templates.ts";
import {
  processEmailDeliveries,
  type ClaimedEmailDelivery,
  type EmailDeliveryStore,
} from "./transactional-email.ts";
import type { Database } from "./supabase/database.types";
import { getSupabaseServerClient } from "./supabase/server";

export async function processTransactionalEmailQueue(options?: {
  now?: Date;
  client?: SupabaseClient<Database>;
  provider?: EmailProvider | null;
  environment?: Record<string, unknown>;
  limit?: number;
}) {
  const now = options?.now ?? new Date();
  const client = options?.client ?? getSupabaseServerClient();
  const environment = options?.environment ?? process.env;
  const provider = resolveProvider(options, environment);

  return processEmailDeliveries({
    store: createSupabaseEmailDeliveryStore(client),
    provider,
    now,
    appBaseUrl: normalizeAppBaseUrl(environment.APP_BASE_URL),
    limit: options?.limit,
  });
}

function resolveProvider(
  options: Parameters<typeof processTransactionalEmailQueue>[0],
  environment: Record<string, unknown>,
) {
  if (options && Object.hasOwn(options, "provider"))
    return options.provider ?? null;
  const result = readBrevoEmailConfig(environment);
  return result.configured ? new BrevoEmailProvider(result.config) : null;
}

function createSupabaseEmailDeliveryStore(
  client: SupabaseClient<Database>,
): EmailDeliveryStore {
  return {
    async claim(limit, now) {
      const result = await client.rpc("claim_email_deliveries", {
        p_limit: limit,
        p_now: now.toISOString(),
      });
      if (result.error) throw new Error("email_delivery_claim_failed");
      return (result.data ?? []).map(projectClaimedDelivery);
    },
    async markSent(id, providerMessageId, now) {
      await updateDelivery(client, id, {
        status: "Sent",
        provider_message_id: providerMessageId?.slice(0, 255) ?? null,
        last_error_code: null,
        next_attempt_at: null,
        sent_at: now.toISOString(),
      });
    },
    async markSkipped(id, code) {
      await updateDelivery(client, id, {
        status: "Skipped",
        last_error_code: code,
        next_attempt_at: null,
      });
    },
    async markFailed(id, code, nextAttemptAt) {
      await updateDelivery(client, id, {
        status: "Failed",
        last_error_code: code,
        next_attempt_at: nextAttemptAt?.toISOString() ?? null,
      });
    },
  };
}

async function updateDelivery(
  client: SupabaseClient<Database>,
  id: string,
  update: Database["public"]["Tables"]["email_deliveries"]["Update"],
) {
  const result = await client
    .from("email_deliveries")
    .update(update)
    .eq("id", id)
    .eq("status", "Processing");
  if (result.error) throw new Error("email_delivery_update_failed");
}

function projectClaimedDelivery(
  row: Database["public"]["Functions"]["claim_email_deliveries"]["Returns"][number],
): ClaimedEmailDelivery {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    notificationId: row.notification_id,
    emailType: row.email_type as ClaimedEmailDelivery["emailType"],
    attemptCount: row.attempt_count,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    emailNotificationsEnabled: row.email_notifications_enabled,
    scheduledAt: row.scheduled_at,
  };
}
