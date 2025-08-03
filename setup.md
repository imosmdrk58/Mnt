# Webtoon Platform Setup Guide

## Overview

This is a comprehensive guide for setting up and deploying your Webtoon/Manga/Novel publishing platform. The platform supports multiple content formats, user authentication, premium content, and monetization features.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon, Supabase, or self-hosted)
- Optional: Stripe account for payment processing

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

The platform supports multiple PostgreSQL providers:

**Option A: Neon Database (Recommended)**
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy your connection string (starts with `postgresql://`)

**Option B: Supabase**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings > Database
4. Copy your connection string

**Option C: Self-hosted PostgreSQL**
- Ensure your PostgreSQL server is accessible
- Format: `postgresql://username:password@host:port/database`

### 3. Run Setup

```bash
npm run dev
```

Navigate to `/setup` in your browser and complete the installation wizard:

1. **Database Configuration**: Enter your PostgreSQL connection string
2. **Admin Account**: Create your administrator account
3. **Site Settings**: Configure site name and branding
4. **Stripe Integration** (Optional): Add payment processing
5. **Logo & Branding** (Optional): Upload site logo and favicon

### 4. Post-Setup

After completing setup:
- Your admin account will be created with creator privileges
- Database tables will be automatically created
- The platform will be ready for content creation

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database operations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:generate      # Generate database migrations

# Production server
npm start
```

## Environment Variables

The setup process automatically configures these variables:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=automatically_generated
STRIPE_SECRET_KEY=your_stripe_secret_key (if configured)
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key (if configured)
```

## Deployment Options

### Deploy to Vercel

#### Prerequisites
- Vercel account (free tier available)
- Git repository with your project
- Database setup completed (Neon, Supabase, etc.)

#### Step 1: Prepare Your Project

1. **Ensure your project is in a Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub/GitLab/Bitbucket:**
   ```bash
   # For GitHub:
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

3. **Build locally to test:**
   ```bash
   npm run build
   ```
   Make sure this completes without errors.

#### Step 2: Deploy to Vercel

**Option A: Deploy via Vercel Dashboard (Recommended)**

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Add New Project"**
3. **Import your Git repository:**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository
   - Click "Import"

4. **Configure project settings:**
   - **Framework Preset:** Select "Other" or "Vite"
   - **Root Directory:** `.` (leave as default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Click "Deploy"** - This first deployment will likely fail due to missing environment variables

**Option B: Deploy with Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory:**
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - Choose "yes" to link to existing project or create new one

#### Step 3: Configure Environment Variables

1. **In Vercel Dashboard, go to your project**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables:**

   **Required Variables:**
   - **Name:** `DATABASE_URL`
     - **Value:** Your PostgreSQL connection string
     - **Environment:** Production, Preview, Development
   
   - **Name:** `SESSION_SECRET`
     - **Value:** A secure random string (generate with: `openssl rand -base64 32`)
     - **Environment:** Production, Preview, Development

   **Optional Variables (if using Stripe):**
   - **Name:** `STRIPE_SECRET_KEY`
     - **Value:** Your Stripe secret key (starts with `sk_`)
     - **Environment:** Production, Preview, Development
   
   - **Name:** `VITE_STRIPE_PUBLIC_KEY`
     - **Value:** Your Stripe publishable key (starts with `pk_`)
     - **Environment:** Production, Preview, Development

4. **Click "Save" for each variable**

#### Step 4: Configure Vercel Project Settings

The `vercel.json` file has been automatically created in your project root with the correct configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["dist/**"]
      }
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

This configuration:
- Uses the correct `@vercel/node` builder for serverless functions
- Builds both the server and static files properly
- Routes API calls (`/api/*`) to your Express server
- Serves static files from the `dist` directory
- Includes the frontend build files in the server function

#### Step 5: Redeploy with Environment Variables

1. **Trigger a new deployment:**
   - **Via Dashboard:** Go to Deployments tab → Click "Redeploy" on latest deployment
   - **Via CLI:** Run `vercel --prod` in your project directory
   - **Via Git:** Push any change to your repository

2. **Monitor the deployment:**
   - Watch the build logs in Vercel dashboard
   - Check for any build errors or warnings

#### Step 6: Post-Deployment Setup

1. **Access your deployed application:**
   - Your app will be available at `https://your-project-name.vercel.app`
   - Vercel provides the URL in the deployment success message

2. **Complete the setup process:**
   - Navigate to `https://your-project-name.vercel.app/setup`
   - Enter your database connection string
   - Create your admin account
   - Configure site settings

3. **Test key functionality:**
   - User registration and login
   - Content creation and viewing
   - File uploads (if applicable)
   - Database operations

#### Step 7: Custom Domain (Optional)

1. **In Vercel Dashboard → Settings → Domains**
2. **Add your custom domain**
3. **Configure DNS records as instructed by Vercel**
4. **SSL certificates are automatically provisioned**

#### Troubleshooting Vercel Deployment

**Runtime Version Error:**
If you see "Function Runtimes must have a valid version", your `vercel.json` file needs to be updated:
- Delete the old `vercel.json` file
- Use the corrected configuration provided above (uses `@vercel/node` instead of `nodejs18.x`)
- Redeploy your project

**Build Failures:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally

**Database Connection Issues:**
- Verify `DATABASE_URL` is correctly set
- Ensure your database allows connections from Vercel IPs
- For Neon: Enable "Allow connections from any IP"

**Function Timeout:**
- Serverless functions have execution limits (10s on free plan)
- Consider upgrading to Pro plan for longer timeouts
- Optimize database queries for faster response times

**Environment Variable Issues:**
- Variables must be set for all environments (Production, Preview, Development)
- VITE_ prefixed variables are exposed to the frontend
- Redeploy after adding new environment variables

**Static File Issues:**
- Ensure `npm run build` creates files in `dist` directory
- Check that `vercel.json` routes are correctly configured
- Verify static assets are properly referenced in your code

**Environment Variable Issues:**
- Variables must be set for all environments (Production, Preview, Development)
- VITE_ prefixed variables are exposed to the frontend
- Redeploy after adding new environment variables

**Static File Issues:**
- Ensure `npm run build` creates files in `dist` directory
- Check that `vercel.json` routes are correctly configured
- Verify static assets are properly referenced in your code

### Deploy to Netlify

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure environment variables in Netlify dashboard:**
   - Same variables as Vercel

5. **Netlify configuration** (`netlify.toml`):
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [functions]
     directory = "server"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/server/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Deploy to Railway

1. **Connect your repository to Railway**
2. **Set environment variables:**
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY` (optional)
   - `VITE_STRIPE_PUBLIC_KEY` (optional)

3. **Railway will automatically deploy using:**
   ```bash
   npm install
   npm run build
   npm start
   ```

### Deploy to Render

1. **Create a new Web Service on Render**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Environment Variables:** Same as above

## Database Management

### Schema Updates

When you modify the database schema:

```bash
# Push changes to development database
npm run db:push

# Generate migration files (for production)
npm run db:generate
```

### Database Studio

Access your database with a GUI:

```bash
npm run db:studio
```

This opens Drizzle Studio at `https://local.drizzle.studio`

## Content Management

### Creating Content

1. **Login as admin**
2. **Navigate to Create section**
3. **Choose content type:**
   - **Webtoon**: Vertical scrolling format with image uploads
   - **Manga**: Traditional page-based format
   - **Novel**: Text-based with markdown support

### Series Management

- Upload cover images and series metadata
- Manage chapters and publishing schedule
- Set premium pricing for monetization
- Track analytics and reader engagement

## User Features

### Authentication
- Username/password registration and login
- Email verification support
- Password reset functionality

### Reading Experience
- Format-specific readers (webtoon, manga, novel)
- Reading progress tracking
- Bookmarking and library management
- Social features (comments, reviews, follows)

### Monetization
- Coin-based premium content system
- Stripe integration for payments
- Creator revenue tracking

## Customization

### Theming
- Light/dark mode support
- Customizable CSS variables in `client/src/index.css`
- Logo and branding configuration

### Features
- Configure site settings in admin panel
- Enable/disable specific features
- Customize user permissions and roles

## Security

### Production Considerations
- Use strong `SESSION_SECRET`
- Enable HTTPS in production
- Configure CORS appropriately
- Regular database backups
- Monitor for security updates

### Database Security
- Use connection pooling for scalability
- Implement proper access controls
- Regular security audits

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify connection string format
- Check database server accessibility
- Ensure proper SSL configuration for cloud databases

**Setup Page Not Loading**
- Clear browser cache
- Check server logs for errors
- Verify all dependencies are installed

**Stripe Integration Issues**
- Verify API keys are correct
- Check Stripe dashboard for webhook configuration
- Ensure HTTPS is enabled for production

**File Upload Problems**
- Check file size limits (default: 10MB)
- Verify supported formats (JPEG, PNG, WebP)
- Ensure proper write permissions

### Getting Help

1. Check server logs: `npm run dev` shows real-time logs
2. Database issues: Use `npm run db:studio` to inspect data
3. API testing: Use browser dev tools to check network requests

## License

This platform is open source and available under the MIT License.

---

For additional support or questions, refer to the project documentation or create an issue in the repository.