# Code Patterns Reference

Quick reference for common implementation patterns used in Annie's Health Journal.
For complete coding standards, see `docs/CONTRIBUTING.md`.

## Table of Contents
1. [Backend Patterns](#backend-patterns)
2. [Frontend Patterns](#frontend-patterns)
3. [Testing Patterns](#testing-patterns)
4. [Common Pitfalls](#common-pitfalls)

---

## Backend Patterns

### Controller Pattern
Controllers handle HTTP requests/responses. Services contain business logic.

```typescript
// controllers/exampleController.ts
import { Request, Response, NextFunction } from 'express';
import { exampleService } from '../services/exampleService';
import { logger } from '../utils/logger';

export const getExample = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { param } = req.params;

    logger.info('Getting example', { userId, param });

    const data = await exampleService.getData(userId, param);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

**Key points**:
- Use `async/await` for all async operations
- Always use `try/catch → next(error)`
- Log important operations with context
- Return consistent response format: `{ success, data }` or `{ success, error }`
- Extract `userId` from `req.user!.id` (populated by auth middleware)

### Service Pattern
Services contain business logic and database operations.

```typescript
// services/exampleService.ts
import { Example } from '../models/Example';
import { logger } from '../utils/logger';

export const exampleService = {
  async getData(userId: string, param: string) {
    logger.info('Service: Getting data', { userId, param });

    const data = await Example.find({ userId, param })
      .lean() // ALWAYS use .lean() for read operations
      .sort({ createdAt: -1 })
      .limit(20);

    if (!data) {
      throw new Error('Data not found');
    }

    return data;
  },

  async createData(userId: string, input: CreateInput) {
    const newData = await Example.create({
      userId,
      ...input,
    });

    return newData.toObject(); // Convert to plain object
  },
};
```

**Key points**:
- Export services as objects with methods
- **Always** use `.lean()` on read queries (performance!)
- Throw errors for business logic failures
- Return plain objects, not Mongoose documents
- Log with context for debugging

### Validation Pattern
Use Joi for request validation.

```typescript
// utils/validation.ts
import Joi from 'joi';

export const createExampleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  value: Joi.number().integer().min(1).max(10).required(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// In route file
import { validateRequest } from '../middleware/validateRequest';
router.post('/example', validateRequest(createExampleSchema), controller.create);
```

### MongoDB Query Pattern
```typescript
// ✅ Good - Uses lean for performance
const data = await Model.find({ userId })
  .lean()
  .select('field1 field2')
  .sort({ createdAt: -1 })
  .limit(20);

// ❌ Bad - No lean, slow
const data = await Model.find({ userId });

// ✅ Good - Aggregation for complex queries
const stats = await Model.aggregate([
  { $match: { userId } },
  { $group: { _id: '$field', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```

---

## Frontend Patterns

### Page Component Pattern
Page components are route-level components.

```typescript
// pages/ExamplePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { exampleApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export default function ExamplePage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await exampleApi.getData();
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Page Title</h1>
      {/* Content */}
    </div>
  );
}
```

**Key points**:
- Default export for page components
- Use `useNavigate` from react-router for navigation
- Separate loading/error states
- Use design system components (`Button`, `Alert`, etc.)
- Handle errors gracefully with user-friendly messages

### UI Component Pattern
Reusable components in `components/ui/`.

```typescript
// components/ui/Example.tsx
import { ReactNode } from 'react';

interface ExampleProps {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'primary';
  onClick?: () => void;
}

export function Example({
  title,
  children,
  variant = 'default',
  onClick
}: ExampleProps) {
  const variantClasses = {
    default: 'bg-white text-gray-900',
    primary: 'bg-indigo-600 text-white',
  };

  return (
    <div
      className={`rounded-lg p-4 ${variantClasses[variant]}`}
      onClick={onClick}
    >
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
```

**Key points**:
- Named exports for UI components
- Props interface with TypeScript
- Default props using destructuring
- Tailwind CSS for styling
- Composable with `children`

### API Service Pattern
Centralized API calls in `services/api.ts`.

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const exampleApi = {
  async getData() {
    const response = await api.get('/example');
    return response.data;
  },

  async createData(data: CreateInput) {
    const response = await api.post('/example', data);
    return response.data;
  },
};
```

### State Management Pattern (Zustand)
```typescript
// stores/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  items: Item[];
  isLoading: boolean;
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  reset: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  items: [],
  isLoading: false,

  setItems: (items) => set({ items }),

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  reset: () => set({ items: [], isLoading: false }),
}));
```

**Key points**:
- Use Zustand for global state only
- Keep state minimal and focused
- Provide clear action methods
- Use `set((state) => ...)` for state that depends on previous state

---

## Testing Patterns

### Backend Controller Test
```typescript
import request from 'supertest';
import app from '../../server';
import { Example } from '../../models/Example';

describe('Example Controller', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Setup: Create user and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  afterEach(async () => {
    await Example.deleteMany({});
  });

  it('should get data successfully', async () => {
    // Arrange
    await Example.create({ userId, name: 'Test' });

    // Act
    const response = await request(app)
      .get('/api/example')
      .set('Authorization', `Bearer ${authToken}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });
});
```

### Frontend Component Test
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import ExamplePage from '../ExamplePage';

describe('ExamplePage', () => {
  it('should display data after loading', async () => {
    render(
      <BrowserRouter>
        <ExamplePage />
      </BrowserRouter>
    );

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText(/page title/i)).toBeInTheDocument();
    });
  });

  it('should handle button click', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><ExamplePage /></BrowserRouter>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(screen.getByText(/clicked/i)).toBeInTheDocument();
  });
});
```

---

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Missing .lean() - slow performance
const data = await Model.find({ userId });

// Using any type - loses type safety
const handleData = (data: any) => { ... };

// Not handling errors
const response = await api.get('/data'); // Could throw!

// Magic numbers
if (severity > 7) { ... } // What does 7 mean?

// Direct process.env access
const secret = process.env.JWT_SECRET; // Not validated!
```

### ✅ Do This Instead
```typescript
// Use .lean() for performance
const data = await Model.find({ userId }).lean();

// Proper typing
const handleData = (data: DataType) => { ... };

// Handle errors
try {
  const response = await api.get('/data');
} catch (error) {
  console.error('Failed:', error);
}

// Named constants
const SEVERITY_THRESHOLD = 7;
if (severity > SEVERITY_THRESHOLD) { ... }

// Use validated env
import { env } from './config/env';
const secret = env.JWT_SECRET;
```

---

## Quick Reference

**Backend**:
- Controllers → next(error)
- Services → throw errors
- Queries → .lean()
- Validation → Joi schemas
- Logging → logger.info/warn/error

**Frontend**:
- Pages → default export
- Components → named export
- State → Zustand (global) or useState (local)
- API calls → services/api.ts
- Styling → Tailwind CSS

**Testing**:
- Backend → Supertest + Jest
- Frontend → Testing Library + Vitest
- Coverage → >80% backend, >70% frontend
- Tests → Arrange, Act, Assert pattern

**Git**:
- Branch → feat/123-description
- Commit → feat: Description (#123)
- Quality checks → typecheck, lint, test, build
- PR → Merge to main after review
