# Ask Annie Frontend

React TypeScript frontend for the Ask Annie symptom tracking application.

## Status

**Version**: 0.1.0 - MVP Infrastructure Complete

Implemented features:
- ✅ JWT-based authentication (login/register)
- ✅ Protected routing with session restoration
- ✅ Dashboard with check-ins display
- ✅ API client with Axios interceptors
- ✅ Form validation with React Hook Form + Zod
- ✅ State management with Zustand
- ✅ 63 passing tests with Vitest

Coming next:
- 📋 Voice recording interface (Issue #11)
- 📋 Manual check-in form (Issue #11)
- 📋 Symptom trends and charts
- 📋 Doctor summary generation

## Tech Stack

- React 18.3.1 with TypeScript
- Vite 6.2.1 for blazing fast development
- React Router 7.1.3 for navigation
- Zustand 5.0.2 for state management
- React Hook Form 7.54.2 + Zod 3.24.1 for forms
- Axios 1.7.9 for API communication
- Tailwind CSS 3.4.17 for styling
- Vitest 3.0.4 for testing
- Recharts for data visualization (planned)
- Web Audio API for voice recording (planned)

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── context/         # React context providers
│   ├── assets/          # Images, fonts, etc.
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── dist/                # Production build
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the backend API URL in `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

### Development

```bash
npm run dev
```

Application will be available at http://localhost:5173

### Building

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Testing

```bash
npm test
npm run test:ui
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Component Structure

### Pages (Implemented)
- `/login` - Authentication page with email/password validation
- `/register` - User registration with username/email/password
- `/dashboard` - Main dashboard displaying check-ins timeline
- `/checkin` - Check-in page (placeholder for Issue #11)
- `/` - Redirects to dashboard

### Pages (Planned)
- `/trends` - Symptom trends and charts
- `/doctor-summary` - Doctor report generation
- `/settings` - User settings and preferences

### Components (Implemented)
- `ProtectedRoute` - Route guard with session restoration

### Components (Planned)
- `VoiceRecorder` - Voice recording interface
- `SymptomChart` - Visualization for symptom trends
- `CheckInCard` - Display single check-in
- `SymptomBadge` - Display individual symptom
- `NotificationPermission` - Request notification access

## Styling

This project uses Tailwind CSS with a custom theme based on pink/blue colour palette. Key classes:

- `btn`, `btn-primary`, `btn-secondary` - Button styles
- `input` - Form input styles
- `card` - Card container styles

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run typecheck` - Type check without build
