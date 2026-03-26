# 🚀 Railway Quick Start Guide

## ⚠️ CRITICAL: Set These FIRST Before Deploying

Your deployment is failing because required environment variables are not set.

### Step 1: Add PostgreSQL Database (5 seconds)

1. Go to your Railway project dashboard
2. Click "+ New" → "Database" → "Add PostgreSQL"
3. Done! `DATABASE_URL` is automatically set

### Step 2: Set Required Environment Variables (1 minute)

Go to your service → "Variables" tab and add:

```bash
# Generate these secrets (run in terminal):
# openssl rand -base64 32

JWT_SECRET=paste-output-from-openssl-command-here
JWT_REFRESH_SECRET=paste-another-output-from-openssl-command-here

# Set environment
NODE_ENV=production

# Add your frontend URLs (comma-separated, no spaces)
ALLOWED_ORIGINS=https://your-admin.railway.app,https://your-storefront.railway.app
```

### Step 3: Add Redis (Optional but Recommended)

1. Click "+ New" → "Database" → "Add Redis"
2. Done! `REDIS_URL` is automatically set

**Note:** Redis is optional. Your app will work without it, but you'll miss:

- Caching (slower API responses)
- Real-time updates (no live inventory sync)

### Step 4: Run Database Migrations

After deploying with environment variables set:

```bash
railway run npx prisma migrate deploy
```

OR in Railway dashboard:

- Go to your service → Settings → Deploy
- Add command: `npx prisma migrate deploy`

## ✅ Verify Deployment

1. Check logs for:
   - ✅ `Server running on 0.0.0.0:PORT`
   - ✅ `Database connected`

2. Test health endpoint:

   ```
   https://your-service.railway.app/health
   ```

   Should return:

   ```json
   {
     "status": "healthy",
     "services": {
       "database": "connected",
       "redis": "connected"
     }
   }
   ```

## 🐛 Still Getting Errors?

### "DATABASE_URL not found"

- ✅ Add PostgreSQL database in Railway
- ✅ Redeploy after adding database

### "JWT_SECRET not found"

- ✅ Set `JWT_SECRET` in Variables tab
- ✅ Generate with: `openssl rand -base64 32`

### Redis connection errors (but app works)

- ℹ️ This is OK if Redis is not added
- ✅ Add Redis plugin to remove errors

### Health check fails

- ✅ Wait 2-3 minutes for first deploy
- ✅ Check DATABASE_URL is set
- ✅ Check logs for actual error

## 📝 Commands Reference

```bash
# Generate JWT secrets
openssl rand -base64 32

# Run migrations
railway run npx prisma migrate deploy

# Check service status
railway status

# View logs
railway logs

# Link to service
railway link
```

## 🎯 Current Error Fix

Your logs show:

1. ❌ `DATABASE_URL` not found → Add PostgreSQL plugin
2. ⚠️ Redis errors → Optional, add Redis plugin to remove

After adding PostgreSQL, your service will deploy successfully!
