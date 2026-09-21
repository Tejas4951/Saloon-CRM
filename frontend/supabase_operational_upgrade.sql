-- Additive operational upgrade. It does not delete or replace existing data.
create extension if not exists "uuid-ossp";

create table if not exists public.staff_members (
  id uuid primary key default uuid_generate_v4(),
  shop_id bigint not null references public.shops(id) on delete cascade,
  name text not null,
  role text not null,
  photo text,
  available boolean not null default true,
  specialties text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  next_available timestamptz,
  working_start time default '09:00',
  working_end time default '18:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists staff_member_id uuid references public.staff_members(id) on delete set null;

alter table public.staff_members enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'staff_members' and policyname = 'authenticated_manage'
  ) then
    create policy authenticated_manage on public.staff_members
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'staff_members' and policyname = 'public_read_available_staff'
  ) then
    create policy public_read_available_staff on public.staff_members
      for select to anon using (available = true);
  end if;
end $$;
