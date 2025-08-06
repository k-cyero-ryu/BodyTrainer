# My Body Trainer Manager

## Overview

My Body Trainer Manager is a comprehensive fitness management platform that connects personal trainers with their clients through a responsive, multi-lingual web application. The system enables trainers to manage client relationships, create customized training plans, track progress, and communicate directly with clients. It supports multiple user roles (SuperAdmin, Trainer, Client) with role-based access control and features real-time communication, exercise management, progress tracking, and monthly evaluations.

## Recent Changes

**January 6, 2025** - Complete Client Training Plan Portal System
- **Client Navigation**: Added "My Training Plans" menu item for clients separate from trainer training plans
- **Client Training Plans Page**: New dedicated page (`/my-training-plans`) showing assigned plans with full details
- **Client Training Plan Detail**: New detailed view (`/my-training-plan/:planId`) showing complete exercise schedule by day
- **Dashboard Integration**: Updated client dashboard links to use client-specific training plan routes
- **Role-Based Access**: Proper role separation - clients access their own training plan views, trainers access management views
- **Enhanced Display**: Shows duration, week cycle, nutrition info, and organized daily exercise schedules
- **System Status**: Clients now have complete access to view their training plans and exercises independently

**January 6, 2025** - Enhanced Training Plan Duration and Cycle System
- **Database Schema**: Added `weekCycle` field to training plans table to distinguish between plan duration and exercise pattern cycle
- **Duration Logic**: Duration can now be fixed weeks (4, 6, 8, 12, 16, 24) or "till goal is met" (stored as 0)
- **Week Cycle**: Separate field for exercise pattern repetition (1-4 weeks before cycling back)
- **Form Enhancement**: Updated training plan creation form with separate duration and week cycle dropdowns
- **Display Updates**: Training plan cards now show both duration ("Till goal is met" or "X weeks") and week cycle pattern
- **API Enhancement**: Client dashboard displays calculated sessions per week based on actual workout days from plan_exercises table
- **System Status**: Training plans now properly distinguish between total plan length and exercise pattern cycles

**January 6, 2025** - Fixed Client Payment Plan Display
- **Field Mapping**: Fixed payment plan display to use correct database fields (amount, type, features)
- **Features Display**: Payment plan features now properly display as badges from database array
- **Sessions Removal**: Removed incorrect sessions display from payment plan (moved to training plan section)
- **Real Data Integration**: Client dashboard now shows authentic payment plan data with proper pricing and feature information
- **System Status**: Payment plan section displays correctly with price, billing type, and feature badges

**January 5, 2025** - Implemented Training Plan Assignment System
- **Feature Added**: Training plan assignment functionality moved from training plan cards to client detail pages
- **UI Enhancement**: Added "Assign Plan" button to client detail page header with blue styling
- **Modal Interface**: Created assignment modal with training plan selection dropdown and date picker
- **Backend Integration**: Connected to existing API routes (`/api/client-plans`) and database schema (`clientPlans` table)
- **Date Calculation**: Automatic end date calculation based on plan duration (weeks × 7 days)
- **Validation**: Added proper form validation and error handling with user feedback
- **System Status**: Trainers can now assign training plans to clients from the client detail page

**January 5, 2025** - Fixed Critical Trainer Referral System
- **Issue Resolved**: Route ordering conflict where `/api/trainers/:id` was intercepting `/api/trainers/clients` requests
- **Solution Applied**: Reordered Express routes to place specific routes before parameterized routes
- **System Status**: Trainer referral code system now fully functional with proper URL generation
- **Verified Working**: Trainers can successfully generate and share referral URLs with code TR42176306

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: i18next for multi-language support (English, Spanish, French, Portuguese)
- **File Uploads**: Uppy with AWS S3 integration for media file handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with WebSocket support for real-time chat functionality
- **Authentication**: Replit's OIDC-based authentication system with session management
- **Middleware**: Custom logging, error handling, and authentication middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **File Storage**: Google Cloud Storage with custom ACL (Access Control List) system for secure file management
- **Database Schema**: Comprehensive schema supporting users, trainers, clients, training plans, exercises, evaluations, chat messages, and progress tracking

### Authentication and Authorization
- **Provider**: Replit's OpenID Connect (OIDC) authentication
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Role-Based Access Control**: Three-tier permission system (SuperAdmin, Trainer, Client)
- **Authorization Middleware**: Route-level protection with role-based access validation

### External Dependencies
- **Cloud Services**: 
  - Neon Database for PostgreSQL hosting
  - Google Cloud Storage for file storage
  - Replit's authentication service
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Development Tools**: 
  - Vite for fast development and building
  - Replit-specific plugins for development environment integration
- **File Upload**: Uppy dashboard with AWS S3 multipart upload support
- **Real-time Communication**: WebSocket implementation for chat functionality
- **Monitoring**: Custom request logging and error tracking middleware

The architecture follows a monorepo structure with shared TypeScript schemas between client and server, ensuring type safety across the full stack. The system is designed for scalability with serverless database hosting and cloud-based file storage, while maintaining real-time capabilities through WebSocket connections.