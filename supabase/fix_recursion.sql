-- Criar função segura para verificar admin sem causar recursão
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 
    from profiles 
    where id = auth.uid() 
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;
-- 'security definer' faz a função rodar com permissões do criador (admin do banco), 
-- ignorando o RLS da tabela profiles durante a execução interna.

-- Atualizar Policies para usar a nova função

-- 1. Profiles
drop policy if exists "Users can view own profile OR admin view all" on profiles;
create policy "Users can view own profile OR admin view all" on profiles for select using (
  auth.uid() = id or public.is_admin()
);

-- 2. Accounts
drop policy if exists "Users can view own accounts OR admin view all" on accounts;
create policy "Users can view own accounts OR admin view all" on accounts for select using (
  auth.uid() = user_id or public.is_admin()
);

-- 3. Metrics (Reaplicar com suporte a admin)
drop policy if exists "Users can view metrics for own accounts" on metrics;
create policy "Users can view metrics for own accounts OR admin view all" on metrics for select using (
  exists ( select 1 from accounts where accounts.id = metrics.account_id and accounts.user_id = auth.uid() )
  or public.is_admin()
);

-- 4. Goals (Reaplicar com suporte a admin)
drop policy if exists "Users can view goals for own accounts" on goals;
create policy "Users can view goals for own accounts OR admin view all" on goals for select using (
  exists ( select 1 from accounts where accounts.id = goals.account_id and accounts.user_id = auth.uid() )
  or public.is_admin()
);
