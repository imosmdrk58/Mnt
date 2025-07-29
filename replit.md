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
- **Authentication**: Custom Passport.js authentication with PostgreSQL session storage
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple

### Database Schema
The application uses PostgreSQL with the following key entities:
- **Sessions**: Express session storage with `idx_session_expire` index for cleanup
- **Users**: Authentication (username/email/password), profile, coins, creator status
- **Series**: Multi-format content (webtoon, manga, novel) with metadata and relations
- **Chapters**: Individual content pieces with files/text, premium pricing
- **Social Features**: Comments (with replies), reviews, follows, bookmarks
- **Monetization**: Transactions, premium content unlock, coin system
- **Groups**: Collaborative content creation with role-based permissions
- **Progress Tracking**: Reading progress per user/series with percentage completion

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
- **Authentication**: Username/password with encrypted password storage (scrypt)
- **Registration**: Email + username validation with uniqueness checks
- **Profiles**: Creator and reader profiles with statistics
- **Monetization**: Coin system for premium content
- **Social Features**: Following, bookmarking, commenting, and reviews

### Creator Tools
- **Dashboard**: Analytics, series management, upload tools
- **Upload Interface**: Format-specific upload workflows
- **Analytics**: View counts, follower growth, earnings tracking
- **Group Collaboration**: Multi-creator project management

## Data Flow

1. **Authentication Flow**: Username/Password → Passport.js → Session creation → User profile setup
2. **Registration Flow**: Form validation → Uniqueness checks → Password hashing → User creation → Auto-login
3. **Content Creation**: Upload → Validation → Storage → Publishing
4. **Reading Flow**: Series discovery → Chapter selection → Reader interface → Progress tracking
5. **Social Interaction**: User actions → Database updates → Real-time updates
6. **Monetization**: Coin purchases → Premium content access → Creator payouts

## External Dependencies

### Database
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Connection**: WebSocket-based connection via @neondatabase/serverless

### Authentication
- **Custom Auth**: Passport.js with local strategy for username/password authentication
- **Password Security**: Scrypt-based password hashing with random salt generation
- **Session Storage**: PostgreSQL-backed session store with automatic table creation

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
- `SESSION_SECRET`: Session encryption key (defaults to 'your-secret-key' in development)

### Scalability Considerations
- Database connection pooling prevents connection exhaustion
- Session storage in PostgreSQL for horizontal scaling
- Static file serving can be moved to CDN for production
- API routes designed for caching and optimization

## Recent Changes

**Database Setup & Authentication (Current)**
- ✓ PostgreSQL database configured with full table schema
- ✓ Custom authentication system implemented with Passport.js
- ✓ Session table created with proper `idx_session_expire` index
- ✓ User registration/login endpoints working with validation
- ✓ Password encryption using scrypt with salt
- ✓ All database relations properly configured
- ✓ Storage interface updated with session store integration

## Current Status

The database is fully set up and the authentication system is working properly. All tables have been created with proper indexes and relationships. The system supports:

- User registration with unique username/email validation
- Secure password hashing and authentication
- PostgreSQL session storage with automatic cleanup
- Full CRUD operations for all content types
- Social features and monetization tracking

The architecture is designed to handle high traffic loads while maintaining good performance for content consumption and creation workflows.