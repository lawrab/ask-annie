# Deployment Guide

Complete guide for deploying Annie's Health Journal to production.

## Table of Contents

1. [Quick Start (Railway)](#quick-start-railway)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Release Process](#release-process)
5. [Operations](#operations)
6. [Troubleshooting](#troubleshooting)
7. [Reference](#reference)

---

## Quick Start (Railway)

Railway provides the simplest deployment with automatic CI/CD from GitHub.

### Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Repository: https://github.com/lrabbets/annies-health-journal

### Deploy in 5 Minutes

```bash
# 1. Push code to GitHub
git push origin main

# 2. Create Railway project
# Visit railway.app → "New Project" → "Deploy from GitHub repo"
# Select annies-health-journal repository

# 3. Create and push a tag
git tag -a v0.1.0 -m "Initial release"
git push origin v0.1.0

# Railway deploys automatically!
```

See [Initial Setup](#initial-setup) for detailed configuration.

---

## Initial Setup

### Deployment Strategy

Annie's Health Journal uses **tag-based deployments**:

- ✅ **Production Only**: Single production environment
- ✅ **Deploy on Git Tags**: Only tags trigger deployments (e.g., `v0.2.0-alpha`)
- ✅ **Railway Auto-Deploy**: Railway automatically deploys when tags are pushed
- ✅ **CI Checks in PRs**: All quality checks run in pull requests before merge

### 1. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway detects monorepo structure

### 2. Create MongoDB Service

1. In Railway project, click **"New Service"**
2. Select **"Database"** → **"MongoDB"**
3. Railway provisions instance and creates `MONGO_URL` variable automatically

### 3. Create Backend Service

**Configure service:**
- Service name: `backend`
- **Root directory**: `backend` ⚠️ **CRITICAL - Set in Settings → Source**
- **Builder**: Dockerfile (auto-detected from `backend/Dockerfile`)

**Set environment variables:**

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<GENERATE_STRONG_SECRET>
ALLOWED_ORIGINS=https://${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
LOG_LEVEL=info
```

**Configure deployment triggers:**
- Go to **Settings** → **Triggers**
- **Disable** "Deploy on every commit to main"
- **Enable** "Deploy on git tags"
- Pattern: `v*`

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

### 4. Create Frontend Service

**Configure service:**
- Service name: `frontend`
- **Root directory**: `frontend` ⚠️ **CRITICAL - Set in Settings → Source**
- **Builder**: Dockerfile (auto-detected from `frontend/Dockerfile`)

**Set environment variables:**

```env
VITE_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
VITE_ENV=production
```

**Configure deployment triggers:**
- Go to **Settings** → **Triggers**
- **Disable** "Deploy on every commit to main"
- **Enable** "Deploy on git tags"
- Pattern: `v*`

### 5. Verify Setup

```bash
# Create test tag
git tag -a v0.0.1-test -m "Test deployment"
git push origin v0.0.1-test

# Check backend health
curl https://<backend-domain>/health
# Expected: {"status":"ok"}

# Check frontend
curl -I https://<frontend-domain>
# Expected: 200 OK
```

---

## Configuration

### Custom Domain Setup

**Backend (api.yourdomain.com):**

1. Railway service → **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `api.yourdomain.com`
4. Add DNS CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: <railway-generated-domain>
   ```

**Frontend (yourdomain.com):**

1. Railway service → **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter: `yourdomain.com` or `www.yourdomain.com`
4. Add DNS CNAME record:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: <railway-generated-domain>
   ```

**Update environment variables after adding domains:**

Backend:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RP_ID=www.yourdomain.com
WEBAUTHN_ORIGIN=https://www.yourdomain.com
```

Frontend:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### WebAuthn/Passkey Configuration

For passkey authentication to work in production, set these environment variables:

```env
# Backend service
RP_ID=www.yourdomain.com           # Domain where users access the app
RP_NAME=Annie's Health Journal     # Display name during passkey creation
WEBAUTHN_ORIGIN=https://www.yourdomain.com  # Full frontend URL
```

**Important**: These must match your actual production domain exactly, or passkey authentication will fail.

### Environment Variables Reference

#### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | No | 3000 | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing (32+ chars) |
| `ALLOWED_ORIGINS` | Yes | - | Comma-separated CORS origins |
| `OPENAI_API_KEY` | Recommended | - | OpenAI API for Whisper transcription |
| `RP_ID` | Yes | localhost | WebAuthn Relying Party ID (production domain) |
| `RP_NAME` | No | Annie's Health Journal | Display name for passkeys |
| `WEBAUTHN_ORIGIN` | Yes | http://localhost:5173 | Full frontend URL with protocol |
| `LOG_LEVEL` | No | info | Logging level |
| `MAX_FILE_SIZE` | No | 10485760 | Max upload size (bytes) |

#### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL |
| `VITE_ENV` | No | production | Environment |

---

## Release Process

### Prerequisites

- All PR checks passing on `main` branch
- Manual testing completed
- CHANGELOG.md updated

### Release Steps

**1. Update version numbers:**

```bash
# Root, backend, and frontend
npm version <patch|minor|major> --no-git-tag-version
cd backend && npm version <version> --no-git-tag-version
cd ../frontend && npm version <version> --no-git-tag-version
```

**2. Update CHANGELOG.md:**

```markdown
## [0.3.0] - 2025-11-29

### Added
- Feature description

### Fixed
- Bug fix description
```

**3. Commit and create tag:**

```bash
# Commit version bump
git add .
git commit -m "chore: Bump version to v0.3.0"
git push origin main

# Create and push tag
git tag -a v0.3.0 -m "Release v0.3.0

- New feature X
- Bug fix Y
"
git push origin v0.3.0
```

**4. Railway deploys automatically**

Monitor at: https://railway.app/dashboard

**5. Verify deployment:**

```bash
# Backend health
curl https://<backend-url>/health

# Frontend
curl -I https://<frontend-url>

# Test authentication
curl -X POST https://<backend-url>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'
```

**6. Create GitHub release:**

```bash
gh release create v0.3.0 \
  --title "v0.3.0 - Release Title" \
  --notes-file CHANGELOG.md
```

### Version Naming Convention

- **Alpha**: `0.x.0-alpha` - Early testing, breaking changes expected
- **Beta**: `0.x.0-beta` - Feature complete, bug fixing
- **Release Candidate**: `0.x.0-rc.1` - Production candidate
- **Stable**: `1.0.0` - Production ready

### Rollback Procedure

**Option 1: Railway Dashboard**

1. Railway dashboard → Service → "Deployments"
2. Find previous working deployment
3. Click "Redeploy"

**Option 2: Redeploy Previous Tag**

```bash
git push origin v0.2.0 --force
```

**Option 3: Hotfix**

```bash
# Create hotfix branch from tag
git checkout -b hotfix/critical-bug v0.3.0

# Fix and create new patch tag
git tag -a v0.3.1 -m "Hotfix: Critical bug fix"
git push origin v0.3.1
```

---

## Operations

### Monitoring

**Railway Dashboard:**
- Navigate to service → "Metrics" tab
- Monitor CPU, memory, response times, error rates

**Logs:**
```bash
# Railway CLI
railway logs --service backend
railway logs --service frontend --tail
```

**Health Checks:**
- Backend: `https://<backend-url>/health` → `{"status":"ok"}`
- Frontend: `https://<frontend-url>` → 200 OK

**External Monitoring (Optional):**

Set up UptimeRobot or Better Uptime:
- Backend monitor: `https://<backend-url>/health`
- Frontend monitor: `https://<frontend-url>`
- Check interval: 5 minutes

### Backups

**Automated (Railway):**
- MongoDB service → **Settings** → **Backups**
- Enable automatic backups
- Retention: 7 days (free tier)

**Manual Backups:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Export database
railway run -s mongodb mongodump --uri=$MONGODB_URI --out=./backup

# Compress
tar -czf backup-$(date +%Y%m%d).tar.gz backup/
```

**Restore:**

```bash
railway run mongorestore --uri=$MONGODB_URI ./backup
```

### Scaling

**Vertical Scaling (Increase Resources):**

1. Railway dashboard → Service → **Settings** → **Resources**
2. Adjust memory/CPU sliders
3. Redeploy if needed

**Horizontal Scaling (Multiple Replicas):**

1. Service → **Settings** → **Scaling**
2. Increase replica count
3. Note: Ensure session storage is stateless

**Database Scaling:**

Add indexes for performance:

```javascript
// In MongoDB
db.checkins.createIndex({ userId: 1, timestamp: -1 });
db.checkins.createIndex({ userId: 1, "structured.symptoms.hand_grip": 1 });
```

---

## Troubleshooting

### Deployment Not Triggered

**Check:**
- Tag pushed to GitHub: `git push origin v0.3.0`
- Tag pattern matches `v*` in Railway settings
- Railway webhook connected (Settings → Integrations)

### Build Fails

**Common Issues:**
- Missing dependencies in package.json
- Node version mismatch
- Incorrect build command

**Fix:**
- Check Railway build logs
- Test locally: `npm install && npm run build`
- Verify package.json scripts

### Database Connection Error

**Check:**
- MongoDB service running
- `MONGODB_URI` set correctly: `${{MongoDB.MONGO_URL}}`
- Network policies allow connection

### CORS Errors

**Check:**
- Frontend URL in backend `ALLOWED_ORIGINS`
- Include protocol: `https://`
- No trailing slashes
- Comma-separated for multiple origins

### Passkey Authentication Fails

**Check:**
- `RP_ID` matches production domain exactly
- `WEBAUTHN_ORIGIN` matches frontend URL with protocol
- Users accessing via the domain specified in `RP_ID`

---

## Reference

### Security Checklist

Before production deployment:

- [ ] Strong `JWT_SECRET` (32+ random characters)
- [ ] HTTPS enabled for all domains
- [ ] Restrictive CORS origins (no wildcards)
- [ ] Rate limiting enabled
- [ ] MongoDB access rules reviewed
- [ ] MongoDB backups enabled
- [ ] Error monitoring set up (optional)
- [ ] Test authentication flows
- [ ] Verify file upload limits
- [ ] WebAuthn variables set correctly

### Cost Estimation (Railway)

**Free Tier**: $0
- $5 credit/month
- Good for development/testing

**Production**: ~$30/month
- Backend: ~$10/month (512MB RAM)
- Frontend: ~$5/month (static hosting)
- MongoDB: ~$15/month (shared cluster)

### Alternative Platforms

**Vercel** (Frontend Only):
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Heroku** (Full Stack):
```bash
heroku create annies-health-journal
heroku addons:create mongolab
git push heroku main
```

**Docker Compose** (Self-Hosted):
```bash
docker-compose up -d
```

### Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Project Issues**: https://github.com/lrabbets/annies-health-journal/issues

---

**Last Updated**: 2025-11-29
