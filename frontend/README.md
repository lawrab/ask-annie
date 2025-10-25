# Ask Annie Frontend

React TypeScript frontend for the Ask Annie symptom tracking application.

## Features

- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for blazing fast development
- React Router for navigation
- Zustand for state management
- React Hook Form for forms
- Recharts for data visualisation
- Web Audio API integration for voice recording

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

### Pages
- `/` - Landing/Dashboard
- `/checkin` - Voice/manual check-in interface
- `/dashboard` - Timeline view of all check-ins
- `/trends` - Symptom trends and charts
- `/doctor-summary` - Doctor report generation
- `/settings` - User settings and preferences
- `/login` - Authentication
- `/register` - User registration

### Key Components
- `VoiceRecorder` - Voice recording interface
- `SymptomChart` - Visualisation for symptom trends
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
