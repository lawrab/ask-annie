# Ask Annie

**Your daily health companion. Track symptoms, spot patterns, empower your health.**

> **📦 Project Status**: This was part of my weekly AI-assisted project experiments! I got the backend started during week one, but decided to move on to new projects rather than complete this one. While the concept is solid and close to my heart, dealing with GDPR compliance and sensitive health data for a hosted service felt like more complexity than I wanted for a weekly experiment. The backend API is partially implemented, but the frontend and full feature set never materialized. Might revisit this someday! For now, it lives here as a testament to "started with good intentions." 🚀

Ask Annie is (or was going to be) a health symptom tracking app designed to help people with undiagnosed or complex conditions track symptoms, identify patterns, and prepare for medical appointments. Built as a dedication to Annie Rabbets.

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

- All audio transcription happens server-side
- Medical data stored securely in your MongoDB instance
- Users can export and delete all data at any time
- No third-party sharing of health information

## Roadmap

- ✅ Core voice check-in functionality
- ✅ Symptom tracking and trends
- ✅ Doctor summary generation
- 🔄 Mobile-optimized PWA
- 🔄 PDF export for doctor summaries
- 📋 Medication tracking
- 📋 Wearable device integration
- 📋 Advanced ML pattern detection

## License

MIT

## Dedication

Built with love for Annie Rabbets 🐰

---

For questions or issues, please open a GitHub issue.
