# Deployment Guide - Library Kiosk System

## Quick Start (Supabase)

### 1. Create a Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Fill in project details:
   - Name: `library-kiosk`
   - Database Password: Choose a secure password
   - Region: Choose closest to your location
4. Wait for project to initialize (~2 minutes)

### 2. Get Your Supabase Credentials
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### 3. Update Your `.env` File
```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 4. Run Database Migrations

#### Option A: Using Supabase Dashboard (Easiest)
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database/migrations/001_create_tables.sql`
3. Click **Run**
4. Copy and paste `database/migrations/002_seed_data.sql`
5. Click **Run**

#### Option B: Using psql
```bash
# Install psql if not already installed
npm install -g pg

# Run migrations
psql "postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres" -f database/migrations/001_create_tables.sql
psql "postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres" -f database/migrations/002_seed_data.sql
```

### 5. Deploy to Production

#### Option A: Render (Recommended - Free)
1. Go to https://render.com and sign up
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PORT` (default: 5000)
5. Build command: `npm install && npm run build`
6. Start command: `node server/server.js`

#### Option B: Railway (Free)
1. Go to https://railway.app
2. Create new project
3. Connect repository
4. Add Supabase integration
5. Railway will auto-detect and configure

#### Option C: Vercel + Supabase
1. Deploy frontend to Vercel (free)
2. Deploy backend to Railway/Render
3. Configure CORS to allow Vercel domain

### 6. Update Client Code for Production

Update `src/main.jsx` to use your production URL:
```jsx
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = 'https://your-backend-url.com';
}
```

## Testing

### Local Testing with Supabase
```bash
# Update .env with your Supabase credentials
# Then run:
npm run dev
```

### Test the Kiosk
1. Go to http://localhost:5000
2. Try clocking in with student number `2024-001`
3. Verify it creates attendance record in Supabase

### Test Admin Panel
1. Go to http://localhost:5000/admin/login
2. Login with `admin` / `admin123`
3. View attendance logs and active sessions

## Production URL Configuration

After deployment, your system will be accessible at:
- **Kiosk**: `https://your-app.vercel.app` or `https://your-app.onrender.com`
- **Admin**: `https://your-app.vercel.app/admin` or `https://your-app.onrender.com/admin`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Your Supabase service role key |
| `PORT` | No | Server port (default: 5000) |

## Troubleshooting

### Connection Issues
- Check that your Supabase credentials are correct
- Verify environment variables are set in production
- Check CORS settings in Supabase dashboard

### Database Errors
- Run migrations again from SQL Editor
- Check table existence in Table Editor

### Login Failures
- Default admin credentials: `admin` / `admin123`
- If changed, you may need to reset via Supabase Auth

## Cost Estimate

### Supabase Free Tier
- 500MB database
- 2GB storage
- 2GB bandwidth/month
- **Perfect for small-to-medium school library**

### Backend Hosting
- **Render**: Free tier available
- **Railway**: Free tier available
- **Vercel**: Free for static sites

Total cost: **$0/month** for small-scale deployment!
