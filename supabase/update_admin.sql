-- Adicionar coluna de role
alter table profiles add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- Atualizar políticas para permitir que admins vejam tudo

-- Accounts: Admins podem ver todas as contas
drop policy if exists "Users can view own accounts" on accounts;
create policy "Users can view own accounts OR admin view all" on accounts for select using (
  auth.uid() = user_id or 
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Profiles: Admins podem ver todos os perfis
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile OR admin view all" on profiles for select using (
  auth.uid() = id or 
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Se precisar que o admin edite dados de outros, teria que atualizar as policies de update/delete também.
-- Por enquanto, vamos manter o admin como "visualizador global" e "gestor da própria conta".
