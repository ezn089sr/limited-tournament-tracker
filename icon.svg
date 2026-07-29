create extension if not exists pgcrypto;

create table if not exists public.tournament_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  venue text not null default '',
  event_name text not null default '',
  custom_event_name text,
  buy_in numeric not null default 0,
  service_fee numeric not null default 0,
  reentry_count integer not null default 0,
  reentry_buyin_total numeric not null default 0,
  reentry_service_fee_total numeric not null default 0,
  prize numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournament_records_user_id_idx on public.tournament_records(user_id);
create index if not exists tournament_records_date_idx on public.tournament_records(date desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tournament_records_set_updated_at on public.tournament_records;
create trigger tournament_records_set_updated_at
before update on public.tournament_records
for each row execute function public.set_updated_at();

alter table public.tournament_records enable row level security;

drop policy if exists "select own tournament records" on public.tournament_records;
create policy "select own tournament records" on public.tournament_records
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own tournament records" on public.tournament_records;
create policy "insert own tournament records" on public.tournament_records
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own tournament records" on public.tournament_records;
create policy "update own tournament records" on public.tournament_records
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own tournament records" on public.tournament_records;
create policy "delete own tournament records" on public.tournament_records
for delete to authenticated using (auth.uid() = user_id);
