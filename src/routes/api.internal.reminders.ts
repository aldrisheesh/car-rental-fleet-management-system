import { createFileRoute } from "@tanstack/react-router";

import { isTrustedReminderInvocation } from "@/lib/reminder-invocation.server";
import { processScheduledReminders } from "@/lib/reminders.server";

export const Route = createFileRoute("/api/internal/reminders")({
  server: { handlers: { POST: invokeReminderProcessor } },
});

async function invokeReminderProcessor({ request }: { request: Request }) {
  if (!isTrustedReminderInvocation(request)) {
    return Response.json({ message: "Not found." }, { status: 404 });
  }

  try {
    const summary = await processScheduledReminders();
    return Response.json(summary, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { message: "Reminder processing failed." },
      { status: 503 },
    );
  }
}
