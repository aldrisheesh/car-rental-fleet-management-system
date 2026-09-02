-- VS030: deployment-managed backup/recovery metadata and Owner/Admin awareness.
create table public.backup_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('Scheduled', 'Manual')),
  status text not null default 'Running' check (
    status in ('Running', 'Completed', 'Partial', 'Failed')
  ),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  retention_until timestamptz not null,
  error_code text check (error_code in (
    'ConfigurationError',
    'DatabaseDumpFailed',
    'StorageEnumerationFailed',
    'StorageObjectReadFailed',
    'ArtifactUploadFailed',
    'IntegrityValidationFailed',
    'RetentionCleanupFailed',
    'UnknownBackupError'
  )),
  remarks text check (remarks is null or length(remarks) <= 500),
  created_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (status = 'Running' and completed_at is null)
    or (status <> 'Running' and completed_at is not null)
  )
);

create index backup_runs_started_idx
  on public.backup_runs (started_at desc, id desc);
create index backup_runs_completed_known_good_idx
  on public.backup_runs (completed_at desc, id desc)
  where status = 'Completed';
create index backup_runs_retention_idx
  on public.backup_runs (retention_until, id)
  where status <> 'Running';

create table public.backup_artifacts (
  id uuid primary key default gen_random_uuid(),
  backup_run_id uuid not null references public.backup_runs (id) on delete cascade,
  artifact_type text not null check (artifact_type in ('Database', 'Storage')),
  artifact_key text not null check (
    length(artifact_key) between 1 and 1024
    and artifact_key ~ '^[A-Za-z0-9][A-Za-z0-9._~%/-]*$'
    and artifact_key !~ '(^|/)\.\.(/|$)'
    and artifact_key !~ '^/'
    and artifact_key !~ '//'
  ),
  status text not null check (status in ('Completed', 'Failed')),
  size_bytes bigint,
  sha256 text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (backup_run_id, artifact_key),
  check (
    (status = 'Completed' and size_bytes is not null and size_bytes >= 0
      and sha256 ~ '^[0-9a-f]{64}$')
    or (status = 'Failed' and size_bytes is null and sha256 is null)
  )
);

create index backup_artifacts_run_idx
  on public.backup_artifacts (backup_run_id, artifact_type, created_at, id);

create table public.recovery_drills (
  id uuid primary key default gen_random_uuid(),
  backup_run_id uuid not null references public.backup_runs (id) on delete restrict,
  target_environment text not null default 'NonProduction'
    check (target_environment = 'NonProduction'),
  status text not null default 'Running'
    check (status in ('Running', 'Passed', 'Failed')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  database_validation text check (
    database_validation is null
    or database_validation in ('Pending', 'Passed', 'Failed')
  ),
  storage_validation text check (
    storage_validation is null
    or storage_validation in ('Pending', 'Passed', 'Failed')
  ),
  error_code text check (error_code in (
    'ConfigurationError',
    'IntegrityValidationFailed',
    'RestoreFailed',
    'ValidationFailed',
    'UnknownBackupError'
  )),
  remarks text check (remarks is null or length(remarks) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (status = 'Running' and completed_at is null)
    or (status <> 'Running' and completed_at is not null)
  ),
  check (status <> 'Passed' or (
    database_validation = 'Passed' and storage_validation = 'Passed'
  ))
);

create index recovery_drills_started_idx
  on public.recovery_drills (started_at desc, id desc);

alter table public.backup_runs enable row level security;
alter table public.backup_artifacts enable row level security;
alter table public.recovery_drills enable row level security;

revoke all on public.backup_runs, public.backup_artifacts,
  public.recovery_drills from public, anon, authenticated;
grant select on public.backup_runs, public.backup_artifacts,
  public.recovery_drills to authenticated;
grant select, insert, update, delete on public.backup_runs,
  public.backup_artifacts, public.recovery_drills to service_role;

create policy backup_runs_owner_select on public.backup_runs
  for select to authenticated
  using (exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  ));

create policy backup_artifacts_owner_select on public.backup_artifacts
  for select to authenticated
  using (exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  ));

create policy recovery_drills_owner_select on public.recovery_drills
  for select to authenticated
  using (exists (
    select 1 from public.profiles profile
    where profile.id = auth.uid()
      and profile.user_type = 'Owner/Admin'
      and profile.account_status = 'Active'
  ));

alter table public.notifications
  drop constraint if exists notifications_notification_type_check;
alter table public.notifications
  add constraint notifications_notification_type_check check (notification_type in (
    'requirements_needs_resubmission',
    'requirements_verified',
    'payment_needs_resubmission',
    'payment_verified',
    'booking_confirmed',
    'new_booking_request',
    'requirements_submitted',
    'payment_proof_submitted',
    'upcoming_pickup',
    'upcoming_return',
    'rental_overdue',
    'maintenance_attention',
    'low_availability',
    'backup_attention'
  ));

alter table public.notifications
  drop constraint if exists notifications_related_entity_type_check;
alter table public.notifications
  add constraint notifications_related_entity_type_check check (
    related_entity_type in (
      'booking', 'requirements', 'payment', 'rental', 'vehicle', 'branch',
      'backup_run'
    )
  );

create function public.notify_backup_run_attention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status not in ('Partial', 'Failed') then
    return new;
  end if;

  perform public.notify_active_owner_admins(
    'backup_attention',
    case new.status
      when 'Partial' then 'Backup run needs attention'
      else 'Backup run failed'
    end,
    case new.status
      when 'Partial' then 'A backup run produced an incomplete recovery set. A Technical Recovery Operator should investigate.'
      else 'A backup run did not produce a useful recovery set. A Technical Recovery Operator should investigate.'
    end,
    'backup_run',
    new.id,
    'backup-attention:' || new.id::text
  );
  return new;
end;
$$;

create trigger backup_runs_notify_attention
after insert or update of status on public.backup_runs
for each row execute function public.notify_backup_run_attention();

revoke all on function public.notify_backup_run_attention()
from public, anon, authenticated;
