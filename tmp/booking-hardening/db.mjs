import postgres from 'postgres';
import {readFileSync,writeFileSync} from 'node:fs';
const u=new URL(process.env.DEFENSE_DATABASE_URL??readFileSync('supabase/.temp/pooler-url','utf8').trim()); if(!u.password)u.password=process.env.SUPABASE_DB_PASSWORD??'';
export const sql=postgres(u.toString(),{ssl:'require',prepare:false,max:1});
if(process.argv[2]==='inspect') {
const rows=await sql`select proname,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and proname in ('review_payment_atomic','assign_booking_vehicle','assign_booking_vehicle_atomic','release_vehicle_start_rental','return_vehicle_close_rental','issue_booking_payment_quote','notify_requirement_review')`;
for(const r of rows)writeFileSync('tmp/booking-hardening/'+r.proname+'.sql',r.definition);
console.log(rows.map(x=>x.proname));
console.log(await sql`select conname,pg_get_constraintdef(oid) as def from pg_constraint where conrelid='public.notifications'::regclass`);
await sql.end();
}
