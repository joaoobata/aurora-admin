# Aurora Admin - Painel de Controle para Dark Accounts

Aurora Admin é um painel administrativo moderno e responsivo desenvolvido para monitorar, gerenciar e escalar operações de "Dark Accounts" (contas de nicho sem rosto) em múltiplas redes sociais (TikTok, Instagram, YouTube Shorts).

O projeto oferece visualização de métricas em tempo real, acompanhamento de metas e gestão centralizada de múltiplas contas.

## 🚀 Tecnologias Utilizadas

- **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Autenticação:** Supabase Auth

## 🛠️ Funcionalidades

- **Dashboard Geral:** Visão consolidada de visualizações, seguidores e engajamento.
- **Gestão de Contas:** Adicione e monitore o status (ativo/inativo) de contas em diferentes plataformas.
- **Acompanhamento de Metas:** Defina objetivos para suas contas e acompanhe o progresso (ex: chegar a 10k seguidores).
- **Histórico de Métricas:** Gráficos interativos para visualizar o crescimento ao longo do tempo.
- **Sistema de Permissões:** Suporte para usuários comuns e Administradores (com visão global).

## ⚙️ Configuração Local

### Pré-requisitos

- Node.js 18+ instalado.
- Uma conta no Supabase.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/joaoobata/aurora-admin.git
    cd aurora-admin
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados (Supabase):**
    - Crie um novo projeto no Supabase.
    - Vá até o **SQL Editor** no painel do Supabase.
    - Execute o script contido em `supabase/schema.sql` para criar as tabelas e políticas de segurança.
    - (Opcional) Para criar um Admin, execute o script em `supabase/create_admin_manual.sql`.

4.  **Configure as Variáveis de Ambiente:**
    - Copie o arquivo de exemplo:
      ```bash
      cp .env.example .env.local
      ```
    - Preencha o `.env.local` com suas credenciais do Supabase (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

5.  **Rode o projeto:**
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000` no seu navegador.

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas principais:

- `profiles`: Dados estendidos dos usuários (incluindo cargo/role).
- `accounts`: Contas de redes sociais cadastradas.
- `metrics`: Histórico diário/semanal de desempenho (views, likes, seguidores).
- `goals`: Metas estipuladas para cada conta.

## 📦 Deploy

Este projeto é otimizado para deploy na **Vercel**:

1.  Faça push do código para o GitHub.
2.  Importe o projeto na Vercel.
3.  Adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_...`) nas configurações do projeto na Vercel.
4.  O deploy será automático.

## 📝 Scripts Úteis

- `npm run dev`: Inicia servidor de desenvolvimento.
- `npm run build`: Cria build de produção.
- `scripts/test-connection.js`: Testa a conexão com o Supabase.
- `scripts/create-admin.js`: Script Node para criar usuário admin programaticamente.

---

Desenvolvido por João Obata.
