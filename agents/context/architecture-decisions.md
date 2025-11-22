# Architecture Decision Records (ADRs)

This document tracks key architectural decisions made during the development of Ask Annie.

---

## ADR-001: Container Runtime - Podman over Docker

**Date:** 2024-10-25
**Status:** Accepted

### Context
Need a container runtime for local development dependencies (MongoDB, Redis). Team uses NixOS which has first-class Podman support.

### Decision
Use Podman as the container runtime instead of Docker.

### Consequences

**Positive:**
- Better integration with NixOS
- Rootless containers by default (improved security)
- Compatible with Docker Compose via podman-compose
- No daemon required

**Negative:**
- Some developers may be more familiar with Docker
- Slight differences in CLI usage

**Implementation:**
- Use `make deps-up` to start MongoDB and Redis via Podman
- docker-compose.yml remains compatible with both runtimes

---

## ADR-002: JWT Storage - HTTP-Only Cookies

**Date:** 2024-11-15
**Status:** Accepted

### Context
Need secure authentication mechanism for web application. Options considered:
1. LocalStorage with JWT
2. SessionStorage with JWT
3. HTTP-only cookies with JWT

### Decision
Store JWT tokens in HTTP-only cookies instead of browser storage.

### Consequences

**Positive:**
- Immune to XSS attacks (JavaScript cannot access cookies)
- Automatic transmission with requests
- Secure flag ensures HTTPS-only transmission
- SameSite attribute prevents CSRF attacks

**Negative:**
- Requires CORS configuration for cross-origin requests
- Slightly more complex server setup

**Implementation:**
- Set cookies with: `httpOnly=true`, `secure=true` (production), `sameSite=strict`
- Cookie name: `authToken`
- 7-day expiration by default
- Backend validates on protected routes via auth middleware

**Code Reference:**
- `backend/src/controllers/authController.ts` - Cookie setting
- `backend/src/middleware/auth.ts` - Cookie validation

---

## ADR-003: Database Schema - Flexible Symptom Storage

**Date:** 2024-11-18
**Status:** Accepted

### Context
Symptom tracking needs to accommodate:
- Unknown future symptoms
- Varying data types (boolean, numeric, text)
- User-specific symptom vocabularies
- Structured querying for analysis

### Decision
Use MongoDB with a flexible symptoms object structure in CheckIn documents. Standardize with `SymptomValue` interface:

```typescript
interface SymptomValue {
  value: string | number | boolean
  severity?: 'mild' | 'moderate' | 'severe'
  notes?: string
}

interface CheckIn {
  symptoms: Record<string, SymptomValue>
  // ... other fields
}
```

### Consequences

**Positive:**
- Accommodates any symptom type without schema migrations
- Structured enough for meaningful queries
- Type-safe via TypeScript interfaces
- Easy to extend with new symptom properties

**Negative:**
- Requires validation logic for symptom values
- More complex querying than rigid schema
- Need to handle inconsistent symptom naming

**Implementation:**
- MongoDB CheckIn model with loose symptoms object
- Joi validation for known symptom patterns
- Parsing service normalizes symptom names
- Frontend uses SymptomValue interface consistently

**Code Reference:**
- `backend/src/models/CheckIn.ts` - Schema definition
- `backend/src/services/parsingService.ts` - Symptom normalization
- `backend/src/utils/validation.ts` - Joi schemas

---

## ADR-004: Design System - Tailwind CSS with Custom Tokens

**Date:** 2024-11-19
**Status:** Accepted

### Context
Need consistent, maintainable styling across frontend components. Options:
1. CSS-in-JS (styled-components, Emotion)
2. CSS Modules
3. Tailwind CSS with custom configuration

### Decision
Use Tailwind CSS with custom design tokens defined in `tailwind.config.js`.

### Consequences

**Positive:**
- Utility-first approach speeds up development
- Easy to maintain consistency with design tokens
- Small bundle size (unused styles purged)
- Mobile-first responsive design built-in
- No CSS naming conventions needed

**Negative:**
- Verbose className strings
- Learning curve for Tailwind utilities
- Requires custom config for design system

**Implementation:**
- Design tokens in `tailwind.config.js`:
  - Colors: primary, secondary, accent, neutral scales
  - Typography: headings, body text, captions
  - Spacing: consistent 8px grid
  - Border radius: sm, md, lg
- Component library documented in Storybook
- Mobile-first breakpoints: sm (640px), md (768px), lg (1024px)

**Code Reference:**
- `frontend/tailwind.config.js` - Design tokens
- `frontend/src/components/` - Component implementations
- `docs/DESIGN_SYSTEM.md` - Design system documentation

---

## ADR-005: Testing Requirements - 95%+ Coverage Minimum

**Date:** 2024-10-25
**Status:** Accepted

### Context
Need to maintain high code quality and prevent regressions in health-tracking application where data accuracy is critical.

### Decision
Enforce minimum 95% test coverage for both backend and frontend codebases.

### Consequences

**Positive:**
- High confidence in code changes
- Early detection of bugs
- Living documentation via tests
- Safe refactoring

**Negative:**
- Slower initial development
- Requires discipline to maintain
- May encourage testing for coverage rather than value

**Implementation:**
- Backend: Jest with 99.08% coverage (332 tests)
- Frontend: Vitest + React Testing Library (270 tests)
- CI/CD checks coverage before merge
- Pre-commit hooks remind about test coverage

**Code Reference:**
- `backend/jest.config.js` - Coverage thresholds
- `frontend/vite.config.ts` - Test configuration
- `.claude/hooks/post-write.sh` - Test reminder

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** [Proposed | Accepted | Deprecated | Superseded]

### Context
[What is the issue we're seeing that motivates this decision?]

### Decision
[What is the change we're proposing/have made?]

### Consequences

**Positive:**
- [Benefit 1]

**Negative:**
- [Tradeoff 1]

**Implementation:**
- [How this is implemented]

**Code Reference:**
- [File paths to relevant code]
```
