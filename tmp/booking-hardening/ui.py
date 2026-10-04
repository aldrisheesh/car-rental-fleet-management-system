from pathlib import Path
for file in ['src/lib/admin-presentations.ts','src/lib/customer-data.ts']:
 p=Path(file);s=p.read_text();s='import type { HandoverQuote, RentalFinancialRecord } from "./rental-finance";\n'+s;typ='AdminBooking' if 'admin' in file else 'CustomerBooking';s=s.replace(f'export type {typ} = {{',f'export type {typ} = {{\n  payment_quote?: HandoverQuote | null;\n  financial_record?: RentalFinancialRecord | null;');p.write_text(s)
p=Path('src/routes/admin.payments.tsx');s=p.read_text().replace('resubmitOpen ?', 'resubmissionOpen ?').replace('{booking.pickup_delivery_option ?? "Pickup option unavailable"}', '{booking.pickup_delivery_option === "delivery" ? "Delivery" : "Pickup"}');p.write_text(s)
p=Path('src/routes/admin.bookings.$bookingId.tsx');s=p.read_text();s='import { depositRefund, releaseDayReached } from "@/lib/rental-finance";\n'+s
s=s.replace('const canRelease = actions.release && meetingReady;', 'const canRelease = actions.release && meetingReady && releaseDayReached(booking.pickup_at) && new Date(booking.return_at).getTime() > Date.now();')
needle='''}) {
  return (
    <div className="booking-ledger-controls space-y-5">'''
replacement='''}) {
  const [collectionMethod, setCollectionMethod] = useState("Cash");
  const [collectionReference, setCollectionReference] = useState("");
  const [collectionAcknowledged, setCollectionAcknowledged] = useState(false);
  const [depositDeduction, setDepositDeduction] = useState("0");
  const [deductionReason, setDeductionReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [refundReference, setRefundReference] = useState("");
  const [refundAcknowledged, setRefundAcknowledged] = useState(false);
  const quote = booking.payment_quote;
  const finance = booking.financial_record;
  const refund = finance ? depositRefund(Number(finance.deposit_collected), depositDeduction) : null;
  const collectionReady = Boolean(quote && collectionAcknowledged && (collectionMethod === "Cash" || collectionReference.trim()));
  const settlementReady = !finance || Boolean(refund !== null && refundAcknowledged && (Number(depositDeduction) === 0 || deductionReason.trim()) && (refundMethod === "Cash" || refundReference.trim()));
  return (
    <div className="booking-ledger-controls space-y-5">'''
assert needle in s;s=s.replace(needle,replacement)
needle='''            <label
              className="block text-sm font-medium"
              htmlFor="release-odometer"'''
insert='''            {!releaseDayReached(booking.pickup_at) ? (
              <p className="admin-booking-payment-terms__notice" role="status">
                Release is available on {formatAdminDateTime(booking.pickup_at)}. Arrange any date change with the customer before handover.
              </p>
            ) : new Date(booking.return_at).getTime() <= Date.now() ? (
              <p role="status">The scheduled rental period has ended. Review the dates before release.</p>
            ) : null}
            <section className="booking-finance" aria-label="Handover collection">
              <h4>Balance &amp; security deposit</h4>
              <p>Record the money received at handover. The verified down payment is already included in the quote.</p>
              {quote ? <>
                <dl>
                  <div><dt>Remaining rental balance</dt><dd>{formatAdminMoney(quote.remaining_balance_amount)}</dd></div>
                  <div><dt>Refundable security deposit</dt><dd>{formatAdminMoney(quote.security_deposit_amount)}</dd></div>
                  <div><dt>Collect at handover</dt><dd>{formatAdminMoney(Number(quote.remaining_balance_amount) + Number(quote.security_deposit_amount))}</dd></div>
                </dl>
                <FinancialMethodFields prefix="collection" label="Collection" method={collectionMethod} setMethod={setCollectionMethod} reference={collectionReference} setReference={setCollectionReference} />
                <Acknowledgement id="collection-ack" checked={collectionAcknowledged} onChange={setCollectionAcknowledged} label="The remaining balance and security deposit have been received." />
              </> : <p role="alert">A saved rental quote is required before release.</p>}
            </section>
'''
assert needle in s;s=s.replace(needle,insert+needle)
s=s.replace('''                !releaseConditionSummary.trim() ||''','''                !collectionReady ||
                !releaseOdometer.trim() ||
                !Number.isFinite(Number(releaseOdometer)) || Number(releaseOdometer) < 0 ||
                !releaseConditionSummary.trim() ||''')
s=s.replace('''                    expectedAssignedVehicleId: booking.assigned_vehicle_id,''','''                    collectionMethod, collectionReference, collectionAcknowledged,
                    balanceReceived: Number(quote?.remaining_balance_amount),
                    depositReceived: Number(quote?.security_deposit_amount),
                    expectedAssignedVehicleId: booking.assigned_vehicle_id,''')
needle='''            <Btn
              variant="primary"
              disabled={
                !canReturn ||'''
insert='''            <section className="booking-finance" aria-label="Security deposit settlement">
              <h4>Security deposit settlement</h4>
              {finance ? <>
                <p>Record any agreed deduction and return the remaining deposit before closing the rental. Early return does not automatically change the agreed rental price.</p>
                <dl><div><dt>Deposit received</dt><dd>{formatAdminMoney(finance.deposit_collected)}</dd></div></dl>
                <label><span>Deposit deduction (PHP)</span><TInput type="number" min="0" max={Number(finance.deposit_collected)} step="0.01" value={depositDeduction} onChange={e => { setDepositDeduction(e.target.value); setRefundAcknowledged(false); }} /></label>
                {Number(depositDeduction) > 0 ? <label><span>Reason for deduction</span><TInput maxLength={500} value={deductionReason} onChange={e => setDeductionReason(e.target.value)} placeholder="Describe the agreed charge or damage deduction" /></label> : null}
                {refund === null ? <p role="alert">Enter a deduction between zero and the deposit received, with at most two decimal places.</p> : <dl><div><dt>Deposit to refund</dt><dd>{formatAdminMoney(refund)}</dd></div></dl>}
                <FinancialMethodFields prefix="refund" label="Refund" method={refundMethod} setMethod={setRefundMethod} reference={refundReference} setReference={setRefundReference} />
                <Acknowledgement id="refund-ack" checked={refundAcknowledged} onChange={setRefundAcknowledged} label="The deposit refund and any deduction have been settled with the customer." />
              </> : <p>Collection was not recorded in this historical rental. Record the inspection here and reconcile its original receipts separately; no deposit refund will be invented.</p>}
            </section>
'''
assert needle in s;s=s.replace(needle,insert+needle)
s=s.replace('''                !returnConditionSummary.trim()
''','''                !settlementReady || !returnOdometer.trim() ||
                !Number.isFinite(Number(returnOdometer)) || Number(returnOdometer) < 0 ||
                !returnConditionSummary.trim()
''')
s=s.replace('''                    rentalId: booking.rental?.id,''','''                    depositDeduction: Number(depositDeduction), deductionReason,
                    depositRefunded: refund, refundMethod, refundReference, refundAcknowledged,
                    rentalId: booking.rental?.id,''')
# A shared restrained summary remains visible after completing each stage.
s=s.replace('''      stage={stage}
      booking={booking}''','''      stage={stage}
      booking={booking}''')
# Insert a summary inside the ledger above its ending boundary by locating booking history.
needle='''      {stage === "release" && canCancel ? ('''
s=s.replace(needle,'''      {stage === "release" && booking.financial_record ? <FinancialRecordSummary booking={booking} /> : null}
      {stage === "return" && booking.financial_record?.settled_at ? <FinancialRecordSummary booking={booking} /> : null}
'''+needle)
s+='''

function FinancialMethodFields({ prefix, label, method, setMethod, reference, setReference }: {
  prefix: string; label: string; method: string; setMethod: (value: string) => void;
  reference: string; setReference: (value: string) => void;
}) {
  return <div className="booking-finance__fields">
    <label htmlFor={`${prefix}-method`}><span>{label} method</span><TSelect id={`${prefix}-method`} value={method} onChange={e => setMethod(e.target.value)}>{["Cash", "GCash", "Bank transfer"].map(value => <option key={value}>{value}</option>)}</TSelect></label>
    <label htmlFor={`${prefix}-reference`}><span>{label} reference {method === "Cash" ? "(optional)" : "(required)"}</span><TInput id={`${prefix}-reference`} maxLength={180} value={reference} onChange={e => setReference(e.target.value)} placeholder={method === "Cash" ? "Receipt number, if available" : "Transaction reference"} /></label>
  </div>;
}

function FinancialRecordSummary({ booking }: { booking: AdminBooking }) {
  const f = booking.financial_record;
  if (!f) return null;
  return <section className="booking-finance" aria-label="Recorded rental collections">
    <h4>{f.settled_at ? "Deposit settled" : "Handover collection recorded"}</h4>
    <dl>
      <div><dt>Rental balance received</dt><dd>{formatAdminMoney(f.balance_collected)}</dd></div>
      <div><dt>Security deposit received</dt><dd>{formatAdminMoney(f.deposit_collected)}</dd></div>
      <div><dt>Collection</dt><dd>{f.collection_method} · {formatAdminDateTime(f.collected_at)}{f.collection_reference ? ` · ${f.collection_reference}` : ""}</dd></div>
      {f.settled_at ? <><div><dt>Deposit deduction</dt><dd>{formatAdminMoney(f.deposit_deduction)}</dd></div><div><dt>Deposit refunded</dt><dd>{formatAdminMoney(f.deposit_refunded)}</dd></div><div><dt>Refund</dt><dd>{f.refund_method} · {formatAdminDateTime(f.settled_at)}{f.refund_reference ? ` · ${f.refund_reference}` : ""}</dd></div></> : null}
    </dl>
    {f.deduction_reason ? <p>{f.deduction_reason}</p> : null}
  </section>;
}
'''
p.write_text(s)
