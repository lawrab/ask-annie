# Database Reset Instructions

## When to Reset
Reset the database when:
- Migrating from old symptom format (`{ headache: 5 }`) to new SymptomValue format (`{ headache: { severity: 5 } }`)
- Testing with clean data
- Resolving data format inconsistencies

## Prerequisites
MongoDB tools are available in the nix development shell (added to flake.nix).

## Steps

### 1. Ensure services are stopped
```bash
make down
```

### 2. Drop the database
```bash
# Connect to MongoDB and drop the database
mongosh mongodb://localhost:27017/ask-annie --eval "db.dropDatabase()"
```

Or using docker/podman:
```bash
docker exec -it ask-annie-mongodb mongosh ask-annie --eval "db.dropDatabase()"
```

### 3. Restart services
```bash
make up
```

The database will be recreated automatically when the backend starts.

### 4. Create new test user
Navigate to http://localhost:5173/register and create a new account.

## Alternative: Clear Specific Collections

If you only want to clear check-ins:
```bash
mongosh mongodb://localhost:27017/ask-annie --eval "db.checkins.deleteMany({})"
```

If you only want to clear users (this will also invalidate all sessions):
```bash
mongosh mongodb://localhost:27017/ask-annie --eval "db.users.deleteMany({})"
```

## Verification

After reset, verify the database is clean:
```bash
mongosh mongodb://localhost:27017/ask-annie --eval "db.stats()"
```

You should see 0 documents in all collections.
