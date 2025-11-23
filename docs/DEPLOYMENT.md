# Ask Annie - Deployment Guide

This guide covers deploying Ask Annie to Railway (recommended) and other platforms.

---

## Deployment Strategy

Ask Annie uses **tag-based deployments** to Railway:

- ✅ **Production Only**: Single production environment
- ✅ **Deploy on Git Tags**: Only git tags trigger deployments (e.g., `v0.2.0-alpha`)
- ✅ **Railway Built-in CD**: Railway automatically deploys when tags are pushed
- ✅ **CI Checks in PRs**: All quality checks run in pull requests before merge

### Quick Deploy

```bash
# 1. Ensure main branch is ready
git checkout main
git pull

# 2. Create and push tag
git tag -a v0.2.0-alpha -m "Release v0.2.0-alpha"
git push origin v0.2.0-alpha

# 3. Railway deploys automatically
# Monitor at: https://railway.app/dashboard
```

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md) for detailed release procedures.

---

## Quick Start (Railway)

Railway provides the simplest deployment path with automatic CI/CD from GitHub.

### Prerequisites

- GitHub account
- Railway account (free tier available)
- Git repository with Ask Annie code

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Railway project**
   - Visit [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `ask-annie` repository
   - Railway will auto-detect the monorepo structure

3. **Configure services**

   Railway should create three services automatically:
   - MongoDB database
   - Backend (Node.js)
   - Frontend (Static site)

4. **Set environment variables**

   For **Backend service**:
   ```env
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   JWT_SECRET=<generate-secure-random-string>
   ALLOWED_ORIGINS=https://<your-frontend-domain>.railway.app
   WHISPER_MODEL_SIZE=base
   WHISPER_DEVICE=cpu
   LOG_LEVEL=info
   ```

   For **Frontend service**:
   ```env
   VITE_API_URL=https://<your-backend-domain>.railway.app/api
   VITE_ENV=production
   ```

5. **Deploy**
   - Railway will automatically build and deploy on push to `main`
   - Monitor deployment logs in Railway dashboard

6. **Verify deployment**
   - Backend health: `https://<backend-url>/health`
   - Frontend: `https://<frontend-url>`

---

## Detailed Railway Configuration

### MongoDB Setup

Railway provides managed MongoDB instances:

1. In Railway dashboard, click "New Service" → "Database" → "MongoDB"
2. Railway generates `MONGO_URL` automatically
3. Reference in backend: `${{MongoDB.MONGO_URL}}`

**Backup strategy**:
- Enable automatic backups in Railway settings
- Consider scheduled exports via API

### Backend Service Configuration

**Build Command**:
```bash
cd backend && npm install && npm run build
```

**Start Command**:
```bash
cd backend && npm start
```

**Health Check**:
- Path: `/health`
- Expected status: `200`

**Resources** (adjust as needed):
- Memory: 512MB (minimum)
- CPU: 0.5 vCPU

### Frontend Service Configuration

**Build Command**:
```bash
cd frontend && npm install && npm run build
```

**Start Command**:
```bash
npm install -g serve && serve -s frontend/dist -p $PORT
```

Or use Railway's static hosting:
- Root directory: `frontend/dist`
- No start command needed

**Resources**:
- Memory: 256MB
- CPU: 0.25 vCPU

### faster-whisper Setup

Railway doesn't support Python natively in Node.js services. Options:

**Option 1: Docker Multi-Stage Build** (Recommended for production)

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim as python-deps
RUN pip install faster-whisper

FROM node:18-alpine
COPY --from=python-deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY backend /app
WORKDIR /app
RUN npm install && npm run build
CMD ["npm", "start"]
```

**Option 2: External Transcription Service**

Use OpenAI Whisper API instead:
- Add `OPENAI_API_KEY` to environment
- Modify transcription service to use API

**Option 3: Separate Python Service**

Deploy Python transcription service separately:
- Create new Railway service with Python runtime
- Backend calls transcription service via HTTP

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment mode |
| `PORT` | No | 3000 | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `JWT_EXPIRES_IN` | No | 7d | Token expiry duration |
| `ALLOWED_ORIGINS` | Yes | - | Comma-separated CORS origins |
| `OPENAI_API_KEY` | Recommended | - | OpenAI API key for Whisper transcription (production) |
| `WHISPER_URL` | No | http://localhost:8000/v1/audio/transcriptions | faster-whisper server URL (dev only) |
| `WHISPER_MODEL` | No | Systran/faster-distil-whisper-small.en | faster-whisper model (dev only) |
| `MAX_FILE_SIZE` | No | 10485760 | Max upload size (bytes) |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |
| `LOG_LEVEL` | No | info | Logging level |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | - | Backend API URL |
| `VITE_ENV` | No | production | Environment |
| `VITE_ENABLE_VOICE_RECORDING` | No | true | Feature flag |
| `VITE_ENABLE_NOTIFICATIONS` | No | true | Feature flag |

---

## Custom Domain Setup

### Railway Custom Domains

1. In Railway dashboard, select service
2. Go to "Settings" → "Domains"
3. Click "Add Custom Domain"
4. Enter your domain (e.g., `ask-annie.com`)
5. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: <railway-generated-domain>
   ```
6. Wait for SSL certificate provisioning (~5 minutes)

### Update CORS Origins

After adding custom domain, update backend environment:
```env
ALLOWED_ORIGINS=https://ask-annie.com,https://www.ask-annie.com
```

---

## CI/CD Pipeline

### Tag-Based Deployment Flow

```
Developer creates git tag (e.g., v0.2.0-alpha)
    ↓
Tag pushed to GitHub
    ↓
Railway webhook triggered
    ↓
Pull tagged code
    ↓
Run build commands
    ↓
Health checks pass
    ↓
Zero-downtime deployment
    ↓
Old instances terminated
```

**Configuration**: Railway services are configured to deploy only on git tags through Railway dashboard settings.

### Pull Request CI (Automated)

All quality checks run in PRs before merge:
- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Test suites (330 backend + 466 frontend)
- ✅ Build verification

### Manual Deployment

To trigger manual deployment:
1. Railway dashboard → Service → "Deploy"
2. Select tag to deploy

### Deployment Rollback

Railway keeps deployment history:
1. Dashboard → Service → "Deployments"
2. Find previous successful deployment
3. Click "Redeploy"

Or redeploy previous tag:
```bash
git push origin v0.1.0 --force
```

---

## Monitoring & Logs

### Viewing Logs

**Railway Dashboard**:
- Navigate to service
- Click "Logs" tab
- Filter by service, time range

**Command Line** (Railway CLI):
```bash
railway logs --service backend
railway logs --service frontend --tail
```

### Health Monitoring

Set up health check monitoring:

**Backend**:
- Endpoint: `https://<backend-url>/health`
- Expected response: `{"status":"ok"}`
- Check interval: 60 seconds

**Frontend**:
- Endpoint: `https://<frontend-url>`
- Expected status: 200

### External Monitoring (Optional)

Services like UptimeRobot or Better Uptime:
1. Create account
2. Add HTTP(S) monitor for backend `/health`
3. Add HTTP(s) monitor for frontend
4. Configure alert emails/SMS

---

## Scaling

### Vertical Scaling

Increase resources in Railway dashboard:
- Navigate to service → "Settings" → "Resources"
- Adjust memory/CPU sliders
- Redeploy if needed

### Horizontal Scaling

Railway supports multiple replicas:
1. Service settings → "Scaling"
2. Increase replica count
3. Ensure session storage is stateless (use Redis if needed)

### Database Scaling

For large datasets:
1. Upgrade MongoDB plan in Railway
2. Enable read replicas
3. Add database indexes:
   ```javascript
   // In MongoDB
   db.checkins.createIndex({ userId: 1, timestamp: -1 });
   db.checkins.createIndex({ userId: 1, "structured.symptoms.hand_grip": 1 });
   ```

---

## Backup & Disaster Recovery

### Database Backups

**Automated (Railway)**:
- Enable in MongoDB service settings
- Retention: 7 days (free tier)

**Manual Backups**:
```bash
# Using Railway CLI
railway run mongodump --uri=$MONGODB_URI --out=./backup

# Compress backup
tar -czf backup-$(date +%Y%m%d).tar.gz backup/
```

**Restore**:
```bash
railway run mongorestore --uri=$MONGODB_URI ./backup
```

### Application Backup

- Code: Backed up in Git
- Configuration: Environment variables documented
- User uploads: Store in cloud storage (S3/Cloudinary) for production

---

## Alternative Deployment Platforms

### Vercel (Frontend Only)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Environment variables:
- Add `VITE_API_URL` in Vercel dashboard

### Heroku (Full Stack)

1. Create Heroku app:
   ```bash
   heroku create ask-annie
   ```

2. Add MongoDB addon:
   ```bash
   heroku addons:create mongolab
   ```

3. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=<your-secret>
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure services (similar to Railway)
3. Set environment variables
4. Deploy

### Docker Compose (Self-Hosted)

See `docker-compose.yml` in repository root:

```bash
docker-compose up -d
```

---

## Security Checklist

Before deploying to production:

- [ ] Generate strong `JWT_SECRET` (32+ random characters)
- [ ] Use HTTPS for all domains
- [ ] Set restrictive CORS origins (no wildcards)
- [ ] Enable rate limiting
- [ ] Review MongoDB access rules
- [ ] Enable Railway IP allowlist (if available)
- [ ] Set up error monitoring (Sentry/Rollbar)
- [ ] Configure log retention policies
- [ ] Test authentication flows
- [ ] Verify file upload limits
- [ ] Enable security headers (Helmet.js)
- [ ] Set up monitoring alerts

---

## Post-Deployment Testing

### Smoke Tests

```bash
# Health check
curl https://<backend-url>/health

# Frontend loads
curl -I https://<frontend-url>

# API responds
curl https://<backend-url>/api/health

# Authentication works
curl -X POST https://<backend-url>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"testpass123"}'
```

### Load Testing

Using Apache Bench:
```bash
ab -n 1000 -c 10 https://<backend-url>/api/health
```

Or Artillery:
```bash
npm install -g artillery
artillery quick --count 10 --num 100 https://<backend-url>/api/health
```

---

## Troubleshooting

### Deployment Fails

**Build errors**:
- Check Railway build logs
- Verify `package.json` scripts
- Ensure all dependencies in `package.json`

**Module not found**:
- Clear build cache in Railway
- Check TypeScript path aliases match runtime

### Database Connection Issues

**Connection refused**:
- Verify `MONGODB_URI` is set correctly
- Check MongoDB service is running
- Review IP allowlist settings

**Slow queries**:
- Add database indexes
- Review aggregation pipelines
- Upgrade MongoDB plan

### Whisper Transcription Fails

**Python not found**:
- Use Docker multi-stage build
- Or switch to OpenAI Whisper API

**Out of memory**:
- Increase service memory allocation
- Use smaller Whisper model (`tiny` or `base`)

### CORS Errors

**"Access-Control-Allow-Origin" missing**:
- Add frontend URL to `ALLOWED_ORIGINS`
- Include protocol (https://)
- Check for trailing slashes

---

## Cost Estimation

### Railway (Monthly)

- **Free Tier**: $0
  - Hobby plan: $5 credit/month
  - Good for development/testing

- **Production**:
  - Backend: ~$10/month (512MB RAM)
  - Frontend: ~$5/month (static hosting)
  - MongoDB: ~$15/month (shared cluster)
  - **Total**: ~$30/month

### Other Platforms

- **Heroku**: $25-50/month
- **DigitalOcean**: $20-40/month
- **Vercel + Railway**: $20-30/month

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Ask Annie Issues**: https://github.com/lrabbets/ask-annie/issues

---

**Document Version**: 1.0
**Last Updated**: 2024-01-25
**Next Review**: 2024-04-25
