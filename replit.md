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
  * Alterado "Em dia" para "PENDENTE" na página de análises de certificações
  * Modificado em FINANCIAL_STATUS_LABELS (linha 88) 
  * Atualizado nos selects de criação (linha 959) e edição (linha 1768)
  * Colaboradores não confundirão mais financeiro quitado com financeiro pendente