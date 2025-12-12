-- 1. Habilitar extensão para criptografia de senha (caso não esteja ativa)
create extension if not exists pgcrypto;

-- 2. Inserir usuário ADMIN diretamente na tabela de autenticação (se ainda não existir)
-- Isso cria o usuário já com email confirmado e senha criptografada
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'admin@auroraigaming.com',
  crypt('Rxt&3644015', gen_salt('bf')), -- Sua senha criptografada
  now(), -- Email confirmado instantaneamente
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Aurora"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@auroraigaming.com'
);

-- 3. Garantir que o perfil tenha permissão de ADMIN
-- (Se o usuário já existia antes, isso apenas atualiza a permissão e confirma o email)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'admin@auroraigaming.com';

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@auroraigaming.com'
);
