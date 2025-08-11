# replit.md

## Overview

This is a full-stack web application for educational institutions, providing an intelligent customer service dashboard. It integrates chat functionality, attendance and productivity tracking, internal communication, CRM, and a gamification system with goals and rewards. The project aims to deliver a comprehensive solution for managing student interactions and institutional operations efficiently.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router DOM
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (using Neon)
- **Session Management**: PostgreSQL session store

### UI/UX Design
- **Component Library**: Radix UI primitives with shadcn/ui
- **Design Style**: "new-york" theme, neutral base colors
- **Responsive Design**: Mobile-first approach
- **Icons**: Lucide React

### Core Features
- **Authentication**: Mock authentication with roles (admin, agent), session persistence, role-based access control.
- **Dashboard & Analytics**: Real-time metrics, interactive charts for attendance, productivity, and performance.
- **Student Support**: Real-time conversation management, infinite scroll, internal notes, conversation transfer, notifications.
- **Internal Chat**: Team-based and private messaging, real-time updates, search, configurable notifications, audio messages.
- **CRM System**: Kanban-style lead management, multiple funnel views, lead assignment, integration with conversations.
- **Gamification**: Goal setting, achievement notifications, reward system, performance rankings.
- **Attendance & Productivity Tracking**: Real-time presence, productivity metrics, reporting.
- **Academic Certifications**: Management of various certification categories, historical data import, status tracking.
- **Financial Management**: Integration with payment gateways (Asaas), automated billing, payment status tracking, multi-company access.
- **Professor & Student Portals**: Dedicated portals for professors (content, evaluations) and students (courses, documents, support).

## External Dependencies

- **BotConversa**: Chat platform integration.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Asaas**: Payment gateway integration.
- **Browser APIs**: Notification API, Web Audio API (for sounds), Web Speech API (for voice transcription).
- **React Ecosystem**: React, React Router, React Query, React Hook Form.
- **UI Components**: Radix UI, Tailwind CSS.
- **Data Visualization**: Recharts.
- **Date Handling**: date-fns.

## Recent Changes

- August 1, 2025. CORREÇÃO DE TERMINOLOGIA FINANCEIRA
  * Alterado "Em dia" para "Pendente" na página de análises de certificações
  * Modificado em FINANCIAL_STATUS_LABELS para padronizar capitalização
  * Atualizado nos selects de criação e edição
  * Colaboradores não confundirão mais financeiro quitado com financeiro pendente
  * Padronização visual: "Pendente" (não "PENDENTE") igual aos outros status

- August 1, 2025. CORREÇÃO DE RATE LIMITING E AUTENTICAÇÃO
  * Corrigido erro 429 (Too Many Requests) causado por rate limiting muito restritivo
  * Aumentado limite de 150 para 1000 requisições por 15 minutos para IPs gerais
  * Implementado limite 10x mais permissivo (10.000 req/15min) para usuários autenticados
  * Corrigido erro TypeScript no useQuery removendo onError deprecated
  * Sistema de sessão persistente mantido e funcionando corretamente

- August 1, 2025. FUNCIONALIDADE DE DUPLICAR CERTIFICAÇÃO IMPLEMENTADA
  * Adicionado botão "Duplicar" (ícone Copy) na tabela de certificações
  * Função handleDuplicateCertification copia dados do aluno (nome, CPF, tutoria, etc.)
  * Limpa curso e carga horária para permitir nova seleção
  * Reseta status para pendente e usa categoria da aba atual
  * Adiciona observação indicando origem da duplicação
  * Abre modal de criação pré-preenchido para edição rápida
  * Otimiza workflow para alunos com múltiplas categorias de cursos

- August 3, 2025. SISTEMA COMPLETO DE FILTROS POR STATUS NO DASHBOARD DE NEGOCIAÇÕES
  * Implementado filtro visual e funcional por status para todas as categorias
  * Filtros específicos para Negociações (aguardando pagamento, recebido, acordo quebrado)
  * Filtros específicos para Expirados (pendente, enviada, aceita, rejeitada)
  * Filtros específicos para Quitações (quitado, aguardando pagamento)
  * Cards de métricas interativos funcionam como filtros clicáveis
  * Integração completa entre filtros de status e período de data
  * Interface reorganizada com status específicos por categoria
  * Indicadores visuais mostrando filtros ativos
  * Sistema unificado de "Limpar Todos os Filtros"
  * Dashboard agora filtra dados de todas as categorias simultaneamente

- August 3, 2025. FUNCIONALIDADE DE DUPLICAR ATENDIMENTOS IMPLEMENTADA
  * Adicionado botão "Duplicar" (ícone Copy) na tabela de atendimentos
  * Função handleDuplicateAtendimento copia dados do atendimento original
  * Duplicata criada com data e hora atuais automaticamente
  * Status resetado para "Em andamento" para nova classificação
  * Resultado CRM limpo para permitir nova avaliação
  * Observações identificam origem da duplicação
  * Preserva atendimento original sem alterações
  * Abre modal pré-preenchido para edição imediata dos dados
  * Título do modal adaptado para "Duplicar Atendimento"
  * Otimiza workflow para casos de retorno de alunos com assunto diferente

- August 3, 2025. CORREÇÕES DE SISTEMA
  * Corrigido sistema de logout com redirecionamento automático para login
  * Corrigido erro "response.json is not a function" no login do professor
  * Resolvido problema de dupla chamada response.json() que causava falha na autenticação
  * Sistema de logout agora limpa sessão completamente e redireciona corretamente

- August 5, 2025. CORREÇÃO CRÍTICA: BUG DE PERSISTÊNCIA DE DADOS NO MÓDULO DE CERTIFICAÇÕES
  * Corrigido bug onde campos TCC, Estágio e Práticas Pedagógicas não persistiam após salvar
  * Problema identificado no insertCertificationSchema que excluía campos importantes da validação
  * Schema alterado de .pick() para .omit() incluindo TODOS os campos da tabela
  * Outros campos como financeiro e documentação também foram corrigidos automaticamente
  * Sistema agora persiste corretamente todos os dados de certificação durante edição

- August 6, 2025. SISTEMA DE FILTROS APRIMORADO E CORREÇÃO DE BUG DE EXIBIÇÃO
  * Implementado sistema de filtros flexível com três tipos de data:
    - Data Prevista de Entrega (padrão)
    - Data Início Certificação  
    - Data de Entrega
  * Corrigido bug crítico na interface onde label "Data Início Certificação" mostrava valor de data_prevista
  * Interface reorganizada com 4 colunas de filtros para melhor usabilidade
  * Backend atualizado com parâmetro tipoData para filtrar por diferentes campos de data
  * Sistema agora permite filtrar com precisão por qualquer tipo de data específica
  * Removido filtro "Formato de Entrega" conforme solicitação do usuário

- August 6, 2025. REFATORAÇÃO COMPLETA DO MÓDULO DE CERTIFICAÇÕES EM COMPONENTES MODULARES
  * Arquivo Certificacoes.tsx original de 2.042 linhas dividido em componentes modulares
  * Hook customizado useCertifications.ts criado para centralizar lógica de API e mutations
  * Componente CertificationFilters.tsx para todos os filtros e busca
  * Componente CertificationCard.tsx para exibir cada certificação individual
  * Componente CertificationForm.tsx unificado para criar e editar certificações
  * Componente NewCourseDialog.tsx para modal de criação de novos cursos
  * Componente DuplicateAlert.tsx para alertas de certificações duplicadas
  * Componente CertificationPagination.tsx para controles de paginação
  * Mantida exatamente a mesma funcionalidade e aparência visual
  * Arquivo principal reduzido para 500+ linhas com melhor organização e manutenibilidade
  * Removida paginação duplicada, mantendo apenas na parte inferior conforme solicitado

- August 6, 2025. CORREÇÃO CRÍTICA DE UX/UI: ELIMINAÇÃO DE PISCADAS BRANCAS E LAYOUT SHIFTS
  * Sistema de cache otimizado do React Query (30s stale time, 5min garbage collection)
  * Placeholder data implementado para manter dados anteriores durante carregamento
  * Overlay de loading removido para evitar embaçamento da tela
  * Indicador de loading discreto no canto superior direito durante transições
  * Altura mínima dinâmica implementada (500px com dados, 300px sem dados)
  * Paginação condicional que só aparece quando há dados para mostrar
  * Layout shift corrigido com containers de altura consistente
  * Erro TypeScript de compatibilidade de tipos cargaHoraria resolvido
  * Sistema agora mantém UX fluida sem interrupções visuais durante navegação entre abas

- August 11, 2025. LIMPEZA SISTEMÁTICA E REFATORAÇÃO DO REPOSITÓRIO
  * Removidos arquivos obsoletos: certificado_teste.pdf (3x), ForceRefreshButton.tsx, cacheCleanup.ts, domErrorHandler.ts
  * Removido backup desnecessário: server/storage_backup.ts, Certificacoes-original.tsx (2042 linhas)
  * Removida pasta scripts vazia e arquivos temporários do sistema
  * Corrigido erro TypeScript no hook use-toast.ts (propriedade 'open' ausente)
  * Otimizado TOAST_REMOVE_DELAY de 1000000ms para 5000ms (16min para 5s)
  * Corrigido erro TypeScript no main.tsx (generics do Node.removeChild)
  * Mantidos arquivos essenciais: mockChatData.ts (usado no ChatContext), productionLogger.ts (usado no main.tsx)
  * Preservada funcionalidade do analisar_planilha.ts com apenas 1 arquivo Excel necessário
  * Sistema de toast consolidado e funcional entre toaster.tsx e use-toast.ts
  * Hooks de validação (useFormValidation) e CRUD (useCrudOperations) mantidos como utilitários centralizados

- August 11, 2025. REORGANIZAÇÃO COMPLETA DOS COMPONENTES FRONTEND E SERVIDOR
  * FRONTEND: Criadas 5 pastas organizacionais (/auth, /dashboard, /layout, /modals, /utils)
  * Movidos 12 componentes soltos para pastas apropriadas por funcionalidade
  * Atualizadas todas as importações automaticamente (15+ arquivos)
  * SERVIDOR: Criadas pastas /config e /lib para melhor organização
  * Movidos db.ts e vite.ts para /config, storage.ts para /lib, pdfService.ts para /services
  * Removido arquivo temporário routes_temp.ts
  * Atualizados todos os imports do servidor (7 arquivos)
  * Estrutura agora escalável e seguindo boas práticas de arquitetura
  * Sistema funcionando normalmente após reorganização completa

- August 11, 2025. REORGANIZAÇÃO COMPLETA DAS PÁGINAS POR DOMÍNIO FUNCIONAL
  * Criada pasta /auth centralizando todas as páginas de autenticação (5 arquivos)
  * Pasta /admin reorganizada de 22 arquivos soltos para 7 subpastas funcionais:
    - /core (dashboard, páginas base) - 2 arquivos
    - /academic (certificações, matrículas) - 4 arquivos
    - /operations (atendimentos, CRM, chat, presença) - 6 arquivos  
    - /reports (envios, negociações) - 3 arquivos
    - /settings (configurações, tokens, metas) - 3 arquivos
    - /integrations (Asaas) - 1 arquivo
    - /financial (cobrança) - 1 arquivo já organizado
  * Removidos 3 arquivos duplicados (*Fixed.tsx) do portal professor
  * App.tsx completamente reorganizado com imports agrupados por categoria
  * Redução de 100% na complexidade da pasta admin (22→0 arquivos na raiz)
  * Estrutura de páginas agora escalável e intuitiva por área de negócio

- August 11, 2025. LIMPEZA SISTEMÁTICA FINAL DE ARQUIVOS DESNECESSÁRIOS
  * Removidos 4 arquivos de documentação temporária (25KB+ liberados)
  * Removidas 5 imagens PNG não utilizadas de attached_assets
  * Limpeza de arquivos temporários (*.log, *.tmp) em todo projeto
  * Mantido apenas 1 arquivo Excel necessário em attached_assets
  * Preservados arquivos essenciais e funcionais do sistema
  * Projeto agora mais limpo e profissional com foco no código funcional
  * Sistema funcionando normalmente após limpeza completa

- August 11, 2025. ELIMINAÇÃO COMPLETA DE DUPLICAÇÕES DE CÓDIGO E CONFLITOS
  * Removidos componentes login duplicados (StudentLogin, ProfessorLogin) das pastas portal/professor
  * Resolvido conflito ChatArea renomeando para AtendimentoChatArea componente específico
  * Resolvido conflito Dashboard renomeando componente para AdminDashboard
  * Corrigido conflito productionLogger renomeando client para clientLogger
  * Atualizadas todas importações automaticamente (App.tsx, AtendimentoAluno.tsx, Dashboard.tsx, main.tsx)
  * Implementado optional chaining seguro no AdminDashboard para evitar erros TypeScript
  * Análise sistemática confirma ZERO duplicações restantes no projeto
  * Sistema de nomenclatura agora 100% específico e livre de conflitos
  * Arquitetura limpa com separação clara de responsabilidades estabelecida