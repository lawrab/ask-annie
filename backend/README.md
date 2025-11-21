# Ask Annie Backend

Express.js TypeScript backend for the Ask Annie symptom tracking application.

## Features

- RESTful API with Express.js
- TypeScript for type safety
- MongoDB with Mongoose ODM
- JWT authentication
- Voice transcription with faster-whisper
- Comprehensive error handling
- Request validation with Joi
- Logging with Winston
- Rate limiting and security with Helmet

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Application entry point
├── logs/                # Application logs
├── uploads/             # Temporary file uploads
└── dist/                # Compiled JavaScript (production)
```

## Data Models

### CheckIn Model

The CheckIn model stores symptom tracking entries with the following structure:

```typescript
interface CheckIn {
  userId: ObjectId;           // Reference to User
  timestamp: Date;            // When check-in occurred
  rawTranscript: string;      // Original voice/text input
  structured: {
    symptoms: {               // Standardized symptom data (Map)
      [symptomName: string]: {
        severity: number;     // Required: 1-10 scale
        location?: string;    // Optional: body location
        notes?: string;       // Optional: additional context
      }
    };
    activities: string[];     // Activities performed
    triggers: string[];       // Potential symptom triggers
    notes: string;            // General notes
  };
  flaggedForDoctor: boolean;  // Requires medical attention
  createdAt: Date;            // Auto-generated
  updatedAt: Date;            // Auto-generated
}
```

#### Symptom Severity Scale

All symptoms use a standardized 1-10 severity scale:

- **1-3**: Low severity (good, minimal symptoms)
  - 1: Excellent, great, strong
  - 2: Fine, normal, high energy
  - 3: Slight discomfort

- **4-7**: Medium severity (moderate symptoms)
  - 4: Light symptoms
  - 5: Moderate, okay, fair
  - 6-7: Noticeable symptoms

- **8-10**: High severity (bad, intense symptoms)
  - 8: Poor, weak, tired
  - 9: Exhausted, drained, low energy
  - 10: Bad, terrible, awful, horrible

#### Categorical to Numeric Conversion

The parsing service automatically converts categorical descriptions to numeric severity:
- Voice input: "My hands felt really bad today" → `hand_grip: { severity: 10 }`
- Voice input: "Moderate pain" → `pain_level: { severity: 5 }`
- Voice input: "Feeling great" → `energy: { severity: 1 }`

See `src/services/parsingService.ts` for complete conversion mappings.

### Migrations

Database migrations are located in `src/migrations/`. See [migrations/README.md](src/migrations/README.md) for details on running migrations.

**Important**: After deploying changes to the symptom data structure, run the symptom format migration:
```bash
npx ts-node src/migrations/migrate-symptom-format.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)
- Python 3.8+ (for faster-whisper)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3000)

### Development

```bash
npm run dev
```

Server will start with hot-reloading on http://localhost:3000

### Building

```bash
npm run build
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## API Endpoints

See [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) for detailed endpoint documentation.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm test` - Run test suite
- `npm run lint` - Lint code
- `npm run typecheck` - Type check without compilation
