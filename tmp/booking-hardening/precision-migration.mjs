import {sql} from './db.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const path='supabase/migrations/20261004074425_rental_settlement_cent_precision.sql';
let source=(await sql`select pg_get_functiondef('public.close_rental_with_settlement(uuid,uuid,jsonb)'::regprocedure) d`)[0].d;
source=source.replace('LANGUAGE plpgsql\n','LANGUAGE plpgsql\n SECURITY DEFINER\n').replace('or refund is distinct from f.deposit_collected-deduction','or deduction <> round(deduction,2)\n     or refund is distinct from f.deposit_collected-deduction');
const migration=`-- Server-only lifecycle wrappers need the same controlled table access as the existing rental RPCs.\n-- Existing revoked client grants are preserved; actor role and stale-state checks remain mandatory.\nalter function public.release_rental_with_collection(uuid,uuid,jsonb) security definer;\n${source}\n`;
writeFileSync(path,migration);
await sql.begin(async tx=>{await tx.unsafe(migration);await tx`insert into supabase_migrations.schema_migrations(version,name,statements) values('20261004074425','rental_settlement_cent_precision',${[migration]})`;});
console.log('Applied server-only permission and currency precision correction.');await sql.end();
