require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = 'admin@auroraigaming.com';
const ADMIN_PASSWORD = 'Rxt&3644015';

async function createAdmin() {
  console.log(`👤 Tentando criar usuário: ${ADMIN_EMAIL}`);

  // 1. Tentar Criar Usuário
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: {
      data: {
        full_name: 'Admin Aurora',
      },
    },
  });

  if (signUpError) {
    console.error('❌ Erro ao criar usuário:', signUpError.message);
    return;
  }

  const user = signUpData.user;
  const session = signUpData.session;

  if (user) {
    console.log('✅ Usuário criado/identificado com ID:', user.id);

    // 2. Tentar Atualizar Role para 'admin'
    // Nota: Isso só funcionará via API se o usuário estiver logado (tem sessão) e as políticas RLS permitirem,
    // ou se o email confirmation estiver desligado.
    if (session) {
      console.log('🔄 Sessão ativa. Tentando definir role como "admin"...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateError) {
        console.error('⚠️ Falha ao atualizar role automaticamente:', updateError.message);
        console.log('📝 Execute o seguinte SQL no Supabase para corrigir:');
        console.log(`   UPDATE profiles SET role = 'admin' WHERE id = '${user.id}';`);
      } else {
        console.log('🎉 Sucesso! O usuário agora é um ADMIN.');
      }
    } else {
      console.log('⚠️ Usuário criado, mas sem sessão ativa (provavelmente requer confirmação de email).');
      console.log('1️⃣ Confirme o email (se necessário).');
      console.log('2️⃣ Vá no SQL Editor do Supabase e rode o comando abaixo para dar permissão de admin:');
      console.log(`   UPDATE profiles SET role = 'admin' WHERE id = '${user.id}';`);
    }
  }
}

createAdmin();
