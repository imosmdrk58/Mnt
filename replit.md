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

**Fixed "Content Not Found" Chapter Reader Issue (Current)**
- ✓ Fixed React Query endpoints: Updated chapter reader to use `/api/chapters/${chapterId}` instead of array format
- ✓ Corrected series navigation: Fixed series detail page to navigate to `/reader/${seriesId}/${chapterId}` instead of `/reader/${type}/${chapterId}`
- ✓ Removed authentication requirement: Chapter reading now works without login for public content
- ✓ Enhanced error handling: Added proper error logging for chapter and series fetch operations
- ✓ Fixed cache invalidation: Updated all reader-related query cache keys to use proper REST endpoint formats
- ✓ Verified API endpoints: Confirmed `/api/series/:id` and `/api/chapters/:id` return proper data structure
- ✓ Tested with real data: Reader page now successfully loads chapters with existing test content

**Previous Creator Series Management Fixes**
- ✓ Database setup: Created PostgreSQL database and pushed schema tables for authentication and content management
- ✓ Fixed React Query patterns: Updated series management page to use RESTful endpoints instead of query string parameters
- ✓ Corrected API calls: Changed `/api/series?id=...` to `/api/series/${seriesId}` for individual series data
- ✓ Applied fixes across components: Updated series management, reader pages, and comment sections

**Previous Series Detail Page Fixes**
- ✓ Fixed authentication logic: Series pages load without requiring login (uses optionalAuth)
- ✓ Corrected API endpoint calls: Now uses `/api/series/${id}/chapters` and `/api/series/${id}/reviews`
- ✓ Enhanced null-safety: Fixed series.type.charAt(0) with proper conditional checks
- ✓ Fixed author display: Shows author usernames instead of [object Object] navigation: Uses correct series type for reader URLs

**Database & Authentication Setup (Completed)**
- ✓ PostgreSQL database fully configured with comprehensive table schema
- ✓ Custom authentication system with username/password login and registration
- ✓ Session storage using PostgreSQL with automatic cleanup via indexed expiry
- ✓ All database tables created: users, sessions, series, chapters, comments, reviews, follows, bookmarks, transactions, groups, reading_progress
- ✓ Password encryption using scrypt with salt for security
- ✓ Complete CRUD operations implemented in DatabaseStorage class
- ✓ Authentication middleware with protected routes
- ✓ User registration with email/username uniqueness validation
- ✓ Database schema pushed successfully and application running

**Navigation & Creator Application System (Completed)**
- ✓ Enhanced navigation bar with proper menu items (Home, Browse, Library, Create/Become Creator)
- ✓ Created comprehensive "Become Creator" application page with form validation
- ✓ Added creator application API endpoint (/api/creator/apply) with user schema updates
- ✓ Implemented Browse page with advanced filtering and search capabilities
- ✓ Fixed all navigation component conflicts and consolidated into Layout component
- ✓ Added dynamic navigation based on user creator status
- ✓ Updated user schema to include creator application fields (display name, bio, portfolio, etc.)
- ✓ Clean, responsive navigation with theme toggle and centered search bar

**Database Setup & Authentication (Completed)**
- ✓ PostgreSQL database provisioned and configured with DATABASE_URL
- ✓ All 14 database tables created via `npm run db:push` (users, sessions, series, chapters, etc.)
- ✓ Custom authentication system fully implemented with Passport.js local strategy
- ✓ Session table with proper `idx_session_expire` index for automatic cleanup
- ✓ User registration/login endpoints tested and working with validation
- ✓ Password encryption using scrypt with salt for security
- ✓ All database relations properly configured with foreign keys
- ✓ Authentication tested: registration creates user, login works, sessions persist
- ✓ Test user created: testuser (ID: 555c9963-d43e-4c0b-b395-abf0828fb37d) properly configured
- ✓ Storage interface updated with session store integration

## Current Status

The platform is fully operational with comprehensive content management and user engagement features:

**Series Detail Pages**
- Complete series information display with author profiles
- Chapter listing and reader navigation functionality
- Review and comment system for user engagement
- Bookmark and follow functionality with proper authentication
- Reading progress tracking and continue reading features
- Multi-format support (webtoons, manga, novels) with type-specific readers

**Authentication & Users**
- Custom username/password authentication with Passport.js
- Secure password hashing using scrypt with salts
- Session storage in PostgreSQL with indexed cleanup
- User profiles with creator application fields
- Email and username uniqueness validation

**Content & Social Features**
- Multi-format content support (webtoons, manga, novels)
- Comprehensive social system (follows, bookmarks, comments, reviews)
- Monetization with coin transactions and premium content
- Group collaboration system with role-based permissions
- Reading progress tracking for personalized experience

**API Endpoints**
- Series management: `/api/series/:id` with populated author data
- Chapter management: `/api/series/:id/chapters` for series-specific chapters
- Review system: `/api/series/:id/reviews` with user information
- Authentication: All endpoints properly handle optional/required auth

The system is ready for full-scale content publishing and user engagement with robust error handling and user experience optimization.