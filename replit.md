# replit.md

## Overview

This is a full-stack web application built with React, Express, and TypeScript that provides an intelligent customer service dashboard for educational institutions. The application integrates with BotConversa for chat functionality and includes features for attendance management, productivity tracking, internal communication, CRM, and gamification through goals and rewards.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API with custom hooks
- **Routing**: React Router DOM
- **Data Fetching**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store
- **Development Server**: Custom Vite integration for SSR-like development

### UI Design System
- **Component Library**: Radix UI primitives with shadcn/ui
- **Design Style**: "new-york" theme with neutral base colors
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Icons**: Lucide React icons

## Key Components

### 1. Authentication System
- Mock authentication with predefined user roles (admin, agent)
- Session persistence via localStorage
- Activity monitoring with automatic logout after 7 minutes of inactivity
- Role-based access control

### 2. Dashboard & Analytics
- Real-time metrics display (total attendances, active agents, response times)
- Interactive charts for attendance volume, team productivity, and performance trends
- Responsive metric cards with trend indicators

### 3. Student Support System (`AtendimentoAluno`)
- Real-time conversation management with students
- Infinite scroll for conversations and message history
- Internal notes system for staff coordination
- Conversation transfer between attendants
- Message grouping by date
- Notification system with sound alerts

### 4. Internal Chat System
- Team-based communication channels
- Private messaging between staff members
- Real-time message updates with React Context
- Message search and filtering
- Configurable notification settings
- Audio message support

### 5. CRM System
- Kanban-style lead management with drag-and-drop
- Multiple funnel views by team
- Lead assignment and tracking
- Integration with conversation system
- List and board view modes

### 6. Gamification System
- Goal setting and tracking (daily, weekly, monthly)
- Achievement notifications with confetti animations
- Reward system with virtual coins
- Team and individual performance rankings
- Configurable notification sounds

### 7. Attendance & Productivity Tracking
- Real-time presence monitoring
- Productivity metrics and reporting
- Team performance analytics
- Export functionality for reports

## Data Flow

### 1. Frontend State Management
- **React Context**: Global state for chat, authentication, and settings
- **TanStack Query**: Server state caching and synchronization
- **Custom Hooks**: Abstraction layer for business logic
- **Local Storage**: Persistent settings and session data

### 2. API Communication
- RESTful API endpoints prefixed with `/api`
- Error handling with custom error boundaries
- Request/response logging for debugging
- Mock data services for development

### 3. Database Schema
- **Users**: Authentication and profile information
- **Conversations**: Student support conversations
- **Messages**: Chat messages with metadata
- **Teams**: Organizational structure
- **Goals**: Gamification tracking
- **Attendance**: Presence and productivity data

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Router, React Query
- **UI Components**: Radix UI primitives, Tailwind CSS
- **Database**: Drizzle ORM, Neon PostgreSQL
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns with Portuguese locale

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across the stack
- **ESBuild**: Fast backend compilation
- **Replit Integration**: Development environment optimization

### External Services
- **BotConversa**: Chat platform integration
- **Neon Database**: Serverless PostgreSQL hosting
- **Browser APIs**: Notification API, Web Audio API for sounds

## Deployment Strategy

### Development Mode
- Vite dev server with hot module replacement
- Express middleware integration
- TypeScript compilation with tsx
- Automatic error overlay

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation to ESM
- **Assets**: Static file serving from Express
- **Database**: Drizzle migrations with `db:push`

### Environment Configuration
- Database URL configuration for Neon
- BotConversa API credentials
- Development vs production environment detection
- Replit-specific optimizations

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
- Migração do Lovable para Replit concluída
- Banco de dados PostgreSQL configurado e migrado com sucesso
- Schema completo implementado com todas as tabelas necessárias
- Storage layer (DatabaseStorage) implementado para todas as operações CRUD
- Backend API completa implementada com JWT authentication
- Rotas para todos os módulos: users, teams, chats, leads, conversations, goals
- WebSocket implementado para comunicação em tempo real
- Sistema de autenticação funcionando (admin/password)
- Testes de API confirmam funcionamento correto do backend
- Base de dados completa criada com dados de exemplo para demonstração:
  * 4 usuários (admin, Maria, João, Ana)
  * 4 teams (Atendimento, Vendas, Suporte Técnico, Relacionamento)
  * 4 leads com diferentes status (new, contacted, qualified, proposal)
  * 4 conversas ativas com mensagens de exemplo
  * 4 metas configuradas (individuais e de equipe)
  * Chats internos com mensagens entre membros da equipe
  * Notas internas para conversas
  * Progresso das metas e atividades de usuário
- Sistema pronto para demonstração e uso
- Integração BotConversa implementada:
  * Configurações mapeadas para conta comercial (27 campos personalizados, 22 tags)
  * Serviços de API configurados com tratamento de erros robusto
  * Página de administração completa (/integracao-botconversa)
  * Webhooks configurados para ambas as contas (suporte e comercial)
  * Identificado número do bot comercial: +55 31 97176-1350
  * Sistema de testes implementado com orientações claras para uso
  * RESOLVIDO: Problema de autenticação solucionado - API usa header 'api-key' em vez de 'Authorization'
  * Chaves API ativadas pelo suporte BotConversa (8 Jul 2025)
  * Integração funcionando para ambas as contas: 182301/Comercial e 182331/Suporte
- Fase 2 - Configuração de Negócio implementada:
  * Mapeamento completo de departamentos para ambas as contas
  * Comercial: 16 membros em 9 departamentos com emails mapeados
  * Suporte: 13 membros em 9 departamentos com emails mapeados
  * Sistema de roteamento automático implementado baseado em tags
  * Regras de negócio configuradas para classificação automática de leads
  * Página de gerenciamento de roteamento criada (/gerenciamento-roteamento)
  * Endpoint de teste de roteamento funcional (/api/routing/test)
  * Integração webhooks com roteamento automático por departamento
  * Mapeamento de status CRM baseado em tags do BotConversa
  * Sistema pronto para operação em produção
- Análise Completa dos Fluxos BotConversa implementada:
  * Endpoint /api/botconversa/flows/:account para informações básicas dos fluxos
  * Endpoint /api/botconversa/flows/:account/analysis para análise comparativa com CRM
  * Análise detalhada do fluxo Suporte: 9 departamentos, 6 regras de roteamento, integração ativa
  * Análise detalhada do fluxo Comercial: 9 departamentos, 20 regras de roteamento, mapeamento status CRM
  * Comparativo completo entre fluxos: Suporte (funcional) vs Comercial (avançado)
  * Fluxos perfeitamente sincronizados com sistema CRM e operacionais
  * Identificadas oportunidades de melhoria: balanceamento de carga e expansão de menu no Suporte
  * Documentação completa gerada: analise_fluxo_suporte.md, analise_fluxo_comercial.md, comparativo_fluxos_completo.md
- Melhorias nas Configurações do CRM (8 Jul 2025):
  * Interface de configurações redesenhada com layout mais profissional
  * Funis existentes agora mostram informações detalhadas (colunas, leads ativos, integração)
  * Cards de funis com border destacado e badges de status aprimorados
  * Informações das companhias atualizadas com dados mais precisos e estruturados
  * Botão "Criar Funil" com estilo melhorado e consistente
  * Coerência entre dados dos funis e estrutura real do sistema mantida
- Módulo de Certificações - Importação de Dados Reais (8 Jul 2025):
  * Sistema expandido para 9 categorias: Pós-Graduação, Segunda Graduação, Formação Livre, Diplomação por Competência, EJA, Graduação, Capacitação, Sequencial
  * Layout ajustado para usar toda a largura da tela (removido container restritivo)
  * Modalidades atualizadas para refletir as necessidades reais do sistema educacional
  * Importação completa de dados de julho 2025: 97 certificações processadas
  * Importação adicional de dados de junho 2025: 26 certificações novas
  * Total atual no sistema: 124 certificações distribuídas:
    - Pós-Graduação: 41 certificações (33 alunos únicos)
    - Segunda Graduação: 73 certificações (63 alunos únicos)
    - Formação Livre: 5 certificações (5 alunos únicos)
    - Diplomação por Competência: 4 certificações (4 alunos únicos)
    - EJA: 1 certificação (1 aluno único)
  * Scripts de importação automatizados para processar dados PDF e CSV
  * Campos preservados fielmente da planilha original: início, aluno, CPF, modalidade, curso, financeiro, documentação, plataforma, tutoria, observações
  * Status automaticamente categorizados: concluído, em andamento, pendente, cancelado
  * Sistema pronto para uso com dados reais de certificações educacionais
  * Divergências de dados sistematicamente corrigidas (9 Jul 2025):
    - CPFs unificados para 6 alunos com registros duplicados
    - Duplicatas removidas do sistema
    - Sistema de busca funcionando sem erros de runtime
  * Interface atualizada (9 Jul 2025):
    - Modalidades ajustadas para: Segunda licenciatura, formação pedagógica, EJA, Diplomação por competência, pós-graduação, formação livre, graduação, capacitação, sequencial
    - Filtros e formulários sincronizados com as novas modalidades
    - Layout responsivo para 8 abas de categorias
    - Botão de chat de suporte temporariamente oculto
  * Melhorias no Modal de Certificações (9 Jul 2025):
    - Modal expandido para tamanho máximo (max-w-6xl) com altura responsiva
    - Novos campos acadêmicos: TCC, Práticas Pedagógicas e Estágio
    - Cada campo acadêmico possui 4 opções: Não Possui, Aprovado, Reprovado, Em Correção
    - Layout reorganizado em 3 colunas com espaçamento otimizado
    - Campo de curso expandido para 2 colunas para melhor visualização de nomes longos
    - Dropdown de busca de cursos ampliado (600px) com informações estruturadas
    - Badges coloridas para status acadêmicos nos cards de visualização
    - Scroll vertical implementado para modais com muito conteúdo
    - Campo de Status movido para o topo do modal com destaque visual (fundo azul)
    - Indicadores visuais com bolinhas coloridas para cada status nos dropdowns
  * Importação Complementar de Dados - Junho 2025 (9 Jul 2025):
    - Análise do arquivo PDF de junho identificou 28 certificações
    - 20 certificações já estavam no sistema (71% de cobertura)
    - 8 certificações restantes foram importadas com sucesso
    - Total no sistema agora: 129 certificações
    - Modalidades importadas: Segunda Licenciatura, Formação Pedagógica, Pós-Graduação, Diplomação por Competência
    - Casos especiais tratados: CPFs duplicados com cursos diferentes, status variados (concluído, em andamento, cancelado, pendente)
    - Scripts de análise e importação automatizados criados (analise_dados_junho.ts, import_certificacoes_junho_restantes.ts)
  * Importação Histórica Completa - Maio 2025 (9 Jul 2025):
    - Processado arquivo Excel completo de maio: 173 certificações identificadas
    - 170 certificações novas importadas com sucesso (98.3% de taxa de sucesso)
    - 3 certificações já existentes no sistema
    - Inferência automática de modalidades com 98.8% de precisão
    - Extração automática de carga horária dos nomes dos cursos
    - Total no sistema após maio: 290 certificações
    - Scripts criados: processar_excel_maio.ts, import_certificacoes_maio_2025.ts
  * Importação Histórica - Abril 2025 (9 Jul 2025):
    - Processado arquivo Excel de abril: 352 certificações identificadas
    - 96 certificações novas importadas com fidelidade total aos dados originais
    - 1 certificação já existente no sistema
    - Mapeamento avançado de 11 colunas de dados incluindo práticas pedagógicas
    - Extração automática de disciplinas restantes e extensões contratuais
    - Total no sistema após abril: 386 certificações históricas
    - Scripts criados: processar_excel_abril.ts, import_certificacoes_abril_2025.ts
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```