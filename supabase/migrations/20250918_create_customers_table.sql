-- Drop existing customers table if it exists and recreate with required fields
-- Safe for re-run: use IF EXISTS/IF NOT EXISTS where possible

begin;

-- Drop existing
drop table if exists public.customers cascade;

-- Create new customers table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_id text unique, -- external/customer code
  contact_person text,
  company text,
  mobile text,
  email text,
  address_line1 text,
  address_line2 text,
  state text,
  city text,
  pincode text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Basic RLS enabled with open read/write for authenticated users
alter table public.customers enable row level security;

-- Policies (simple: allow all authenticated operations)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_select'
  ) then
    create policy customers_select on public.customers for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_insert'
  ) then
    create policy customers_insert on public.customers for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_update'
  ) then
    create policy customers_update on public.customers for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'customers_delete'
  ) then
    create policy customers_delete on public.customers for delete to authenticated using (true);
  end if;
end $$;

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

commit;


