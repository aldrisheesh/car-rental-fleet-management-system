export const CUSTOMER_PAYMENT_STATUSES = [
  "Not Submitted",
  "Pending Verification",
  "Needs Resubmission",
  "Verified",
] as const;

export type CustomerPaymentStatus = (typeof CUSTOMER_PAYMENT_STATUSES)[number];

export type CustomerPaymentProof = {
  id: string;
  original_filename?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  version?: number | null;
  is_current?: boolean | null;
  uploaded_at?: string | null;
};

export type CustomerPaymentMethod = {
  id: string;
  code?: string | null;
  label: string;
  recipient_name?: string | null;
  account_number?: string | null;
  qr_image_path?: string | null;
  qr_image_url?: string | null;
};

export type CustomerPayment = {
  id: string;
  booking_id: string;
  status: CustomerPaymentStatus;
  payment_method_id?: string | null;
  payment_method_label?: string | null;
  submitted_amount?: number | string | null;
  required_amount?: number | string | null;
  transaction_reference?: string | null;
  resubmission_reason?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  payment_quote?: {
    daily_rate?: number | string | null;
    billable_days?: number | null;
    rental_subtotal?: number | string | null;
    delivery_fee?: number | string | null;
    total_amount?: number | string | null;
    down_payment_amount?: number | string | null;
    remaining_balance_amount?: number | string | null;
    security_deposit_amount?: number | string | null;
  } | null;
  payment_methods?: CustomerPaymentMethod | null;
  payment_proofs?: CustomerPaymentProof[];
};

export type CustomerPaymentResponse = {
  payments: CustomerPayment[];
  paymentMethods: CustomerPaymentMethod[];
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
