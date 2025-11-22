# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Wave 3 Backend Analytics & Engagement (Issues #87-90)
  - Symptom data standardization with SymptomValue interface for numeric severity tracking
  - Daily check-in status endpoint (GET /api/checkins/status) with grace period logic
  - Streak tracking endpoint (GET /api/analysis/streak) with supportive gamification
  - Quick stats analytics endpoint (GET /api/analysis/quick-stats) with week-over-week comparison
  - Service layer architecture with reusable analytics functions
  - 80+ new test cases (99.08% coverage, 332 total backend tests)
- Wave 2B Design System & Component Library (Issues #72-77)
  - Comprehensive design system with Tailwind custom tokens
  - 12 accessible UI components (Button, Input, TextArea, Checkbox, Radio, RadioGroup, Card, Badge, Alert, Divider, Modal, ConfirmDialog)
  - Storybook 10 setup with 69+ component stories
  - All pages refactored to use component library (~280 lines of duplicate code eliminated)
- Wave 2 Frontend MVP (Issues #9-11, #25-26, #56, #60-61, #64)
  - User authentication (login/register) with JWT and session persistence
  - Protected routing with automatic session restoration
  - Dashboard with check-ins display using Card and Badge components
  - Voice recording with Web Audio API
  - Manual check-in form with validation
  - API client service with Axios interceptors
  - 270 frontend tests with 92%+ coverage
- Wave 1 Backend (Issues #52, #87)
  - Voice check-in endpoint (POST /api/checkins with audio)
  - Manual check-in endpoint (POST /api/checkins/manual)
  - List check-ins endpoint (GET /api/checkins with filtering & pagination)
  - Symptom parsing service with AI-powered extraction
  - JWT authentication with Passport.js
  - Migration script for symptom data standardization

### Changed
- Refactored all existing pages to use design system components
- Updated symptom storage format from mixed types to standardized SymptomValue objects
- Improved test coverage from 98.51% to 99.08% (backend)

### Planned Features
- Enhanced dashboard with timeline view (Issue #18)
- Symptom trends page with charts (Issue #19)
- Reusable CheckInCard component (Issue #21)
- Doctor summary generation (Issue #20)
- Daily check-in notifications (Issue #13)
- PDF export functionality
- Toast notification system (Issue #71)
- Accessibility audit (Issue #70)
- End-to-end voice flow testing (Issue #8)

## [0.1.0] - 2024-01-25

### Added
- Initial project structure
- Backend API skeleton with Express and TypeScript
- Frontend React application with Vite and Tailwind CSS
- MongoDB database configuration
- Project documentation (Architecture, API, Deployment, Development, Contributing)
- GitHub Actions CI/CD pipeline
- Development environment setup
- ESLint and Prettier configuration
- Testing framework setup (Jest for backend, Vitest for frontend)

### Project Setup
- Monorepo structure with frontend and backend
- TypeScript configuration for type safety
- Environment variable templates
- Git repository initialisation
- Comprehensive documentation suite

---

## Version History

### Version Numbering

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, backwards compatible

### Release Types

- **Alpha** (0.0.x): Early development, unstable
- **Beta** (0.x.0): Feature complete, testing phase
- **Stable** (1.0.0+): Production ready

---

## Migration Guides

### Upgrading from 0.1.0 to 0.2.0 (when released)

Instructions will be added here for breaking changes and migration steps.

---

**Note**: This changelog is maintained manually. All notable changes should be documented here before releasing a new version.
