
# MarketingHub - Dashboard de Analytics de Marketing

Um dashboard abrangente de analytics de marketing que consolida dados de múltiplas APIs externas (CRM, e-commerce, anúncios) em dashboards unificados de KPIs e relatórios automatizados.

## 🚀 Funcionalidades Principais

### 📊 Dashboard Central
- **Métricas de Performance**: Visualização em tempo real de leads, conversões, receita e CPA
- **Gráficos Interativos**: Tendências de receita, distribuição de fontes de leads e performance de campanhas
- **Feed de Atividades**: Timeline em tempo real de novos leads, vendas e atualizações de campanhas
- **Indicadores de Status**: Monitor visual do status de conexão com todas as integrações

### 🔗 Integrações de APIs
- **HubSpot CRM**: Sincronização de leads, contatos e deals
- **Shopify**: Dados de pedidos, clientes e receita de e-commerce
- **Google Ads**: Métricas de campanhas e performance de anúncios
- **Meta Ads (Facebook/Instagram)**: Dados de campanhas sociais
- **TikTok Ads**: Performance de campanhas no TikTok
- **Kommo CRM**: Gerenciamento alternativo de CRM e leads

### 📈 Relatórios e Analytics
- **Relatórios Automatizados**: Geração diária de relatórios em HTML, PDF e JSON
- **KPIs Calculados**: Taxa de conversão, ROI, CPA médio, receita diária
- **Análise de Campanhas**: Performance comparativa entre plataformas
- **Métricas de Leads**: Rastreamento de origem e qualidade dos leads

### ⚙️ Configurações de API
- **Gerenciamento de Conexões**: Interface para configurar chaves de API e tokens
- **Teste de Conectividade**: Verificação automática do status das conexões
- **Sincronização Agendada**: ETL automatizado para coleta e processamento de dados
- **Logs de Sincronização**: Histórico de sincronizações e status das APIs

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**: Framework principal para interface
- **Vite**: Ferramenta de build rápida e desenvolvimento
- **Wouter**: Roteamento leve para navegação
- **TanStack Query**: Gerenciamento de estado do servidor e cache
- **Tailwind CSS**: Framework de CSS utilitário
- **Shadcn/ui**: Componentes UI baseados em Radix UI
- **Recharts**: Biblioteca para gráficos interativos
- **Lucide React**: Ícones consistentes
- **React Hook Form + Zod**: Validação e gerenciamento de formulários

### Backend
- **Node.js** com **Express.js**: Servidor API RESTful
- **TypeScript**: Tipagem estática para JavaScript
- **Supabase (PostgreSQL)**: Banco de dados principal
- **Drizzle ORM**: ORM type-safe para PostgreSQL
- **Node-cron**: Agendamento de tarefas para ETL
- **Express Session**: Gerenciamento de sessões
- **Zod**: Validação de esquemas de dados

### Banco de Dados
- **PostgreSQL (Supabase)**: Armazenamento principal
- **Drizzle Kit**: Migrações e gerenciamento de schema
- **connect-pg-simple**: Armazenamento de sessões no PostgreSQL
- **Pool de Conexões**: Conexões otimizadas com o banco

### Integrações e APIs
- **OAuth2**: Autenticação segura para serviços externos
- **REST APIs**: Integração com HubSpot, Shopify, Google Ads, Meta, TikTok
- **Webhooks**: Atualizações em tempo real de dados externos
- **Rate Limiting**: Controle de requisições para APIs externas

### DevOps e Deployment
- **Replit**: Plataforma de desenvolvimento e deployment
- **ESBuild**: Build otimizado para produção
- **Hot Module Replacement**: Desenvolvimento com reload instantâneo
- **Environment Variables**: Configuração segura de variáveis sensíveis

## 📁 Estrutura do Projeto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── ui/        # Componentes base (Shadcn/ui)
│   │   │   ├── sidebar.tsx
│   │   │   ├── kpi-grid.tsx
│   │   │   ├── charts-section.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── campaign-table.tsx
│   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── dashboard.tsx
│   │   │   ├── api-settings.tsx
│   │   │   └── reports.tsx
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários e configurações
│   └── index.html
├── server/                # Backend Node.js
│   ├── services/          # Serviços de integração
│   │   ├── hubspot.ts
│   │   ├── shopify.ts
│   │   ├── googleAds.ts
│   │   ├── metaAds.ts
│   │   ├── tiktokAds.ts
│   │   ├── kommo.ts
│   │   ├── dataProcessor.ts
│   │   └── reportGenerator.ts
│   ├── db.ts             # Configuração do banco
│   ├── storage.ts        # Camada de abstração de dados
│   ├── routes.ts         # Rotas da API
│   └── index.ts          # Servidor principal
├── shared/               # Tipos e schemas compartilhados
│   └── schema.ts
└── drizzle.config.ts     # Configuração do ORM
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js 20+
- Conta Supabase (PostgreSQL)
- Chaves de API das integrações desejadas

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env com as configurações necessárias

# Executar migrações do banco
npm run db:push

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### Variáveis de Ambiente
```env
DATABASE_URL=your_supabase_postgresql_url
HUBSPOT_API_KEY=your_hubspot_api_key
SHOPIFY_ACCESS_TOKEN=your_shopify_token
GOOGLE_ADS_CLIENT_ID=your_google_ads_client_id
META_ADS_ACCESS_TOKEN=your_meta_ads_token
KOMMO_ACCESS_TOKEN=your_kommo_token
```

## 📊 Características Técnicas

### Padrões de Arquitetura
- **Repository Pattern**: Abstração da camada de armazenamento
- **Service Layer**: Classes dedicadas para cada API externa
- **Factory Pattern**: Geração flexível de relatórios
- **Observer Pattern**: Atualizações em tempo real

### Performance e Escalabilidade
- **Cache Inteligente**: TanStack Query para cache do frontend
- **Pool de Conexões**: Conexões otimizadas com PostgreSQL
- **Lazy Loading**: Carregamento sob demanda de componentes
- **Code Splitting**: Divisão automática do código para loading rápido

### Segurança
- **Validação de Dados**: Zod para validação type-safe
- **Sanitização**: Limpeza automática de inputs
- **Gestão de Sessões**: Sessões seguras com PostgreSQL
- **Rate Limiting**: Proteção contra abuso de APIs

## 🚀 Deployment

O projeto está configurado para deployment automático no Replit:

1. **Build**: `npm run build`
2. **Start**: `npm run start`
3. **Port**: 5000 (automaticamente mapeado para 80/443)

## 📝 Contribuição

O projeto segue práticas modernas de desenvolvimento:
- TypeScript para type safety
- ESLint para qualidade de código
- Prettier para formatação consistente
- Conventional Commits para histórico claro

## 🔄 Atualizações Automáticas

- **ETL Diário**: Processamento automático de dados às 02:00
- **Relatórios**: Geração automática de relatórios diários
- **Sincronização**: Atualização contínua de métricas
- **Real-time**: WebSockets para atualizações instantâneas

## 📈 Métricas Suportadas

- **Leads**: Total, origem, taxa de conversão
- **Receita**: Diária, mensal, por canal
- **ROI**: Retorno sobre investimento por campanha
- **CPA**: Custo por aquisição médio
- **Performance**: Métricas detalhadas por plataforma

---

**MarketingHub** - Centralize seus dados de marketing e tome decisões baseadas em dados reais.
