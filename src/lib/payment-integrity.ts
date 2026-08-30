export function meetsRequiredDownPayment(submitted: number | null, required: number | null): boolean {
  return required === null || (submitted !== null && submitted >= required);
}

export function projectCustomerPayment(payment: any) {
  return { id: payment.id, booking_id: payment.booking_id, status: payment.status, payment_method_id: payment.payment_method_id, payment_method_label: payment.payment_method_label, submitted_amount: payment.submitted_amount, required_amount: payment.required_amount, transaction_reference: payment.transaction_reference, resubmission_reason: payment.resubmission_reason, submitted_at: payment.submitted_at, updated_at: payment.updated_at, payment_methods: payment.payment_methods, payment_proofs: (payment.payment_proofs ?? []).filter((p: any) => p.is_current).map((p: any) => ({ id:p.id, original_filename:p.original_filename, mime_type:p.mime_type, size_bytes:p.size_bytes, version:p.version, is_current:p.is_current, uploaded_at:p.uploaded_at })) };
}
