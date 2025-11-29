# Architecture Overview

High-level architecture documentation for Annie's Health Journal.

## System Overview

Annie's Health Journal is a full-stack health symptom tracking application with three main components:

1. **React Frontend** - User-facing web application (TypeScript, Tailwind CSS)
2. **Express Backend** - RESTful API server (Node.js, TypeScript)
3. **MongoDB Database** - Flexible document storage

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │        React Frontend (Port 5173)                │   │
│  │  - Voice Recording (Web Audio API)               │   │
│  │  - Dashboard & Visualizations                    │   │
│  │  - Passkey Authentication                        │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS REST API
┌───────────────────────▼─────────────────────────────────┐
│              Express Backend (Port 3000)                 │
│  ┌───────────────────────────────────────────────┐     │
│  │  API Routes                                    │     │
│  │  - /api/auth (Authentication + WebAuthn)       │     │
│  │  - /api/checkins (Check-in Management)        │     │
│  │  - /api/analysis (Trend Analysis)             │     │
│  │  - /api/passkeys (Passkey Management)         │     │
│  └───────────────────┬───────────────────────────┘     │
│                      │                                   │
│  ┌───────────────────▼───────────────────────────┐     │
│  │  Services Layer                                │     │
│  │  - Voice Transcription (OpenAI/Whisper)       │     │
│  │  - Symptom Parsing (GPT-4o-mini)             │     │
│  │  - Analysis & Trends                          │     │
│  │  - WebAuthn (Passkeys)                        │     │
│  └───────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│               MongoDB Database                           │
│  Collections: users, checkins, passkeys                  │
└─────────────────────────────────────────────────────────┘

External Services:
- OpenAI API (transcription + parsing)
```

## Technology Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS (styling)
- Zustand (state management)
- React Router v6 (routing)
- Recharts (visualizations)
- React Hook Form + Zod (forms/validation)

### Backend
- Node.js 18+ + Express + TypeScript
- MongoDB + Mongoose ODM
- JWT + WebAuthn (authentication)
- Winston (logging)
- Helmet, CORS, rate limiting (security)

### Infrastructure
- **Hosting**: Railway
- **Database**: Railway MongoDB
- **CI/CD**: GitHub → Railway auto-deploy on tags
- **Version Control**: GitHub

## Key Design Decisions

### 1. Flexible Symptom Storage

Store symptoms as dynamic key-value pairs rather than rigid schema.

**Rationale**: Health conditions evolve; users have different symptoms; allows natural language capture from voice.

```typescript
{
  "symptoms": {
    "headache": { "severity": 7 },
    "nausea": { "severity": 5 },
    [customSymptom: string]: any
  }
}
```

### 2. Voice-First Input with Manual Fallback

Prioritize voice recording for lower friction and accessibility.

**Rationale**:
- More natural symptom expression
- Lower daily friction (just speak)
- Accessible for hand mobility issues
- Manual fallback for reliability

**Trade-offs**: Requires OpenAI API, privacy considerations

### 3. Passwordless Authentication (Passkeys)

WebAuthn-based passkey authentication with password fallback.

**Rationale**:
- More secure (phishing-resistant)
- Better UX (Face ID/Touch ID)
- No password management burden

**Implementation**: Biometric authentication via Web Authentication API

### 4. MongoDB Document Database

Use MongoDB over relational database.

**Rationale**:
- Flexible schema matches symptom tracking needs
- Easy to add new symptom fields
- JSON-native storage
- Good aggregation pipeline for trends

**Trade-offs**: Requires careful indexing for performance

### 5. Monorepo Structure

Keep frontend and backend in same repository.

**Rationale**:
- Shared TypeScript types
- Simplified deployment
- Single source of truth
- Easier local development

## Security Architecture

### Authentication
- JWT tokens with HTTP-only cookies
- WebAuthn passkeys (FIDO2)
- Password hashing with bcrypt
- CORS restricted to known origins

### Data Privacy
- Audio files deleted after transcription
- No third-party analytics
- User data export capability (GDPR)
- Complete data deletion on request

### API Security
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- Input validation (Zod, Joi)
- Parameterized MongoDB queries

## Deployment Architecture

### Railway Configuration

```
GitHub Repo (main branch)
    ↓
Tag pushed (v0.x.0)
    ↓
Railway detects tag
    ↓
Parallel builds:
  ├─ Backend (Docker)
  └─ Frontend (Docker)
    ↓
Health checks pass
    ↓
Zero-downtime deployment
```

### Environment Variables

**Backend**: `MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `OPENAI_API_KEY`, `RP_ID`, `WEBAUTHN_ORIGIN`

**Frontend**: `VITE_API_URL`, `VITE_ENV`

See DEPLOYMENT.md for complete configuration.

## Scalability Considerations

### Current (MVP)
- Single Railway instance
- Direct OpenAI API integration
- MongoDB on Railway

### Future Scaling Path

**Horizontal Scaling**:
1. Redis for session storage
2. Job queue for async transcription
3. Load balancer across instances

**Database Scaling**:
1. MongoDB read replicas
2. Sharding by userId
3. Optimized indexes

**Caching**:
1. Redis for frequently accessed data
2. CDN for frontend assets
3. Browser caching

## Testing Strategy

- **Backend**: >80% coverage (Jest, Supertest)
- **Frontend**: >70% coverage (Vitest, Testing Library)
- **Manual**: Regression test plan for releases
- **Responsive**: All viewports (375px - 2560px)

See TESTING.md for complete guide.

## Performance Goals

- Dashboard load: <3 seconds
- API response: <500ms (p95)
- Chart render: <2 seconds
- Check-in submit: <1 second

---

**Last Updated**: 2025-11-29
