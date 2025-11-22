# Common Patterns

This document outlines common coding patterns used throughout the Ask Annie codebase.

---

## Backend Patterns

### Controller Pattern

All controllers follow async/await pattern with try-catch and NextFunction for error handling:

```typescript
export async function controllerName(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract and validate input
    const { field } = req.body;

    // 2. Log operation
    logger.info('Operation started', { context });

    // 3. Business logic / database operations
    const result = await Service.operation(field);

    // 4. Send success response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // 5. Pass errors to error handler middleware
    next(error);
  }
}
```

**Key Points:**
- Return type is `Promise<void>` (response sent via `res.json()`)
- Use `next(error)` instead of throwing
- Log important operations with structured context
- Consistent response format: `{ success: boolean, data?: any, error?: string }`

**Example:** `backend/src/controllers/authController.ts:12`

---

### Service Layer Pattern

Services contain business logic and are pure functions that return data:

```typescript
export async function serviceName(params: ParamsType): Promise<ReturnType> {
  // 1. Validate inputs
  if (!params.required) {
    throw new Error('Validation message');
  }

  // 2. Database operations
  const data = await Model.find(query);

  // 3. Transform/process data
  const processed = data.map(transform);

  // 4. Return results
  return processed;
}
```

**Key Points:**
- Pure functions - no side effects on req/res
- Throw errors (caught by controller)
- Type-safe parameters and return values
- Single responsibility per function

**Example:** `backend/src/services/parsingService.ts`

---

### Validation Pattern

Use Joi schemas for request validation with `validateRequest` middleware:

```typescript
// Define schema
const createSchema = Joi.object({
  field: Joi.string().required(),
  optional: Joi.number().optional(),
});

// Apply to route
router.post(
  '/endpoint',
  validateRequest(createSchema),
  controller
);
```

**Key Points:**
- Schemas defined near route definitions
- Validation happens before controller execution
- Consistent error messages via validateRequest middleware
- Use `.required()` explicitly for required fields

**Example:** `backend/src/utils/validation.ts`

---

### Authentication Pattern

Protect routes with `authenticateJWT` middleware:

```typescript
router.get(
  '/protected',
  authenticateJWT,
  controller
);

// In controller, access user via req.user
export async function controller(req: Request, res: Response) {
  const userId = req.user?.id; // Type-safe via augmented Request
  // ...
}
```

**Key Points:**
- JWT stored in HTTP-only cookies
- `req.user` populated by middleware
- User type: `{ id: string, email: string, username: string }`

**Example:** `backend/src/middleware/auth.ts`

---

### Logging Pattern

Use structured logging with context:

```typescript
import { logger } from '../utils/logger';

// Info logs - normal operations
logger.info('Operation description', {
  userId,
  contextField: value,
});

// Warn logs - recoverable issues
logger.warn('Issue description', {
  field: problematicValue,
});

// Error logs - failures
logger.error('Error description', {
  error: error.message,
  stack: error.stack,
});
```

**Key Points:**
- Always include relevant context object
- Use appropriate log level
- Avoid logging sensitive data (passwords, tokens)

**Example:** Throughout `backend/src/controllers/`

---

### Database Model Pattern

MongoDB models use Mongoose with TypeScript interfaces:

```typescript
// Define interface
export interface IModel extends Document {
  field: string;
  optionalField?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define schema
const modelSchema = new Schema<IModel>(
  {
    field: { type: String, required: true },
    optionalField: { type: Number },
  },
  {
    timestamps: true, // Auto-creates createdAt/updatedAt
  }
);

export default mongoose.model<IModel>('Model', modelSchema);
```

**Key Points:**
- Interface extends `Document` for Mongoose types
- Use `timestamps: true` for audit fields
- Export both interface and model

**Example:** `backend/src/models/CheckIn.ts`, `backend/src/models/User.ts`

---

### SymptomValue Pattern

All symptom data uses the standardized SymptomValue interface:

```typescript
interface SymptomValue {
  value: string | number | boolean;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

// Usage in CheckIn
interface CheckIn {
  symptoms: Record<string, SymptomValue>;
}

// Example
const checkIn = {
  symptoms: {
    pain_level: { value: 7, severity: 'moderate', notes: 'worse in morning' },
    hand_grip: { value: 'weak', severity: 'severe' },
    raynauds_event: { value: true },
  },
};
```

**Key Points:**
- Flexible value types accommodate different symptom formats
- Optional severity and notes for additional context
- Record type allows any symptom name

**Example:** `backend/src/models/CheckIn.ts:10-15`

---

## Frontend Patterns

### Component Pattern

Components use TypeScript, forwardRef for ref support, and comprehensive props interfaces:

```typescript
export interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Prop description with JSDoc
   * @default 'defaultValue'
   */
  prop?: 'option1' | 'option2';

  /** Required prop */
  required: string;

  /** Child elements */
  children?: ReactNode;
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ prop = 'defaultValue', required, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('base-classes', className)} {...props}>
        {children}
      </div>
    );
  }
);

Component.displayName = 'Component';
```

**Key Points:**
- Extend appropriate HTML attributes for native props
- Use JSDoc for prop documentation (shows in IDE)
- Default values in destructuring
- Use `forwardRef` for ref support
- Set `displayName` for better debugging
- Spread remaining props with `...props`

**Example:** `frontend/src/components/ui/Button.tsx`

---

### Styling Pattern

Use Tailwind CSS with the `cn()` utility for conditional classes:

```typescript
import { cn } from '../../utils/cn';

const Component = ({ variant, className }) => {
  return (
    <div
      className={cn(
        // Base classes (always applied)
        'flex items-center gap-2 rounded-md',

        // Conditional classes
        {
          'bg-primary text-white': variant === 'primary',
          'bg-secondary text-gray-900': variant === 'secondary',
        },

        // User-provided classes (override base)
        className
      )}
    >
      Content
    </div>
  );
};
```

**Key Points:**
- Base classes first, then conditional, then user `className`
- Use design system tokens (primary, secondary, etc.)
- Mobile-first responsive design: `md:`, `lg:` prefixes
- Prefer utility classes over custom CSS

**Example:** `frontend/src/components/ui/Button.tsx:85-120`

---

### State Management Pattern

Use Zustand for global state with TypeScript:

```typescript
interface StoreState {
  // State
  data: DataType[];
  loading: boolean;

  // Actions
  setData: (data: DataType[]) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  data: [],
  loading: false,

  // Actions
  setData: (data) => set({ data }),

  fetchData: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/endpoint');
      set({ data: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
```

**Key Points:**
- Define interface for type safety
- Separate state and actions in interface
- Use `set` to update state
- Use `get` to read current state in actions
- Handle loading states explicitly

**Example:** `frontend/src/stores/` (if exists)

---

### API Call Pattern

Use axios with proper error handling:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies
});

// In component or hook
try {
  const response = await api.post('/endpoint', data);

  if (response.data.success) {
    // Handle success
    return response.data.data;
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle API errors
    const message = error.response?.data?.error || 'Request failed';
    console.error(message);
  }
  throw error;
}
```

**Key Points:**
- Set `withCredentials: true` for cookie-based auth
- Check `response.data.success` for business logic errors
- Use `axios.isAxiosError()` type guard
- Extract error messages from `response.data.error`

---

### Form Pattern

Forms use controlled components with validation:

```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
});
const [errors, setErrors] = useState<Record<string, string>>({});

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  // Clear error on change
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Validate
  const newErrors: Record<string, string> = {};
  if (!formData.field1) newErrors.field1 = 'Required';

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Submit
  try {
    await api.post('/endpoint', formData);
  } catch (error) {
    // Handle error
  }
};
```

**Key Points:**
- Controlled components (value + onChange)
- Clear errors on field change
- Validate before submission
- Use Record<string, string> for error objects

---

### Accessibility Pattern

All interactive components follow WCAG 2.1 AA standards:

```typescript
<button
  type="button"
  aria-label="Descriptive action" // For icon-only buttons
  aria-describedby="help-text-id" // Link to help text
  disabled={isDisabled}
  className={cn(
    'focus:ring-2 focus:ring-primary', // Visible focus indicator
    'disabled:opacity-50 disabled:cursor-not-allowed' // Disabled states
  )}
>
  <span className="sr-only">Screen reader text</span>
  <Icon aria-hidden="true" /> {/* Decorative icons */}
</button>
```

**Key Points:**
- Use semantic HTML elements
- Add ARIA labels for icon-only buttons
- Include visible focus indicators
- Mark decorative icons with `aria-hidden="true"`
- Use `.sr-only` for screen reader only content
- Ensure minimum color contrast ratios
- Support keyboard navigation

**Example:** `frontend/src/components/ui/Button.tsx`

---

## Testing Patterns

### Backend Test Pattern

```typescript
describe('Feature/Component', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should handle normal case', async () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.field).toBe('expected');
  });

  it('should handle error case', async () => {
    await expect(
      functionUnderTest(invalidInput)
    ).rejects.toThrow('Expected error');
  });
});
```

---

### Frontend Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('should render with props', () => {
    render(<Component prop="value">Text</Component>);

    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    render(<Component onClick={handleClick} />);

    await fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Key Points:**
- Test user-facing behavior, not implementation
- Use `screen.getByRole()` for accessibility
- Use `vi.fn()` for mocks (Vitest)
- Aim for 95%+ coverage

---

## File Organization

### Backend Structure
```
backend/src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # Route definitions
├── services/        # Business logic
├── utils/           # Shared utilities
└── __tests__/       # Test files
```

### Frontend Structure
```
frontend/src/
├── components/      # React components
│   └── ui/          # Design system components
├── pages/           # Page components
├── stores/          # Zustand stores
├── utils/           # Shared utilities
├── hooks/           # Custom React hooks
└── types/           # TypeScript types
```

---

## Naming Conventions

- **Files:** PascalCase for components, camelCase for utilities
- **Components:** PascalCase (`Button.tsx`, `CheckInForm.tsx`)
- **Interfaces:** PascalCase with `I` prefix (`IUser`, `ICheckIn`)
- **Functions:** camelCase (`parseSymptoms`, `authenticateJWT`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **CSS Classes:** kebab-case or Tailwind utilities
- **Test Files:** Match source file with `.test.ts(x)` suffix

---

## Git Commit Conventions

Follow conventional commits format:

```
type(scope): description

Body (optional)

Footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
- `feat(auth): add JWT cookie authentication`
- `fix(parsing): handle edge case in symptom parsing`
- `docs: update README with setup instructions`
- `refactor(components): extract common Button component`

---

## Environment Variables

**Backend (.env):**
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ask-annie
JWT_SECRET=your-secret-key
COOKIE_SECRET=your-cookie-secret
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3000
```

**Key Points:**
- Never commit `.env` files
- Use `.env.example` as template
- Prefix frontend vars with `VITE_`
- Access via `process.env.VAR_NAME` (backend) or `import.meta.env.VITE_VAR_NAME` (frontend)
