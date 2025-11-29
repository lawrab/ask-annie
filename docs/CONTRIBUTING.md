# Contributing to Annie's Health Journal

Thank you for your interest in contributing! This guide covers code standards, patterns, and best practices for this project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Coding Patterns](#coding-patterns)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Podman or Docker
- Git and GitHub CLI (`gh`)
- Basic knowledge of TypeScript, React, Express, MongoDB

### Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete setup instructions.

```bash
# Clone and setup
git clone https://github.com/lrabbets/annies-health-journal.git
cd annies-health-journal
make deps-up
make install
make dev
```

---

## Development Workflow

**Read [WORKFLOW.md](WORKFLOW.md) for the complete workflow.**

Quick summary:
1. Select issue → 2. Create branch → 3. Develop → 4. Quality checks → 5. Manual test → 6. PR → 7. Review → 8. Merge

**🤖 For Claude Code sessions:** Start by reading the "For Claude Code Sessions" section in WORKFLOW.md to ensure consistency across context resets.

---

## Code Standards

### Language & Style

- **TypeScript** in strict mode for all code
- **ESLint + Prettier** for formatting (auto-fix on save)
- **No `any` types** except in test files (use `unknown` if needed)
- **Named exports** preferred over default exports
- **Functional components** with hooks (React)

### Quality Requirements

| Metric | Target | Command |
|--------|--------|---------|
| TypeScript Errors | 0 | `npm run typecheck` |
| Linting Errors/Warnings | 0 | `npm run lint` |
| Test Coverage | Backend >80%, Frontend >70% | `npm test -- --coverage` |
| All Tests | Pass | `npm test` |
| Build | Success | `npm run build` |

**All must pass before PR can be merged.**

### File Organization

```
backend/src/
├── controllers/      # Request handlers (thin, delegate to services)
├── services/         # Business logic (reusable, testable)
├── models/           # Mongoose schemas
├── middleware/       # Express middleware
├── routes/           # Route definitions
└── utils/            # Shared utilities

frontend/src/
├── components/       # Reusable UI (use design system!)
├── pages/            # Page components
├── stores/           # Zustand stores
├── services/         # API clients
└── hooks/            # Custom React hooks
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `CheckInCard.tsx` |
| Functions | camelCase | `handleSubmit`, `calculateStats` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Interfaces | PascalCase | `User`, `CheckInData` |
| Files | Match content | `userController.ts`, `Button.tsx` |
| Test files | Same + `.test` | `Button.test.tsx` |
| Branches | `type/issue-desc` | `feature/160-account-deletion` |

---

## Coding Patterns

**🎯 Golden Rule: Find similar existing code and match its patterns.**

### Before Writing Code

1. **Search for similar implementations:**
   ```bash
   # Use Glob to find similar files
   # Use Grep to find similar patterns
   # Read 2-3 examples before writing new code
   ```

2. **Check the design system:**
   - Run Storybook: `npm run storybook`
   - Use existing components (don't reinvent Button, Input, Modal, etc.)

3. **Read coding patterns memory:**
   - Use `/patterns` slash command in Claude Code
   - Or read Serena memory: `07-coding-patterns-consistency`

### Backend Patterns

#### Controller Pattern

```typescript
export async function myController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;
    logger.info('Action started', { userId });

    // Validate input
    if (!req.body.field) {
      res.status(400).json({
        success: false,
        error: 'Field is required',
      });
      return;
    }

    // Delegate business logic to service
    const result = await MyService.doWork(userId, req.body);

    logger.info('Action completed', { userId });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Action failed', { error });
    next(error); // Let error middleware handle it
  }
}
```

**Key points:**
- Use `try/catch` + `next(error)` for error handling
- Extract `userId` from `req.user` (set by auth middleware)
- Validate at controller level, return early
- Use `logger` with context objects
- Explicit `Promise<void>` return type
- Delegate business logic to services

#### Service Pattern

```typescript
export async function calculateStats(userId: string) {
  const checkIns = await CheckIn.find({ userId })
    .sort({ timestamp: -1 })
    .lean(); // Use .lean() for read-only queries

  return {
    total: checkIns.length,
    // ... computed values
  };
}
```

**Key points:**
- Pure functions where possible
- No `res.json()` calls (services don't know about HTTP)
- Return data, let controller handle response
- Use `.lean()` for read-only MongoDB queries

#### MongoDB Queries

```typescript
// READ: Use .lean() for better performance
const users = await User.find({ active: true })
  .select('username email') // Only select needed fields
  .lean();

// WRITE: Don't use .lean()
const user = await User.findById(userId);
user.name = 'New Name';
await user.save();
```

### Frontend Patterns

#### Component Pattern

```typescript
interface MyComponentProps {
  userId: string;
  onSave: (data: Data) => void;
}

export function MyComponent({ userId, onSave }: MyComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Early returns for loading/error states
  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return <div>{/* JSX */}</div>;
}
```

**Key points:**
- Interface for props
- Named export (not default)
- TypeScript for all props and state
- Early returns for loading/error states
- Use design system components (`Alert`, `Button`, etc.)

#### State Management (Zustand)

```typescript
interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// Use with selectors to prevent unnecessary re-renders
const user = useAuthStore((state) => state.user);
const logout = useAuthStore((state) => state.logout);
```

#### API Calls

```typescript
// In services/api.ts
export const userApi = {
  async exportData() {
    const response = await api.get('/api/user/export');
    return response.data; // Return data directly
  },

  async deleteAccount(token: string) {
    const response = await api.delete('/api/user/account', {
      data: { deletionToken: token },
    });
    return response.data;
  },
};
```

**Key points:**
- API calls in `services/api.ts`
- Use axios with interceptors (already configured)
- Return data directly, not full response
- Group related endpoints in objects (`userApi`, `checkInApi`)

---

## Testing Guidelines

### Backend Tests (Jest)

```typescript
describe('UserController', () => {
  let mockUser: User;

  beforeEach(async () => {
    mockUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should export user data successfully', async () => {
    const res = await request(app)
      .get('/api/user/export')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
  });

  it('should return 401 without auth', async () => {
    await request(app)
      .get('/api/user/export')
      .expect(401);
  });
});
```

**Key points:**
- Use `supertest` for API testing
- Setup/cleanup in `beforeEach`/`afterEach`
- Test both success and error cases
- Use `.expect()` for status codes

### Frontend Tests (Vitest + Testing Library)

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<MyComponent userId="123" onSave={vi.fn()} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(<MyComponent userId="123" onSave={handleSave} />);
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});
```

**Key points:**
- Use Testing Library (not Enzyme)
- Test user behavior, not implementation
- Use `userEvent` for interactions
- Query by role/label (accessible)
- Clear mocks in `beforeEach`

### Test Coverage Requirements

- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

Run coverage reports:
```bash
npm test -- --coverage
```

---

## Documentation

### Code Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Calculate expiry 15 minutes from now to prevent token reuse attacks
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

// ❌ Bad: Explaining obvious code
// Set expiresAt to current time plus 15 minutes
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
```

### JSDoc for Public APIs

```typescript
/**
 * Export all user data in JSON format (GDPR compliance)
 * @requires Authentication
 * @returns User data, check-ins, symptoms, activities, triggers, statistics
 */
export async function exportUserData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ...
}
```

### Update Documentation

When changing functionality, update:
- **API_DOCUMENTATION.md** - For API endpoint changes
- **README.md** - For user-facing features
- **This file** - For new patterns or conventions
- **WORKFLOW.md** - For process changes

---

## Submitting Changes

### Before Creating a PR

Run all quality checks:

```bash
# Backend
cd backend
npm run typecheck    # Must pass
npm run lint         # Must pass
npm test             # All must pass
npm run build        # Must succeed

# Frontend
cd frontend
npm run typecheck    # Must pass
npm run lint         # Must pass
npm test             # All must pass
npm run build        # Must succeed
```

### PR Checklist

- [ ] Code follows style guide
- [ ] All quality checks pass (typecheck, lint, test, build)
- [ ] Tests added for new features
- [ ] Tests updated for changed features
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No console.log or commented code
- [ ] Branch up to date with main
- [ ] PR description is complete
- [ ] Issue linked (`Closes #X`)

### PR Template

```markdown
## Description
Brief overview of what this PR does.

## Changes
- List of key changes

## Testing
- [x] All unit tests pass
- [x] TypeScript compiles
- [x] Linting passes
- [x] Manual testing completed

## Screenshots
(if UI changes)

## Breaking Changes
None (or list them)

Closes #<issue-number>
```

### Review Process

1. Automated CI runs all checks
2. Reviewer examines code quality
3. Address feedback
4. Re-request review
5. Merge with squash

---

## Common Mistakes to Avoid

### ❌ Don't

```typescript
// Don't use any without eslint-disable
const data: any = getData();

// Don't use default exports
export default function MyComponent() {}

// Don't handle errors with res.status(500)
catch (error) {
  res.status(500).json({ error: 'Error' });
}

// Don't use console.log in production
console.log('Debug:', data);

// Don't forget .lean() on read queries
const users = await User.find({});
```

### ✅ Do

```typescript
// Use specific types
const data: UserData = getData();

// Use named exports
export function MyComponent() {}

// Let error middleware handle it
catch (error) {
  logger.error('Operation failed', { error });
  next(error);
}

// Use logger
logger.info('Operation complete', { data });

// Use .lean() for reads
const users = await User.find({}).lean();
```

---

## Getting Help

### Resources

- **Documentation:** `/docs` directory
- **Coding Patterns:** Use `/patterns` command (Claude Code)
- **Workflow:** [WORKFLOW.md](WORKFLOW.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Design System:** Run `npm run storybook`

### Questions?

- Open a GitHub issue for questions
- Check existing issues and PRs
- Read relevant documentation first

---

## Code of Conduct

- Be respectful and constructive
- Follow best practices
- Write clean, maintainable code
- Test your changes thoroughly
- Document what you build
- Help maintain code quality

---

**Thank you for contributing to Annie's Health Journal! 🐰**
