# Development Workflow

**Annie's Health Journal - Professional Development Workflow Guide**

This document outlines the standard workflow for all development work on Annie's Health Journal. Following this workflow ensures consistent quality, proper code review, and maintains project stability.

---

## 🤖 For Claude Code Sessions (Context Resets)

**When starting work in a new session with clean context, follow this checklist to ensure consistency:**

### Session Start Checklist

1. **Activate project and read memories**
   ```bash
   # Serena will automatically activate and show available memories
   # Read relevant memories for your task:
   # - 03-tech-stack-architecture (always read this)
   # - 04-testing-quality-standards (if writing tests)
   # - 07-coding-patterns-consistency (CRITICAL - read before any code)
   ```

2. **Understand the task context**
   - Read the GitHub issue thoroughly
   - Check linked PRs or discussions
   - Review any related documentation

3. **Find similar existing implementations** (CRITICAL)
   ```bash
   # Before writing ANY new code, find similar code first:

   # New controller? Read existing controllers:
   # backend/src/controllers/userController.ts
   # backend/src/controllers/checkInController.ts

   # New page? Read existing pages:
   # frontend/src/pages/DashboardPage.tsx
   # frontend/src/pages/SettingsPage.tsx

   # New component? Check design system first:
   # frontend/src/components/ (and Storybook)

   # Use Glob/Grep to find patterns:
   # Glob: **/*Controller.ts
   # Grep: "export async function"
   ```

4. **Match existing patterns**
   - Use the same error handling approach
   - Use the same state management pattern
   - Use the same testing style
   - Use the same naming conventions
   - **When in doubt, copy the pattern from existing code**

5. **Use the design system**
   - Check Storybook for available components
   - Don't create new buttons, inputs, modals if they exist
   - Use existing Tailwind design tokens

6. **Quick reference commands**
   ```bash
   # View coding patterns (if slash command exists)
   /patterns

   # Check current standards
   cd backend && npm run lint      # See active lint rules
   cd frontend && npm test          # See test patterns
   ```

### Why This Matters

Context resets mean losing awareness of:
- Previous architectural decisions
- Established coding patterns
- Component library conventions
- Testing approaches
- Style preferences

**Following this checklist ensures new code matches existing code**, maintaining quality and consistency across sessions.

---

## Workflow Overview

```
1. Select Issue → 2. Create Branch → 3. Develop → 4. Quality Checks → 5. Manual Testing → 6. Pull Request → 7. Review → 8. Merge
```

---

## Step-by-Step Workflow

### 1. Select an Issue

**Choose your work:**
```bash
# View all open issues
gh issue list

# View issues by label (e.g., Wave 1 issues)
gh issue list --label "wave-1"

# View issues assigned to you
gh issue list --assignee @me
```

**Assign yourself:**
```bash
# Assign issue to yourself
gh issue edit <issue-number> --add-assignee @me

# Example
gh issue edit 1 --add-assignee @me
```

**Move issue to "In Progress":**
- Comment on the issue to indicate you're starting work
- If using GitHub Projects, move the issue card to "In Progress"

---

### 2. Create a Branch

**Always work on a feature branch, never directly on `main`.**

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create and checkout a new branch
git checkout -b <branch-name>
```

**Branch naming conventions:**

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/<issue-number>-<brief-description>` | `feature/1-user-model` |
| Bug Fix | `fix/<issue-number>-<brief-description>` | `fix/42-login-timeout` |
| Documentation | `docs/<issue-number>-<brief-description>` | `docs/10-update-api-docs` |
| Refactor | `refactor/<issue-number>-<brief-description>` | `refactor/5-simplify-auth` |
| Test | `test/<issue-number>-<brief-description>` | `test/8-checkin-endpoint` |

**Examples:**
```bash
git checkout -b feature/1-create-user-model
git checkout -b fix/15-voice-recording-ios
git checkout -b docs/23-deployment-guide
```

---

### 3. Develop

**Make your changes following best practices:**

- Write clean, readable code
- Follow the [Code Style Guide](CONTRIBUTING.md#code-style-guide)
- Add/update tests for your changes
- Update documentation where needed
- Commit frequently with meaningful messages

**Commit message format:**
```
type(scope): brief description

Longer explanation if needed.

Relates to #<issue-number>
```

**Commit types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no logic change)
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Build/tooling

**Examples:**
```bash
git add .
git commit -m "feat(models): create User model with validation

Added User model with email, password, and profile fields.
Includes bcrypt password hashing and JWT token generation.

Relates to #1"

git commit -m "test(models): add User model validation tests

Relates to #1"

git commit -m "docs(api): document user registration endpoint

Relates to #1"
```

**Push regularly:**
```bash
git push origin feature/1-create-user-model
```

---

### 4. Quality Checks

**Before requesting review, run all quality checks locally:**

#### Backend Quality Checks

```bash
cd backend

# 1. TypeScript compilation check
npm run typecheck

# 2. Linting
npm run lint

# 3. Run tests
npm test

# 4. Build check
npm run build
```

**Expected output:**
- ✅ TypeScript: No errors
- ✅ Linting: No errors or warnings
- ✅ Tests: All passing
- ✅ Build: Successful compilation

**Fix any issues before proceeding.**

#### Frontend Quality Checks

```bash
cd frontend

# 1. TypeScript compilation check
npm run typecheck

# 2. Linting
npm run lint

# 3. Run tests
npm test

# 4. Build check
npm run build
```

**Expected output:**
- ✅ TypeScript: No errors
- ✅ Linting: No errors or warnings
- ✅ Tests: All passing
- ✅ Build: Successful compilation

#### Full Project Quality Checks

```bash
# Run from project root
make lint        # Lint backend + frontend
make test        # Test backend + frontend
make typecheck   # TypeScript check both
```

---

### 5. Manual Testing

**Test your changes in a running environment:**

#### Start Development Environment

```bash
# Terminal 1: Start dependencies (MongoDB, Redis)
make deps-up

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Mongo Express: http://localhost:8081 (admin/admin)

#### Manual Testing Checklist

**For ALL changes:**
- [ ] Feature works as expected
- [ ] No console errors in browser/terminal
- [ ] UI displays correctly (if frontend change)
- [ ] API returns expected responses (if backend change)
- [ ] Error handling works correctly
- [ ] Edge cases are handled

**For Backend changes:**
- [ ] Test API endpoints with realistic data
- [ ] Verify database changes in Mongo Express
- [ ] Check authentication/authorisation if applicable
- [ ] Test error responses (400, 401, 404, 500)
- [ ] Verify logging output

**For Frontend changes:**
- [ ] Test on Chrome and Firefox minimum
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test keyboard navigation and accessibility
- [ ] Verify loading states
- [ ] Verify error states
- [ ] Test user interactions (clicks, forms, etc.)

**For Full-Stack features:**
- [ ] Test end-to-end user flow
- [ ] Verify data flows correctly from UI → API → Database
- [ ] Test error handling at each layer
- [ ] Verify loading and empty states

#### Testing Tools

```bash
# Backend API testing with curl
curl -X GET http://localhost:3000/api/health

# Backend API testing with httpie (if installed)
http GET http://localhost:3000/api/health

# Use GitHub CLI to test issue integration
gh issue view <issue-number>
```

---

### 6. Create Pull Request

**Once quality checks pass and manual testing is complete:**

```bash
# Ensure all changes are committed and pushed
git status
git push origin feature/1-create-user-model
```

**Create the PR:**
```bash
gh pr create --title "feat: Create User model with validation" --body "$(cat <<'EOF'
## Description
Implements User model with email/password authentication, profile fields, and JWT token generation.

## Changes
- Created `User` model with Mongoose schema
- Added bcrypt password hashing
- Implemented JWT token generation methods
- Added input validation with Joi
- Created unit tests for User model
- Updated API documentation

## Testing
- [x] All unit tests pass
- [x] TypeScript compilation successful
- [x] Linting passes with no errors
- [x] Manual testing completed
- [x] User registration flow tested end-to-end
- [x] Password hashing verified
- [x] JWT token generation verified

## Screenshots
N/A - Backend only

## Breaking Changes
None

## Checklist
- [x] Code follows style guide
- [x] Tests added/updated
- [x] Documentation updated
- [x] All quality checks pass
- [x] Manual testing complete
- [x] No console warnings or errors
- [x] Branch is up to date with main

Closes #1
EOF
)"
```

**PR Title Format:**
- `feat: Brief description` - New feature
- `fix: Brief description` - Bug fix
- `docs: Brief description` - Documentation
- `refactor: Brief description` - Code refactoring
- `test: Brief description` - Test changes

**PR Body Template:**

```markdown
## Description
Brief overview of what this PR does.

## Changes
- Bullet list of key changes
- Be specific and concise

## Testing
- [ ] All unit tests pass
- [ ] TypeScript compilation successful
- [ ] Linting passes with no errors
- [ ] Manual testing completed
- [ ] Specific feature test cases (list them)

## Screenshots
(If applicable - include before/after screenshots for UI changes)

## Breaking Changes
List any breaking changes or "None"

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All quality checks pass
- [ ] Manual testing complete
- [ ] No console warnings or errors
- [ ] Branch is up to date with main

Closes #<issue-number>
```

---

### 7. Code Review

**What happens during review:**

1. **Automated checks run** (GitHub Actions CI):
   - Backend tests
   - Frontend tests
   - Linting
   - TypeScript compilation
   - Build verification

2. **Reviewer(s) examine**:
   - Code quality and style
   - Test coverage
   - Documentation completeness
   - Potential bugs or edge cases
   - Performance implications
   - Security considerations

3. **Address feedback**:
   ```bash
   # Make requested changes
   git add .
   git commit -m "refactor: address PR feedback - improve error handling"
   git push origin feature/1-create-user-model
   ```

4. **Re-request review** after addressing all feedback

**Review timeline:**
- Initial review: Within 24 hours
- Follow-up reviews: Within 12 hours
- Urgent fixes: Same day

---

### 8. Merge to Main

**Once PR is approved:**

1. **Ensure branch is up to date:**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/1-create-user-model
   git merge main
   # Resolve any conflicts
   git push origin feature/1-create-user-model
   ```

2. **Merge the PR:**
   ```bash
   # Using GitHub CLI (recommended)
   gh pr merge <pr-number> --squash --delete-branch

   # Or merge via GitHub web interface
   # - Choose "Squash and merge"
   # - Delete branch after merge
   ```

3. **Verify merge:**
   ```bash
   git checkout main
   git pull origin main

   # Verify the feature is in main
   git log --oneline -5
   ```

4. **Close the issue:**
   ```bash
   # If not auto-closed by "Closes #X" in PR
   gh issue close <issue-number> --comment "Completed in PR #<pr-number>"
   ```

---

## Quality Standards

### Definition of Done

A feature is considered "done" when:

- [x] Code is written and committed
- [x] Unit tests written and passing
- [x] Integration tests passing (if applicable)
- [x] Manual testing completed
- [x] TypeScript compilation successful with no errors
- [x] Linting passes with zero errors/warnings
- [x] Code reviewed and approved
- [x] Documentation updated (code comments, API docs, README)
- [x] No console errors or warnings
- [x] Accessible and responsive (for UI changes)
- [x] PR merged to `main`
- [x] Issue closed with reference to PR

### Code Quality Metrics

**Enforce these standards:**

| Metric | Target | How to Check |
|--------|--------|--------------|
| Test Coverage | Backend: >80%<br>Frontend: >70% | `npm test -- --coverage` |
| TypeScript Errors | 0 | `npm run typecheck` |
| Linting Errors | 0 | `npm run lint` |
| Build Success | 100% | `npm run build` |
| Console Warnings | 0 | Manual testing |

---

## Workflow Examples

### Example 1: Simple Feature

```bash
# 1. Select and assign issue
gh issue view 5
gh issue edit 5 --add-assignee @me

# 2. Create branch
git checkout main
git pull origin main
git checkout -b feature/5-add-health-endpoint

# 3. Develop
# ... make changes ...
git add .
git commit -m "feat(api): add health check endpoint

Relates to #5"

# 4. Quality checks
cd backend
npm run typecheck
npm run lint
npm test
npm run build

# 5. Manual test
npm run dev
# Test http://localhost:3000/api/health

# 6. Create PR
git push origin feature/5-add-health-endpoint
gh pr create --title "feat: Add health check endpoint" --body "..."

# 7. Review and merge (after approval)
gh pr merge --squash --delete-branch

# 8. Clean up
git checkout main
git pull origin main
```

### Example 2: Bug Fix with Multiple Commits

```bash
# 1. Identify and assign bug
gh issue edit 42 --add-assignee @me

# 2. Create branch
git checkout -b fix/42-login-timeout

# 3. Develop with multiple commits
git commit -m "fix(auth): increase JWT expiry time

Relates to #42"

git commit -m "test(auth): add token expiry tests

Relates to #42"

git commit -m "docs(api): update auth documentation

Relates to #42"

# 4. Quality checks
make lint
make test
make typecheck

# 5. Manual test login flow

# 6. Create PR
git push origin fix/42-login-timeout
gh pr create --title "fix: Resolve login timeout issue" --body "..."

# 7. Address review feedback
git commit -m "refactor: simplify token refresh logic"
git push origin fix/42-login-timeout

# 8. Merge (after approval)
gh pr merge --squash --delete-branch
```

---

## Troubleshooting

### Common Issues

**Issue: Quality checks failing**
```bash
# TypeScript errors
npm run typecheck
# Fix errors, then re-run

# Linting errors
npm run lint:fix
# Review changes, commit fixes

# Test failures
npm test
# Debug failing tests, fix code
```

**Issue: Merge conflicts**
```bash
# Update your branch with latest main
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "chore: resolve merge conflicts with main"
git push origin feature/your-branch
```

**Issue: CI/CD pipeline failing**
```bash
# View failure details
gh pr checks

# Usually means quality checks pass locally but fail in CI
# Ensure you've committed all changes
# Pull latest main and re-test locally
```

---

## Best Practices

### DO ✅

- ✅ Always work on a feature branch
- ✅ Write descriptive commit messages
- ✅ Run quality checks before creating PR
- ✅ Test manually before requesting review
- ✅ Keep PRs focused and small (< 500 lines preferred)
- ✅ Update documentation with code changes
- ✅ Add tests for new features and bug fixes
- ✅ Request review when ready
- ✅ Address all review feedback
- ✅ Delete branches after merging

### DON'T ❌

- ❌ Commit directly to `main`
- ❌ Create PRs without testing
- ❌ Skip quality checks
- ❌ Leave console.log statements in production code
- ❌ Merge without approval
- ❌ Leave TODOs without GitHub issues
- ❌ Commit node_modules or build artefacts
- ❌ Ignore linting errors or warnings
- ❌ Create massive PRs (>1000 lines)
- ❌ Force push to shared branches

---

## Quick Reference

### Essential Commands

```bash
# Issue management
gh issue list                           # List all issues
gh issue view <number>                  # View issue details
gh issue edit <number> --add-assignee @me  # Assign to yourself

# Branch workflow
git checkout -b feature/<number>-<name>  # Create branch
git add .                                # Stage changes
git commit -m "type(scope): message"     # Commit
git push origin <branch-name>            # Push to remote

# Quality checks
make lint                                # Lint all
make test                                # Test all
make typecheck                           # TypeScript check all
cd backend && npm run lint               # Lint backend only
cd frontend && npm test                  # Test frontend only

# Pull requests
gh pr create                             # Create PR (interactive)
gh pr view                               # View your PR
gh pr checks                             # View CI/CD status
gh pr merge --squash --delete-branch     # Merge and clean up

# Development
make deps-up                             # Start dependencies
make dev                                 # Start backend + frontend
make deps-down                           # Stop dependencies
```

---

## Review Checklist Template

**Use this before creating a PR:**

```markdown
## Pre-PR Checklist

### Code Quality
- [ ] TypeScript compiles with no errors
- [ ] Linting passes with no errors or warnings
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Code follows project style guide
- [ ] No commented-out code or console.logs

### Documentation
- [ ] Code comments added for complex logic
- [ ] API documentation updated (if applicable)
- [ ] README updated (if needed)
- [ ] CHANGELOG updated (for user-facing changes)

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Tested on Chrome and Firefox
- [ ] Tested responsive design (if UI change)
- [ ] Error handling tested
- [ ] Edge cases tested

### Security & Performance
- [ ] No sensitive data in code or commits
- [ ] Input validation implemented
- [ ] No performance regressions
- [ ] Database queries optimised (if applicable)

### Git
- [ ] Commits follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Commits are logical and atomic

### Issue Management
- [ ] Issue linked in PR description (Closes #X)
- [ ] PR title follows convention
- [ ] PR description is complete and clear
```

---

## Workflow Diagram

```
┌─────────────────┐
│  Select Issue   │
│  (gh issue)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Branch   │
│ (git checkout)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Develop      │
│ (code + commit) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quality Checks  │
│ lint/test/build │
└────────┬────────┘
         │
    Pass │
         ▼
┌─────────────────┐
│ Manual Testing  │
│  (local env)    │
└────────┬────────┘
         │
    Pass │
         ▼
┌─────────────────┐
│   Create PR     │
│  (gh pr create) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Code Review    │
│   (reviewer)    │
└────────┬────────┘
         │
  Approved
         │
         ▼
┌─────────────────┐
│  Merge to Main  │
│ (squash merge)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Close Issue    │
│   (complete!)   │
└─────────────────┘
```

---

## Additional Resources

- [CONTRIBUTING.md](CONTRIBUTING.md) - Code style guide and contribution guidelines
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoint specifications
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development environment setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview

---

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Maintained By**: Development Team

---

**Ready to start? Pick an issue and let's build! 🐰**
