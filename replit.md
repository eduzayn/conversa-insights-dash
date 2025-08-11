# replit.md

## Overview
This project is a comprehensive full-stack web application designed for educational institutions. It provides an intelligent customer service dashboard, integrating chat functionality, attendance and productivity tracking, internal communication, CRM, and a gamification system. The core purpose is to streamline student interaction management and optimize institutional operations, aiming to be a complete solution for educational administrative needs.

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
- **Dashboard & Analytics**: Real-time metrics and interactive charts for operational insights.
- **Student Support**: Real-time conversation management, notifications, and conversation transfer.
- **Internal Chat**: Team-based and private messaging with real-time updates and search.
- **CRM System**: Kanban-style lead management with multiple funnel views and lead assignment.
- **Gamification**: Goal setting, achievement notifications, and a reward system.
- **Attendance & Productivity Tracking**: Real-time presence and productivity metrics.
- **Academic Certifications**: Management, historical data import, and status tracking of certifications.
- **Financial Management**: Integration with payment gateways, automated billing, and payment tracking.
- **Portals**: Dedicated professor and student portals for content, evaluations, and support.

### System Design Choices
- **Modularity**: Frontend components and server-side logic are organized into functional modules and domains for scalability and maintainability.
- **Data Persistence**: Critical data fields are ensured to persist correctly through robust schema validation.
- **Code Quality**: Systematic removal of code duplications and conflicts for a cleaner and more maintainable codebase.

## External Dependencies
- **BotConversa**: Chat platform integration.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Asaas**: Payment gateway integration.
- **Browser APIs**: Notification API, Web Audio API, Web Speech API.
- **React Ecosystem**: React, React Router, React Query, React Hook Form.
- **UI Components**: Radix UI, Tailwind CSS.
- **Data Visualization**: Recharts.
- **Date Handling**: date-fns.