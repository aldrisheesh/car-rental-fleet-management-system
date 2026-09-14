import type { CustomerBooking, RequirementsResponse } from "./customer-data.ts";
import type { CustomerPayment } from "./payment-retrieval.ts";
import type { CustomerPaymentMethod } from "./payment-retrieval.ts";
import { isActiveRental } from "./rental-projection.ts";

export const CUSTOMER_JOURNEY_STAGES = [
  "Request",
  "Requirements",
  "Payment",
  "Confirmation",
  "Rental",
  "Return",
] as const;

export type CustomerJourneyStage = (typeof CUSTOMER_JOURNEY_STAGES)[number];

export type CustomerLifecycleState =
  | "requirements-needed"
  | "requirements-review"
  | "requirements-resubmission"
  | "payment-action"
  | "payment-review"
  | "payment-resubmission"
  | "confirmation-waiting"
  | "confirmed"
  | "active-rental"
  | "returned"
  | "rejected"
  | "cancelled"
  | "unavailable";

export type LifecycleJourneyStep = {
  key: CustomerJourneyStage;
  label: string;
  note?: string;
  state: "complete" | "current" | "locked";
};

export type LifecyclePresentation = {
  state: CustomerLifecycleState;
  currentStage: CustomerJourneyStage;
  title: string;
  statusLabel: string;
  statusTone: "info" | "success" | "warning" | "error" | "locked";
  actionRequired: boolean;
  actionLabel: string | null;
  waiting: boolean;
  message: string;
  reason: string | null;
  journey: LifecycleJourneyStep[];
};

export type CustomerBookingComposition = {
  booking: CustomerBooking;
  requirements: RequirementsResponse | null;
  payment: CustomerPayment | null;
  paymentMethods: CustomerPaymentMethod[];
  requirementsAvailable: boolean;
  paymentAvailable: boolean;
  requirementsError: string | null;
  paymentError: string | null;
};

export function paymentForBooking(
  bookingId: string,
  payments: CustomerPayment[],
) {
  return payments.find((payment) => payment.booking_id === bookingId) ?? null;
}

export function requirementStatus(
  requirements: RequirementsResponse | null | undefined,
) {
  return requirements?.requirementSet?.status ?? "Not Submitted";
}

export function paymentStatus(payment: CustomerPayment | null | undefined) {
  return payment?.status ?? "Not Submitted";
}

export function deriveCustomerLifecycle(
  composition: Pick<
    CustomerBookingComposition,
    | "booking"
    | "requirements"
    | "payment"
    | "requirementsAvailable"
    | "paymentAvailable"
  >,
): LifecyclePresentation {
  const { booking, requirements, payment } = composition;
  const requirementState = requirementStatus(requirements);
  const paymentState = paymentStatus(payment);

  if (booking.booking_status === "Rejected") {
    return present("rejected", "Request", {
      title: "Your rental request was rejected",
      statusLabel: "Request rejected",
      statusTone: "error",
      message: "This request cannot continue in the current booking workflow.",
      reason: null,
    });
  }

  if (booking.booking_status === "Cancelled") {
    return present("cancelled", "Request", {
      title: "Your rental request was cancelled",
      statusLabel: "Request cancelled",
      statusTone: "info",
      message: "This request is no longer active.",
      reason: null,
    });
  }

  if (booking.rental?.ended_at) {
    return present("returned", "Return", {
      title: "Your return has been recorded.",
      statusLabel: "Return recorded",
      statusTone: "success",
      message:
        "The rental ended. This does not confirm settlement, final charges, or booking completion.",
      reason: null,
    });
  }

  if (booking.rental && isActiveRental(booking.rental)) {
    return present("active-rental", "Rental", {
      title: "Your rental is active.",
      statusLabel: "Active rental",
      statusTone: "success",
      message: "Keep the scheduled return time in view.",
      reason: null,
    });
  }

  if (booking.booking_status === "Confirmed") {
    return present("confirmed", "Confirmation", {
      title: "Your booking is confirmed.",
      statusLabel: "Booking confirmed",
      statusTone: "success",
      message: "No action needed right now.",
      reason: null,
    });
  }

  if (!composition.requirementsAvailable) {
    return unavailable(
      "Requirements status is unavailable. We cannot safely determine the next step for this request.",
    );
  }

  if (requirementState === "Needs Resubmission") {
    return present("requirements-resubmission", "Requirements", {
      title: "Update your requirements",
      statusLabel: "Requirements need an update",
      statusTone: "warning",
      message:
        "Replace the flagged document and send your requirements for review again.",
      reason: requirementReason(requirements),
      actionLabel: "Continue requirements",
    });
  }

  if (requirementState === "Pending Review") {
    return present("requirements-review", "Requirements", {
      title: "Requirements under review",
      statusLabel: "Requirements under review",
      statusTone: "info",
      message:
        "No action needed — Briah is reviewing your submitted requirements.",
      reason: null,
    });
  }

  if (requirementState !== "Verified") {
    return present("requirements-needed", "Requirements", {
      title: "Complete your rental requirements",
      statusLabel: "Requirements needed",
      statusTone: "warning",
      message:
        "Action required — submit your rental requirements before payment can become available.",
      reason: null,
      actionLabel: "Continue requirements",
    });
  }

  if (!composition.paymentAvailable) {
    return unavailable(
      "Payment status is unavailable. We cannot safely determine whether payment needs action.",
      "Payment",
    );
  }

  if (paymentState === "Needs Resubmission") {
    return present("payment-resubmission", "Payment", {
      title: "Resubmit payment information",
      statusLabel: "Payment needs an update",
      statusTone: "warning",
      message:
        "Action required — correct the payment details and submit them for review again.",
      reason: payment?.resubmission_reason?.trim() || null,
      actionLabel: "Continue payment",
    });
  }

  if (paymentState === "Pending Verification") {
    return present("payment-review", "Payment", {
      title: "Payment under review",
      statusLabel: "Payment under review",
      statusTone: "info",
      message: "No action needed — Briah is reviewing your payment submission.",
      reason: null,
    });
  }

  if (paymentState === "Verified") {
    return present("confirmation-waiting", "Confirmation", {
      title: "Payment verified — booking confirmation is next",
      statusLabel: "Waiting for booking confirmation",
      statusTone: "info",
      message:
        "No action needed — your payment is verified and Briah will confirm the booking separately.",
      reason: null,
    });
  }

  return present("payment-action", "Payment", {
    title: "Submit your down payment",
    statusLabel: "Payment action required",
    statusTone: "warning",
    message:
      "Action required — your requirements are verified and payment is now available.",
    reason: null,
    actionLabel: "Continue payment",
  });
}

function requirementReason(requirements: RequirementsResponse | null) {
  const review = requirements?.review;
  const reasons = [
    review?.governmentIdReason,
    review?.driversLicenseReason,
  ].filter((reason): reason is string => Boolean(reason?.trim()));
  return reasons.length ? reasons.join(" ") : null;
}

function unavailable(
  message: string,
  currentStage: CustomerJourneyStage = "Request",
): LifecyclePresentation {
  return present("unavailable", currentStage, {
    title: "Booking details unavailable",
    statusLabel: "Details unavailable",
    statusTone: "error",
    message,
    reason: null,
  });
}

function present(
  state: CustomerLifecycleState,
  currentStage: CustomerJourneyStage,
  values: Omit<
    LifecyclePresentation,
    | "state"
    | "currentStage"
    | "actionRequired"
    | "waiting"
    | "journey"
    | "actionLabel"
  > & { actionLabel?: string | null },
): LifecyclePresentation {
  const actionRequired = Boolean(values.actionLabel);
  const waiting =
    !actionRequired &&
    !["rejected", "cancelled", "unavailable"].includes(state);
  return {
    ...values,
    state,
    currentStage,
    actionLabel: values.actionLabel ?? null,
    actionRequired,
    waiting,
    journey: journeyFor(state, currentStage),
  };
}

function journeyFor(
  state: CustomerLifecycleState,
  currentStage: CustomerJourneyStage,
): LifecycleJourneyStep[] {
  const currentIndex = CUSTOMER_JOURNEY_STAGES.indexOf(currentStage);
  const paymentVerified = [
    "confirmation-waiting",
    "confirmed",
    "active-rental",
    "returned",
  ].includes(state);
  const requirementsVerified =
    paymentVerified ||
    ["payment-action", "payment-review", "payment-resubmission"].includes(
      state,
    );

  return CUSTOMER_JOURNEY_STAGES.map((key, index) => {
    const complete = index < currentIndex;
    const current = index === currentIndex;
    const locked = index > currentIndex;
    let label: string = key;
    let note: string | undefined;

    if (key === "Request" && index <= currentIndex) label = "Request submitted";
    if (key === "Requirements" && requirementsVerified) {
      label = "Requirements verified";
    }
    if (key === "Requirements" && current && state === "requirements-review") {
      note = "Under review";
    }
    if (
      key === "Requirements" &&
      current &&
      state === "requirements-resubmission"
    ) {
      note = "Action required";
    }
    if (key === "Requirements" && current && state === "requirements-needed") {
      note = "Action required";
    }
    if (key === "Payment" && paymentVerified) label = "Payment verified";
    if (key === "Payment" && current && state === "payment-review") {
      note = "Under review";
    }
    if (key === "Payment" && current && state === "payment-resubmission") {
      note = "Action required";
    }
    if (key === "Payment" && current && state === "payment-action") {
      note = "Action required";
    }
    if (
      key === "Confirmation" &&
      ["confirmed", "active-rental", "returned"].includes(state)
    ) {
      label = "Booking confirmed";
    }
    if (key === "Confirmation" && current && state === "confirmation-waiting") {
      note = "Next step";
    }
    if (key === "Rental" && state === "active-rental") label = "Active rental";
    if (key === "Rental" && state === "returned") label = "Rental ended";
    if (key === "Return" && state === "returned") label = "Return recorded";
    if (locked && key === "Confirmation") note = "Locked";
    if (locked && key === "Payment") note = "Locked";

    return {
      key,
      label,
      note,
      state: complete ? "complete" : current ? "current" : "locked",
    };
  });
}
