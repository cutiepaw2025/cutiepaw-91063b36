-- Auto-generate customer_id as CP-00001, CP-00002 ... when not provided

begin;

-- Create a sequence to back the incremental number
create sequence if not exists public.customer_code_seq;

-- Function to assign customer_id on insert when NULL/empty
create or replace function public.set_customer_id()
returns trigger as $$
begin
  if new.customer_id is null or btrim(new.customer_id) = '' then
    new.customer_id := 'CP-' || lpad(nextval('public.customer_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger on customers
drop trigger if exists customers_set_customer_id on public.customers;
create trigger customers_set_customer_id
before insert on public.customers
for each row execute function public.set_customer_id();

commit;


