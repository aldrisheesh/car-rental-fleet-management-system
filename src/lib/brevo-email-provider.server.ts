import {
  EmailProviderError,
  type EmailMessage,
  type EmailProvider,
  type EmailSendResult,
} from "./email-provider.ts";

const BREVO_TRANSACTIONAL_EMAIL_ENDPOINT =
  "https://api.brevo.com/v3/smtp/email";

export type BrevoEmailConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

export type BrevoConfigResult =
  | { configured: true; config: BrevoEmailConfig }
  | { configured: false; missing: string[] };

export function readBrevoEmailConfig(
  values: Record<string, unknown> = process.env,
): BrevoConfigResult {
  const apiKey = stringValue(values.BREVO_API_KEY);
  const senderEmail = stringValue(values.BREVO_SENDER_EMAIL);
  const missing = [
    !apiKey && "BREVO_API_KEY",
    !senderEmail && "BREVO_SENDER_EMAIL",
  ].filter((value): value is string => Boolean(value));
  if (missing.length) return { configured: false, missing };
  return {
    configured: true,
    config: {
      apiKey,
      senderEmail,
      senderName: stringValue(values.BREVO_SENDER_NAME) || "Briah's Car Rental",
    },
  };
}

export class BrevoEmailProvider implements EmailProvider {
  private readonly config: BrevoEmailConfig;
  private readonly fetchImplementation: typeof fetch;

  constructor(
    config: BrevoEmailConfig,
    fetchImplementation: typeof fetch = fetch,
  ) {
    this.config = config;
    this.fetchImplementation = fetchImplementation;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    let response: Response;
    try {
      response = await this.fetchImplementation(
        BREVO_TRANSACTIONAL_EMAIL_ENDPOINT,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": this.config.apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              email: this.config.senderEmail,
              name: this.config.senderName,
            },
            to: [{ email: message.to }],
            subject: message.subject,
            textContent: message.text,
            htmlContent: message.html,
          }),
        },
      );
    } catch {
      throw new EmailProviderError("NetworkError", true);
    }

    if (!response.ok) throw classifyBrevoResponse(response.status);

    try {
      const payload = (await response.json()) as { messageId?: unknown };
      return {
        providerMessageId:
          typeof payload.messageId === "string"
            ? payload.messageId.slice(0, 255)
            : null,
      };
    } catch {
      return { providerMessageId: null };
    }
  }
}

function classifyBrevoResponse(status: number) {
  if (status === 401 || status === 403)
    return new EmailProviderError("ConfigurationError", false);
  if (status === 400 || status === 404 || status === 422)
    return new EmailProviderError("RecipientInvalid", false);
  if (status === 429) return new EmailProviderError("RateLimited", true);
  if (status >= 500) return new EmailProviderError("ProviderUnavailable", true);
  return new EmailProviderError("ProviderRejected", false);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
