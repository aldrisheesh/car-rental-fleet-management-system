from pathlib import Path
p=Path('supabase/migrations/20261004071833_booking_rehearsal_hardening.sql')
review=Path('tmp/booking-hardening/review_payment_atomic.sql').read_text()
needle='''        perform public.confirm_booking_atomic('''
assert needle in review
review=review.replace(needle,'''        if booking.assigned_vehicle_id is null then
          booking := public.assign_booking_vehicle(
            booking.id, booking.requested_vehicle_id, p_reviewer_id
          );
        end if;
        perform public.confirm_booking_atomic(''')
req=Path('tmp/booking-hardening/notify_requirement_review.sql').read_text().replace('Your requirements were verified. You can proceed to the payment step.','Your requirements were verified. The team will share your rental quote and handover arrangements before payment.')
p.write_text('-- Fix the observed payment/assignment ordering without relaxing confirmation checks.\n'+review+';\n'+req+';\n')
