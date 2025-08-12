# replit.md

## Overview
This project is a comprehensive full-stack web application designed for educational institutions. It provides an intelligent customer service dashboard, integrating chat functionality, attendance and productivity tracking, internal communication, CRM, and a gamification system. The core purpose is to streamline student interaction management and optimize institutional operations, aiming to be a complete solution for educational administrative needs.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Issues Resolved
- **Global Accessibility & Scalability (Aug 2025)**: Complete optimization for worldwide access without restrictions
  - Issue: System needed to be accessible globally from any network, browser, or device type
  - Solution: Implemented comprehensive accessibility improvements:
    - Added universal CORS headers and global security headers in `server/index.ts`
    - Enhanced HTML with international meta tags, PWA support, and responsive viewport
    - Created Service Worker (`client/public/sw.js`) for offline functionality
    - Added PWA manifest (`client/public/manifest.json`) for mobile app-like experience
    - Optimized Socket.IO for multiple transports and global compatibility
    - Implemented fallback loading states and offline page
    - Enhanced health checks for robust deployment on Replit Autoscale
  - System now supports: global access, offline mode, PWA installation, mobile optimization
  - Performance optimized: Critical CSS inlined, Service Worker caching, robots.txt for SEO
  - Universal compatibility: Tested with desktop, mobile, IE, external origins - all working perfectly
  - Production ready: All health checks working, proper routing in prod vs dev environments

- **Academic Management System (Aug 2025)**: Complete implementation of academic course and professor management
  - Issue: Missing API routes for academic modules, token authentication problems, and lack of deletion functionality
  - Solution: Added complete CRUD routes for courses/disciplines/professors in `server/routes.ts`
  - Fixed authentication token handling in `client/src/lib/queryClient.ts` for proper header merging
  - Implemented `deleteAcademicProfessor` method in storage with integrity checks
  - Added confirmation dialogs for deletion operations to prevent accidental removals
  - System now properly manages 942+ certifications with data integrity protection

- **Rate Limiting Problem (Aug 2025)**: Resolved critical 429 "Too Many Requests" errors that were preventing server startup
  - Issue: Rate limiter was too restrictive (100 requests for non-authenticated users)
  - Solution: Disabled rate limiting in development environment in `server/middleware/errorHandler.ts`
  - Server now runs correctly on port 3001 without authentication blocking

- **API Route Standardization (Aug 2025)**: Unified pre-registered courses API routes to prevent future conflicts
  - Issue: Frontend using `/api/cursos-pre-cadastrados` while backend had `/api/pre-registered-courses`
  - Solution: Standardized all routes to use `/api/pre-registered-courses` across frontend and backend
  - Removed duplicate legacy routes to maintain single source of truth
  - System now has consistent API naming throughout the application

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