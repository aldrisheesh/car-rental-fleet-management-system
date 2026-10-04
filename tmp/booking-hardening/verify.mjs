import {sql} from './db.mjs';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const storage=createClient(process.env.VITE_SUPABASE_URL??process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY).storage.from('payment-proofs');
const source='2c2c0391-3d1c-4419-9602-a34d32197d36';
let fixture;
await sql.begin(async tx=>{
const [b]=await tx`select * from public.booking_requests where id=${source}`;
const [p]=await tx`select * from public.payments where booking_id=${source}`;
const [proof]=await tx`select * from public.payment_proofs where payment_id=${p.id} and is_current`;
const [admin]=await tx`select id from public.profiles where email='uat-a01@briah-uat.invalid'`;
await tx`update public.rental_transactions set inspection_status='Cleared' where vehicle_id=${b.requested_vehicle_id} and inspection_status='Pending'`;
await tx`update public.booking_requests set booking_status='Submitted',assigned_vehicle_id=null,assigned_at=null,confirmed_at=null where id=${source}`;
await tx`update public.payments set status='Pending Verification' where id=${p.id}`;
await tx`select public.review_payment_atomic(${p.id},${admin.id},'verify',${proof.version},${p.submitted_amount},${p.transaction_reference},null)`;
const [verified]=await tx`select booking_status,assigned_vehicle_id,confirmation_exception_code from public.booking_requests where id=${source}`;
assert.equal(verified.booking_status,'Confirmed');assert.equal(verified.assigned_vehicle_id,b.requested_vehicle_id);assert.equal(verified.confirmation_exception_code,null);
await tx.savepoint(async sp=>{try{await sp`select public.release_rental_with_collection(${source},${admin.id},${JSON.stringify({})}::jsonb)`;throw Error('Expected future release rejection');}catch(e){assert.match(e.message,/release_day_not_reached/);throw e;}}).catch(e=>{assert.match(e.message,/release_day_not_reached/)});
// Mark transaction for rollback without throwing an unhandled error.
throw Object.assign(new Error('rollback verification'),{verified:true});
}).catch(e=>{if(!e.verified)throw e;console.log('PASS atomic automatic assignment/confirmation and future-day release guard (rolled back).')});

// One clearly labeled synthetic current-day fixture supports the frontend release/settlement rehearsal.
await sql.begin(async tx=>{
// Historical rehearsal seed only: DDL lock keeps this insert exception isolated; the customer lead-time rule is restored before commit.
await tx`alter table public.booking_requests disable trigger booking_requests_enforce_one_day_lead_time`;
const [id]=await tx`select gen_random_uuid() id`;
const [b]=await tx`insert into public.booking_requests select (jsonb_populate_record(null::public.booking_requests,
 to_jsonb(b)||jsonb_build_object('id',${id.id}::text,'booking_status','Submitted','assigned_vehicle_id',null,'assigned_at',null,
 'confirmed_at',null,'confirmed_by',null,'confirmation_exception_code',null,'confirmation_exception_message',null,'confirmation_exception_at',null,
 'created_at',now()-interval '2 days','updated_at',now(),'pickup_at',now()+interval '1 hour','return_at',date_trunc('day',now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'+interval '23 hours',
 'purpose_of_use','SYNTHETIC DEFENSE FIX VERIFICATION — handover collection and deposit settlement'))).* from public.booking_requests b where b.id=${source} returning *`;
await tx`alter table public.booking_requests enable trigger booking_requests_enforce_one_day_lead_time`;
await tx`insert into public.renter_requirement_sets select (jsonb_populate_record(null::public.renter_requirement_sets,to_jsonb(s)||jsonb_build_object('id',gen_random_uuid(),'booking_id',${b.id}::text))).* from public.renter_requirement_sets s where booking_id=${source}`;
const [q]=await tx`insert into public.booking_payment_quotes select (jsonb_populate_record(null::public.booking_payment_quotes,
 to_jsonb(q)||jsonb_build_object('id',gen_random_uuid(),'booking_id',${b.id}::text,'pickup_at',${b.pickup_at}::timestamptz,'return_at',${b.return_at}::timestamptz,
 'billable_days',1,'rental_subtotal',2000,'total_amount',2000,'down_payment_amount',1000,'remaining_balance_amount',1000,'issued_at',now(),'updated_at',now()))).* from public.booking_payment_quotes q where booking_id=${source} returning *`;
const [p]=await tx`insert into public.payments select (jsonb_populate_record(null::public.payments,to_jsonb(p)||jsonb_build_object('id',gen_random_uuid(),'booking_id',${b.id}::text,'status','Pending Verification','submitted_amount',1000,'required_amount',1000,
 'transaction_reference','SYNTHETIC-FINANCE-VERIFICATION-NO-MONEY','submitted_at',now(),'reviewed_at',null,'reviewed_by',null,'reviewed_proof_version',null,'reviewed_submitted_amount',null,'reviewed_transaction_reference',null))).* from public.payments p where booking_id=${source} returning *`;
const [originalProof]=await tx`select storage_path from public.payment_proofs where payment_id=(select id from public.payments where booking_id=${source}) and is_current`;
const proofPath=b.customer_id+'/'+b.id+'/synthetic-finance-proof.png';
const copy=await storage.copy(originalProof.storage_path,proofPath);if(copy.error)throw copy.error;
await tx`insert into public.payment_proofs select (jsonb_populate_record(null::public.payment_proofs,to_jsonb(p)||jsonb_build_object('id',gen_random_uuid(),'payment_id',${p.id}::text,'storage_path',${proofPath}::text,'created_at',now(),'uploaded_at',now()))).* from public.payment_proofs p where payment_id=(select id from public.payments where booking_id=${source}) and is_current`;
fixture={bookingId:b.id,paymentId:p.id};
});
console.log('Prepared labeled frontend verification fixture:',fixture);
await sql.end();
