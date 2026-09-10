import { createFileRoute } from "@tanstack/react-router";
import { parseCalendarPeriod } from "@/lib/admin-calendar";
import { getCanonicalAdminCalendar } from "@/lib/admin-calendar.server";
import { requirePrincipal } from "@/lib/auth.server";

export async function readAdminCalendar({ request }: { request: Request }) {
  try {
    const principal = await requirePrincipal();
    if (principal.role === "Customer/Renter")
      return Response.json({ message: "Forbidden." }, { status: 403 });

    const period = parseCalendarPeriod(
      new URL(request.url).searchParams.get("month"),
    );
    return Response.json(
      await getCanonicalAdminCalendar(principal.role, period),
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "invalid_period")
      return Response.json(
        { message: "A valid calendar month is required." },
        { status: 400 },
      );
    if (reason === "forbidden")
      return Response.json({ message: "Forbidden." }, { status: 403 });
    if (reason === "unauthenticated")
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    return Response.json(
      { message: "Unable to load the calendar schedule." },
      { status: 503 },
    );
  }
}

export const Route = createFileRoute("/api/admin-calendar")({
  server: { handlers: { GET: readAdminCalendar } },
});
