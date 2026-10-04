import {sql} from './db.mjs';
import {readFileSync} from 'node:fs';
await sql.begin(async tx=>{
 await tx.unsafe(readFileSync('supabase/migrations/20261004071833_booking_rehearsal_hardening.sql','utf8'));
 await tx`insert into supabase_migrations.schema_migrations(version,name,statements) values('20261004071833','booking_rehearsal_hardening', ${[readFileSync('supabase/migrations/20261004071833_booking_rehearsal_hardening.sql','utf8')]})`;
});
console.log('Applied booking rehearsal hardening transaction.');
console.log(await sql`select relrowsecurity from pg_class where oid='public.rental_financial_records'::regclass`);
await sql.end();
