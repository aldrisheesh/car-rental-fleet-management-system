export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult = {
  providerMessageId: string | null;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

export type EmailProviderErrorCode =
  | "ConfigurationError"
  | "RecipientInvalid"
  | "RateLimited"
  | "ProviderUnavailable"
  | "ProviderRejected"
  | "NetworkError"
  | "UnknownProviderError";

export class EmailProviderError extends Error {
  readonly code: EmailProviderErrorCode;
  readonly retryable: boolean;

  constructor(code: EmailProviderErrorCode, retryable: boolean) {
    super(code);
    this.name = "EmailProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}
