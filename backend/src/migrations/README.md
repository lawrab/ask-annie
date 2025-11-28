# Database Migrations

This directory contains database migration scripts for the Annie's Health Journal backend.

## Available Migrations

### Symptom Format Migration

**File**: `migrate-symptom-format.ts`

**Purpose**: Converts existing check-in data from old symptom formats to the standardized SymptomValue format.

**Old formats**:
- Plain numbers: `{ headache: 5 }`
- Categorical strings: `{ headache: 'bad' }`
- Boolean values: `{ headache: true }`

**New format**:
```typescript
{
  headache: {
    severity: 5,      // Required: 1-10 scale
    location?: string // Optional
    notes?: string    // Optional
  }
}
```

**When to run**:
- After deploying Issue #87 changes to production
- Before enabling Wave 3 features that rely on standardized symptom data

**How to run**:

1. Set your MongoDB connection string in environment variables:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017/annies-health-journal"
   ```

2. Run the migration:
   ```bash
   npm run build
   node dist/migrations/migrate-symptom-format.js
   ```

   Or with ts-node during development:
   ```bash
   npx ts-node src/migrations/migrate-symptom-format.ts
   ```

3. Check the logs for migration results:
   - Total check-ins processed
   - Number migrated (format changed)
   - Number skipped (already in correct format)
   - Any errors encountered

**Rollback**:
This migration is non-destructive and converts data to a compatible format. The new format is a superset of the old format, so no data is lost. However, it's recommended to:
1. Back up your database before running
2. Test on a staging environment first
3. Keep a database backup for at least 7 days after migration

## Creating New Migrations

1. Create a new TypeScript file in this directory: `migrate-{description}.ts`
2. Export a main migration function
3. Add proper error handling and logging
4. Include a dry-run option if possible
5. Document the migration in this README
6. Test thoroughly on development/staging before production

## Best Practices

- Always back up data before migrations
- Test migrations on staging environments
- Include rollback instructions when possible
- Log all changes for audit trail
- Make migrations idempotent (safe to run multiple times)
- Add migration to deployment checklist
