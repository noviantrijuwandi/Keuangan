-- Jalankan sekali di Supabase SQL Editor.
create table if not exists public.finance_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_states enable row level security;

drop policy if exists "finance_states_select_own" on public.finance_states;
drop policy if exists "finance_states_insert_own" on public.finance_states;
drop policy if exists "finance_states_update_own" on public.finance_states;

create policy "finance_states_select_own"
on public.finance_states for select
to authenticated
using (auth.uid() = user_id);

create policy "finance_states_insert_own"
on public.finance_states for insert
to authenticated
with check (auth.uid() = user_id);

create policy "finance_states_update_own"
on public.finance_states for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
