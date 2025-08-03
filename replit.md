# replit.md

## Overview

This is a full-stack web application designed as an intelligent customer service dashboard for educational institutions. It provides comprehensive tools for attendance management, productivity tracking, internal communication, CRM, and gamification. The platform aims to streamline operations, enhance student and faculty engagement, and offer robust analytics for informed decision-making within an educational environment. Key capabilities include real-time conversation management, lead tracking, goal setting, and academic certifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router DOM
- **UI Design System**: Radix UI primitives, "new-york" theme, mobile-first responsive design, Lucide React icons

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Session Management**: PostgreSQL session store

### Core Features
- **Authentication**: Mock authentication with role-based access control (admin, agent, student, professor).
- **Dashboard & Analytics**: Real-time metrics and interactive charts for attendance, productivity, and performance.
- **Student Support System**: Real-time conversation management, internal notes, conversation transfer, notification system.
- **Internal Chat**: Team-based and private messaging with real-time updates and notifications.
- **CRM System**: Kanban-style lead management, funnel views, lead assignment, integration with conversation system.
- **Gamification**: Goal setting, achievement tracking, reward system, performance rankings.
- **Attendance & Productivity Tracking**: Real-time presence monitoring, productivity metrics, reporting.
- **Academic Portals**: Dedicated portals for administrative, student, and professor roles with tailored functionalities (e.g., course management, content creation, certifications, payments).
- **SCORM Integration**: Native SCORM player for educational content.
- **Multi-Company Access**: Support for users managing multiple organizational units.
- **Voice Transcription**: Integration for transcribing audio into text fields within modals.

## External Dependencies

- **Database**: Neon (serverless PostgreSQL)
- **Payment Gateway**: Asaas (for payment processing and webhook integration)
- **Charts**: Recharts
- **Date Handling**: date-fns
- **UI Libraries**: Radix UI, shadcn/ui, Tailwind CSS
- **Form Management**: React Hook Form with Zod validation
- **Voice Recognition**: Web Speech API