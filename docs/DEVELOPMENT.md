# Annie's Health Journal - Development Guide

This guide covers setting up the development environment and common development workflows.

---

## Prerequisites

### Required Software

- **Node.js**: 18.x or higher ([Download](https://nodejs.org))
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version
- **MongoDB**: 6.x or higher ([Download](https://www.mongodb.com/try/download/community))
  - Or use MongoDB Atlas (cloud)
  - Or use Railway MongoDB (development)
- **Python**: 3.8+ (for faster-whisper transcription)

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin
  - MongoDB for VS Code
- **Postman** or **Insomnia** (API testing)
- **MongoDB Compass** (database GUI)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/lrabbets/annies-health-journal.git
cd annies-health-journal
```

### 2. Install Dependencies

**Option A: Install all at once**
```bash
npm run install:all
```

**Option B: Install separately**
```bash
# Root dependencies
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start Dependencies with Podman

**Start MongoDB and Redis containers**:
```bash
# From project root
make deps-up
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- Mongo Express UI on `localhost:8081`

**Verify containers are running**:
```bash
make ps
```

**Alternative: Manual podman-compose**:
```bash
podman-compose up -d mongodb redis mongo-express
```

### 4. Set Up Environment Variables

**Backend**:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/annies-health-journal?authSource=admin
JWT_SECRET=dev-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:5173
WHISPER_MODEL_SIZE=base
LOG_LEVEL=debug
```

**Frontend**:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
VITE_ENABLE_VOICE_RECORDING=true
VITE_ENABLE_NOTIFICATIONS=true
```

### 5. Set Up faster-whisper (Optional for Voice Features)

```bash
# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install faster-whisper
pip install faster-whisper

# Download model (first run only)
python -c "from faster_whisper import WhisperModel; WhisperModel('base')"
```

---

## Running the Application

### Development Mode (Recommended)

**1. Start dependencies (MongoDB + Redis)**:
```bash
make deps-up
```

**2. Run both frontend and backend locally**:
```bash
# From project root
make dev
# Or: npm run dev
```

This starts:
- Backend on `http://localhost:3000` (with hot-reload)
- Frontend on `http://localhost:5173` (with HMR)

### Run Services Separately

**Backend only**:
```bash
cd backend
npm run dev
```

**Frontend only**:
```bash
cd frontend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Health**: http://localhost:3000/health
- **Mongo Express**: http://localhost:8081 (admin/admin)

### Stop Dependencies

When you're done developing:
```bash
make deps-down
```

---

## Development Workflows

### Making Changes

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** in your editor

3. **Test locally**:
   ```bash
   # Run linter
   npm run lint

   # Run tests
   npm test

   # Type check
   npm run typecheck
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Adding New API Endpoints

1. **Create route file** in `backend/src/routes/`:
   ```typescript
   // routes/exampleRoutes.ts
   import { Router } from 'express';
   import { exampleController } from '../controllers/exampleController';

   const router = Router();

   router.get('/', exampleController.getAll);
   router.post('/', exampleController.create);

   export default router;
   ```

2. **Create controller** in `backend/src/controllers/`:
   ```typescript
   // controllers/exampleController.ts
   import { Request, Response } from 'express';

   export const exampleController = {
     getAll: async (req: Request, res: Response) => {
       // Implementation
     },
     create: async (req: Request, res: Response) => {
       // Implementation
     }
   };
   ```

3. **Register route** in `backend/src/routes/index.ts`:
   ```typescript
   import exampleRoutes from './exampleRoutes';

   router.use('/example', exampleRoutes);
   ```

4. **Test endpoint**:
   ```bash
   curl http://localhost:3000/api/example
   ```

### Adding New React Components

1. **Create component** in `frontend/src/components/`:
   ```tsx
   // components/ExampleComponent.tsx
   interface ExampleProps {
     title: string;
   }

   export function ExampleComponent({ title }: ExampleProps) {
     return <div>{title}</div>;
   }
   ```

2. **Import and use**:
   ```tsx
   import { ExampleComponent } from '@/components/ExampleComponent';

   function App() {
     return <ExampleComponent title="Hello" />;
   }
   ```

### Adding New Database Models

1. **Create model** in `backend/src/models/`:
   ```typescript
   // models/Example.ts
   import mongoose, { Schema, Document } from 'mongoose';

   export interface IExample extends Document {
     name: string;
     createdAt: Date;
   }

   const ExampleSchema = new Schema({
     name: { type: String, required: true },
     createdAt: { type: Date, default: Date.now }
   });

   export default mongoose.model<IExample>('Example', ExampleSchema);
   ```

2. **Use in controller**:
   ```typescript
   import Example from '../models/Example';

   const examples = await Example.find({ userId });
   ```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- checkins.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Writing Tests

**Backend (Jest + Supertest)**:
```typescript
// __tests__/checkins.test.ts
import request from 'supertest';
import app from '../src/server';

describe('Checkins API', () => {
  it('should create check-in', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .send({ structured: { symptoms: {} } })
      .expect(201);

    expect(res.body.success).toBe(true);
  });
});
```

**Frontend (Vitest + Testing Library)**:
```tsx
// __tests__/ExampleComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from '@/components/ExampleComponent';

test('renders title', () => {
  render(<ExampleComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

---

## Code Quality

### Linting

**Run linter**:
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

**Format code with Prettier**:
```bash
# Backend
cd backend && npm run format

# Frontend
cd frontend && npm run format
```

### Type Checking

```bash
# Backend
cd backend && npm run typecheck

# Frontend
cd frontend && npm run typecheck
```

### Pre-Commit Hook (Recommended)

Install Husky for automatic checks:

```bash
npm install -D husky lint-staged
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Database Management

### MongoDB Commands

**Connect via CLI**:
```bash
mongosh mongodb://localhost:27017/annies-health-journal
```

**Common queries**:
```javascript
// View all check-ins
db.checkins.find().pretty()

// Count check-ins by user
db.checkins.countDocuments({ userId: "..." })

// Find recent check-ins
db.checkins.find().sort({ createdAt: -1 }).limit(10)

// Delete all test data
db.checkins.deleteMany({ userId: "test-user-id" })
```

### Seeding Test Data

Create `backend/scripts/seed.ts`:
```typescript
import mongoose from 'mongoose';
import CheckIn from '../src/models/CheckIn';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/annies-health-journal');

  await CheckIn.create({
    userId: 'test-user',
    timestamp: new Date(),
    rawTranscript: 'Test entry',
    structured: {
      symptoms: { pain_level: 5 },
      activities: [],
      triggers: [],
      notes: ''
    }
  });

  console.log('Seeded!');
  process.exit(0);
}

seed();
```

Run:
```bash
ts-node backend/scripts/seed.ts
```

---

## Debugging

### Backend Debugging (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

Set breakpoints and press F5 to debug.

### Frontend Debugging

1. Open browser DevTools (F12)
2. Use React DevTools extension
3. Use VS Code debugger with Chrome

### API Debugging with Postman

**Import collection**:
1. Create `postman_collection.json` with common requests
2. Import into Postman
3. Set environment variables

**Example request**:
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "password123"
}
```

---

## Performance Optimisation

### Backend

**Database indexing**:
```javascript
// In model definition
CheckInSchema.index({ userId: 1, timestamp: -1 });
CheckInSchema.index({ userId: 1, 'structured.symptoms.pain_level': 1 });
```

**Caching** (with Redis - future):
```typescript
const cached = await redis.get(`user:${userId}:summary`);
if (cached) return JSON.parse(cached);
```

### Frontend

**Code splitting**:
```tsx
import { lazy, Suspense } from 'react';

const Trends = lazy(() => import('./pages/Trends'));

<Suspense fallback={<Loading />}>
  <Trends />
</Suspense>
```

**Memoisation**:
```tsx
import { useMemo } from 'react';

const sortedData = useMemo(
  () => data.sort((a, b) => a.date - b.date),
  [data]
);
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### MongoDB Connection Failed

- Check MongoDB is running: `mongosh`
- Verify connection string in `.env`
- Check firewall/network settings

### TypeScript Path Alias Not Working

**Backend**: Install `tsconfig-paths`:
```bash
npm install -D tsconfig-paths
```

Update `nodemon.json`:
```json
{
  "exec": "ts-node -r tsconfig-paths/register src/server.ts"
}
```

**Frontend**: Already configured in `vite.config.ts`

### Tailwind Styles Not Applying

1. Check `tailwind.config.js` `content` paths
2. Restart Vite dev server
3. Clear browser cache

---

## Useful Commands Cheat Sheet

```bash
# Development
npm run dev                # Run both services
npm run dev:backend       # Backend only
npm run dev:frontend      # Frontend only

# Building
npm run build             # Build both
npm run build:backend     # Backend only
npm run build:frontend    # Frontend only

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode

# Code Quality
npm run lint              # Lint all code
npm run lint:fix          # Fix linting issues
npm run format            # Format with Prettier
npm run typecheck         # Type check

# Database
mongosh                   # MongoDB shell
npm run seed              # Seed test data (if script exists)

# Cleanup
npm run clean             # Remove node_modules and builds
```

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Document Version**: 1.0
**Last Updated**: 2024-01-25
**Maintained By**: Development Team
