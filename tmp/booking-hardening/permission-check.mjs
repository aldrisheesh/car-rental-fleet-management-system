import {sql} from './db.mjs';import assert from 'node:assert/strict';
const [permission]=await sql`select has_function_privilege('anon','public.release_rental_with_collection(uuid,uuid,jsonb)','execute') anon_release,has_function_privilege('authenticated','public.release_rental_with_collection(uuid,uuid,jsonb)','execute') customer_release,has_function_privilege('authenticated','public.close_rental_with_settlement(uuid,uuid,jsonb)','execute') customer_return`;
for(const value of Object.values(permission))assert.equal(value,false);
console.log('PASS restricted release/return function grants after follow-up migration');await sql.end();
