# Ask Annie

**Your daily health companion. Track symptoms, spot patterns, empower your health.**

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
- Node.js 18+ and npm/yarn
- MongoDB (local or Railway instance)
- Python 3.8+ (for faster-whisper)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ask-annie.git
   cd ask-annie
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and secrets
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your backend API URL
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Development Guide](docs/DEVELOPMENT.md)
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

Built with love in memory of Annie Rabbets 🐰

---

For questions or issues, please open a GitHub issue.
