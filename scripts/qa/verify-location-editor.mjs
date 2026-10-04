import postgres from 'postgres';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const project=readFileSync('supabase/.temp/project-ref','utf8').trim();
const url=new URL(process.env.DEFENSE_DATABASE_URL??readFileSync('supabase/.temp/pooler-url','utf8').trim());
if(!(url.hostname===`db.${project}.supabase.co`||decodeURIComponent(url.username)===`postgres.${project}`))throw new Error('Database project mismatch');
if(!url.password)url.password=process.env.SUPABASE_DB_PASSWORD??'';
const sql=postgres(url.toString(),{ssl:'require',max:1,prepare:false});
const file='supabase/migrations/20261003141509_unified_location_editor.sql';
const migration=readFileSync(file,'utf8');
try {
 const existing=await sql`select version from supabase_migrations.schema_migrations where version='20261003141509'`;
 try{await sql.begin(async tx=>{
  if(!existing.length)await tx.unsafe(migration);
  const [{id:actor}]=await tx`select id from public.profiles limit 1`;
  const id=randomUUID();
  const point={latitude:14.57,longitude:121.18,query:'QA Dalig, Antipolo',label:'Synthetic QA reference',provider:'qa',resultType:'qa',kind:'area_reference'};
  const save=(id,create,name,address,active,p,who=actor)=>tx`select public.save_operational_location(${id}::uuid,${create},${name},${address},${active},${p?tx.json(p):null}::jsonb,${who}::uuid) as result`;
  await save(id,true,'Synthetic QA location',point.query,true,point);
  await save(id,false,'Renamed QA location',point.query,true,null);
  assert.equal((await tx`select query from public.branch_route_points where branch_id=${id}`)[0].query,point.query);
  await assert.rejects(tx.savepoint(async()=>save(id,false,'Bad changed name','Unconfirmed new address',true,null)),/Confirm the map point/);
  assert.equal((await tx`select name,address from public.branches where id=${id}`)[0].name,'Renamed QA location');
  assert.equal((await tx`select query from public.branch_route_points where branch_id=${id}`)[0].query,point.query);
  const changed={...point,query:'QA Manila new address'};
  await save(id,false,'QA moved location',changed.query,true,changed);
  assert.equal((await tx`select query from public.branch_route_points where branch_id=${id}`)[0].query,changed.query);
  await assert.rejects(tx.savepoint(async()=>save(id,false,'Bad actor',changed.query,true,changed,randomUUID())),/foreign key/);
  assert.equal((await tx`select name from public.branches where id=${id}`)[0].name,'QA moved location');
  const empty=randomUUID();
  await assert.rejects(tx.savepoint(async()=>save(empty,true,'No map','QA address',true,null)),/Confirm the map point/);
  assert.equal((await tx`select id from public.branches where id=${empty}`).length,0);
  await save(id,false,'QA inactive',changed.query,false,null);
  assert.equal((await tx`select is_active from public.branches where id=${id}`)[0].is_active,false);
  await tx`update public.branches set address='QA legacy edit' where id=${id}`;
  assert.equal((await tx`select branch_id from public.branch_route_points where branch_id=${id}`).length,0);
  const [access]=await tx`select has_function_privilege('anon','public.save_operational_location(uuid,boolean,text,text,boolean,jsonb,uuid)','execute') as anon,has_function_privilege('authenticated','public.save_operational_location(uuid,boolean,text,text,boolean,jsonb,uuid)','execute') as authenticated,has_function_privilege('service_role','public.save_operational_location(uuid,boolean,text,text,boolean,jsonb,uuid)','execute') as server`;
  assert.deepEqual(access,{anon:false,authenticated:false,server:true});
  console.log('PASS: create, rename, atomic address replacement, invalid-save rollback, actor FK rollback, active-map requirement, deactivation, stale-point invalidation, server-only access.');
  throw new Error('QA_ROLLBACK');
 });}catch(e){if(e.message!=='QA_ROLLBACK')throw e;}
 if(process.argv.includes('--apply')&&!existing.length){await sql.begin(async tx=>{await tx.unsafe(migration);await tx`insert into supabase_migrations.schema_migrations(version,name,statements) values('20261003141509','unified_location_editor',array[${migration}])`;await tx`notify pgrst,'reload schema'`;});console.log('Migration applied; no QA rows persisted.');}
}finally{await sql.end();}
