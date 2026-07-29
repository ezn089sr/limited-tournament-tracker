create table if not exists public.share_snapshots (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  title text not null default '限時錦標賽統計',
  range_label text not null default '',
  start_date date,
  end_date date,
  summary jsonb not null default '{}'::jsonb,
  chart_data jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists share_snapshots_token_idx on public.share_snapshots(token);
create index if not exists share_snapshots_user_id_idx on public.share_snapshots(user_id);

alter table public.share_snapshots enable row level security;

drop policy if exists "public can read public share snapshots" on public.share_snapshots;
create policy "public can read public share snapshots"
on public.share_snapshots
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "users can create own share snapshots" on public.share_snapshots;
create policy "users can create own share snapshots"
on public.share_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own share snapshots" on public.share_snapshots;
create policy "users can update own share snapshots"
on public.share_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own share snapshots" on public.share_snapshots;
create policy "users can delete own share snapshots"
on public.share_snapshots
for delete
to authenticated
using (auth.uid() = user_id);
