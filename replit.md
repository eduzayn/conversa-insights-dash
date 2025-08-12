# replit.md

## Overview
This project is a comprehensive full-stack web application for educational institutions, providing an intelligent customer service dashboard. It integrates chat, attendance and productivity tracking, internal communication, CRM, and a gamification system. Its core purpose is to streamline student interaction management and optimize institutional operations, aiming to be a complete administrative solution for education.

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
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL session store

### UI/UX Design
- **Component Library**: Radix UI primitives with shadcn/ui
- **Design Style**: "new-york" theme, neutral base colors
- **Responsive Design**: Mobile-first approach
- **Icons**: Lucide React
- **User Experience**: Optimized for fluid navigation, minimal layout shifts, and discreet loading indicators.

### Core Features
- **Authentication**: Role-based access control (admin, agent) with session persistence.
- **Dashboard & Analytics**: Real-time metrics and interactive charts.
- **Student Support**: Real-time conversation management, notifications, and transfer.
- **Internal Chat**: Team-based and private messaging with real-time updates.
- **CRM System**: Kanban-style lead management with multiple funnel views.
- **Gamification**: Goal setting, achievement notifications, and reward system.
- **Attendance & Productivity Tracking**: Real-time presence and productivity metrics.
- **Academic Certifications**: Management, historical data import, and status tracking.
- **Financial Management**: Payment gateway integration, automated billing, and tracking.
- **Portals**: Dedicated professor and student portals.

### System Design Choices
- **Modularity**: Frontend components and server-side logic are organized into functional modules and domains.
- **Data Persistence**: Critical data fields are ensured to persist correctly through robust schema validation.
- **Code Quality**: Systematic removal of code duplications and conflicts.
- **Global Accessibility**: Optimized for worldwide access with PWA support, offline functionality, and robust health checks.
- **Security**: Implemented JWT-based authentication for Socket.io, fail-fast environment variable validation, prevention of token reuse, and configurable CORS whitelist with Helmet.
- **Performance**: Optimized React Query cache, implemented list virtualization for large datasets, and debounced search inputs.
- **Data Validation**: Centralized Zod validation for API routes and form data.
- **User Feedback**: Implemented optimistic updates for instant UI feedback on mutations.
- **Role-Based Access Control (RBAC)**: Simple authorization system with `rbac` middleware for administrative routes.
- **Input Validation Security**: Protection against parseInt silent failures with comprehensive Zod schemas for numeric parameters.
- **SPA Fallback Enhancement**: Proper handling of Single Page Application routing with correct API route exclusion and standardized error logging.

## External Dependencies
- **BotConversa**: Chat platform integration.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Asaas**: Payment gateway integration.
- **Browser APIs**: Notification API, Web Audio API, Web Speech API.
- **React Ecosystem**: React, React Router, React Query, React Hook Form.
- **UI Components**: Radix UI, Tailwind CSS.
- **Data Visualization**: Recharts.
- **Date Handling**: date-fns.