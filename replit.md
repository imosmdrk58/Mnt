# Webtoon Platform

## Overview
This platform is a full-scale web application for publishing and consuming Webtoons, Manga, and Novels. It aims to combine features from popular content platforms with a modern UI/UX, scalable architecture, and monetization via coins, ads, and premium access. The project's vision is to create a robust and engaging environment for both content creators and readers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: Radix UI primitives with custom Shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful API with Multer for file uploads
- **Database ORM**: Drizzle ORM
- **Authentication**: Custom Passport.js authentication with PostgreSQL session storage
- **Session Management**: Express sessions with connect-pg-simple

### Database Schema
PostgreSQL is used with entities including:
- **Users**: Authentication, profile, coins, creator status
- **Series**: Multi-format content (webtoon, manga, novel) with metadata
- **Chapters**: Individual content pieces with files/text, premium pricing
- **Social Features**: Comments, reviews, follows, bookmarks
- **Monetization**: Transactions, premium content unlock, coin system
- **Groups**: Collaborative content creation with role-based permissions
- **Progress Tracking**: Reading progress per user/series

### Key Components
- **Content Management System**: Supports webtoons (vertical scroll), manga (paged), and novels (text-based) with drag-and-drop uploads, an advanced markdown editor, scheduling, and content flagging (NSFW, premium).
- **Reader Experience**: Adaptive readers for each content type (infinite scroll for webtoon, page navigation for manga, customizable text reader for novel), automatic progress tracking, and customizable reading settings.
- **User Management**: Secure username/password authentication (scrypt), user profiles, coin system for premium content access, and integrated social features.
- **Creator Tools**: Dashboard for analytics, series management, format-specific upload workflows, and group collaboration features.

## External Dependencies

### Database
- **Neon Database**: PostgreSQL hosting
- **Connection**: @neondatabase/serverless for WebSocket-based connection

### Authentication
- **Passport.js**: For local username/password authentication
- **Scrypt**: For password hashing and security
- **connect-pg-simple**: For PostgreSQL-backed session storage

### File Storage
- **Multer**: For local filesystem file uploads (JPEG, PNG, WebP up to 10MB)

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

## Recent Changes

**CRITICAL Installation Loop and Database Table Fixes (COMPLETE - August 3, 2025)**
- ✓ Fixed Installation Loop Issue: Setup status now correctly updates to "installed" after successful installation
- ✓ Fixed Database Table Creation: All 18 tables (series, chapters, groups, comments, etc.) now get created during installation instead of just 2
- ✓ Enhanced Vercel API Function: Complete table creation in serverless environment without Drizzle CLI dependency
- ✓ Improved Cache Management: Reduced setup status cache duration from 30s to 5s for more responsive status checks
- ✓ Enhanced Frontend Polling: Aggressive status polling after installation completion to detect setup completion faster
- ✓ Complete Database Schema: All enums (series_type, series_status, chapter_status) and foreign key relationships properly created
- ✓ Proper Admin User Creation: Admin user with creator privileges properly inserted during installation
- ✓ Robust Error Handling: Better error messages and fallback handling for both local and Vercel environments

**Previous Vercel Deployment Fixes (COMPLETE - August 3, 2025)**
- ✓ Fixed Vercel Runtime Error: Updated vercel.json to use @vercel/node instead of deprecated nodejs18.x runtime
- ✓ Fixed Raw Code Display: Corrected Vercel configuration to serve from dist/public for static files
- ✓ Fixed Setup API 404/500 Error: Created Vercel serverless functions with ES modules and dynamic imports
- ✓ Added Individual API Endpoints: status.js, install.js, validate-db.js, test-current-db.js using export default
- ✓ Fixed Favicon 404: Added proper favicon.svg file and routing configuration
- ✓ Updated Vercel Routes: Specific routing for setup API endpoints and static assets
- ✓ Added Client-Side Setup Guard: Automatic redirect to /setup when setup is incomplete
- ✓ Enhanced Troubleshooting: Updated setup.md with comprehensive Vercel-specific troubleshooting steps
- ✓ Dependency Management: Added bcrypt for password hashing in serverless functions
- ✓ Fixed Method Not Allowed: Standardized API format between local server and Vercel functions
- ✓ Route Consistency: Both environments now use identical simplified API calls