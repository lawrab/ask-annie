# Annie's Health Journal Frontend

React TypeScript frontend for the Annie's Health Journal symptom tracking application.

## Status

**Version**: 0.1.0 MVP + Wave 2B + Wave 3 Complete

Implemented features:
- ✅ JWT-based authentication (login/register)
- ✅ Protected routing with session restoration
- ✅ Enhanced dashboard with three-section layout (Wave 3)
- ✅ Symptom trends page with interactive charts (Wave 3)
- ✅ Voice recording interface with Web Audio API
- ✅ Manual check-in form with validation
- ✅ Complete design system with 12 UI components (Wave 2B)
- ✅ Storybook documentation with 100+ stories
- ✅ API client with Axios interceptors
- ✅ Form validation with React Hook Form + Zod
- ✅ State management with Zustand
- ✅ 468 passing tests with Vitest (485 total, 17 skipped)

Coming next:
- 📋 Doctor summary generation (Issue #20)
- 📋 Settings page (Issue #28)
- 📋 Daily check-in notifications (Issue #13)

## Tech Stack

- React 18.3.1 with TypeScript
- Vite 6.2.1 for blazing fast development
- React Router 7.1.3 for navigation
- Zustand 5.0.2 for state management
- React Hook Form 7.54.2 + Zod 3.24.1 for forms
- Axios 1.7.9 for API communication
- Tailwind CSS 3.4.17 for styling
- Storybook 10 for component documentation
- Vitest 3.0.4 for testing
- Recharts 2.15.0 for data visualization
- Web Audio API for voice recording
- Headless UI 2.2.0 for accessible overlays

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
- `/dashboard` - Enhanced dashboard with Daily Momentum, Weekly Insights, Timeline History (Wave 3)
- `/checkin` - Check-in page with voice/manual toggle
- `/trends` - Symptom trends visualization with interactive charts (Wave 3)
- `/design-system` - Component library documentation
- `/` - Redirects to dashboard

### Pages (Planned)
- `/doctor-summary` - Doctor report generation
- `/settings` - User settings and preferences

### Components (Implemented)

**Design System (Wave 2B)**:
- `Alert` - Contextual alerts with variants
- `Badge` - Status and category badges
- `Button` - Primary, secondary, danger buttons
- `Card` - Container component
- `Checkbox` - Accessible checkbox input
- `ConfirmDialog` - Confirmation modal with Headless UI
- `Divider` - Visual separator
- `Input` - Text input with validation states
- `Modal` - Accessible modal dialog
- `Radio` - Radio button input
- `RadioGroup` - Radio button group
- `TextArea` - Multi-line text input

**Dashboard Components (Wave 3)**:
- `CheckInCard` - Check-in display with progressive disclosure
- `InsightCard` - Data-driven insights with severity color coding
- `QuickStatsCard` - Metric comparisons with trend indicators

**Chart Components (Wave 3)**:
- `SymptomChart` - Recharts line chart for symptom severity over time

**Other Components**:
- `ProtectedRoute` - Route guard with session restoration
- `VoiceRecorder` - Voice recording interface with Web Audio API
- `ManualCheckInForm` - Form for manual check-in entry

### Components (Planned)
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
