# System Architecture

Quick reference for understanding how Annie's Health Journal works.
For detailed architecture, see `docs/ARCHITECTURE.md`.

## High-Level Data Flow

```
User Input (Voice/Manual)
    ↓
React Frontend (Port 5173)
    ↓ HTTP/HTTPS REST API
Express Backend (Port 3000)
    ↓ Business Logic
Service Layer
    ↓ Mongoose ODM
MongoDB Database
```

## Authentication Flow

### Magic Link Login
```
1. User enters email → POST /api/auth/magic-link
2. Backend generates token → Email sent via Resend
3. User clicks link with token → GET /api/auth/verify-magic-link?token=xxx
4. Backend verifies token → Issues JWT
5. Frontend stores JWT → localStorage.setItem('token', jwt)
6. All API requests → Authorization: Bearer {jwt}
```

### Passkey/WebAuthn Flow
```
1. User registers passkey → POST /api/passkeys/register-challenge
2. Backend generates challenge → Client creates credential
3. Client sends credential → POST /api/passkeys/register
4. Backend verifies & stores → Passkey saved to database

Login:
1. User clicks "Use Passkey" → POST /api/passkeys/login-challenge
2. Backend generates challenge → Client signs challenge
3. Client sends assertion → POST /api/passkeys/login
4. Backend verifies signature → Issues JWT
```

## Voice Check-In Flow

```
1. User taps "Record" → Web Audio API starts recording
2. User speaks symptoms → Audio captured as Blob
3. User taps "Stop" → Audio ready for upload
4. Frontend → POST /api/checkins (multipart/form-data with audio file)
5. Backend → Multer saves temporary file
6. Backend → OpenAI Whisper API transcribes audio → text
7. Backend → GPT-4o-mini parses text → structured data
8. Backend → Saves to MongoDB with structured symptoms
9. Backend → Returns check-in + insight
10. Frontend → Displays confirmation & insight modal
```

## Manual Check-In Flow

```
1. User fills form → Symptom selectors, activities, triggers, notes
2. Frontend validates → React Hook Form + Zod
3. Frontend → POST /api/checkins (JSON)
4. Backend validates → Joi schema
5. Backend → Saves to MongoDB
6. Backend → Returns check-in + insight
7. Frontend → Displays confirmation & insight modal
```

## Database Schema Overview

### User Model
```typescript
{
  _id: ObjectId,
  email: string (unique),
  passwordHash: string (optional - for legacy users),
  createdAt: Date,
  updatedAt: Date
}
```

### CheckIn Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  timestamp: Date,
  structured: {
    symptoms: {
      [symptomName]: {
        severity: number (1-10),
        location?: string,
        description?: string
      }
    },
    activities: string[],
    triggers: string[],
    notes: string
  },
  raw: {
    transcript?: string,  // Voice check-ins only
    audioFile?: string    // Voice check-ins only
  },
  createdAt: Date
}
```

### Passkey Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  credentialID: Buffer,
  publicKey: Buffer,
  counter: number,
  deviceName: string,
  createdAt: Date,
  lastUsedAt: Date
}
```

### MagicLinkToken Model
```typescript
{
  _id: ObjectId,
  email: string,
  token: string (hashed),
  expiresAt: Date,
  used: boolean,
  createdAt: Date
}
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## Frontend State Management

### Authentication State (Zustand)
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (token, user) => void,
  logout: () => void,
  setUser: (user) => void
}
```

Stored in `localStorage`:
- `token` → JWT for API requests
- `user` → User object for UI display

### API Service Architecture
```typescript
// services/api.ts
axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true
});

// Interceptors
- Request: Add Authorization header with token
- Response: Handle 401 (redirect to login), other errors
```

## File Organization

### Backend Structure
```
backend/src/
├── config/           # Database, passport, env validation
├── controllers/      # HTTP request handlers
├── middleware/       # Auth, validation, error handling
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── services/        # Business logic
└── utils/           # Helpers, logger, validation
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── ui/          # Design system components (Button, Card, etc.)
│   └── [features]   # Feature-specific components
├── pages/           # Route-level components
├── services/        # API client
├── stores/          # Zustand state
└── utils/           # Frontend utilities
```

## Key Design Decisions

### Why Passwordless Authentication?
- **Security**: No passwords to leak or phish
- **UX**: Faster login, no password reset flows
- **Modern**: Passkeys are the future of authentication

### Why Voice-First Input?
- **Accessibility**: Easier for users with hand mobility issues
- **Natural**: Speak symptoms as you feel them
- **Speed**: Faster than typing on mobile

### Why MongoDB?
- **Flexible schema**: Health symptoms vary by person
- **Easy evolution**: Add new symptom fields without migrations
- **JSON-native**: Matches API structure
- **Good aggregation**: Powerful analytics queries

### Why Monorepo?
- **Shared types**: Frontend and backend use same TypeScript interfaces
- **Single source**: One repo, one CI/CD pipeline
- **Easier development**: Both services in one place

### Why Tailwind CSS?
- **Design system**: Consistent spacing, colors, typography
- **No CSS files**: Styles co-located with components
- **Responsive**: Mobile-first utilities
- **WCAG compliant**: Verified color contrast

## Performance Optimizations

### Backend
- `.lean()` on all read queries → 30-50% faster
- Database indexes on `userId`, `timestamp`
- Mongoose connection pooling
- Response compression with gzip

### Frontend
- Code splitting by route
- Lazy loading for charts (Recharts)
- Optimistic UI updates
- Service Worker (future - PWA support)

## Security Measures

### Authentication
- JWT with HTTP-only storage (localStorage)
- Passkeys using FIDO2/WebAuthn
- Magic links expire after 15 minutes
- Rate limiting: 3 failed attempts per 15 min

### Data Privacy
- Audio files deleted after transcription
- PHI/PII sanitized in logs
- User can export all data (GDPR)
- User can delete account + all data

### API Security
- Helmet.js security headers
- CORS restricted to known origins
- Rate limiting (100 req/15min per IP)
- Input validation on all endpoints
- Parameterized MongoDB queries (no injection)

## Deployment Architecture

### Railway Setup
```
GitHub Repository
    ↓ (Push tag: v0.x.0)
Railway detects tag
    ↓
Parallel builds:
    ├─ Backend Docker container (from backend/Dockerfile)
    └─ Frontend Docker container (from frontend/Dockerfile)
    ↓
Health checks pass
    ↓
Zero-downtime deployment
    ↓
Traffic routed to new containers
```

### Environment Variables
Backend requires:
- `MONGODB_URI` (database)
- `JWT_SECRET` (auth tokens)
- `OPENAI_API_KEY` (transcription)
- `RESEND_API_KEY` (emails)
- `RP_ID`, `WEBAUTHN_ORIGIN` (passkeys)

All validated on startup with Zod schema in `backend/src/config/env.ts`.

## Error Handling Strategy

### Backend
```
Error occurs
    ↓
try/catch → next(error)
    ↓
Error Handler Middleware
    ↓
Log error with context
    ↓
Sanitize error message (hide stack in production)
    ↓
Return { success: false, error: "message" }
```

### Frontend
```
Error occurs
    ↓
try/catch in component
    ↓
Set error state
    ↓
Display <Alert type="error"> to user
    ↓
Log to console (future: error tracking service)
```

## Testing Strategy

### Backend (Jest + Supertest)
- Controllers: Full HTTP request/response tests
- Services: Business logic unit tests
- Integration: Database operations
- Coverage target: >80% (currently 96.73%)

### Frontend (Vitest + Testing Library)
- Components: User interaction tests
- Pages: Full page rendering and navigation
- Stores: State management logic
- Coverage target: >70% (currently 90%+)

## Monitoring & Observability

### Current
- Winston logging (info, warn, error levels)
- Railway dashboard metrics (CPU, memory, requests)
- Manual health checks (`/health` endpoint)

### Future
- Error tracking (Sentry integration)
- Performance monitoring (New Relic or similar)
- Uptime monitoring (UptimeRobot)
- User analytics (privacy-respecting)

## Scaling Considerations

### Current (MVP)
- Single Railway instance
- Direct OpenAI API calls
- Synchronous transcription

### Future Horizontal Scaling
1. Redis for session storage
2. Job queue (Bull/BullMQ) for async transcription
3. Separate transcription service
4. Load balancer across multiple backend instances
5. MongoDB read replicas
6. CDN for frontend assets

## Quick Reference

**Ports**:
- Frontend: 5173 (dev), 4173 (preview)
- Backend: 3000
- MongoDB: 27017
- Mongo Express UI: 8081
- Redis: 6379

**Key Services**:
- OpenAI API: Whisper (transcription) + GPT-4o-mini (parsing)
- Resend: Email delivery for magic links
- Railway: Hosting platform

**Important URLs**:
- Staging: Not deployed yet
- Production: https://www.anniesjournal.com (future)
