# Ask Annie - Agent System

This directory contains the Claude Code agent configuration and context for the Ask Annie project.

## Directory Structure

```
agents/
├── README.md                    # This file
└── context/                     # Project context files
    ├── current-state.md         # Current development status and metrics
    ├── architecture-decisions.md # ADRs (Architecture Decision Records)
    └── common-patterns.md       # Code patterns and conventions

.claude/
├── settings.json                # Project-wide hook configurations
├── commands/                    # Custom slash commands
│   ├── weekly-sync.md          # Weekly documentation update
│   └── milestone-complete.md   # Milestone completion workflow
└── hooks/                       # Hook scripts
    ├── post-write.sh           # Runs after file writes
    ├── docs-reminder.sh        # Documentation checklist
    └── progress-check.sh       # Project progress summary
```

## Quick Reference

### Custom Commands

#### `/weekly-sync`
Run comprehensive weekly documentation update:
- Update context files with current progress
- Review and update CHANGELOG.md
- Update README.md with latest metrics
- Check active issues and milestone progress
- Verify test coverage metrics

**When to use:** Weekly, or before major milestones

#### `/milestone-complete`
Complete current development milestone:
- Verify all milestone issues are closed
- Update CHANGELOG.md with version section
- Update README.md milestone markers
- Create milestone summary
- Prepare next phase goals

**When to use:** After completing a major milestone/wave

---

### Context Files

#### `context/current-state.md`
**Purpose:** Track current development status, active issues, and metrics

**Contents:**
- Current milestone and completion percentage
- Test coverage metrics (backend: 99.08%, frontend: 270 tests)
- Active issues and priorities
- Recent accomplishments
- Known blockers

**Update frequency:** Weekly via `/weekly-sync`, or as major changes occur

#### `context/architecture-decisions.md`
**Purpose:** Document key architectural decisions (ADRs)

**Contents:**
- ADR-001: Podman over Docker
- ADR-002: JWT in HTTP-only cookies
- ADR-003: Flexible symptom storage with SymptomValue
- ADR-004: Tailwind CSS with custom tokens
- ADR-005: 95%+ test coverage requirement

**Update frequency:** When making significant architectural decisions

#### `context/common-patterns.md`
**Purpose:** Document code patterns and conventions used across the project

**Contents:**
- Backend patterns (controllers, services, validation, auth)
- Frontend patterns (components, styling, state, forms)
- Testing patterns
- File organization
- Naming conventions
- Git commit format

**Update frequency:** When establishing new patterns or conventions

---

### Automated Hooks

#### `post-write.sh`
**Trigger:** After any file write (via Write tool)

**Actions:**
- Detects source file changes (`.ts`, `.tsx`, `.js`, `.jsx`)
- Reminds about 95%+ test coverage requirement
- Suggests updating CHANGELOG, docs, and Storybook

**Can be disabled:** Set in `.claude/settings.json`

#### `docs-reminder.sh`
**Trigger:** When conversation ends (Stop hook)

**Actions:**
- Shows documentation update checklist
- Reminds to update CHANGELOG, README, API docs
- Suggests running `/weekly-sync`

#### `progress-check.sh`
**Trigger:** When conversation ends (Stop hook)

**Actions:**
- Shows current test coverage
- Counts UI components
- Shows recent commits
- Lists open issues count

---

## Project Standards

### Test Coverage
- **Minimum:** 95% coverage required
- **Backend:** Currently 99.08% (332 tests)
- **Frontend:** Currently 270 tests passing
- **Enforcement:** Pre-commit hooks, CI/CD checks

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Joi validation for all API inputs
- Comprehensive JSDoc comments

### Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements

### Security
- JWT in HTTP-only cookies (not localStorage)
- Joi validation on all inputs
- Bcrypt password hashing (10 rounds)
- HTTPS-only in production
- No sensitive data in logs

---

## Development Workflow

### Starting a New Feature

1. **Check Current State**
   ```bash
   gh issue list
   ```
   Review `context/current-state.md`

2. **Create Issue** (if needed)
   ```bash
   gh issue create --title "Feature description" --label "enhancement,backend"
   ```

3. **Review Patterns**
   Check `context/common-patterns.md` for relevant patterns

4. **Implement with Tests**
   - Write tests first (TDD) or alongside code
   - Maintain 95%+ coverage
   - Follow established patterns

5. **Update Documentation**
   - Update CHANGELOG.md (Unreleased section)
   - Update API docs if endpoints changed
   - Add Storybook stories for UI components

6. **Run Tests**
   ```bash
   npm run test:backend
   npm run test:frontend
   ```

7. **Commit Changes**
   Follow conventional commits:
   ```
   feat(scope): description

   Longer description if needed
   ```

### Ending a Session

When stopping work, the hooks will remind you to:
- [ ] Update CHANGELOG.md
- [ ] Update README.md if needed
- [ ] Update API documentation
- [ ] Update context files
- [ ] Ensure tests pass
- [ ] Add Storybook stories

Run `/weekly-sync` for comprehensive updates.

---

## Technology Stack

### Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **Auth:** JWT in HTTP-only cookies
- **Validation:** Joi
- **Testing:** Jest (332 tests, 99.08% coverage)
- **Logging:** Winston

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design tokens
- **State:** Zustand
- **UI Components:** 14 components in Storybook
- **Testing:** Vitest + React Testing Library (270 tests)
- **Accessibility:** WCAG 2.1 AA compliant

### Infrastructure
- **Containers:** Podman (NixOS compatible)
- **Development:** docker-compose for MongoDB + Redis
- **Hosting:** Railway (planned)
- **CI/CD:** GitHub Actions

---

## Quick Commands

```bash
# Start development environment
make deps-up          # Start MongoDB + Redis
make dev              # Start both backend + frontend

# Run tests
npm run test:backend  # Backend tests with coverage
npm run test:frontend # Frontend tests

# Build
npm run build         # Build both projects

# Storybook
cd frontend && npm run storybook  # Component documentation

# Database
make mongo-shell      # Open MongoDB shell
```

---

## Support & Resources

- **Documentation:** `/docs` directory
- **Project Brief:** `ASK_ANNIE_PROJECT_BRIEF.md`
- **Workflow Guide:** `docs/WORKFLOW.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **API Docs:** `docs/API_DOCUMENTATION.md`
- **Design System:** `docs/DESIGN_SYSTEM.md`

---

## Contribution Guidelines

1. **Follow established patterns** (see `context/common-patterns.md`)
2. **Maintain test coverage** (95%+ requirement)
3. **Update documentation** as you work
4. **Use conventional commits** for clear history
5. **Review ADRs** before major architectural changes
6. **Run `/weekly-sync`** to stay current with project state

---

**Last Updated:** 2025-11-22
**Project Status:** v0.1.0 MVP + Wave 2B (85% Complete)
