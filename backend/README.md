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
