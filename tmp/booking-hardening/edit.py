from pathlib import Path
p=Path('supabase/migrations/20261004071833_booking_rehearsal_hardening.sql');s=p.read_text().replace('q.total_rental_amount','q.total_amount');s=s.replace("if nullif(p_payload->>'releaseOdometer','') is null then", "if nullif(p_payload->>'releaseOdometer','') is null or not ((p_payload->>'releaseOdometer')::numeric between 0 and 999999999) then");s=s.replace("if nullif(p_payload->>'returnOdometer','') is null then", "if nullif(p_payload->>'returnOdometer','') is null or not ((p_payload->>'returnOdometer')::numeric between 0 and 999999999) then");p.write_text(s)
p=Path('src/routes/api.bookings.ts');s=p.read_text();start=s.index('                ? await client.rpc("release_vehicle_start_rental"');end=s.index('\n    if (rpc.error)',start);s=s[:start]+'''                ? await client.rpc("release_rental_with_collection", {
                    p_booking_id: bookingId,
                    p_actor_id: principal.userId,
                    p_payload: body,
                  })
                : await client.rpc("close_rental_with_settlement", {
                    p_booking_id: bookingId,
                    p_actor_id: principal.userId,
                    p_payload: body,
                  });'''+s[end:];s=s.replace('        forbidden: "Forbidden.",','''        release_day_not_reached: "Release is available from the scheduled pickup or delivery day. Review any date change with the customer first.",
        rental_window_elapsed: "The scheduled rental period has ended. Review the dates before release.",
        quote_required_for_release: "A saved rental quote is required before release.",
        handover_collection_required: "Confirm collection of the remaining rental balance and security deposit before release.",
        collection_details_required: "Select a collection method and record a reference for electronic payments.",
        release_acknowledgements_required: "Complete all handover acknowledgements before release.",
        invalid_deposit_settlement: "Check the deposit deduction, its reason, and the refund amount.",
        refund_acknowledgement_required: "Confirm the deposit refund or documented deduction before closing the rental.",
        refund_details_required: "Select a refund method and record a reference for electronic refunds.",
        forbidden: "Forbidden.",''',1)
needle='    if (principal.role === "Customer/Renter") {\n      const quoteResult'
pos=s.index(needle);s=s[:pos]+'''    if (principal.role !== "Operations Staff" && bookingIds.length) {
      const [quotes, finances] = await Promise.all([
        (client as any).from("booking_payment_quotes").select("*").in("booking_id", bookingIds),
        (client as any).from("rental_financial_records").select("*").in("booking_id", bookingIds),
      ]);
      if (quotes.error || finances.error) return errorResponse("Unable to load rental financial records.", 503);
      const quoteMap = new Map((quotes.data ?? []).map((q: any) => [q.booking_id, q]));
      const financeMap = new Map((finances.data ?? []).map((f: any) => [f.booking_id, f]));
      rows.forEach((b: any) => {
        const f = financeMap.get(b.id) as any;
        b.payment_quote = quoteMap.get(b.id) ?? null;
        b.financial_record = f ? {
          balance_collected: f.balance_collected, deposit_collected: f.deposit_collected,
          collection_method: f.collection_method, collection_reference: f.collection_reference, collected_at: f.collected_at,
          deposit_deduction: f.deposit_deduction, deduction_reason: f.deduction_reason,
          deposit_refunded: f.deposit_refunded, refund_method: f.refund_method, refund_reference: f.refund_reference, settled_at: f.settled_at,
        } : null;
      });
    }
'''+s[pos:];p.write_text(s)
# Simple copy fixes preserve the incumbent visual structure.
p=Path('src/routes/customer.tsx');s=p.read_text().replace('return pickup ? `Pickup: ${pickup}` : "Pickup details will appear here";', 'const label = booking.pickup_delivery_option === "delivery" ? "Delivery" : "Pickup";\n  return pickup ? `${label}: ${pickup}` : `${label} details will appear here`;');p.write_text(s)
p=Path('src/routes/bookings.$bookingId.tsx');s=p.read_text().replace('Review your agreed meeting points before paying. These are also included in your confirmed booking.','Your agreed pickup and return points, including the times and handover instructions.');p.write_text(s)
p=Path('src/routes/admin.payments.tsx');s=p.read_text().replace('{saving ? "Verifying…" : "Verify payment"}', '{saving ? (resubmitOpen ? "Requesting correction…" : "Verifying…") : "Verify payment"}');s=s.replace('<dt>Pickup</dt>', '<dt>Service</dt>');p.write_text(s)
p=Path('src/routes/vehicles.tsx');s=p.read_text().replace('Add your group, bags &amp; total budget','For ranked recommendations, add your group, bags &amp; total budget').replace('Refine your results','Find your best match');p.write_text(s)
p=Path('src/lib/notifications.ts');s=p.read_text().replace('  | "payment_verified"','  | "quote_issued"\n  | "payment_verified"');p.write_text(s)
