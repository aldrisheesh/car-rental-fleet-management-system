export const CUSTOMER_PAYMENT_STATUSES = [
  "Not Submitted",
  "Pending Verification",
  "Needs Resubmission",
  "Verified",
] as const;

export type CustomerPaymentStatus = (typeof CUSTOMER_PAYMENT_STATUSES)[number];

export type CustomerPayment = {
  id: string;
  booking_id: string;
  status: CustomerPaymentStatus;
  payment_method_label?: string | null;
  submitted_amount?: number | string | null;
  transaction_reference?: string | null;
  resubmission_reason?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
};

type JsonResponse = {
  ok: boolean;
  json(): Promise<unknown>;
};

export async function parseCustomerPaymentResponse(
  response: JsonResponse,
): Promise<CustomerPayment[]> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messageFrom(body));
  if (
    !isRecord(body) ||
    !Array.isArray(body.payments) ||
    !body.payments.every(isCustomerPayment)
  ) {
    throw new Error("Unable to load payment status.");
  }
  return body.payments;
}

function isCustomerPayment(value: unknown): value is CustomerPayment {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.booking_id === "string" &&
    isCustomerPaymentStatus(value.status)
  );
}

function isCustomerPaymentStatus(
  value: unknown,
): value is CustomerPaymentStatus {
  return (
    typeof value === "string" &&
    (CUSTOMER_PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

function messageFrom(body: unknown) {
  return isRecord(body) &&
    typeof body.message === "string" &&
    body.message.trim()
    ? body.message
    : "Unable to load payment status.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
