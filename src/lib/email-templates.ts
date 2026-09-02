import type { EmailMessage } from "./email-provider.ts";
import type { EmailEligibleNotificationType } from "./transactional-email.ts";

export type TransactionalEmailTemplateInput = {
  emailType: EmailEligibleNotificationType;
  recipientName?: string | null;
  scheduledAt?: string | null;
  appBaseUrl?: string | null;
};

const COPY: Record<
  EmailEligibleNotificationType,
  { subject: string; message: string; action: string }
> = {
  requirements_needs_resubmission: {
    subject: "Action required: update your rental requirements",
    message:
      "Your rental requirements need an update before review can continue.",
    action:
      "Review the requested corrections and submit updated requirements in the application.",
  },
  requirements_verified: {
    subject: "Your rental requirements were verified",
    message: "Your rental requirements have been verified.",
    action:
      "You can review your booking and continue with the next step in the application.",
  },
  payment_needs_resubmission: {
    subject: "Action required: update your payment proof",
    message:
      "Your payment proof needs an update before verification can continue.",
    action:
      "Review the correction information and submit a new payment proof in the application.",
  },
  payment_verified: {
    subject: "Your payment was verified",
    message: "Your payment proof has been verified.",
    action:
      "Booking confirmation is a separate step. Check the application for your current booking status.",
  },
  booking_confirmed: {
    subject: "Your Briah's Car Rental booking is confirmed",
    message: "Your booking has been confirmed.",
    action: "Review your confirmed booking details before pickup.",
  },
  upcoming_pickup: {
    subject: "Upcoming vehicle pickup reminder",
    message: "Your confirmed vehicle pickup is coming up.",
    action: "Review your booking details and pickup schedule.",
  },
  upcoming_return: {
    subject: "Upcoming vehicle return reminder",
    message: "Your scheduled vehicle return is coming up.",
    action: "Review your rental details and return schedule.",
  },
  rental_overdue: {
    subject: "Vehicle return reminder",
    message: "The scheduled return time for your vehicle has passed.",
    action: "Please contact Briah's Car Rental regarding the vehicle return.",
  },
};

export function buildTransactionalEmail(
  input: TransactionalEmailTemplateInput,
): Omit<EmailMessage, "to"> {
  const copy = COPY[input.emailType];
  const greeting = input.recipientName?.trim()
    ? `Hello ${input.recipientName.trim()},`
    : "Hello,";
  const schedule = formatManilaSchedule(input.scheduledAt);
  const link = buildApplicationLink(input.appBaseUrl, input.emailType);
  const textParts = [
    greeting,
    "",
    copy.message,
    schedule ? `Scheduled time: ${schedule}` : "",
    copy.action,
    link ? `Open the application: ${link}` : "",
    "",
    "Briah's Car Rental",
  ].filter((part) => part !== "");
  const htmlParts = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(copy.message)}</p>`,
    schedule
      ? `<p><strong>Scheduled time:</strong> ${escapeHtml(schedule)}</p>`
      : "",
    `<p>${escapeHtml(copy.action)}</p>`,
    link
      ? `<p><a href="${escapeHtml(link)}">Open the Briah's Car Rental application</a></p>`
      : "",
    "<p>Briah&#39;s Car Rental</p>",
  ].filter(Boolean);
  return {
    subject: copy.subject,
    text: textParts.join("\n"),
    html: htmlParts.join(""),
  };
}

export function normalizeAppBaseUrl(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function buildApplicationLink(
  appBaseUrl: string | null | undefined,
  emailType: EmailEligibleNotificationType,
) {
  const baseUrl = normalizeAppBaseUrl(appBaseUrl);
  if (!baseUrl) return null;
  const path = emailType.startsWith("payment_")
    ? "/payment-details"
    : "/customer";
  return new URL(path, `${baseUrl}/`).toString();
}

function formatManilaSchedule(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}
