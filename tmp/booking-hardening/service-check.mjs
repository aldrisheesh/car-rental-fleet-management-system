import {sql} from './db.mjs';
await sql.begin(async tx=>{
const [r]=await tx`select *,started_at::text exact_started from rental_transactions where booking_id='dff20919-76aa-4c9f-9887-0b3b5593f936'`;
const [a]=await tx`select id from profiles where email='uat-a01@briah-uat.invalid'`;
const payload={rentalId:r.id,expectedBookingId:r.booking_id,expectedVehicleId:r.vehicle_id,expectedStartedAt:r.exact_started,returnOdometer:50100,returnFuelLevel:'3/4',returnConditionSummary:'Synthetic inspection',depositDeduction:250,deductionReason:'Synthetic fuel top-up',depositRefunded:2750,refundMethod:'Cash',refundAcknowledged:true};
await tx`set local role service_role`;
await tx`select public.close_rental_with_settlement(${r.booking_id},${a.id},${sql.json(payload)}::jsonb)`;
throw Object.assign(Error('rollback'),{verified:true});
}).catch(e=>{if(e.verified)console.log('PASS service_role settlement (rolled back)');else console.log({message:e.message,code:e.code,where:e.where});});
await sql.end();
