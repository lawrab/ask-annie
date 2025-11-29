# Testing Guide

Comprehensive testing guide for Annie's Health Journal covering automated tests, manual regression testing, responsive design testing, and voice parsing validation.

## Table of Contents

1. [Automated Testing](#automated-testing)
2. [Manual Regression Testing](#manual-regression-testing)
3. [Responsive Design Testing](#responsive-design-testing)
4. [Voice Parsing Testing](#voice-parsing-testing)
5. [Test Environment Setup](#test-environment-setup)
6. [Best Practices](#best-practices)

---

## Automated Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run backend tests only
cd backend && npm test

# Run frontend tests only
cd frontend && npm test
```

### Coverage Requirements

- **Backend**: >80% coverage
- **Frontend**: >70% coverage

### Current Test Suites

**Backend (330+ tests):**
- Authentication (registration, login, JWT)
- Check-ins (create, list, validation)
- Analysis (stats, trends, streaks)
- Passkeys (WebAuthn)
- User management

**Frontend (466+ tests):**
- Components (UI, forms, charts)
- Pages (dashboard, trends, check-in, settings)
- Stores (auth, state management)
- Utilities (passkeys, date formatting)

---

## Manual Regression Testing

### Quick Smoke Test (10-15 minutes)

Use this checklist before any release:

- [ ] Backend running - `http://localhost:3000/api/health` returns 200
- [ ] Frontend running - `http://localhost:5173` loads
- [ ] User can register new account
- [ ] User can login successfully
- [ ] **Session persists on refresh** (F5)
- [ ] **Session persists on navigation** (between pages)
- [ ] Manual check-in works
- [ ] Check-in appears in timeline
- [ ] Severity displays correctly (no "severity undefined")
- [ ] Dashboard loads all sections
- [ ] Trends page renders charts
- [ ] User can logout

### Critical User Flows

#### Authentication Flow

**Session Persistence (CRITICAL):**
1. Login successfully
2. Verify token in localStorage (`Application` tab)
3. Press F5 to refresh
4. **Expected**: Stay on current page, still logged in
5. Navigate between pages
6. **Expected**: Remain logged in throughout

**Login/Logout:**
1. Navigate to `/login`
2. Enter valid credentials
3. **Expected**: Redirect to `/dashboard`
4. Click "Logout"
5. **Expected**: Redirect to `/login`, token cleared

#### Check-In Creation

**Manual Check-In:**
1. Navigate to `/checkin`
2. Select "Manual Entry" tab
3. Add symptom (e.g., headache, severity 7)
4. Add optional activities, triggers, notes
5. Click "Submit Check-In"
6. **Expected**: Success message, redirect to dashboard
7. **Expected**: Check-in appears in timeline with correct severity

#### Dashboard Display

1. Navigate to `/dashboard`
2. **Verify sections load**:
   - Daily Momentum (check-in status, streaks)
   - Weekly Insights (check-in count, top symptoms)
   - Timeline History (recent check-ins)
3. **Verify**: No "Invalid Date" or "severity undefined" text
4. **Verify**: All data displays correctly

#### Trends Page

1. Navigate to `/trends`
2. Select symptom from dropdown
3. **Expected**: Chart renders with data
4. Change time range (7/14/30/90 days)
5. **Expected**: Chart updates
6. **Verify**: Statistics cards display correctly

### Edge Cases

**Empty States:**
- New user with no check-ins
- Dashboard with no data this week
- Trends with no data for selected symptom

**Boundary Values:**
- Severity min (1) and max (10)
- Very long notes (500+ characters)
- 10+ symptoms in single check-in
- Special characters in symptom names

**Long Time Gaps:**
- Streak after 30+ day inactivity
- Trends over 90-day span

### Browser Compatibility

Test critical flows in:
- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest, macOS only)
- **Chrome Mobile** (Android)
- **Safari Mobile** (iOS)

### Pre-Release Checklist

Before releasing:

- [ ] All critical tests pass (100% required)
- [ ] High priority tests ≥90% pass rate
- [ ] Session persistence working
- [ ] No "severity undefined" or "Invalid Date" bugs
- [ ] No new critical bugs discovered
- [ ] Browser compatibility verified
- [ ] Performance acceptable (<3s dashboard load)
- [ ] No console errors during normal use

---

## Responsive Design Testing

### Critical Rule

⚠️ **ZERO HORIZONTAL SCROLLING ALLOWED** ⚠️

### Test Viewports

**Mobile (Most Important):**
- **iPhone SE / 6/7/8**: 375 x 667 (**minimum width - test first!**)
- **Android Small**: 360 x 800 (**very common - must test!**)
- iPhone 12/13/14: 390 x 844
- iPhone 14 Pro Max: 430 x 932
- Google Pixel: 393 x 873
- Samsung Galaxy: 360 x 800

**Tablet:**
- iPad Mini: 768 x 1024
- iPad Air/Pro: 820 x 1180

**Desktop:**
- Small Laptop: 1280 x 800
- Standard: 1920 x 1080
- Large: 2560 x 1440

### Pages to Test

- [ ] `/login` - Login page
- [ ] `/register` - Registration page
- [ ] `/dashboard` - Dashboard with stats
- [ ] `/checkin` - Check-in page (both modes)
- [ ] `/trends` - Trends visualization
- [ ] `/settings` - Settings page

### Testing Checklist

**Visual Inspection:**
- [ ] No horizontal scrollbar
- [ ] All content visible without horizontal scrolling
- [ ] Text doesn't overflow containers
- [ ] Images/icons properly sized
- [ ] Buttons fully visible and clickable
- [ ] Forms fit within viewport

**Interactive Elements:**
- [ ] All buttons reachable
- [ ] Form inputs don't cause layout shift
- [ ] Dropdowns don't break layout
- [ ] Modals fit within viewport
- [ ] Virtual keyboard doesn't break layout (mobile)

### Testing Procedure

**Manual Testing:**
1. Open Browser DevTools (F12)
2. Enable "Responsive Design Mode" (Cmd+Shift+M)
3. Set viewport to 375px wide (smallest)
4. Navigate through all pages
5. Check for horizontal scrollbar
6. Try scrolling left/right with trackpad

**Automated Testing (Playwright):**
```javascript
// Check for horizontal scroll
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:5173');

const hasHorizontalScroll = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth;
});

if (hasHorizontalScroll) {
  console.error('❌ FAIL: Horizontal scroll detected');
} else {
  console.log('✅ PASS: No horizontal scroll');
}
```

### Common Causes of Horizontal Scroll

1. **Fixed Width Elements**
   ```css
   /* ❌ Bad */
   .container { width: 500px; }

   /* ✅ Good */
   .container { max-width: 500px; width: 100%; padding: 0 1rem; }
   ```

2. **Images Without Constraints**
   ```css
   /* ❌ Bad */
   img { width: 800px; }

   /* ✅ Good */
   img { max-width: 100%; height: auto; }
   ```

3. **Long Unbreakable Text**
   ```css
   /* ✅ Good */
   .text {
     word-wrap: break-word;
     overflow-wrap: break-word;
     word-break: break-word;
   }
   ```

### Debugging Horizontal Scroll

Run this in DevTools Console to highlight overflowing elements:

```javascript
const findOverflow = () => {
  const docWidth = document.documentElement.clientWidth;
  const elements = document.querySelectorAll('*');

  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > docWidth || rect.left < 0) {
      el.style.outline = '2px solid red';
      console.log('Overflow element:', el, {
        right: rect.right,
        width: rect.width,
        docWidth: docWidth
      });
    }
  });
};
findOverflow();
```

### Acceptance Criteria

✅ **PASSED** if:
- Zero horizontal scrollbars on any viewport
- All content readable and accessible
- No element extends beyond viewport width
- Works on all tested viewports

❌ **FAILED** if:
- Any horizontal scrollbar appears
- Content requires horizontal scrolling
- Layout breaks on any viewport size

---

## Voice Parsing Testing

### Test Scripts

#### Test 1: Complex Multi-Symptom

**What to say:**
> "Today I'm experiencing a moderate headache, probably a 6 out of 10, mostly in my temples. I also have some mild nausea, maybe a 3. I've been working on the computer for about 4 hours and I'm feeling pretty fatigued. I think the headache was triggered by not drinking enough water and too much screen time. I did take a short walk outside which helped a little."

**Expected results:**
```json
{
  "symptoms": {
    "headache": { "severity": 6, "location": "temples" },
    "nausea": { "severity": 3 },
    "fatigue": { "severity": 5 }
  },
  "activities": ["working on computer", "walk outside"],
  "triggers": ["dehydration", "screen time"]
}
```

#### Test 2: Categorical Severities

**What to say:**
> "I'm having a terrible migraine today, probably a 9 out of 10, right behind my eyes. My neck is also really stiff. I think it was caused by stress at work and not sleeping well last night."

**Expected results:**
```json
{
  "symptoms": {
    "migraine": { "severity": 9, "location": "behind eyes" },
    "neck_stiffness": { "severity": 7 }
  },
  "triggers": ["stress", "lack of sleep"]
}
```

#### Test 3: Good Day (Low Severities)

**What to say:**
> "Feeling pretty good today. Just a little bit of joint stiffness in the morning, maybe a 2, but it went away after my morning walk. Energy levels are good, did some light housework and cooking without any issues."

**Expected results:**
```json
{
  "symptoms": {
    "joint_stiffness": { "severity": 2 }
  },
  "activities": ["walking", "housework", "cooking"]
}
```

#### Test 4: Negative Assertions (Should NOT Extract)

**What to say:**
> "No headache today, which is great. I'm not experiencing any pain at all. I did some yoga and went for a short run. Feeling pretty energetic."

**Expected results:**
```json
{
  "symptoms": {},
  "activities": ["yoga", "running"]
}
```

**Note**: Should NOT extract "headache" or "pain" since they're negated.

### How to Test

**Option 1: Manual Check-In (Recommended)**
1. Start dev servers
2. Login to app
3. Go to "Manual Check-In" page
4. Type script into notes field
5. Submit check-in
6. View on Dashboard to verify parsing

**Option 2: Voice Check-In**
1. Go to "Voice Check-In" page
2. Click record
3. Read test script
4. Stop recording
5. Submit
6. Verify parsed results

**Option 3: Direct API Test (Fastest)**
```bash
cd backend
node -e "
const { parseSymptoms } = require('./dist/services/parsingService.js');

const transcript = \"Today I'm experiencing a moderate headache, probably a 6 out of 10.\";

parseSymptoms(transcript).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
});
"
```

### What to Check

- ✅ Symptoms extracted correctly (name, severity, location)
- ✅ Severities mapped correctly (numbers preserved, words mapped to scale)
- ✅ Activities detected (normalized, no duplicates)
- ✅ Triggers identified (from signal words like "triggered by")
- ✅ Negations handled (don't extract "no pain" as "pain")
- ✅ Original transcript preserved in notes

### Success Indicators

- GPT-4o-mini extracts all explicitly mentioned symptoms
- Numeric severities preserved exactly (6 out of 10 → 6)
- Categorical severities mapped reasonably (mild → 2-3, severe → 8-9)
- Locations associated with correct symptoms
- Activities and triggers detected from context
- Negations properly ignored

### Debugging

If results don't match expectations:

1. **Check backend logs**:
   ```bash
   info: Parsing transcript with GPT-4o-mini
   info: Parsing complete { symptomCount: X, activityCount: Y }
   ```

2. **Verify API key**:
   ```bash
   cd backend
   echo $OPENAI_API_KEY
   ```

3. **Test OpenAI connection**:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "test"}]}'
   ```

### Cost Tracking

Each check-in costs approximately **$0.00009** (~0.009 cents):
- Input: ~200 tokens @ $0.15/1M = $0.00003
- Output: ~100 tokens @ $0.60/1M = $0.00006

---

## Test Environment Setup

### Prerequisites

- [ ] Node.js installed (v18+)
- [ ] npm installed
- [ ] MongoDB running (Podman/Docker)
- [ ] Redis running (Podman/Docker)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)

### Starting the Application

**Using Makefile (Recommended):**
```bash
# Start MongoDB and Redis
make deps-up

# Start backend and frontend
make dev
```

**Manual Start:**
```bash
# Terminal 1: Dependencies
docker-compose up

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Verify Services

**Backend health check:**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

**Frontend:**
Open browser: `http://localhost:5173`

**MongoDB:**
```bash
mongosh mongodb://localhost:27017/annies-health-journal
```

### Environment Variables

**Backend `.env`:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/annies-health-journal
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Test Data

**Create test user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "Password123!"
  }'
```

**Create sample check-in:**
```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Password123!"}' \
  | jq -r '.data.token')

# Create check-in
curl -X POST http://localhost:3000/api/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "structured": {
      "symptoms": {
        "headache": {"severity": 7},
        "nausea": {"severity": 5}
      },
      "activities": ["walking"],
      "notes": "Test check-in"
    }
  }'
```

---

## Best Practices

### During Development

1. **Test on mobile first**: Always check 375px viewport
2. **Run tests before committing**: `npm test`
3. **Check coverage**: Maintain >80% backend, >70% frontend
4. **Use DevTools**: Keep Console and Network tabs open
5. **Test session persistence**: Refresh page after every change

### Before Pull Requests

1. **Run full quality checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

2. **Test critical flows**:
   - Login/logout
   - Create check-in
   - View dashboard
   - Session persistence

3. **Test responsive design**:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

### Before Releases

1. **Complete smoke test** (10-15 minutes)
2. **Test in all supported browsers**
3. **Verify known issues remain fixed**
4. **Check for new bugs**
5. **Performance testing** (dashboard <3s load)

### Code Review

When reviewing PRs, check:
- [ ] Tests added/updated for new features
- [ ] Coverage maintained or improved
- [ ] Responsive on mobile (375px width)
- [ ] No fixed widths without max-width
- [ ] Session persistence not broken
- [ ] No console errors

### CI/CD Integration

All PR checks must pass:
- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Test suites (330 backend + 466 frontend)
- ✅ Build verification

### Regression Prevention

1. **Automated tests** for critical flows
2. **Playwright tests** for responsive design
3. **Pre-commit hooks** for linting/tests
4. **Code review checklist** enforcement
5. **Regular regression testing** before releases

---

**Last Updated**: 2025-11-29
