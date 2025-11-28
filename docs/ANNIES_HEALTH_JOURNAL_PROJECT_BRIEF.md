# Annie's Health Journal - Project Brief

**Strapline:** *Your daily health companion. Track symptoms, spot patterns, empower your health.*

---

## Project Overview

Annie's Health Journal is a health symptom tracking app designed to help people with undiagnosed or complex conditions track symptoms, identify patterns, and prepare for medical appointments. Built as a dedication to Annie Rabbets, the app is intuitive enough for anyone to use daily.

**Core Philosophy:** Simple daily check-ins via voice or quick selections, flexible symptom tracking, and meaningful trend analysis.

---

## User Problem

People with undiagnosed or mysterious health conditions struggle to:
- Remember symptom patterns when appointments come around
- Communicate the full scope of their experience to doctors
- Spot correlations between activities and symptoms
- Track evolving or new symptoms without rigid forms

Annie's Health Journal solves this by being frictionless, flexible, and focused on what actually matters: patterns over time.

---

## Core Features

### 1. Daily Check-In (Primary Flow)
- **Trigger:** Push notification at customizable times (default: 8am, 2pm, 8pm)
- **Input Method:** Voice recording (Whisper transcription) OR quick multiple-choice fallback
- **Voice Flow:**
  - User taps notification
  - Big microphone button opens
  - Records 5-30 second voice memo
  - Backend transcribes with faster-whisper
  - AI parses transcript into structured symptoms
  - Confirmation: "Check-in saved!"
- **Fallback Multiple Choice:**
  - Hand Grip: Bad / Moderate / Good
  - Pain Level: 1-10 slider
  - Energy: Low / Medium / High
  - What stopped you: Nothing / Hand issues / Fatigue / Pain / Other
  - Activity level: Rested / Light / Normal / High

### 2. Dynamic Symptom Tracking
- Symptoms stored as flexible dictionary (not rigid schema)
- Common symptoms pre-populated, but any new symptom mentioned gets captured
- Example symptoms tracked: hand_grip, pain_level, raynauds_event, brain_fog, tingling_feet, neck_stiffness, etc.
- Symptoms are tracked as key-value pairs with values like: true/false, "mild"/"moderate"/"severe", 1-10, or freeform text

### 3. Dashboard & Trends
- **Timeline View:** All check-ins chronologically with raw transcripts
- **Symptom Analysis:** 
  - "Show me all entries with [symptom]"
  - Frequency: "Tingling in feet appeared in 40% of last 14 days' entries"
  - Severity trends: "Pain level average: 5.2, but 7.1 on high activity days"
  - Pattern detection: "You feel best on rest days"
- **Charts:** Simple line graphs for numeric symptoms (pain, energy) over time

### 4. Doctor Appointment Prep
- Flag entries as "important for doctor"
- Generate Doctor Summary:
  - Symptom timeline (when each symptom first appeared)
  - Frequency table (% of entries containing each symptom)
  - Severity trends
  - Correlations (activities/rest patterns affecting symptoms)
  - Export as JSON or printable PDF
  - Condensed format: fits on 1-2 pages

### 5. Settings
- Notification times (customizable)
- Notification toggle (on/off)
- Data export (download all entries as JSON)
- Clear all data (with confirmation)

---

## Tech Stack

**Frontend:**
- React 18 (TypeScript)
- Tailwind CSS (styling)
- Web Audio API (recording)
- Notifications API (browser push)
- localStorage (offline sync)

**Backend:**
- Node.js/Express (TypeScript)
- MongoDB (flexible document storage)
- faster-whisper (OpenAI Whisper optimized - voice transcription)
- Parsing layer (keyword + optional Claude API for edge cases)

**Infrastructure:**
- Railway (frontend, backend, MongoDB all hosted)
- GitHub (source control, auto-deploy on push)

---

## Data Schema

### Check-In Document (MongoDB)

```json
{
  "_id": "ObjectId",
  "userId": "string",
  "timestamp": "ISO 8601 datetime",
  "rawTranscript": "string (original voice-to-text or 'manual entry')",
  "structured": {
    "symptoms": {
      "hand_grip": "bad" | "moderate" | "good",
      "pain_level": 1-10,
      "energy": "low" | "medium" | "high",
      "raynauds_event": true | false,
      "activity_level": "rested" | "light" | "normal" | "high",
      "[custom_symptom_key]": "value" // dynamic, any symptom mentioned
    },
    "activities": ["array", "of", "activities"],
    "triggers": ["array", "of", "potential", "triggers"],
    "notes": "string (any extra context from transcript)"
  },
  "flaggedForDoctor": true | false,
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### User Document (MongoDB)

```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "notificationTimes": ["08:00", "14:00", "20:00"],
  "notificationsEnabled": true | false,
  "createdAt": "ISO 8601"
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account (username, email, password)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Check-Ins
- `POST /api/checkins` - Create new check-in
  - **Input:** FormData with audio file OR JSON with structured data
  - **Returns:** Parsed structured check-in + ID
- `GET /api/checkins` - Get all check-ins (with optional date range filters)
  - **Query params:** ?startDate=ISO&endDate=ISO&limit=50
  - **Returns:** Array of check-ins
- `GET /api/checkins/:id` - Get single check-in
- `PUT /api/checkins/:id/flag` - Toggle flagged status for doctor
- `DELETE /api/checkins/:id` - Delete single check-in

### Analysis & Summary
- `GET /api/analysis/symptoms` - Get all symptoms tracked + frequency
- `GET /api/analysis/summary?startDate=ISO&endDate=ISO` - Generate doctor summary
  - **Returns:** Object with symptoms timeline, frequencies, trends, correlations
- `GET /api/analysis/trends/:symptom?days=14` - Get trend data for specific symptom

### User Settings
- `GET /api/user/settings` - Get notification settings
- `PUT /api/user/settings` - Update notification times/preferences
- `POST /api/user/export` - Export all data as JSON

---

## Frontend Components & Pages

### Pages
1. **Check-In Page** (`/checkin`)
   - Voice recording interface (big mic button)
   - Fallback quick-choice buttons
   - Confirmation message
   - Redirect to dashboard after save

2. **Dashboard** (`/dashboard`)
   - Timeline view of all check-ins
   - Recent summary card (last 7 days stats)
   - Quick stats (symptoms this week, trending symptoms)
   - Links to detailed views

3. **Trends** (`/trends`)
   - Symptom selector dropdown
   - Line chart showing symptom over time
   - Stats: average, min, max, % days present
   - Correlation insights ("Better on rest days")

4. **Doctor Summary** (`/doctor-summary`)
   - Date range selector
   - Flag filter toggle (show only flagged entries)
   - Generated summary with:
     - Symptom timeline
     - Frequency table
     - Severity trends
   - Download as PDF button
   - Copy to clipboard button

5. **Settings** (`/settings`)
   - Notification times input
   - Toggle notifications on/off
   - Export data button
   - Clear all data button (with confirmation)

6. **Auth Pages**
   - Login (`/login`)
   - Register (`/register`)

### Components (Reusable)
- NotificationPermission (requests browser notification access)
- SymptomChart (renders line chart for any symptom)
- CheckInCard (displays single check-in with transcript + flags)
- SymptomBadge (displays individual symptom with value)

---

## Voice Transcription Flow (Whisper Integration)

1. **Frontend:** Records audio → sends as FormData blob to backend
2. **Backend Receives:** Audio file at `/api/checkins` endpoint
3. **Whisper Processing:** 
   - Write audio to temp file
   - Run through faster-whisper model
   - Get transcript string
4. **Parsing Layer:**
   - Keyword matching pass (extract common symptoms)
   - If confidence < 80%, send to Claude API (optional): "Extract symptoms from this transcript: [transcript]. Return JSON with keys like: hand_grip, pain_level, etc."
   - Build structured symptoms object
5. **Storage:** Save to MongoDB with both raw transcript + structured data
6. **Response:** Return parsed data + confirmation to frontend

---

## Development Phases (Week Breakdown)

### Day 1-2: Project Setup & Infrastructure
- [ ] Initialize GitHub repo
- [ ] Setup Node.js/Express server structure
- [ ] Setup React project (TypeScript, Tailwind)
- [ ] Create MongoDB database on Railway
- [ ] Basic Express routes skeleton
- [ ] Deploy skeleton to Railway (verify CI/CD works)

### Day 3-4: Core Backend (Whisper + Parsing)
- [ ] Integrate faster-whisper
- [ ] Build audio transcription endpoint
- [ ] Build symptom parsing logic (keyword matching)
- [ ] Create MongoDB schema + check-in creation endpoint
- [ ] Build `/api/checkins` GET endpoint
- [ ] Test voice recording → transcription → storage flow

### Day 4-5: Frontend (Check-In Interface)
- [ ] Build check-in page with mic recording
- [ ] Integrate Web Audio API
- [ ] Build fallback multiple-choice interface
- [ ] Connect to backend `/api/checkins` POST
- [ ] Add success/error handling
- [ ] Add notification permission request

### Day 5-6: Dashboard & Analysis
- [ ] Build dashboard with timeline view
- [ ] Build trends page with charts (recharts library)
- [ ] Build analysis endpoints (symptom frequency, trends)
- [ ] Build doctor summary generation logic
- [ ] Create doctor summary page with PDF export

### Day 6-7: Polish, Testing, Deployment
- [ ] Authentication flow (login/register)
- [ ] Settings page (notifications, export)
- [ ] Bug fixes from testing
- [ ] Performance optimization
- [ ] Final deployment to Railway
- [ ] Test on mobile (notification permission, voice recording)

---

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway connected to GitHub repo
- [ ] MongoDB database created on Railway
- [ ] Environment variables set:
  - `MONGODB_URI`
  - `NODE_ENV=production`
  - `JWT_SECRET` (for auth)
  - `OPENAI_API_KEY` (if using Claude API fallback)
- [ ] Frontend build deployed
- [ ] Backend API deployed
- [ ] Test end-to-end flow in production
- [ ] HTTPS verified
- [ ] Notifications tested on mobile
- [ ] Voice recording tested on multiple browsers

---

## Key Implementation Notes

### Offline Capability
- localStorage stores last check-in draft
- If network fails, app queues check-in for sync when online
- Background sync (Service Worker) can retry failed uploads

### Privacy
- All audio transcription happens server-side (never sent to third parties unless Claude API fallback used)
- Medical data stays in your MongoDB instance
- Users can export and delete all data anytime

### Scalability
- MongoDB handles thousands of check-ins per user
- Whisper transcription is CPU-bound, not memory-bound
- Consider adding job queue (Bull, Bee-Queue) if many concurrent users

### UX Polish
- Haptic feedback on mobile when recording
- Loading states during Whisper transcription
- Encouraging messages ("Great, 3 entries this week!")
- Skeleton loaders for dashboard data

---

## Claude Code Handoff Instructions

When starting with Claude Code:

1. **Begin with infrastructure setup** (Day 1-2 phase)
   - Clone starter Express/React templates
   - Wire up MongoDB connection
   - Deploy skeleton to Railway
   - Verify deployment works before building features

2. **Then tackle Whisper integration** (critical path)
   - This is the most complex part
   - Get it working locally first, then in production

3. **Frontend and backend endpoints can be built in parallel** once Whisper works

4. **Always test voice recording + transcription end-to-end** before moving to parsing logic

5. **Deploy frequently** (after each major feature) to catch deployment issues early

6. **Focus on the core loop first:**
   - Record voice → Transcribe → Parse → Store → Display
   - Everything else builds from there

---

## Success Criteria

- ✅ User can record voice check-in via notification
- ✅ Whisper transcribes accurately (>90% accuracy)
- ✅ Symptoms parsed dynamically (new symptoms captured automatically)
- ✅ Dashboard shows timeline + trends
- ✅ Doctor summary generated and exportable
- ✅ Mobile-friendly (responsive design)
- ✅ Works on iPhone Safari + Android Chrome
- ✅ Deployed on Railway with auto-deploy on GitHub push

---

## Nice-to-Haves (Post-Week Enhancements)

- Symptom correlations (ML: which activities correlate with worst days)
- Wearable integration (heart rate, steps correlating with symptoms)
- Medication logging + response tracking
- Multi-user household accounts
- Doctor sharing links (anonymized summary for sharing with medical team)
- Symptom severity predictions based on patterns
- Email summary digest (weekly recap)

---

## Questions for Clarity

Before starting, confirm:
1. ✅ Annie using this primarily on mobile or desktop? (assume mobile-first)
2. ✅ Need user authentication (multiple people) or single-user? (assume single for now, can add later)
3. ✅ Whisper model size: base (~140MB) or tiny (~39MB)? (recommend base for accuracy)
4. ✅ PDF export critical or JSON export sufficient? (start with JSON, add PDF if time)

---

**Ready to ship. Let's build Annie's Health Journal. 🐰**
