import type { CustomerLifecycleState } from "./customer-lifecycle";

const states: readonly CustomerLifecycleState[] = [
  "requirements-needed",
  "requirements-review",
  "requirements-resubmission",
  "payment-waiting",
  "payment-action",
  "payment-review",
  "payment-resubmission",
  "confirmation-resolution",
  "confirmed",
  "active-rental",
  "returned",
  "rejected",
  "cancelled",
  "unavailable",
];

// Layout hints only; the authenticated response still determines all content and actions.
export function readBookingLoadingState(
  bookingId: string,
): CustomerLifecycleState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(
      `booking-loading-variant:${bookingId}`,
    );
    return states.find((state) => state === value) ?? null;
  } catch {
    return null;
  }
}

export function rememberBookingLoadingState(
  bookingId: string,
  state: CustomerLifecycleState,
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `booking-loading-variant:${bookingId}`,
      state,
    );
  } catch {
    // Storage can be unavailable in private browsing; loading must still work.
  }
}
