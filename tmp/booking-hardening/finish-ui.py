from pathlib import Path
p=Path('src/lib/rental-finance.ts');s=p.read_text().replace('Math.round(amount * 100) !== amount * 100','Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001');p.write_text(s)
p=Path('src/routes/admin.bookings.$bookingId.tsx');s=p.read_text();s=s.replace('''              {booking.rental ? (
                <p className="admin-booking-ledger__empty">''','''              {booking.rental ? (
                <><p className="admin-booking-ledger__empty">''');s=s.replace('''                  is complete.
                </p>
              ) : booking.booking_status''','''                  is complete.
                </p>{ownerView ? <FinancialRecordSummary booking={booking} /> : null}</>
              ) : booking.booking_status''');s=s.replace('''                  {ownerView && !booking.rental.ended_at ? (''','''                  {ownerView && booking.rental.ended_at ? <FinancialRecordSummary booking={booking} /> : null}
                  {ownerView && !booking.rental.ended_at ? (''');p.write_text(s)
p=Path('src/routes/bookings.$bookingId.tsx');s=p.read_text().replace('''            <p>We&apos;ll review the return and email any final update.</p>''','''            <p>{booking.financial_record?.settled_at ? "Your return inspection and deposit settlement are recorded below." : "Contact the team for any remaining charges or deposit refund details."}</p>''');needle='''      <div className="booking-active-rental__help">
        <h2>Questions about your return?</h2>''';assert needle in s;s=s.replace(needle,'''      {booking.financial_record ? <section className="booking-finance" aria-label="Rental payment and deposit summary">
        <h2>Payment &amp; security deposit</h2>
        <dl>
          <div><dt>Rental balance received at handover</dt><dd>{formatMoney(Number(booking.financial_record.balance_collected))}</dd></div>
          <div><dt>Security deposit received</dt><dd>{formatMoney(Number(booking.financial_record.deposit_collected))}</dd></div>
          {booking.financial_record.settled_at ? <>
            <div><dt>Deposit deduction</dt><dd>{formatMoney(Number(booking.financial_record.deposit_deduction))}</dd></div>
            <div><dt>Deposit refunded</dt><dd>{formatMoney(Number(booking.financial_record.deposit_refunded))}</dd></div>
            <div><dt>Refund method</dt><dd>{booking.financial_record.refund_method}</dd></div>
          </> : null}
        </dl>
        {booking.financial_record.deduction_reason ? <p>{booking.financial_record.deduction_reason}</p> : null}
      </section> : null}
'''+needle);s=s.replace('''  const pickupLocation =
    booking.pickup_location ?? booking.pickup_branch?.name ?? "Not recorded";
  const returnLocation =
    booking.dropoff_location ?? booking.return_branch?.name ?? "Not recorded";''','''  const pickupLocation = booking.pickup_delivery_option === "pickup"
    ? booking.pickup_meeting_address ?? booking.pickup_branch?.name ?? "Not recorded"
    : booking.pickup_location ?? booking.pickup_branch?.name ?? "Not recorded";
  const returnLocation = booking.pickup_delivery_option === "pickup"
    ? booking.return_meeting_address ?? booking.return_branch?.name ?? "Not recorded"
    : booking.dropoff_location ?? booking.return_branch?.name ?? "Not recorded";''');p.write_text(s)
p=Path('src/routes/admin.calendar.tsx');s=p.read_text().replace('pickup: "Pickup"','pickup: "Pickup / delivery"').replace('Track confirmed pickups, returns, and maintenance.','Track confirmed pickups, deliveries, returns, and maintenance.');p.write_text(s)
# Include the new financial records in baseline save/restore dependency order; old snapshots mean no collection record.
p=Path('scripts/defense/baseline-data.ts');s=p.read_text().replace('  "rental_transactions",','  "rental_transactions",\n  "rental_financial_records",',1);p.write_text(s)
p=Path('scripts/defense/baseline.ts');s=p.read_text().replace('sort(expected[table])','sort(expected[table] ?? [])').replace('sort(actual[table])','sort(actual[table] ?? [])').replace('const rows = data[t];','const rows = data[t] ?? [];');p.write_text(s)
# Use the existing bundled photograph when the legacy Everest record has no image URL.
p=Path('src/components/customer/CustomerPrimitives.tsx');s=p.read_text();s='import everestImage from "@/assets/vehicles/ford_everest.png";\n'+s;s=s.replace('''  const [failedSource, setFailedSource] = useState<string | null>(null);''','''  src = src || (alt === "Ford Everest" ? everestImage : null);
  const [failedSource, setFailedSource] = useState<string | null>(null);''',1);p.write_text(s)
