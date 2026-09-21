-- DEMO ONLY: allows the mock-login frontend to manage operational data with the anon key.
-- Do not use these policies in production. Run the DROP statements at the bottom before launch.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'shops',
    'services',
    'customers',
    'appointments',
    'inventory_items',
    'inventory_in_use',
    'store_products',
    'store_orders',
    'store_order_items',
    'tally_items',
    'expenses',
    'staff_members'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'demo_anon_manage'
    ) then
      execute format(
        'create policy demo_anon_manage on public.%I for all to anon using (true) with check (true)',
        table_name
      );
    end if;
  end loop;
end $$;

-- Production cleanup (run manually when real authentication is ready):
-- drop policy if exists demo_anon_manage on public.shops;
-- drop policy if exists demo_anon_manage on public.services;
-- drop policy if exists demo_anon_manage on public.customers;
-- drop policy if exists demo_anon_manage on public.appointments;
-- drop policy if exists demo_anon_manage on public.inventory_items;
-- drop policy if exists demo_anon_manage on public.inventory_in_use;
-- drop policy if exists demo_anon_manage on public.store_products;
-- drop policy if exists demo_anon_manage on public.store_orders;
-- drop policy if exists demo_anon_manage on public.store_order_items;
-- drop policy if exists demo_anon_manage on public.tally_items;
-- drop policy if exists demo_anon_manage on public.expenses;
-- drop policy if exists demo_anon_manage on public.staff_members;
