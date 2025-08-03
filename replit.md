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
  * Otimiza workflow para casos de retorno de alunos com assunto diferente