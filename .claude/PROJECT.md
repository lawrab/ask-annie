# Annie's Health Journal

## Project Overview
Daily health symptom tracking application with voice-first input and AI-powered insights.
Built as a dedication to Annie Rabbets.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + MongoDB + Mongoose
- **Auth**: Passwordless (Magic Links + Passkeys/WebAuthn)
- **Voice**: Web Audio API → OpenAI Whisper transcription → GPT-4o-mini parsing
- **Hosting**: Railway (auto-deploy from Git tags)
- **Testing**: Jest (backend) + Vitest (frontend)

## Key Patterns
- **Controllers** use try/catch → next(error) for error handling
- **Services** return data, controllers handle HTTP responses
- **Frontend**: Zustand for global state, React Hook Form for forms
- **Always** use `.lean()` on MongoDB read queries for performance
- **Type safety**: Use TypeScript strictly, no `any` types
- **Validation**: Joi for backend, Zod for env vars, React Hook Form + Zod for frontend

## Before Implementing Features
1. **Find similar existing code first** - Don't reinvent patterns
2. **Match existing patterns exactly** - Consistency is critical
3. **Use design system components** - Don't create new buttons/inputs/cards
4. **Check docs**: WORKFLOW.md, CONTRIBUTING.md, ARCHITECTURE.md
5. **Follow development workflow** (see below)

## Quality Standards
- **Backend**: >80% test coverage (currently 96.73%)
- **Frontend**: >70% test coverage (currently 90%+)
- **Zero TypeScript errors** - No compromises
- **Zero linting warnings** - Run `npm run lint`
- **All tests must pass** before creating PR

## Development Workflow
**CRITICAL**: Always follow this workflow:

1. **Create branch** from main: `git checkout -b feat/123-feature-name`
2. **Make changes** following existing patterns
3. **Run quality checks** (ALL required):
   ```bash
   npm run typecheck  # TypeScript compilation
   npm run lint       # ESLint checks
   npm test           # All test suites
   npm run build      # Production build
   ```
4. **Commit with clear message**:
   ```
   feat: Add feature description (#123)

   - Bullet point of change
   - Another change
   - Testing notes

   Quality checks:
   - TypeScript: ✅
   - Lint: ✅
   - Tests: ✅ X passed
   - Build: ✅
   ```
5. **Create PR** with description referencing issue
6. **Merge after review**

**Never**:
- Commit without running all quality checks
- Push directly to main (use PRs)
- Skip tests or ignore failing tests
- Use `@ts-ignore` or `any` types without good reason
- DO NOT reference AI or Claude in commit messages or PRs

## Project Structure
```
annies-health-journal/
├── backend/              # Express API server
│   ├── src/
│   │   ├── config/       # Database, passport, environment
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers, logger, validation
│   └── __tests__/        # Test files alongside source
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   └── ui/       # Design system components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── stores/       # Zustand state management
│   │   └── utils/        # Frontend utilities
│   └── __tests__/        # Test files
└── docs/                 # All documentation
    ├── README.md         # Documentation index
    ├── WORKFLOW.md       # Development workflow (detailed)
    ├── CONTRIBUTING.md   # Coding standards
    ├── ARCHITECTURE.md   # System design
    └── [others]
```

## Common Tasks

### Adding a New API Endpoint
1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Create service in `backend/src/services/`
4. Add validation schema (Joi)
5. Write tests (aim for >80% coverage)
6. Update API documentation

### Adding a New Frontend Page
1. Create page component in `frontend/src/pages/`
2. Add route in `App.tsx`
3. Use design system components from `components/ui/`
4. Connect to API via `services/api.ts`
5. Write component tests
6. Update navigation if needed

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify test now passes
4. Check for similar issues elsewhere
5. Add regression test if needed

## Important Files
- **Workflow**: `docs/WORKFLOW.md` - Complete development process
- **Patterns**: `docs/CONTRIBUTING.md` - Coding standards and patterns
- **Architecture**: `docs/ARCHITECTURE.md` - System design decisions
- **API Docs**: `docs/API_DOCUMENTATION.md` - Endpoint specifications
- **Design System**: `docs/DESIGN_SYSTEM.md` - UI components and patterns
- **Testing**: `docs/TESTING.md` - Testing strategies

## Environment Variables
See `backend/.env.example` and `frontend/.env.example` for required configuration.

**Backend critical vars**:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Minimum 32 characters
- `RESEND_API_KEY` - Magic link emails
- `OPENAI_API_KEY` - Voice transcription
- `RP_ID`, `WEBAUTHN_ORIGIN` - Passkey configuration

All variables are validated on startup with Zod (see `backend/src/config/env.ts`).

## Quick Commands
```bash
# Install all dependencies
npm install

# Start development (uses Makefile)
make dev                    # Start all services
make deps-up                # Start only MongoDB/Redis

# Run quality checks (backend or frontend)
npm run typecheck           # Type checking
npm run lint                # Linting
npm test                    # Tests with coverage
npm run build               # Production build

# Database utilities
make db-shell              # Open MongoDB shell
make db-ui                 # Open Mongo Express (localhost:8081)
```

## Getting Help
- Check `docs/README.md` for documentation index
- Read similar existing code for patterns
- See `docs/CONTRIBUTING.md` for detailed coding patterns
- Check GitHub issues for known problems
