require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Email e senha de um usuário que SABEMOS que existe (o admin que criamos)
const TEST_EMAIL = 'admin@auroraigaming.com';
const TEST_PASSWORD = 'Rxt&3644015';

async function testCreateAccount() {
  console.log('🧪 Iniciando teste de criação de conta...');

  // 1. Fazer Login para obter sessão (imitar o usuário no front-end)
  console.log(`👤 Logando como: ${TEST_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError) {
    console.error('❌ Falha no login:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('✅ Login realizado. User ID:', userId);

  // 2. Tentar Inserir uma Conta
  const newAccount = {
    user_id: userId,
    username: '@teste_script',
    platform: 'tiktok',
    status: 'active',
    url: 'https://tiktok.com/@teste_script'
  };

  console.log('💾 Tentando salvar conta no banco:', newAccount);

  const { data, error } = await supabase
    .from('accounts')
    .insert(newAccount)
    .select()
    .single();

  if (error) {
    console.error('❌ ERRO AO CRIAR CONTA:', error.message);
    console.error('details:', error.details);
    console.error('hint:', error.hint);
    console.error('code:', error.code);
    
    if (error.code === '42501') {
        console.log('\n🔒 Diagnóstico: ERRO DE PERMISSÃO (RLS).');
        console.log('   O banco bloqueou a inserção. As políticas RLS precisam ser revisadas.');
    }
  } else {
    console.log('🎉 SUCESSO! Conta criada com ID:', data.id);
  }
}

testCreateAccount();
