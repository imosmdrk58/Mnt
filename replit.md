# Webtoon Platform - replit.md

## Overview

This is a full-scale, production-ready web platform for publishing and consuming Webtoons, Manga, and Novels. The platform combines the best features of Tapas, MangaDex, and Webtoon with modern UI/UX, scalable architecture, and monetization features through coins, ads, and premium access.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI primitives with custom Shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API**: RESTful API with file upload support via Multer
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database Schema
The application uses PostgreSQL with the following key entities:
- **Users**: Authentication, profile, coins, creator status
- **Series**: Multi-format content (webtoon, manga, novel) with metadata
- **Chapters**: Individual content pieces with files/text
- **Social Features**: Comments, reviews, follows, bookmarks
- **Monetization**: Transactions, premium content, coin system
- **Groups**: Collaborative content creation
- **Progress Tracking**: Reading progress per user/series

## Key Components

### Content Management System
- **Multi-format Support**: Handles webtoons (vertical scroll), manga (paged), and novels (text-based)
- **Upload System**: Drag-and-drop interface with file validation and quality checks
- **Editor**: Advanced markdown editor for novels with live preview
- **Scheduling**: Chapter publishing with preview capabilities
- **Content Flags**: NSFW, premium, and language tagging

### Reader Experience
- **Adaptive Readers**: Specialized readers for each content type
  - Webtoon: Infinite scroll with image preloading
  - Manga: Page navigation with zoom controls
  - Novel: Customizable text reader with auto-scroll
- **Progress Tracking**: Automatic save points and continue reading
- **Settings**: Customizable reading preferences per format

### User Management
- **Authentication**: Replit OAuth integration
- **Profiles**: Creator and reader profiles with statistics
- **Monetization**: Coin system for premium content
- **Social Features**: Following, bookmarking, commenting, and reviews

### Creator Tools
- **Dashboard**: Analytics, series management, upload tools
- **Upload Interface**: Format-specific upload workflows
- **Analytics**: View counts, follower growth, earnings tracking
- **Group Collaboration**: Multi-creator project management

## Data Flow

1. **Authentication Flow**: Replit OAuth → Session creation → User profile setup
2. **Content Creation**: Upload → Validation → Storage → Publishing
3. **Reading Flow**: Series discovery → Chapter selection → Reader interface → Progress tracking
4. **Social Interaction**: User actions → Database updates → Real-time updates
5. **Monetization**: Coin purchases → Premium content access → Creator payouts

## External Dependencies

### Database
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Connection**: WebSocket-based connection via @neondatabase/serverless

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Storage**: PostgreSQL-backed session store

### File Storage
- **Local Storage**: Multer-based file uploads to local filesystem
- **File Types**: Support for JPEG, PNG, WebP images up to 10MB

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **API Proxy**: Express server serving both API and static files
- **Database**: Direct connection to Neon PostgreSQL

### Production Build
- **Frontend**: Vite builds React app to static files
- **Backend**: ESBuild bundles Express server
- **Database**: Connection pooling for scalability
- **File Serving**: Express static file serving for uploads

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OAuth provider URL

### Scalability Considerations
- Database connection pooling prevents connection exhaustion
- Session storage in PostgreSQL for horizontal scaling
- Static file serving can be moved to CDN for production
- API routes designed for caching and optimization

The architecture is designed to handle high traffic loads while maintaining good performance for content consumption and creation workflows.