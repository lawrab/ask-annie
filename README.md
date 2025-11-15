# Ask Annie

**Your daily health companion. Track symptoms, spot patterns, empower your health.**

> **📦 Project Status**: Active development. Backend API is functional with comprehensive testing (98.51% coverage, 202 tests). Voice and manual check-in endpoints implemented with JWT authentication. Frontend scaffolded but not yet complete. See roadmap below for current progress.

Ask Annie is a health symptom tracking app designed to help people with undiagnosed or complex conditions track symptoms, identify patterns, and prepare for medical appointments. Built as a dedication to Annie Rabbets.

## Features

- **Daily Voice Check-ins**: Record symptoms naturally via voice using Whisper AI transcription
- **Flexible Symptom Tracking**: Dynamic symptom capture without rigid forms
- **Pattern Recognition**: Spot correlations between activities and symptoms
- **Doctor Reports**: Generate comprehensive summaries for medical appointments
- **Privacy-First**: All data stays in your control

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Web Audio API for voice recording
- Chart.js/Recharts for data visualization

### Backend
- Node.js/Express with TypeScript
- MongoDB for flexible document storage
- faster-whisper for voice transcription
- Railway for hosting

## Project Structure

```
ask-annie/
├── backend/          # Express API server
├── frontend/         # React application
├── docs/            # Documentation
└── ASK_ANNIE_PROJECT_BRIEF.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Podman (or Docker)
- Python 3.8+ (for faster-whisper)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lrabbets/ask-annie.git
   cd ask-annie
   ```

2. **Start dependencies (MongoDB + Redis)**
   ```bash
   make deps-up
   ```
   This starts MongoDB on `localhost:27017` and Redis on `localhost:6379`

3. **Install npm dependencies**
   ```bash
   make install
   # Or manually:
   npm run install:all
   ```

4. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings

   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your settings
   ```

5. **Start development servers**
   ```bash
   make dev
   ```
   This runs both backend and frontend with hot-reload enabled.

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Mongo Express UI: http://localhost:8081 (admin/admin)

## Documentation

- [Development Workflow](docs/WORKFLOW.md) - **Start here for development work**
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Container Setup (Podman/Docker)](docs/DOCKER.md)
- [Podman Specific Guide](docs/PODMAN.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

## Deployment

The app is designed to be deployed on Railway with automatic CI/CD from GitHub. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## Privacy & Security

- **JWT Authentication**: Industry-standard Passport.js authentication protects all endpoints
- **PHI Protection**: Users can only access their own Protected Health Information
- All audio transcription happens server-side
- Medical data stored securely in your MongoDB instance
- Users can export and delete all data at any time
- No third-party sharing of health information

## Roadmap

### Backend (Wave 1) - Nearly Complete
- ✅ Symptom parsing service with AI
- ✅ Voice check-in endpoint (POST /api/checkins with audio)
- ✅ Manual check-in endpoint (POST /api/checkins with JSON)
- ✅ List check-ins endpoint (GET /api/checkins with filtering & pagination)
- ✅ JWT Authentication with Passport.js (Issue #52 - security fix)
- ✅ Comprehensive test coverage (98.51%, 202 tests)
- 📋 End-to-end voice flow testing (Issue #8)
- 📋 Login/register endpoints (needed for JWT token generation)

### Frontend - Not Started
- 📋 Voice recording interface
- 📋 Manual check-in UI
- 📋 Dashboard with timeline view
- 📋 Symptom trends and charts
- 📋 Doctor summary generation
- 📋 Mobile-optimized PWA

### Future Enhancements
- 📋 PDF export for doctor summaries
- 📋 Medication tracking
- 📋 Wearable device integration
- 📋 Advanced ML pattern detection

## License

AGPL-3.0

This project is licensed under the GNU Affero General Public License v3.0. This means:
- You can freely use, modify, and distribute this software
- If you run a modified version on a server, you must make the source code available to users
- Any derivative work must also be licensed under AGPL-3.0

See the [LICENSE](LICENSE) file for full details.

## Dedication

Built with love for Annie Rabbets 🐰

---

For questions or issues, please open a GitHub issue.
