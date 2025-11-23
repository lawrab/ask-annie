# Release Process

This document describes how to create and deploy releases of Ask Annie.

## Prerequisites

- All PR checks passing on `main` branch
- Manual testing completed
- CHANGELOG.md updated with release notes

## Release Steps

### 1. Update Version Numbers

Update version in all package.json files:

```bash
# Root package.json
npm version <version> --no-git-tag-version

# Backend
cd backend && npm version <version> --no-git-tag-version

# Frontend
cd ../frontend && npm version <version> --no-git-tag-version
```

Where `<version>` is one of:
- `patch` - Bug fixes (0.2.0 → 0.2.1)
- `minor` - New features (0.2.0 → 0.3.0)
- `major` - Breaking changes (0.2.0 → 1.0.0)
- Or explicit version like `0.2.0-alpha`

### 2. Update CHANGELOG

Add release notes to `CHANGELOG.md`:

```markdown
## [0.2.0-alpha] - 2025-11-23

### Added
- Feature description

### Fixed
- Bug fix description

### Changed
- Change description
```

### 3. Commit Version Bump

```bash
git add .
git commit -m "chore: Bump version to v0.2.0-alpha"
git push origin main
```

### 4. Create Git Tag

```bash
# Create annotated tag
git tag -a v0.2.0-alpha -m "Release v0.2.0-alpha - Alpha Release

- Session persistence fixed
- Dashboard symptom analytics working
- New SymptomValue format implemented
"

# Push tag to trigger deployment
git push origin v0.2.0-alpha
```

### 5. Railway Deployment

Railway will automatically detect the tag and deploy:

1. **Backend service** builds and deploys
2. **Frontend service** builds and deploys
3. **Health checks** verify deployment
4. **Old instances** are replaced (zero-downtime)

Monitor deployment at: https://railway.app/dashboard

### 6. Verify Deployment

```bash
# Check backend health
curl https://<backend-url>/health

# Check frontend
curl -I https://<frontend-url>

# Test authentication
curl -X POST https://<backend-url>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"TestPass123!"}'
```

### 7. Create GitHub Release

```bash
# Using GitHub CLI
gh release create v0.2.0-alpha \
  --title "v0.2.0-alpha - Alpha Release" \
  --notes-file docs/release-notes/v0.2.0-alpha.md \
  --prerelease
```

Or manually on GitHub:
1. Go to https://github.com/lawrab/ask-annie/releases/new
2. Select tag: `v0.2.0-alpha`
3. Set title: `v0.2.0-alpha - Alpha Release`
4. Paste release notes from CHANGELOG
5. Check "This is a pre-release" for alpha/beta
6. Click "Publish release"

## Rollback Procedure

If deployment fails or issues are found:

### Option 1: Rollback in Railway

1. Go to Railway dashboard
2. Select service → "Deployments"
3. Find previous working deployment
4. Click "Redeploy"

### Option 2: Deploy Previous Tag

```bash
# Find previous tag
git tag -l

# Redeploy previous version
git push origin v0.1.0 --force
```

### Option 3: Hotfix

1. Create hotfix branch from tag:
   ```bash
   git checkout -b hotfix/critical-bug v0.2.0-alpha
   ```

2. Fix the issue and commit

3. Create new patch tag:
   ```bash
   git tag -a v0.2.1-alpha -m "Hotfix: Critical bug fix"
   git push origin v0.2.1-alpha
   ```

## Version Naming Convention

- **Alpha**: `0.x.0-alpha` - Early testing, breaking changes expected
- **Beta**: `0.x.0-beta` - Feature complete, bug fixing
- **Release Candidate**: `0.x.0-rc.1` - Production candidate
- **Stable**: `1.0.0` - Production ready

## Environment Variables

Ensure these are set in Railway for production:

### Backend
```env
NODE_ENV=production
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://<frontend-domain>
LOG_LEVEL=info
```

### Frontend
```env
VITE_API_URL=https://<backend-domain>/api
VITE_ENV=production
```

## Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Check-in creation works
- [ ] Dashboard displays data correctly
- [ ] No console errors
- [ ] Database connection stable
- [ ] Logs showing normal operation
- [ ] Update team/users about new release

## Release Frequency

- **Alpha**: As needed for testing major features
- **Beta**: Weekly or bi-weekly
- **Stable**: Monthly or when critical fixes needed

## Communication

After successful deployment:

1. Post in team chat/Slack
2. Email beta testers (if applicable)
3. Update status page
4. Monitor error logs for 24 hours

## Troubleshooting

### Tag Push Doesn't Trigger Deployment

- Check Railway is configured to watch tags
- Verify Railway service is connected to correct repository
- Check Railway build logs for errors

### Build Fails

- Review Railway build logs
- Test build locally: `npm run build`
- Check all dependencies in package.json
- Verify Node version compatibility

### Database Migration Issues

- Ensure migrations run before app starts
- Check MongoDB connection string
- Verify database has sufficient storage/resources

---

**Last Updated**: 2025-11-23
