import {sql} from './db.mjs';
import assert from 'node:assert/strict';
const id='dff20919-76aa-4c9f-9887-0b3b5593f936';
await sql.begin(async tx=>{
 const [b]=await tx`select *,confirmed_at::text confirmed_at_exact from public.booking_requests where id=${id}`;
 const [a]=await tx`select id from profiles where email='uat-a01@briah-uat.invalid'`;
 const release={collectionMethod:'Cash',collectionAcknowledged:true,balanceReceived:1000,depositReceived:3000,expectedAssignedVehicleId:b.assigned_vehicle_id,expectedConfirmedAt:b.confirmed_at_exact,releaseOdometer:50000,releaseFuelLevel:'Full',releaseConditionSummary:'Synthetic test only',agreementAcknowledged:true,conditionAcknowledged:true,returnScheduleAcknowledged:true};
 async function rejects(payload,pattern,fn){await tx.savepoint(async sp=>{await sp`select ${sql.unsafe('public.'+fn)}(${id},${a.id},${sql.json(payload)}::jsonb)`;}).then(()=>assert.fail('Unexpected acceptance'),e=>assert.match(e.message,pattern));}
 await rejects({...release,balanceReceived:999},/handover_collection_required/,'release_rental_with_collection');
 const [r]=await tx`select * from public.release_rental_with_collection(${id},${a.id},${sql.json(release)}::jsonb)`;
 const [f]=await tx`select * from rental_financial_records where booking_id=${id}`;assert.equal(Number(f.balance_collected),1000);assert.equal(Number(f.deposit_collected),3000);
 const settlement={rentalId:r.id,expectedBookingId:id,expectedVehicleId:r.vehicle_id,expectedStartedAt:(await tx`select started_at::text value from rental_transactions where id=${r.id}`)[0].value,returnOdometer:50100,returnFuelLevel:'Full',returnConditionSummary:'Synthetic return test',depositDeduction:250,deductionReason:'Synthetic cleaning charge',depositRefunded:2750,refundMethod:'Cash',refundAcknowledged:true};
 await rejects({...settlement,depositRefunded:3000},/invalid_deposit_settlement/,'close_rental_with_settlement');
 await rejects({...settlement,depositDeduction:3100,depositRefunded:-100},/invalid_deposit_settlement/,'close_rental_with_settlement');
 await rejects({...settlement,deductionReason:''},/invalid_deposit_settlement/,'close_rental_with_settlement');
 const [stillActive]=await tx`select ended_at from rental_transactions where id=${r.id}`;assert.equal(stillActive.ended_at,null);
 await tx`select public.close_rental_with_settlement(${id},${a.id},${sql.json(settlement)}::jsonb)`;
 const [settled]=await tx`select * from rental_financial_records where booking_id=${id}`;assert.equal(Number(settled.deposit_refunded),2750);assert.ok(settled.settled_at);
 throw Object.assign(Error('verification rollback'),{verified:true});
}).catch(e=>{if(!e.verified)throw e;console.log('PASS release collection + invalid settlement guards + atomic saved refund (rolled back)')});
console.log(await sql`select relrowsecurity from pg_class where oid='public.rental_financial_records'::regclass`);
console.log(await sql`select has_table_privilege('authenticated','public.rental_financial_records','select') authenticated_read,has_function_privilege('authenticated','public.release_rental_with_collection(uuid,uuid,jsonb)','execute') authenticated_rpc,has_function_privilege('service_role','public.release_rental_with_collection(uuid,uuid,jsonb)','execute') server_rpc`);
console.log(await sql`select tgenabled from pg_trigger where tgname='booking_requests_enforce_one_day_lead_time'`);
await sql.end();
