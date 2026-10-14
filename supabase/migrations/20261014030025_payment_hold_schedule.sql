-- Vercel Hobby permits only daily cron. Use the hosted DB scheduler to call
-- the existing protected processor every ten minutes. Activate only after
-- production deployment and Vault credential provisioning are verified.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create function briah_private.invoke_payment_hold_processor() returns bigint
language plpgsql security definer set search_path='' as $$
declare processor_secret text;
begin
 select decrypted_secret into processor_secret from vault.decrypted_secrets where name='briah_payment_hold_processor';
 if processor_secret is null then raise exception 'payment_hold_processor_not_configured'; end if;
 return net.http_post(url:='https://briahcarrental.site/api/internal/reminders',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||processor_secret),body:='{}'::jsonb,timeout_milliseconds:=30000);
end $$;
revoke all on function briah_private.invoke_payment_hold_processor() from public,anon,authenticated,service_role;
select cron.schedule('briah-payment-hold-cycle','*/10 * * * *','select briah_private.invoke_payment_hold_processor()');
select cron.alter_job(job_id := (select jobid from cron.job where jobname='briah-payment-hold-cycle'),active := false);
