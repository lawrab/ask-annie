# Package Upgrade Notes

## Summary

Upgraded all dependencies to latest versions to eliminate deprecation warnings and security vulnerabilities.

## Major Changes

### Backend

**Key Upgrades:**
- `multer`: 1.4.5-lts.1 → 2.0.2 (fixed vulnerabilities)
- `supertest`: 6.3.3 → 7.0.0 (no longer deprecated)
- `eslint`: 8.56.0 → 9.17.0 (flat config)
- `helmet`: 7.1.0 → 8.0.0
- `mongoose`: 8.0.3 → 8.9.5
- `typescript`: 5.3.3 → 5.7.2
- `@types/express`: 4.17.21 → 5.0.0

**Breaking Changes:**
- ESLint now uses flat config (`eslint.config.mjs` instead of `.eslintrc.json`)
- Multer 2.x has different API (check when implementing file uploads)
- `@types/express` v5 may have stricter types

### Frontend

**Key Upgrades:**
- `react-router-dom`: 6.22.0 → 7.1.3
- `eslint`: 8.56.0 → 9.17.0 (flat config)
- `vite`: 5.1.0 → 6.0.7
- `vitest`: 1.2.2 → 2.1.8
- `zustand`: 4.5.0 → 5.0.2
- `date-fns`: 3.3.1 → 4.1.0
- `@testing-library/react`: 14.2.1 → 16.1.0
- `typescript`: 5.3.3 → 5.7.2

**Breaking Changes:**
- ESLint now uses flat config (`eslint.config.js` instead of `.eslintrc.cjs`)
- React Router 7 has API changes (check when implementing routing)
- Vite 6 may have config changes
- Vitest 2 has new API
- Zustand 5 has minor API changes
- date-fns 4 has breaking changes in some functions

## Migration Guide

### ESLint 9 Migration

Both backend and frontend now use ESLint 9 flat config format.

**Backend:** `backend/eslint.config.mjs`
**Frontend:** `frontend/eslint.config.js`

Old config files have been removed.

### Multer 2.x Migration

When implementing file uploads, note:
- New storage engines
- Updated TypeScript types
- Check official migration guide: https://github.com/expressjs/multer/releases

### React Router 7 Migration

When implementing routing:
- Some hooks have changed
- Loader/action API updated
- Check migration guide: https://reactrouter.com/en/main/upgrading/v7

### Zustand 5 Migration

Minor breaking changes:
- Type inference improvements
- Middleware changes
- Check guide: https://github.com/pmndrs/zustand/releases

## Installation

After pulling these changes:

```bash
# Clean old installations
make clean

# Install fresh
cd backend && npm install
cd ../frontend && npm install

# Or from root
npm run install:all
```

## Verification

```bash
# Backend
cd backend
npm audit  # Should show 0 vulnerabilities
npm run lint
npm run typecheck

# Frontend
cd frontend
npm audit
npm run lint
npm run typecheck
```

## Removed Deprecation Warnings

✅ `multer` - Upgraded to 2.x
✅ `supertest` - Upgraded to 7.x
✅ `eslint` - Upgraded to 9.x
✅ `inflight` - Removed via dependency updates
✅ `glob` - Updated to v9+ via dependencies
✅ `rimraf` - Updated to v4+ via dependencies

---

**Date:** 2025-01-25
**Author:** Development Team
