export const PAYMENT_POLICY_VERSION = "2026-10-05.v1";

export function hasCurrentPaymentPolicyAcknowledgement(
  form: FormData,
): boolean {
  return (
    form.get("policyAcknowledged") === "true" &&
    form.get("policyVersion") === PAYMENT_POLICY_VERSION
  );
}
