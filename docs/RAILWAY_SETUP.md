# Railway Setup Guide

Step-by-step guide to set up Annie's Health Journal on Railway with tag-based deployments.

> **⚠️ Important**: This project uses **Dockerfile-based builds** (not Nixpacks). Railway will automatically detect the Dockerfiles in `backend/` and `frontend/` directories. Ensure the **Root Directory** is set correctly for each service.

## Prerequisites

- [x] GitHub repository with Annie's Health Journal code
- [ ] Railway account (https://railway.app)
- [ ] GitHub account connected to Railway

## Initial Setup

### 1. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `lawrab/annies-health-journal` repository
5. Railway detects the monorepo structure

### 2. Create MongoDB Service

1. In Railway project, click **"New Service"**
2. Select **"Database"** → **"MongoDB"**
3. Railway provisions MongoDB instance
4. Note: `MONGO_URL` variable is automatically created

### 3. Create Backend Service

1. Click **"New Service"** → **"GitHub Repo"**
2. Select `lawrab/annies-health-journal` repository
3. **Configure service**:
   - Service name: `backend`
   - **Root directory**: `backend` ⚠️ **CRITICAL - Must be set in Settings → Source**
   - **Builder**: Dockerfile (auto-detected from `backend/Dockerfile`)
   - Build and start commands are defined in the Dockerfile

4. **Set environment variables**:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=<GENERATE_STRONG_SECRET>
   ALLOWED_ORIGINS=https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
   OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
   LOG_LEVEL=info
   MAX_FILE_SIZE=10485760
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **Note on Transcription Service**:
   - Set `OPENAI_API_KEY` to use OpenAI Whisper API (recommended for production)
   - If `OPENAI_API_KEY` is not set, app will try to use local faster-whisper-server (development only)
   - Get your API key from: https://platform.openai.com/api-keys

5. **Configure deployment triggers**:
   - Go to service **Settings** → **Triggers**
   - **Disable** "Deploy on every commit to main"
   - **Enable** "Deploy on git tags"
   - Pattern: `v*` (deploys on any tag starting with 'v')

6. **Set up health check** (optional - auto-detected from Dockerfile):
   - Go to **Settings** → **Health Check**
   - Path: `/health`
   - Timeout: 100 seconds
   - Note: The backend Dockerfile includes a HEALTHCHECK instruction

### 4. Create Frontend Service

1. Click **"New Service"** → **"GitHub Repo"**
2. Select `lawrab/annies-health-journal` repository
3. **Configure service**:
   - Service name: `frontend`
   - **Root directory**: `frontend` ⚠️ **CRITICAL - Must be set in Settings → Source**
   - **Builder**: Dockerfile (auto-detected from `frontend/Dockerfile`)
   - Build and start commands are defined in the Dockerfile

4. **Set environment variables**:
   ```env
   VITE_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
   VITE_ENV=production
   VITE_ENABLE_VOICE_RECORDING=true
   VITE_ENABLE_NOTIFICATIONS=true
   ```

5. **Configure deployment triggers**:
   - Go to service **Settings** → **Triggers**
   - **Disable** "Deploy on every commit to main"
   - **Enable** "Deploy on git tags"
   - Pattern: `v*`

### 5. Generate JWT Secret

**IMPORTANT**: Use a strong random secret for JWT_SECRET

```bash
# Generate secure random string (32 characters)
openssl rand -base64 32
```

Copy the output and set as `JWT_SECRET` in backend service.

## Verify Setup

### Check Service Configuration

**Backend**:
- [x] Root directory: `backend`
- [x] Build command set
- [x] Start command set
- [x] Health check enabled at `/health`
- [x] Tag-based deployment enabled
- [x] All environment variables set
- [x] MONGODB_URI references MongoDB service

**Frontend**:
- [x] Root directory: `frontend`
- [x] Build command set
- [x] Start command set
- [x] Tag-based deployment enabled
- [x] VITE_API_URL references backend service

**MongoDB**:
- [x] Service running
- [x] Backups enabled (if available)

### Test Deployment

1. Create a test tag:
   ```bash
   git tag -a v0.0.1-test -m "Test deployment"
   git push origin v0.0.1-test
   ```

2. Monitor Railway dashboard for deployment

3. Check logs:
   - Backend logs should show server starting
   - MongoDB connection successful
   - No errors

4. Test endpoints:
   ```bash
   # Backend health
   curl https://<backend-domain>/health
   # Should return: {"status":"ok"}

   # Frontend
   curl -I https://<frontend-domain>
   # Should return: 200 OK
   ```

## Domain Configuration (Optional)

### Add Custom Domain

**Backend**:
1. Service settings → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.annies-health-journal.com` (or your domain)
4. Add CNAME record in DNS:
   ```
   Type: CNAME
   Name: api
   Value: <railway-generated-domain>
   ```

**Frontend**:
1. Service settings → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `annies-health-journal.com`
4. Add CNAME record in DNS:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: <railway-generated-domain>
   ```

### Update Environment Variables

After adding custom domains, update:

**Backend**:
```env
ALLOWED_ORIGINS=https://annies-health-journal.com,https://www.annies-health-journal.com
```

**Frontend**:
```env
VITE_API_URL=https://api.annies-health-journal.com/api
```

## Monitoring Setup

### Enable Metrics

1. Each service → **Metrics** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Response times
   - Error rates

### Set Up Alerts (Optional)

Railway Pro plan includes:
- Resource usage alerts
- Deployment failure notifications
- Downtime alerts

Configure in project **Settings** → **Notifications**

### External Monitoring (Optional)

Set up UptimeRobot or similar:

**Backend Monitor**:
- Type: HTTPS
- URL: `https://<backend-domain>/health`
- Interval: 5 minutes

**Frontend Monitor**:
- Type: HTTPS
- URL: `https://<frontend-domain>`
- Interval: 5 minutes

## Backup Configuration

### MongoDB Backups

Railway Hobby/Pro plans include automatic backups:
1. MongoDB service → **Settings** → **Backups**
2. Enable automatic backups
3. Set retention period (7 days recommended)

### Manual Backups

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Export database
railway run -s mongodb mongodump --uri=$MONGO_URL --out=./backup

# Compress
tar -czf backup-$(date +%Y%m%d).tar.gz backup/
```

## Troubleshooting

### Deployment Not Triggered

**Check**:
- [ ] Tag pushed to GitHub: `git push origin v0.2.0-alpha`
- [ ] Tag pattern matches `v*` in Railway settings
- [ ] Railway webhook connected (Settings → Integrations)

### Build Fails

**Common issues**:
1. Missing dependencies in package.json
2. Build command incorrect
3. Node version mismatch

**Fix**:
- Check Railway build logs
- Test locally: `npm install && npm run build`
- Verify package.json scripts

### Database Connection Error

**Check**:
- [ ] MongoDB service running
- [ ] MONGODB_URI environment variable set correctly
- [ ] Reference format: `${{MongoDB.MONGO_URL}}`
- [ ] Network policies allow connection

### CORS Errors

**Check**:
- [ ] Frontend URL in backend ALLOWED_ORIGINS
- [ ] Include protocol: `https://`
- [ ] No trailing slashes
- [ ] Comma-separated for multiple origins

### Health Check Failing

**Check**:
- [ ] Backend `/health` endpoint exists and returns 200
- [ ] Health check path is `/health` (with leading slash)
- [ ] Timeout set appropriately (100s recommended)

## Security Checklist

Before going to production:

- [ ] **JWT_SECRET**: Strong random string (32+ characters)
- [ ] **MONGODB_URI**: Using Railway's managed MongoDB (not exposed publicly)
- [ ] **ALLOWED_ORIGINS**: Specific domains only (no wildcards)
- [ ] **NODE_ENV**: Set to `production`
- [ ] **LOG_LEVEL**: Set to `info` or `warn` (not `debug`)
- [ ] **HTTPS**: Enabled for all domains (Railway does this automatically)
- [ ] **Rate limiting**: Enabled via environment variables
- [ ] **File upload limits**: Set via MAX_FILE_SIZE
- [ ] **MongoDB backups**: Enabled
- [ ] **Error monitoring**: Set up (optional but recommended)

## Cost Optimization

### Hobby Plan (~$5/month)

Includes $5 credit:
- 3 services (MongoDB, Backend, Frontend)
- ~512MB RAM per service
- Good for development/testing

### Optimize Resources

1. **Backend**: Start with 512MB RAM
2. **Frontend**: 256MB RAM (static hosting)
3. **MongoDB**: Shared cluster
4. Monitor usage and adjust as needed

### Scaling Tips

- Use Railway metrics to identify resource needs
- Scale vertically first (more RAM/CPU per service)
- Scale horizontally if needed (multiple replicas)

## Next Steps

After setup complete:

1. [ ] Create first deployment tag
2. [ ] Verify all services deployed successfully
3. [ ] Test authentication flow
4. [ ] Test check-in creation
5. [ ] Verify dashboard displays correctly
6. [ ] Set up monitoring/alerts
7. [ ] Document any custom configuration
8. [ ] Share access with team members (if applicable)

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Annie's Health Journal Issues**: https://github.com/lawrab/annies-health-journal/issues

---

**Last Updated**: 2025-11-23
