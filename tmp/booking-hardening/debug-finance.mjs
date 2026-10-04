import {sql} from './db.mjs';
const payload={collectionMethod:'Cash',collectionAcknowledged:true,balanceReceived:1000,depositReceived:3000};
console.log(await sql`select (v->>'collectionAcknowledged')::boolean ack,(v->>'balanceReceived')::numeric balance,(v->>'depositReceived')::numeric deposit, greatest(q.total_amount-p.submitted_amount,0) expected_balance,q.security_deposit_amount from booking_payment_quotes q join payments p on p.booking_id=q.booking_id cross join (select ${JSON.stringify(payload)}::jsonb v) x where q.booking_id='dff20919-76aa-4c9f-9887-0b3b5593f936'`);
console.log((await sql`select pg_get_functiondef('public.release_rental_with_collection(uuid,uuid,jsonb)'::regprocedure) d`)[0].d);
await sql.end();
