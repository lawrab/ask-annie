# Ask Annie API Documentation

**Base URL**: `http://localhost:3000/api` (development)
**Base URL**: `https://ask-annie.railway.app/api` (production)

**API Version**: v1
**Content-Type**: `application/json` (unless specified otherwise)

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Register

Create a new user account.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "string (required, 3-30 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "notificationsEnabled": false,
      "notificationTimes": ["08:00", "14:00", "20:00"]
    },
    "token": "string (JWT)"
  }
}
```

**Errors**:
- `400` - Validation error (email/username already exists, weak password)
- `500` - Server error

---

### Login

Authenticate an existing user.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string (JWT)"
  }
}
```

**Errors**:
- `401` - Invalid credentials
- `400` - Validation error

---

### Logout

Invalidate user session.

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Check-Ins

### Create Check-In (Voice)

Upload audio recording for transcription and symptom extraction.

**Endpoint**: `POST /checkins`

**Content-Type**: `multipart/form-data`

**Headers**: `Authorization: Bearer <token>`

**Request Body** (FormData):
```
audio: File (required, audio/*, max 10MB)
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "userId": "string",
    "timestamp": "ISO 8601 string",
    "rawTranscript": "string",
    "structured": {
      "symptoms": {
        "hand_grip": "bad" | "moderate" | "good",
        "pain_level": 1-10,
        "energy": "low" | "medium" | "high",
        "raynauds_event": true | false,
        // ... other extracted symptoms
      },
      "activities": ["array", "of", "activities"],
      "triggers": ["potential", "triggers"],
      "notes": "Additional context"
    },
    "flaggedForDoctor": false,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Errors**:
- `400` - Invalid audio file, file too large
- `401` - Unauthorised
- `500` - Transcription failed

---

### Create Check-In (Manual)

Submit structured symptom data directly.

**Endpoint**: `POST /checkins`

**Content-Type**: `application/json`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "structured": {
    "symptoms": {
      "hand_grip": "bad" | "moderate" | "good",
      "pain_level": 5,
      "energy": "medium",
      "activity_level": "light"
    },
    "activities": ["walking", "light housework"],
    "triggers": [],
    "notes": "Felt better after rest"
  }
}
```

**Response**: Same as voice check-in (201 Created)

---

### Get All Check-Ins

Retrieve user's check-in history.

**Endpoint**: `GET /checkins`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): Number (default: 50, max: 100)
- `page` (optional): Number (default: 1)

**Example**: `/checkins?startDate=2024-01-01&endDate=2024-01-31&limit=20`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "checkins": [
      {
        "id": "string",
        "timestamp": "ISO 8601",
        "rawTranscript": "string",
        "structured": { ... },
        "flaggedForDoctor": false
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

---

### Get Single Check-In

**Endpoint**: `GET /checkins/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "timestamp": "ISO 8601",
    "rawTranscript": "string",
    "structured": { ... },
    "flaggedForDoctor": false
  }
}
```

**Errors**:
- `404` - Check-in not found
- `403` - Unauthorised (not your check-in)

---

### Flag Check-In for Doctor

Toggle whether a check-in is flagged for doctor review.

**Endpoint**: `PUT /checkins/:id/flag`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "flagged": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "flaggedForDoctor": true
  }
}
```

---

### Delete Check-In

**Endpoint**: `DELETE /checkins/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Check-in deleted successfully"
}
```

**Errors**:
- `404` - Check-in not found
- `403` - Unauthorised

---

## Analysis & Trends

### Get All Symptoms

Retrieve list of all symptoms tracked by the user with frequency data.

**Endpoint**: `GET /analysis/symptoms`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "symptoms": [
      {
        "name": "hand_grip",
        "count": 45,
        "percentage": 75.0,
        "values": ["bad", "moderate", "good"],
        "type": "categorical"
      },
      {
        "name": "pain_level",
        "count": 50,
        "percentage": 83.3,
        "min": 1,
        "max": 9,
        "average": 5.2,
        "type": "numeric"
      }
    ],
    "totalCheckins": 60
  }
}
```

---

### Get Symptom Trend

Get time-series data for a specific symptom.

**Endpoint**: `GET /analysis/trends/:symptom`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `days` (optional): Number (default: 14, max: 365)

**Example**: `/analysis/trends/pain_level?days=30`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "symptom": "pain_level",
    "dataPoints": [
      {
        "date": "2024-01-01",
        "value": 5,
        "count": 3
      },
      {
        "date": "2024-01-02",
        "value": 6.5,
        "count": 2
      }
    ],
    "statistics": {
      "average": 5.2,
      "min": 1,
      "max": 9,
      "median": 5,
      "standardDeviation": 1.8
    }
  }
}
```

---

### Generate Doctor Summary

Create comprehensive summary for medical appointments.

**Endpoint**: `GET /analysis/summary`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date
- `flaggedOnly` (optional): Boolean (default: false)

**Example**: `/analysis/summary?startDate=2024-01-01&endDate=2024-01-31&flaggedOnly=true`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "totalDays": 31
    },
    "overview": {
      "totalCheckins": 60,
      "flaggedCheckins": 5,
      "uniqueSymptoms": 12
    },
    "symptomTimeline": [
      {
        "symptom": "hand_grip",
        "firstAppeared": "2024-01-01",
        "frequency": 75.0,
        "trend": "worsening" | "improving" | "stable"
      }
    ],
    "frequencyTable": {
      "hand_grip": {
        "bad": 15,
        "moderate": 25,
        "good": 20
      },
      "pain_level": {
        "average": 5.2,
        "range": "1-9"
      }
    },
    "correlations": [
      {
        "finding": "Pain levels average 7.1 on high activity days vs 4.2 on rest days",
        "confidence": "high"
      }
    ],
    "flaggedEntries": [
      {
        "id": "string",
        "date": "2024-01-15",
        "highlights": "Severe pain episode, Raynaud's event"
      }
    ]
  }
}
```

---

## User Settings

### Get User Settings

**Endpoint**: `GET /user/settings`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notificationsEnabled": true,
    "notificationTimes": ["08:00", "14:00", "20:00"],
    "email": "user@example.com",
    "username": "string"
  }
}
```

---

### Update User Settings

**Endpoint**: `PUT /user/settings`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "notificationsEnabled": true,
  "notificationTimes": ["09:00", "15:00", "21:00"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notificationsEnabled": true,
    "notificationTimes": ["09:00", "15:00", "21:00"]
  }
}
```

---

### Export All Data

Download complete user data as JSON.

**Endpoint**: `POST /user/export`

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "checkins": [ ... ],
    "exportDate": "ISO 8601",
    "totalCheckins": 150
  }
}
```

---

### Delete All Data

Permanently delete all user data.

**Endpoint**: `DELETE /user/data`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "confirmation": "DELETE_ALL_DATA"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "All user data deleted successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE" (optional),
    "details": { } (optional, development only)
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorised (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (external service down)

### Common Error Codes

- `INVALID_TOKEN` - JWT token invalid or expired
- `VALIDATION_ERROR` - Request body validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_ENTRY` - Email/username already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `TRANSCRIPTION_FAILED` - Whisper service error
- `FILE_TOO_LARGE` - Audio file exceeds 10MB
- `INVALID_FILE_TYPE` - File is not audio format

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters**:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)

**Response includes**:
```json
{
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

## Versioning

Current API version: `v1` (included in base URL path)

Future versions will be accessible via `/api/v2`, etc. We maintain backwards compatibility for at least one major version.

---

## Webhook Support (Future)

*Planned for future release*: Webhook notifications for events like:
- New check-in created
- Symptom threshold exceeded
- Weekly summary available

---

**Document Version**: 1.0
**Last Updated**: 2024-01-25
**API Changelog**: See `CHANGELOG.md` for version history
