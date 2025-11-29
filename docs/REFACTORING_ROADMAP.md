# Refactoring & Architecture Improvement Roadmap

**Version:** 1.0
**Created:** 2025-11-29
**Purpose:** Strategic plan for improving codebase maintainability, scalability, and AI-assistant effectiveness

---

## Executive Summary

This roadmap prioritizes technical improvements that will make Annie's Health Journal more maintainable, scalable, and optimized for AI-assisted development. Based on research into AI-friendly codebases and analysis of our current technical debt, this plan focuses on **context clarity**, **pattern consistency**, and **developer experience**.

### Key Principles
1. **AI-First Development**: Structure code for maximum AI comprehension and assistance
2. **Progressive Enhancement**: Improve without breaking existing functionality
3. **Measurable Impact**: Each change should demonstrably improve maintainability or performance
4. **Documentation as Code**: Context files that help both humans and AI understand the system

---

## Phase 1: Foundation - AI Context & Configuration Management

**Goal**: Establish clear context for AI assistants and prevent configuration errors

**Duration**: 2-3 days
**Impact**: High - Prevents bugs, improves AI effectiveness
**Priority**: P0 - Should be done first

### 1.1 Environment Variable Validation (#143)
**Why this matters for AI**: AI assistants can't detect missing env vars at runtime. Validation catches issues before deployment.

**Implementation**:
- Use Zod for schema-based validation
- Validate on app startup (fail fast)
- Generate TypeScript types from schema
- Document all env vars with examples

```typescript
// backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(20),
  RP_ID: z.string().min(3), // NEW: Prevents passkey config issues!
  WEBAUTHN_ORIGIN: z.string().url(),
  // ... all env vars
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

**Benefits**:
- Catches missing env vars immediately (like the RP_ID issue we just hit!)
- Self-documenting configuration
- Type-safe env access
- AI can understand required configuration

**Files affected**: `backend/src/config/env.ts` (new), `backend/src/server.ts`

---

### 1.2 Create CLAUDE.md Context Files
**Why this matters**: Industry best practice for AI-assisted development. 73% of developers report AI performs poorly without proper context files.

**Create these files**:

#### `.claude/PROJECT.md` (Root)
```markdown
# Annie's Health Journal

## Project Overview
Daily health symptom tracker with voice-first input and AI-powered insights.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind
- Backend: Express + TypeScript + MongoDB
- Auth: Passwordless (Magic Links + Passkeys)
- Voice: Web Audio API → Whisper transcription

## Key Patterns
- Controllers use try/catch → next(error)
- Services return data, controllers handle responses
- Frontend: Zustand for state, React Hook Form for forms
- Always use .lean() on MongoDB read queries

## Before Implementing
1. Find similar existing code first
2. Match existing patterns exactly
3. Use design system components (don't create new buttons/inputs)
4. Read memories: 03-tech-stack, 07-coding-patterns

## Quality Standards
- Backend: >80% test coverage
- Frontend: >70% test coverage
- Zero TypeScript errors
- Zero linting warnings
- All tests must pass before PR

## Development Workflow
See docs/WORKFLOW.md for complete guide
```

#### `.claude/PATTERNS.md`
```markdown
# Code Patterns Reference

Quick reference for common implementation patterns.
See memories/07-coding-patterns-consistency.md for complete guide.

## Controller Pattern
[Paste standard controller pattern from memory]

## Service Pattern
[Paste standard service pattern from memory]

## Component Pattern
[Paste standard component pattern from memory]

[etc...]
```

#### `.claude/ARCHITECTURE.md`
```markdown
# System Architecture

## Data Flow
User → React → API Service → Controller → Service → MongoDB

## Authentication Flow
1. User requests magic link
2. Email sent via Resend
3. User clicks link with token
4. Backend verifies token, issues JWT
5. JWT stored in localStorage
6. Axios interceptor adds JWT to requests

## File Organization
[Document current structure]

## Key Design Decisions
[Reference tech stack memory]
```

**Benefits**:
- AI assistants understand project immediately
- Faster onboarding for new developers
- Consistent code generation
- Reduces need to repeat context

**Estimated effort**: 4-6 hours

---

### 1.3 Extract Magic Numbers to Constants (#142)
**Why this matters for AI**: Magic numbers make code hard to understand. Named constants are self-documenting.

**Create**: `backend/src/constants/index.ts` and `frontend/src/constants/index.ts`

```typescript
// backend/src/constants/index.ts
export const AUTH_CONSTANTS = {
  MAGIC_LINK_EXPIRY_MINUTES: 15,
  JWT_EXPIRY_DAYS: 7,
  RATE_LIMIT_REQUESTS: 3,
  RATE_LIMIT_WINDOW_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  TOKEN_LENGTH_BYTES: 32,
} as const;

export const VALIDATION_CONSTANTS = {
  MIN_USERNAME_LENGTH: 2,
  MAX_USERNAME_LENGTH: 50,
  MAX_NOTES_LENGTH: 5000,
  MAX_SYMPTOM_VALUE: 10,
} as const;

export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Export all
export * from './auth';
export * from './validation';
```

**Find and replace**:
- `15` (minutes) → `AUTH_CONSTANTS.MAGIC_LINK_EXPIRY_MINUTES`
- `3` (rate limit) → `AUTH_CONSTANTS.RATE_LIMIT_REQUESTS`
- `64` (token length) → `AUTH_CONSTANTS.TOKEN_LENGTH_BYTES * 2`
- etc.

**Benefits**:
- Self-documenting code
- Single source of truth
- Easy to adjust values
- AI can understand intent

**Files affected**: ~15 files across backend/frontend

---

## Phase 2: Type Safety & Code Quality

**Goal**: Improve type safety and remove code smells

**Duration**: 2-3 days
**Impact**: Medium-High
**Priority**: P1

### 2.1 Remove Double Type Assertions (#175)
**Why this matters for AI**: Double assertions (`as unknown as`) hide type issues and confuse AI about actual types.

**Solution**: Create proper lean types for Mongoose

```typescript
// backend/src/models/Passkey.ts
export interface IPasskeyLean {
  _id: string;
  userId: string;
  credentialId: string;
  publicKey: Buffer;
  counter: number;
  transports?: string[];
  deviceName?: string;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Then use:
const passkeys = await Passkey.find({ userId }).lean() as IPasskeyLean[];
```

**Benefits**:
- True type safety
- AI understands actual data shape
- Better autocomplete
- Catches bugs at compile time

**Files affected**: `passkeyController.ts`, `Passkey.ts`, `webauthnService.ts`

---

### 2.2 Add Database Indexes (#140)
**Why this matters**: Performance optimization. AI can't optimize queries without knowing access patterns.

**Document query patterns first**, then add indexes:

```typescript
// backend/src/models/CheckIn.ts
checkInSchema.index({ userId: 1, timestamp: -1 }); // Get user's check-ins sorted by date
checkInSchema.index({ userId: 1, createdAt: -1 }); // Recent check-ins
checkInSchema.index({ flaggedForDoctor: 1, userId: 1 }); // Flagged items

// backend/src/models/User.ts
userSchema.index({ email: 1 }, { unique: true }); // Unique email lookup

// backend/src/models/MagicLinkToken.ts
magicLinkSchema.index({ token: 1 }, { unique: true }); // Fast token lookup
magicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

**Document in code**:
```typescript
/**
 * Common query patterns for this collection:
 * 1. Get user's recent check-ins: find({userId}).sort({timestamp: -1})
 * 2. Get flagged items: find({userId, flaggedForDoctor: true})
 * 3. Date range queries: find({userId, timestamp: {$gte, $lte}})
 *
 * Indexes support these patterns for O(log n) performance.
 */
```

**Benefits**:
- Faster queries
- Documented access patterns
- AI understands data access
- Prevents slow queries

---

### 2.3 Remove Code Duplication in analysisService (#141)
**Why this matters**: DRY principle. Duplicated code = duplicated bugs. AI has to learn multiple implementations of same logic.

**Refactor symptom extraction**:

```typescript
// Before: Duplicated in multiple functions
function extractSymptomFrequency(checkIns) {
  const symptoms = {};
  checkIns.forEach(ci => {
    Object.keys(ci.structured?.symptoms || {}).forEach(symptom => {
      symptoms[symptom] = (symptoms[symptom] || 0) + 1;
    });
  });
  return symptoms;
}

// After: Shared utility
// backend/src/utils/symptomUtils.ts
export function extractSymptoms(checkIns: CheckIn[]): Map<string, number> {
  const symptomCounts = new Map<string, number>();

  for (const checkIn of checkIns) {
    const symptoms = checkIn.structured?.symptoms || {};
    for (const symptomName of Object.keys(symptoms)) {
      symptomCounts.set(
        symptomName,
        (symptomCounts.get(symptomName) || 0) + 1
      );
    }
  }

  return symptomCounts;
}

export function calculateSymptomStats(checkIns: CheckIn[], symptomName: string) {
  const values = checkIns
    .map(ci => ci.structured?.symptoms?.[symptomName])
    .filter((v): v is number => typeof v === 'number');

  if (values.length === 0) return null;

  return {
    count: values.length,
    average: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
```

**Benefits**:
- Single source of truth
- Easier to test
- AI learns one pattern, not three
- Bugs fixed in one place

**Files affected**: `analysisService.ts`, new `symptomUtils.ts`

---

## Phase 3: Architecture & Scalability

**Goal**: Improve code organization and scalability

**Duration**: 3-4 days
**Impact**: High (long-term)
**Priority**: P1-P2

### 3.1 Shared Component Library Improvements (#135)
**Why this matters**: Consistency + reusability. AI should use existing components, not create new ones.

**Create shared layout components**:

```typescript
// frontend/src/components/layouts/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: 'dashboard' | 'trends' | 'settings' | 'checkin';
}

export function AppLayout({ children, currentPage }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

// Usage in pages:
export default function DashboardPage() {
  return (
    <AppLayout currentPage="dashboard">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page content */}
      </div>
    </AppLayout>
  );
}
```

**Benefits**:
- DRY - no repeated layout code
- Consistent page structure
- Easy to add app-wide features (footer, sidebar, etc.)
- AI uses one pattern for all pages

---

### 3.2 API Error Handling Improvements (#162)
**Why this matters**: User-friendly errors. AI should generate consistent error messages.

**Create error utility**:

```typescript
// frontend/src/utils/errorMessages.ts
export const ERROR_MESSAGES = {
  RATE_LIMIT_429: (retryMinutes: number) =>
    `Too many login attempts. For security, you can only request 3 magic links per 15 minutes. Please check your email for a recent link, or try again in ${retryMinutes} minutes.`,

  NETWORK_ERROR: () =>
    'Unable to connect. Please check your internet connection and try again.',

  SERVER_ERROR: () =>
    'Something went wrong on our end. Please try again in a few moments.',

  VALIDATION_ERROR: (field: string) =>
    `${field} is required and must be valid.`,
} as const;

// Helper to extract user-friendly message
export function getUserFriendlyError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    switch (status) {
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT_429(15); // TODO: parse retry-after header
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR();
      default:
        return message || 'An unexpected error occurred.';
    }
  }

  if (!navigator.onLine) {
    return ERROR_MESSAGES.NETWORK_ERROR();
  }

  return error instanceof Error ? error.message : 'An error occurred';
}
```

**Benefits**:
- Consistent error UX
- Single source of error messages
- AI uses standard error handling
- Easy to translate later

---

### 3.3 Add Frontend Performance Optimizations (#138)
**Why this matters**: Prevent unnecessary re-renders. AI should know when to use useMemo/useCallback.

**Document optimization patterns**:

```typescript
// PATTERN.md addition
## Performance Optimization Pattern

### When to use useMemo
- Expensive calculations
- Derived data from large lists
- Props passed to optimized components

### When to use useCallback
- Callbacks passed to optimized child components
- Dependency of useEffect/useMemo
- Event handlers for frequently re-rendering components

### Example
export function ExpensiveComponent({ data }: Props) {
  // ✅ Memoize expensive calculation
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  // ✅ Memoize callback for child component
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return <ChildComponent data={processedData} onClick={handleClick} />;
}
```

**Audit existing components** and add memoization where beneficial.

---

## Phase 4: Developer Experience

**Goal**: Improve tooling and developer workflows

**Duration**: 2 days
**Impact**: Medium
**Priority**: P2

### 4.1 API Versioning Strategy (#144)
**Why this matters**: Future-proofing. AI should understand versioning when generating endpoints.

**Implementation approach**:

```typescript
// backend/src/routes/index.ts
import express from 'express';
import v1Routes from './v1';

const router = express.Router();

// Current routes (backward compatibility)
router.use('/api', v1Routes);

// Versioned routes
router.use('/api/v1', v1Routes);

export default router;

// backend/src/routes/v1/index.ts
import { Router } from 'express';
import authRoutes from './auth';
import checkInRoutes from './checkIns';
import analysisRoutes from './analysis';

const router = Router();

router.use('/auth', authRoutes);
router.use('/checkins', checkInRoutes);
router.use('/analysis', analysisRoutes);

export default router;
```

**Documentation**:
```markdown
## API Versioning

Current version: v1

### Versioning Strategy
- Major breaking changes → new version (v2)
- Backward-compatible changes → same version
- Deprecation period: 90 days minimum
- Version in URL: /api/v1/resource

### When to Create New Version
- Changing response schema (removing/renaming fields)
- Changing authentication method
- Removing endpoints
- Changing validation rules (stricter)

### Safe Changes (Same Version)
- Adding new endpoints
- Adding optional fields to requests
- Adding fields to responses
- Making validation less strict
```

**Benefits**:
- Future flexibility
- Backward compatibility
- Clear upgrade paths
- AI understands versioning

---

### 4.2 Error Tracking with Sentry (#147)
**Why this matters**: Catch production errors. AI can reference Sentry docs for implementation.

**Setup** (defer to later, document for now):
- Add Sentry SDK
- Track backend errors
- Track frontend errors
- Source maps for debugging

---

## Phase 5: Mobile & Performance

**Goal**: Optimize for mobile and improve performance

**Duration**: 4-5 days
**Impact**: High (user-facing)
**Priority**: P1 (some items)

### 5.1 Code Splitting & Lazy Loading (#136)
**Why this matters**: Large bundle size (916KB!). AI should know code-splitting patterns.

**Implementation**:

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load route components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TrendsPage = lazy(() => import('./pages/TrendsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Split vendor bundles**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['recharts', '@headlessui/react'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
  },
});
```

**Target**: Reduce initial bundle to <300KB

---

### 5.2 PWA with Service Worker (#139)
**Why this matters**: Offline support, app-like experience.

**Defer to Phase 6** - document approach for now.

---

## Phase 6: Feature Work

These can be done alongside refactoring:

### 6.1 Passkey Onboarding (#173)
**When**: After Phase 1 (env validation done)
**Benefit**: Increase passkey adoption

### 6.2 Component Testing Improvements
**When**: Ongoing
**Benefit**: Maintain test coverage as we refactor

---

## Implementation Priority Matrix

### Do First (P0 - Blocking for quality)
1. **Environment variable validation** (#143) - 1 day
2. **CLAUDE.md context files** - 0.5 days
3. **Extract magic numbers** (#142) - 0.5 days

**Total: 2 days**

### Do Next (P1 - High value, enables other work)
4. **Remove double type assertions** (#175) - 0.5 days
5. **Database indexes** (#140) - 0.5 days
6. **Remove code duplication** (#141) - 1 day
7. **Shared layouts** (#135) - 1 day
8. **Error message improvements** (#162) - 0.5 days
9. **Code splitting** (#136) - 1 day

**Total: 4.5 days**

### Do Later (P2 - Nice to have, optimize)
10. **Frontend performance** (#138) - 1 day
11. **API versioning** (#144) - 1 day
12. **PWA** (#139) - 3 days

**Total: 5 days**

---

## Success Metrics

### Code Quality
- ✅ Zero TypeScript errors (maintain)
- ✅ Zero linting warnings (maintain)
- ✅ >80% backend test coverage (maintain)
- ✅ >70% frontend test coverage (maintain)
- 🎯 <5 magic numbers in codebase
- 🎯 All env vars validated
- 🎯 Zero double type assertions

### Performance
- 🎯 Initial bundle <300KB (currently 916KB)
- 🎯 All database queries indexed
- 🎯 No unnecessary re-renders in hot paths

### Developer Experience
- 🎯 AI assistants can understand codebase from context files
- 🎯 New developers onboard in <1 hour
- 🎯 All patterns documented

### User Experience
- 🎯 Helpful error messages (no "status 429")
- 🎯 Fast page loads (<2s)
- 🎯 Passkey adoption >30%

---

## AI-Friendly Codebase Checklist

Based on industry research, our codebase should have:

- [x] TypeScript with strict mode
- [x] Comprehensive test coverage
- [x] Consistent patterns (controllers, services, components)
- [ ] CLAUDE.md context files **← Phase 1**
- [ ] Environment validation **← Phase 1**
- [ ] No magic numbers **← Phase 1**
- [ ] Clear error messages **← Phase 2**
- [ ] No code duplication **← Phase 2**
- [ ] Documented query patterns **← Phase 2**
- [ ] Performance optimizations **← Phase 3**
- [ ] API versioning strategy **← Phase 4**

---

## Next Steps

1. **Review this plan** - discuss priorities
2. **Create tracking issue** - Epic for refactoring
3. **Start Phase 1** - env validation + context files
4. **Iterate** - complete phases in order
5. **Measure** - track metrics above

---

## References

- [AI-Ready Codebase Guide 2025](https://llmx.de/blog/ai-ready-codebase-claude-cursor-integration-guide/)
- [Structuring Codebases for AI Tools](https://www.propelcode.ai/blog/structuring-codebases-for-ai-tools-2025-guide)
- [Best Practices for AI Coding Assistants](https://graphite.com/guides/best-practices-ai-coding-assistants)
- Project memories: 03-tech-stack, 04-testing-standards, 07-coding-patterns

---

**Status**: Draft for review
**Owner**: Development team
**Last updated**: 2025-11-29
