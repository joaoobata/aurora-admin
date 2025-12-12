require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apifyToken = process.env.APIFY_API_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico do sistema Aurora Admin...\n');

  // 1. Verificar Conexão com Banco
  console.log('1️⃣  Testando Banco de Dados (Supabase)...');
  const { data: accounts, error: dbError } = await supabase.from('accounts').select('*');
  
  if (dbError) {
    console.error('   ❌ Erro ao acessar tabela "accounts":', dbError.message);
    console.log('   💡 Dica: Verifique se rodou o script "supabase/schema.sql" no SQL Editor.');
  } else {
    console.log(`   ✅ Conexão OK. ${accounts.length} conta(s) encontrada(s).`);
    if (accounts.length > 0) {
        console.log('   📋 Última conta cadastrada:', accounts[0].username, `(${accounts[0].platform})`);
    } else {
        console.log('   ⚠️ Nenhuma conta encontrada. O cadastro pelo front-end pode ter falhado.');
    }
  }

  console.log('\n---------------------------------------------------\n');

  // 2. Verificar Tabela de Vídeos (Schema Novo)
  console.log('2️⃣  Verificando suporte a Vídeos...');
  const { error: videoError } = await supabase.from('videos').select('count', { count: 'exact', head: true });
  
  if (videoError) {
    console.error('   ❌ Tabela "videos" inacessível:', videoError.message);
    console.log('   🚨 CRÍTICO: Você precisa rodar o arquivo "supabase/schema_videos.sql" no Supabase!');
    console.log('   Sem isso, a sincronização e a página de detalhes NÃO vão funcionar.');
  } else {
    console.log('   ✅ Tabela "videos" existe.');
  }

  console.log('\n---------------------------------------------------\n');

  // 3. Verificar Configuração do Scraper (Apify)
  console.log('3️⃣  Verificando Crawler (Apify)...');
  if (!apifyToken) {
    console.log('   ⚠️ APIFY_API_TOKEN não encontrado em .env.local');
    console.log('   ℹ️  O sistema usará MOCK DATA (dados falsos) para testes.');
    console.log('   👉 Para dados reais, crie conta no Apify.com e adicione o token no .env.local');
  } else {
    console.log('   ✅ Token do Apify configurado.');
  }

  console.log('\n---------------------------------------------------\n');
  console.log('🏁 Diagnóstico concluído.');
}

diagnose();
