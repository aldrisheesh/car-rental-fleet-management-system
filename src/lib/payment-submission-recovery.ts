export type PaymentSubmissionResult =
  | { state: "refreshed" }
  | { state: "uncertain"; acknowledged: boolean }
  | { state: "rejected"; error: unknown };

/** A lost response does not prove that a payment write failed. Never retry the
 * write automatically; refresh the authoritative booking before showing an
 * error or allowing the customer to decide whether to submit again. */
export async function submitPaymentWithRecovery(options: {
  submit: () => Promise<unknown>;
  refresh: () => Promise<void>;
}): Promise<PaymentSubmissionResult> {
  let acknowledged = false;
  try {
    await options.submit();
    acknowledged = true;
    await options.refresh();
    return { state: "refreshed" };
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number(error.status)
        : 0;
    try {
      await options.refresh();
    } catch {
      // Preserve uncertainty if the status read also fails. Do not resend proof.
    }
    if (!acknowledged && status >= 400 && status < 500)
      return { state: "rejected", error };
    return { state: "uncertain", acknowledged };
  }
}
