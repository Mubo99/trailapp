create table if not exists public.app_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_select" on public.app_state;
drop policy if exists "app_state_insert" on public.app_state;
drop policy if exists "app_state_update" on public.app_state;
drop policy if exists "authenticated_app_state_select" on public.app_state;
drop policy if exists "authenticated_app_state_insert" on public.app_state;
drop policy if exists "authenticated_app_state_update" on public.app_state;

create policy "authenticated_app_state_select"
on public.app_state for select
to authenticated
using ((select auth.uid()) is not null);

create policy "authenticated_app_state_insert"
on public.app_state for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "authenticated_app_state_update"
on public.app_state for update
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception
  when duplicate_object then null;
end $$;
