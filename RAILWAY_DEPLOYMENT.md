# Railway Deployment Checklist

## ✅ Files Updated

- [x] `backend/railway.toml` - Railway configuration
- [x] `backend/src/server.js` - Bind to 0.0.0.0
- [x] `backend/src/api/app.js` - Enhanced health check
- [x] `.github/workflows/backend-ci.yml` - Fixed deployment command
- [x] `backend/.env.railway` - Environment variables guide

## 🔧 Railway Dashboard Setup

### 1. Database (PostgreSQL)

- [ ] Add PostgreSQL plugin to your Railway project
- [ ] Database will automatically provide `DATABASE_URL`

### 2. Redis (Optional but recommended)

- [ ] Add Redis plugin to your Railway project
- [ ] Redis will automatically provide `REDIS_URL`

### 3. Environment Variables

Set these in Railway dashboard → Variables:

**Required:**

- [ ] `JWT_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `JWT_REFRESH_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `NODE_ENV` - Set to: `production`
- [ ] `ALLOWED_ORIGINS` - Your frontend URLs (comma-separated)

**Optional:**

- [ ] `SMTP_*` - Email service credentials (if using email)
- [ ] `RAZORPAY_*` - Payment gateway credentials (if using payments)

### 4. Service Configuration

- [ ] Root directory: `backend`
- [ ] Build command: `npm install && npx prisma generate`
- [ ] Start command: `npm start`
- [ ] Health check path: `/health`

### 5. GitHub Integration

- [ ] Add `RAILWAY_TOKEN` to GitHub Secrets
- [ ] Add `RAILWAY_SERVICE_ID` to GitHub Secrets (optional)
- [ ] Enable automatic deployments from `main` branch

## 🚀 Post-Deployment

### 1. Run Migrations

```bash
railway run --service backend npx prisma migrate deploy
```

OR in Railway dashboard:

- Go to Settings → Deploy → Add deployment trigger
- Command: `npx prisma migrate deploy`

### 2. Test Endpoints

- Health check: `https://your-backend.railway.app/health`
- API: `https://your-backend.railway.app/api/v1`

### 3. Verify Logs

- Check Railway logs for:
  - ✅ Server running on 0.0.0.0:PORT
  - ✅ Database connected
  - ✅ No errors during startup

## 🐛 Troubleshooting

### Health Check Fails

- ✅ Check server binds to `0.0.0.0` not `localhost`
- ✅ Verify `PORT` env var is used correctly
- ✅ Check database connection isn't blocking startup

### Database Connection Issues

- ✅ Verify PostgreSQL plugin is added
- ✅ Check `DATABASE_URL` exists in variables
- ✅ Run migrations: `railway run npx prisma migrate deploy`

### CORS Errors

- ✅ Add frontend URL to `ALLOWED_ORIGINS`
- ✅ Ensure URL doesn't have trailing slash

### Service Unavailable

- ✅ Check logs for startup errors
- ✅ Verify all required env vars are set
- ✅ Test health check returns 200

## 📝 Changes Made

### Server Binding Fix

Before: `app.listen(PORT)`
After: `app.listen(PORT, "0.0.0.0")`

### Database Connection

- Changed to non-blocking in production
- Won't crash if DB temporarily unavailable

### Health Check Enhancement

- Now checks database connectivity
- Returns 503 if services degraded
- Provides detailed service status

### Railway Config

- Increased health check timeout to 300s
- Optimized restart policy
- Proper build and start commands
