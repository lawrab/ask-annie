# Annie's Health Journal - Architecture Documentation

## System Overview

Annie's Health Journal is a full-stack health symptom tracking application built with a microservices-oriented architecture. The system consists of three main components:

1. **React Frontend** - User-facing web application
2. **Express Backend** - RESTful API server
3. **MongoDB Database** - Flexible document storage

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │        React Frontend (Port 5173)                │   │
│  │  - Voice Recording (Web Audio API)               │   │
│  │  - Dashboard & Visualisations                    │   │
│  │  - Notification Management                       │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/HTTPS
                        │ REST API Calls
┌───────────────────────▼─────────────────────────────────┐
│              Express Backend (Port 3000)                 │
│  ┌───────────────────────────────────────────────┐     │
│  │  API Routes                                    │     │
│  │  - /api/auth (Authentication)                  │     │
│  │  - /api/checkins (Check-in Management)        │     │
│  │  - /api/analysis (Trend Analysis)             │     │
│  │  - /api/user (User Settings)                  │     │
│  └───────────────────┬───────────────────────────┘     │
│                      │                                   │
│  ┌───────────────────▼───────────────────────────┐     │
│  │  Services Layer                                │     │
│  │  - Whisper Transcription Service              │     │
│  │  - Symptom Parsing Service                    │     │
│  │  - Analysis Service                           │     │
│  │  - PDF Generation Service                     │     │
│  └───────────────────┬───────────────────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│               MongoDB Database                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Collections:                                     │  │
│  │  - users (User accounts & settings)              │  │
│  │  - checkins (Symptom check-ins)                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

External Services:
┌──────────────────────┐
│  faster-whisper      │  (Voice → Text Transcription)
│  (Python Process)    │
└──────────────────────┘

┌──────────────────────┐
│  OpenAI Claude API   │  (Optional fallback for parsing)
│  (External)          │
└──────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Utilities**: date-fns

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **File Upload**: Multer
- **Voice Transcription**: faster-whisper (Python)

### Infrastructure
- **Hosting**: Railway
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions → Railway auto-deploy
- **Database Hosting**: Railway MongoDB

## Data Flow

### Voice Check-In Flow

```
1. User taps "Check-In" button
   ↓
2. Frontend: Microphone permission requested
   ↓
3. Web Audio API records audio (5-30 seconds)
   ↓
4. Audio blob sent to backend via FormData
   ↓
5. Backend: Multer saves temporary file
   ↓
6. faster-whisper transcribes audio → text
   ↓
7. Parsing service extracts symptoms from transcript
   ↓
8. Structured data saved to MongoDB
   ↓
9. Response sent back to frontend
   ↓
10. Frontend displays confirmation & clears recording
```

### Manual Check-In Flow

```
1. User selects symptoms via UI controls
   ↓
2. Frontend validates form data
   ↓
3. JSON payload sent to backend
   ↓
4. Backend validates & stores in MongoDB
   ↓
5. Confirmation response sent to frontend
```

### Trend Analysis Flow

```
1. User navigates to Trends page
   ↓
2. Frontend requests analysis for date range
   ↓
3. Backend queries MongoDB with aggregation pipeline
   ↓
4. Analysis service calculates:
   - Frequency of each symptom
   - Severity trends over time
   - Correlations with activities
   ↓
5. Data sent to frontend
   ↓
6. Recharts renders visualisations
```

## Key Design Decisions

### 1. Flexible Symptom Storage

**Decision**: Store symptoms as dynamic key-value pairs rather than rigid schema.

**Rationale**:
- Health conditions evolve; new symptoms may appear
- Different users have different symptoms
- Allows natural language capture from voice

**Implementation**:
```typescript
structured: {
  symptoms: {
    hand_grip?: "bad" | "moderate" | "good",
    pain_level?: number,
    [customSymptom: string]: any
  }
}
```

### 2. Voice-First Input

**Decision**: Prioritise voice recording with manual fallback.

**Rationale**:
- Lower friction for daily use
- More natural expression of symptoms
- Accessible for users with hand mobility issues

**Trade-offs**:
- Requires Python dependency (faster-whisper)
- Privacy considerations for audio processing
- Network bandwidth for audio upload

### 3. Client-Side State Management (Zustand)

**Decision**: Use Zustand instead of Redux or Context API.

**Rationale**:
- Simpler API, less boilerplate
- Better TypeScript support
- Lightweight (<1KB gzipped)
- Sufficient for app complexity

### 4. MongoDB Document Database

**Decision**: Use MongoDB over PostgreSQL.

**Rationale**:
- Flexible schema matches symptom tracking needs
- Easy to add new symptom fields without migrations
- JSON-native storage aligns with API structure
- Aggregation pipeline good for trend analysis

**Trade-offs**:
- Less strict referential integrity
- Requires careful indexing for performance

### 5. Monorepo Structure

**Decision**: Keep frontend and backend in same repository.

**Rationale**:
- Shared TypeScript types
- Simplified deployment pipeline
- Easier local development
- Single source of truth

## Security Considerations

### Authentication
- JWT tokens with secure HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- Token expiry and refresh mechanism
- CORS restricted to known origins

### Data Privacy
- Audio files deleted after transcription
- No third-party analytics
- User data export capability
- Complete data deletion on request

### API Security
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- Input validation on all endpoints
- Parameterised MongoDB queries (no injection)

### File Upload Security
- Max file size: 10MB
- Allowed MIME types: audio/* only
- Temporary storage with automatic cleanup
- Multer disk storage with sanitised filenames

## Scalability Considerations

### Current Architecture (MVP)
- Single server instance
- Direct faster-whisper integration
- Synchronous transcription

### Future Scaling Path

**Horizontal Scaling**:
1. Add Redis for session storage
2. Use job queue (Bull/BullMQ) for transcription
3. Separate transcription service as microservice
4. Load balancer across multiple backend instances

**Database Scaling**:
1. Add MongoDB read replicas
2. Shard by userId for large datasets
3. Add indexes on frequently queried fields

**CDN & Caching**:
1. CloudFlare CDN for frontend assets
2. Redis cache for frequently accessed summaries
3. Browser caching for chart data

## Deployment Architecture

### Railway Configuration

```
GitHub Repo
    ↓ (Push to main)
Railway Detects Changes
    ↓
Parallel Builds:
  ├─ Backend Service (Node.js)
  └─ Frontend Service (Static)
    ↓
Deploy to Production
    ↓
Health Checks Pass
    ↓
Traffic Routed to New Instances
```

### Environment Variables

**Backend**:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Token signing key
- `ALLOWED_ORIGINS` - CORS whitelist
- `WHISPER_MODEL_SIZE` - Model configuration

**Frontend**:
- `VITE_API_URL` - Backend endpoint
- `VITE_ENABLE_VOICE_RECORDING` - Feature flag
- `VITE_ENABLE_NOTIFICATIONS` - Feature flag

## Error Handling Strategy

### Frontend
1. Network errors → Retry with exponential backoff
2. Auth errors → Redirect to login
3. Validation errors → Inline form feedback
4. Runtime errors → Error boundary with fallback UI

### Backend
1. Validation errors → 400 with specific message
2. Auth errors → 401/403 with clear reason
3. Database errors → 500 with logged stack trace
4. External service errors → 503 with retry guidance

## Monitoring & Logging

### Backend Logging (Winston)
- **Info**: Successful operations, startup events
- **Warn**: Deprecated features, non-critical issues
- **Error**: Exceptions, failed operations, stack traces

### Log Storage
- Development: Console output
- Production: File-based logs (`logs/combined.log`, `logs/error.log`)
- Future: Integrate with Railway logs or external service

### Metrics to Monitor
- API response times
- Transcription success rate
- Database query performance
- Error rates by endpoint
- Daily active users
- Check-ins per day

## Testing Strategy

### Frontend
- **Unit Tests**: Vitest for components and hooks
- **Integration Tests**: Testing Library for user flows
- **E2E Tests**: (Future) Playwright for critical paths

### Backend
- **Unit Tests**: Jest for services and utilities
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: In-memory MongoDB for isolation

### Coverage Targets
- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

## Performance Optimisations

### Frontend
- Code splitting by route
- Lazy loading for charts
- Debounced API calls
- Optimistic UI updates
- Service Worker for offline capability

### Backend
- Database indexing on userId, timestamp
- Response compression (gzip)
- Connection pooling for MongoDB
- Caching of aggregation results

## Future Architecture Enhancements

1. **Real-time Updates**: WebSocket support for live dashboards
2. **Offline-First**: Service Workers with background sync
3. **Mobile Apps**: React Native using same backend
4. **ML Pipeline**: Separate service for pattern detection
5. **Microservices**: Split transcription, analysis, and API services
6. **Event Sourcing**: Audit log of all symptom changes

---

**Document Version**: 1.0
**Last Updated**: 2024-01-25
**Maintainers**: Development Team
