# Manual Regression Test Plan

**Version:** 1.0
**Last Updated:** 2025-11-23
**Application:** Ask Annie v0.1.0+
**Purpose:** Pre-release manual testing checklist to ensure critical user flows work correctly

---

## Table of Contents

1. [Pre-Release Regression Test Checklist](#1-pre-release-regression-test-checklist)
2. [Critical User Flows](#2-critical-user-flows-must-test-every-release)
3. [Detailed Test Cases](#3-detailed-test-cases)
4. [Edge Cases & Boundary Conditions](#4-edge-cases--boundary-conditions)
5. [Browser Compatibility Checklist](#5-browser-compatibility-checklist)
6. [Known Issues to Verify](#6-known-issues-to-verify)
7. [Test Data Requirements](#7-test-data-requirements)
8. [Test Environment Setup](#8-test-environment-setup)
9. [Regression Test Results Template](#9-regression-test-results-template)
10. [Sign-Off Criteria](#10-sign-off-criteria)

---

## 1. Pre-Release Regression Test Checklist

**Estimated Time:** 45-60 minutes for complete regression suite

### Quick Smoke Test (10-15 minutes)

Use this checklist for rapid pre-release validation:

- [ ] **Backend is running** - `http://localhost:3000/api/health` returns 200 OK
- [ ] **Frontend is running** - `http://localhost:5173` loads without errors
- [ ] **Database connected** - MongoDB running and accessible
- [ ] **User can register** - New account creation succeeds
- [ ] **User can login** - Credentials authenticate successfully
- [ ] **Session persists on refresh** ⚠️ CRITICAL - Dashboard stays loaded after F5
- [ ] **Session persists on navigation** ⚠️ CRITICAL - Navigate away and back without logout
- [ ] **Manual check-in works** - Can submit symptoms with severity
- [ ] **Check-in appears in timeline** - New entry visible immediately
- [ ] **Severity displays correctly** - No "severity undefined" text
- [ ] **Dashboard loads all sections** - Daily Momentum, Weekly Insights, Timeline
- [ ] **Trends page loads** - Charts render without errors
- [ ] **User can logout** - Session cleared properly

### Full Regression Test (45-60 minutes)

Complete all sections 2-4 for comprehensive coverage.

---

## 2. Critical User Flows (Must Test Every Release)

### 2.1 Authentication Flow

**Time Estimate:** 10 minutes

#### Test Flow: New User Registration
1. Navigate to `http://localhost:5173`
2. Click "Sign up" or navigate to `/register`
3. Fill form:
   - Username: `testuser` (3-30 characters)
   - Email: `testuser@example.com` (valid format)
   - Password: `Password123!` (min 8 characters)
4. Submit form
5. **Expected:** Redirect to `/dashboard` with welcome message
6. **Verify:** Token exists in localStorage (`Application` tab → `Local Storage`)

#### Test Flow: Existing User Login
1. Navigate to `/login`
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `Password123!`
3. Click "Login"
4. **Expected:** Redirect to `/dashboard`
5. **Verify:** User data displays (username, check-in count)

#### Test Flow: Invalid Login Credentials
1. Navigate to `/login`
2. Enter incorrect password
3. Click "Login"
4. **Expected:** Error message "Invalid credentials"
5. **Expected:** User stays on `/login` page

#### Test Flow: Session Persistence on Page Refresh ⚠️ CRITICAL
1. Login successfully → on `/dashboard`
2. **Verify:** `localStorage.getItem('auth-storage')` contains token
3. Press F5 or browser refresh button
4. **Expected:** Stay on `/dashboard` with user data visible
5. **Expected:** No redirect to `/login`
6. **Verify:** Network tab shows Authorization header in requests
7. **CRITICAL BUG:** If redirected to login, session persistence is broken (Issue #97)

#### Test Flow: Session Persistence on Navigation ⚠️ CRITICAL
1. Login successfully
2. Navigate: `/dashboard` → `/trends` → `/checkin` → `/dashboard`
3. **Expected:** Stay logged in throughout navigation
4. **Expected:** User data persists across all pages
5. **CRITICAL BUG:** If logged out mid-navigation, session persistence is broken

#### Test Flow: Session Persistence After Browser Tab Close
1. Login successfully
2. Close browser tab
3. Open new tab → navigate to `http://localhost:5173`
4. **Expected:** Automatically logged in, redirect to `/dashboard`
5. **Expected:** No need to re-enter credentials

#### Test Flow: Logout
1. From any authenticated page, click "Logout" button
2. **Expected:** Redirect to `/login`
3. **Verify:** `localStorage` token is cleared
4. **Expected:** Cannot access `/dashboard` without logging in again

---

### 2.2 Manual Check-In Flow

**Time Estimate:** 10 minutes

#### Test Flow: Create Manual Check-In with Severity
1. Login and navigate to `/checkin`
2. Ensure "Manual Entry" tab is selected (or switch to it)
3. Add symptom:
   - Click "Add Symptom" or similar button
   - Enter symptom name: `headache`
   - Set severity: `7` (scale 1-10)
   - Click "Add" or confirm
4. Add another symptom:
   - Name: `fatigue`
   - Severity: `5`
5. Add activities (optional):
   - Enter: `walking`, `light housework`
6. Add triggers (optional):
   - Enter: `screen time`
7. Add notes (optional):
   - Enter: `Symptoms worse after 2pm`
8. Click "Submit Check-In"
9. **Expected:** Success message appears
10. **Expected:** Redirect to `/dashboard` or check-in appears in timeline

#### Test Flow: Verify Check-In in Dashboard Timeline
1. After submitting check-in (above)
2. Navigate to `/dashboard` if not already there
3. Scroll to "Timeline History" section
4. **Expected:** New check-in appears at top of list
5. **Verify:** Symptom badges display correctly:
   - "headache" with severity indicator (color or number)
   - "fatigue" with severity indicator
6. **Verify:** NO text saying "severity undefined" ⚠️ (Issue #99)
7. **Verify:** Activities and notes visible (if expanded)
8. **Verify:** Timestamp shows correct date/time

#### Test Flow: Multiple Check-Ins Same Day
1. Create first check-in (morning): `headache: 8`
2. Wait 1-2 seconds
3. Create second check-in (afternoon): `headache: 5`
4. Navigate to `/dashboard`
5. **Expected:** Both check-ins appear in timeline
6. **Expected:** Chronological order (most recent first)
7. **Expected:** Dashboard stats update (check-in count +2)

---

### 2.3 Dashboard Display

**Time Estimate:** 10 minutes

#### Test Flow: Dashboard Sections Load
1. Login and navigate to `/dashboard`
2. **Verify:** Three main sections render:
   - **Daily Momentum** (top section)
   - **Weekly Insights** (middle section)
   - **Timeline History** (bottom section)
3. Each section should have:
   - Section heading
   - Content (not just loading spinner indefinitely)
   - No error messages

#### Test Flow: Daily Momentum Section
1. Navigate to `/dashboard`
2. Locate "Daily Momentum" section
3. **Verify displays:**
   - Check-in status for today (e.g., "2 of 3 check-ins complete")
   - Scheduled check-in times (e.g., "09:00, 14:00, 21:00")
   - Next suggested check-in time (formatted as "9:00 AM" not "Invalid Date")
   - Current streak count (e.g., "7 day streak")
   - Longest streak count
4. **Bug Check:** Next suggested time should NOT show "Invalid Date" (Issue #98 fixed)

#### Test Flow: Weekly Insights Section
1. Navigate to `/dashboard`
2. Locate "Weekly Insights" section
3. **Verify displays:**
   - Check-in count for current week (e.g., "3 check-ins this week")
   - Week-over-week comparison (e.g., "+2 from last week" or trend indicator)
   - Top symptoms with frequency
4. **Bug Check:** If "Check-ins This Week: 3", then "Top Symptoms" should NOT say "No symptoms recorded"
5. **NEW BUG FOUND:** Dashboard inconsistency - shows check-ins but no top symptoms

#### Test Flow: Timeline History Section
1. Navigate to `/dashboard`
2. Locate "Timeline History" or "Recent Check-Ins" section
3. **Verify displays:**
   - List of recent check-ins (most recent first)
   - Each check-in shows: date, time, symptoms with severity
   - Check-in cards can expand/collapse (progressive disclosure)
   - "View All" link to see full history (if applicable)
4. **Verify:** Symptoms display with severity (NOT "severity undefined")

#### Test Flow: Streak Calculation
1. Submit check-ins on consecutive days (or verify existing data)
2. Navigate to `/dashboard`
3. **Verify:**
   - Current streak increments with daily check-ins
   - Longest streak shows historical maximum
   - Streak resets if a day is missed (with 1-day grace period)
   - Supportive messaging (not punitive)

---

### 2.4 Trends Page

**Time Estimate:** 10 minutes

#### Test Flow: Navigate to Trends
1. From `/dashboard`, click "Trends" in navigation
2. **Expected:** Navigate to `/trends`
3. **Expected:** Page loads without errors
4. **Verify:** Symptom selector dropdown visible
5. **Verify:** Time range selector visible (7/14/30/90 days)

#### Test Flow: Select Symptom and View Chart
1. Navigate to `/trends`
2. Click symptom selector dropdown
3. **Verify:** List of tracked symptoms appears (e.g., headache, fatigue, nausea)
4. Select a symptom: `headache`
5. **Expected:** Line chart renders showing severity over time
6. **Verify:** Chart displays:
   - X-axis: Dates
   - Y-axis: Severity (1-10 scale)
   - Data points connected by lines
   - No error messages

#### Test Flow: Change Time Range
1. On `/trends` with symptom selected
2. Click time range selector
3. Select "30 days"
4. **Expected:** Chart updates to show 30-day data
5. **Verify:** X-axis adjusts to new date range
6. Select "7 days"
7. **Expected:** Chart zooms to recent week
8. **Verify:** Data updates accordingly

#### Test Flow: View Statistics Cards
1. On `/trends` with symptom selected
2. Scroll to statistics section
3. **Verify displays:**
   - Average severity (e.g., "5.2")
   - Min/max severity (e.g., "Range: 1-9")
   - Days symptom was present (e.g., "14 of 30 days")
   - Trend direction (improving/worsening/stable)
4. **Verify:** Color coding matches severity (red/amber/green)

---

## 3. Detailed Test Cases

### Authentication Test Cases

#### TEST-AUTH-001: Register New User
- **Prerequisite:** Database accessible, no existing user with test email
- **Steps:**
  1. Navigate to `/register`
  2. Enter username: `newuser123`
  3. Enter email: `newuser123@test.com`
  4. Enter password: `SecurePass123!`
  5. Click "Sign Up"
- **Expected Result:**
  - HTTP 201 Created response
  - User redirected to `/dashboard`
  - Token saved to localStorage
  - User data visible in dashboard
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** ________________

---

#### TEST-AUTH-002: Login Existing User
- **Prerequisite:** User account exists (`testuser@example.com` / `Password123!`)
- **Steps:**
  1. Navigate to `/login`
  2. Enter email: `testuser@example.com`
  3. Enter password: `Password123!`
  4. Click "Login"
- **Expected Result:**
  - HTTP 200 OK response
  - Redirect to `/dashboard`
  - Token in localStorage
  - Network requests include Authorization header
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-AUTH-003: Login with Invalid Password
- **Prerequisite:** User account exists
- **Steps:**
  1. Navigate to `/login`
  2. Enter email: `testuser@example.com`
  3. Enter password: `WrongPassword123`
  4. Click "Login"
- **Expected Result:**
  - HTTP 401 Unauthorized
  - Error message: "Invalid credentials"
  - User remains on `/login`
  - No token in localStorage
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-AUTH-004: Session Persistence on Refresh ⚠️ CRITICAL
- **Prerequisite:** User logged in, on `/dashboard`
- **Steps:**
  1. Verify URL is `http://localhost:5173/dashboard`
  2. Open DevTools → Application → Local Storage
  3. Verify `auth-storage` key exists with token
  4. Press F5 to refresh page
  5. Wait for page to fully reload
- **Expected Result:**
  - User stays on `/dashboard`
  - No redirect to `/login`
  - User data still visible
  - Token still in localStorage
  - Network requests include Authorization header
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** **CRITICAL** - Issue #97 supposedly fixed but reported still broken

---

#### TEST-AUTH-005: Session Persistence Across Navigation ⚠️ CRITICAL
- **Prerequisite:** User logged in
- **Steps:**
  1. Start on `/dashboard`
  2. Click "Trends" → verify on `/trends`
  3. Click "Check-In" → verify on `/checkin`
  4. Click "Dashboard" → verify on `/dashboard`
  5. Manually type `/trends` in URL bar and press Enter
- **Expected Result:**
  - User stays logged in throughout all navigation
  - No redirects to `/login`
  - User data persists on all pages
  - No re-authentication required
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** **CRITICAL** - Core navigation must work without re-login

---

#### TEST-AUTH-006: Session Persistence After Tab Close
- **Prerequisite:** User logged in
- **Steps:**
  1. Login successfully
  2. Verify on `/dashboard` with user data visible
  3. Close browser tab completely
  4. Open new browser tab
  5. Navigate to `http://localhost:5173`
- **Expected Result:**
  - Automatically logged in
  - Redirected to `/dashboard` (not `/login`)
  - User data visible
  - No need to re-enter credentials
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-AUTH-007: Logout Clears Session
- **Prerequisite:** User logged in
- **Steps:**
  1. From any authenticated page, locate "Logout" button
  2. Click "Logout"
  3. Open DevTools → Application → Local Storage
  4. Check for `auth-storage` key
  5. Try accessing `/dashboard` directly
- **Expected Result:**
  - Redirected to `/login` after logout
  - localStorage token is cleared/removed
  - Accessing `/dashboard` redirects to `/login`
  - Network requests do NOT include Authorization header
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

### Check-In Test Cases

#### TEST-CHECKIN-001: Create Manual Check-In with Single Symptom
- **Prerequisite:** User logged in
- **Steps:**
  1. Navigate to `/checkin`
  2. Select "Manual Entry" tab
  3. Add symptom: `headache`
  4. Set severity: `7`
  5. Click "Submit Check-In"
- **Expected Result:**
  - HTTP 201 Created
  - Success message displays
  - Check-in appears in dashboard timeline
  - Symptom shows as "headache" with severity 7
  - No "severity undefined" text
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-CHECKIN-002: Create Manual Check-In with Multiple Symptoms
- **Prerequisite:** User logged in
- **Steps:**
  1. Navigate to `/checkin`
  2. Add symptom: `headache`, severity `8`
  3. Add symptom: `nausea`, severity `6`
  4. Add symptom: `fatigue`, severity `5`
  5. Add activities: `walking`, `light housework`
  6. Add triggers: `screen time`, `lack of sleep`
  7. Add notes: `Symptoms worse in afternoon`
  8. Click "Submit Check-In"
- **Expected Result:**
  - HTTP 201 Created
  - All symptoms appear in timeline with correct severities
  - Activities and triggers saved
  - Notes visible when check-in expanded
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-CHECKIN-003: Verify New Check-In Displays Correctly in Timeline
- **Prerequisite:** Just created check-in in TEST-CHECKIN-002
- **Steps:**
  1. Navigate to `/dashboard`
  2. Locate "Timeline History" section
  3. Find the most recent check-in
  4. Verify symptom badges
  5. Expand check-in card (if collapsed)
- **Expected Result:**
  - Check-in appears at top of timeline
  - Badges show: "headache 8", "nausea 6", "fatigue 5"
  - NO text "severity undefined" anywhere
  - Color coding: headache (red/high), nausea (amber/medium), fatigue (amber/medium)
  - Activities, triggers, notes visible when expanded
  - Timestamp correct
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** Issue #99 - verify severity NOT showing as "undefined"

---

#### TEST-CHECKIN-004: Old Check-Ins Display Severity Correctly ⚠️
- **Prerequisite:** Existing check-ins from Nov 16 or earlier (pre-migration data)
- **Steps:**
  1. Navigate to `/dashboard`
  2. Scroll through timeline to older check-ins
  3. Locate check-ins from Nov 16, 2024
  4. Inspect symptom badges
- **Expected Result:**
  - Old check-ins should display severity correctly OR
  - Old check-ins show symptom name only (no severity) without "undefined" text
  - No "severity undefined" text anywhere
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** Issue #99 - partially fixed. New data works, old data may still show "severity undefined"

---

#### TEST-CHECKIN-005: Multiple Check-Ins Same Day
- **Prerequisite:** User logged in
- **Steps:**
  1. Create check-in #1: `headache: 8` at current time
  2. Wait 2 seconds
  3. Create check-in #2: `headache: 5` at current time
  4. Navigate to `/dashboard`
- **Expected Result:**
  - Both check-ins appear in timeline
  - Chronological order (most recent first)
  - Dashboard stats update: "Check-ins Today: 2"
  - Distinct timestamps on each check-in
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

### Dashboard Test Cases

#### TEST-DASH-001: Dashboard Loads All Sections
- **Prerequisite:** User logged in with at least 3 check-ins in past week
- **Steps:**
  1. Navigate to `/dashboard`
  2. Wait for all sections to load
- **Expected Result:**
  - Daily Momentum section visible with data
  - Weekly Insights section visible with data
  - Timeline History section visible with check-ins
  - No infinite loading spinners
  - No error messages
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-DASH-002: Daily Momentum Section Displays Correctly
- **Prerequisite:** User logged in, has check-ins today
- **Steps:**
  1. Navigate to `/dashboard`
  2. Locate "Daily Momentum" section
  3. Verify all data fields
- **Expected Result:**
  - Check-in status: "X of Y check-ins complete"
  - Scheduled times listed (e.g., "09:00, 14:00, 21:00")
  - Next suggested time formatted correctly (e.g., "9:00 PM")
  - Next suggested time NOT "Invalid Date"
  - Current streak number (e.g., "7 days")
  - Longest streak number
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** Issue #98 fixed - "Invalid Date" bug

---

#### TEST-DASH-003: Weekly Insights Section Displays Correctly
- **Prerequisite:** User logged in, has check-ins in past 7 days
- **Steps:**
  1. Navigate to `/dashboard`
  2. Locate "Weekly Insights" section
  3. Verify all data fields
- **Expected Result:**
  - Check-in count for week (e.g., "3 check-ins this week")
  - Week-over-week trend (e.g., "+2 from last week" or percentage)
  - Top symptoms listed with frequency
  - If check-ins exist, top symptoms should NOT say "No symptoms recorded"
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked
- **Notes:** **NEW BUG** - Inconsistency: shows "3 check-ins" but "No symptoms recorded"

---

#### TEST-DASH-004: Timeline Shows Recent Check-Ins
- **Prerequisite:** User has at least 5 check-ins
- **Steps:**
  1. Navigate to `/dashboard`
  2. Scroll to Timeline History section
  3. Verify check-ins display
- **Expected Result:**
  - At least 5 recent check-ins visible
  - Chronological order (newest first)
  - Each shows: date, time, symptoms with severity
  - Symptom severity visible (NOT "severity undefined")
  - Cards can expand/collapse
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-DASH-005: Streak Calculation Accuracy
- **Prerequisite:** User has check-ins on 3+ consecutive days
- **Steps:**
  1. Navigate to `/dashboard`
  2. Locate current streak counter
  3. Count actual consecutive days with check-ins
  4. Compare displayed streak to actual count
- **Expected Result:**
  - Current streak matches actual consecutive days
  - Longest streak shows historical maximum (≥ current streak)
  - Streak has 1-day grace period (includes yesterday)
  - Supportive messaging (not punitive if streak broken)
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

### Trends Page Test Cases

#### TEST-TRENDS-001: Trends Page Loads
- **Prerequisite:** User logged in
- **Steps:**
  1. Navigate to `/trends`
  2. Wait for page to fully load
- **Expected Result:**
  - Page renders without errors
  - Symptom selector dropdown visible
  - Time range selector visible
  - Default state shows placeholder or instructions
  - No JavaScript errors in console
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-TRENDS-002: Symptom Selection Displays Chart
- **Prerequisite:** User logged in, has tracked symptoms
- **Steps:**
  1. Navigate to `/trends`
  2. Click symptom selector dropdown
  3. Verify list of symptoms appears
  4. Select symptom: `headache`
- **Expected Result:**
  - Dropdown shows all tracked symptoms (headache, nausea, fatigue, etc.)
  - Selecting symptom triggers chart render
  - Line chart displays with:
    - X-axis: Dates (last 14 days default)
    - Y-axis: Severity (1-10)
    - Data points for each check-in
  - No errors in console
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-TRENDS-003: Time Range Selection Updates Chart
- **Prerequisite:** Symptom selected and chart visible
- **Steps:**
  1. On `/trends` with `headache` selected
  2. Default time range: 14 days
  3. Change to 7 days
  4. Change to 30 days
  5. Change to 90 days
- **Expected Result:**
  - Chart updates immediately on selection change
  - X-axis adjusts to show correct date range
  - Data points update to match time range
  - Statistics cards update to reflect new range
  - No flickering or loading errors
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-TRENDS-004: Statistics Cards Display Correctly
- **Prerequisite:** Symptom selected, chart visible
- **Steps:**
  1. On `/trends` with symptom selected
  2. Locate statistics cards below chart
  3. Verify each card's data
- **Expected Result:**
  - Average severity shown (e.g., "5.2")
  - Min/max severity (e.g., "Range: 1-9")
  - Days present (e.g., "14 of 30 days")
  - Trend indicator (improving/worsening/stable)
  - Color coding: green (improving), red (worsening), gray (stable)
  - All numbers make mathematical sense
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

#### TEST-TRENDS-005: Empty State Handling
- **Prerequisite:** User logged in but NO data for a specific symptom
- **Steps:**
  1. Navigate to `/trends`
  2. Select time range: 90 days
  3. Select symptom that has no data in that range
- **Expected Result:**
  - Friendly empty state message (e.g., "No data for this symptom in the selected time range")
  - No broken charts or error messages
  - Suggestion to create a check-in or select different symptom
- **Actual Result:** ________________
- **Status:** [ ] Pass [ ] Fail [ ] Blocked

---

## 4. Edge Cases & Boundary Conditions

### Empty States

#### TEST-EDGE-001: New User with No Check-Ins
- **Scenario:** User just registered, no data yet
- **Steps:**
  1. Register new account
  2. Navigate to `/dashboard`
- **Expected:**
  - Empty state messages (e.g., "No check-ins yet. Create your first check-in!")
  - No errors or broken components
  - Call-to-action button to create first check-in
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-002: Dashboard with No Check-Ins This Week
- **Scenario:** User has old data but nothing in past 7 days
- **Steps:**
  1. Login with account that has no recent check-ins
  2. Navigate to `/dashboard`
- **Expected:**
  - Weekly Insights: "0 check-ins this week"
  - Top Symptoms: "No symptoms recorded this week"
  - Current streak: 0 or informative message
  - Timeline shows older check-ins (if any)
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-003: Trends with No Data for Selected Symptom
- **Scenario:** Symptom exists but not in selected time range
- **Steps:**
  1. Navigate to `/trends`
  2. Select symptom that wasn't tracked in last 7 days
  3. Set time range to 7 days
- **Expected:**
  - Empty state message
  - Chart shows empty axes
  - Statistics show "No data available"
- **Status:** [ ] Pass [ ] Fail

---

### Maximum Inputs

#### TEST-EDGE-004: Check-In with Maximum Symptoms
- **Scenario:** Create check-in with 10+ different symptoms
- **Steps:**
  1. Navigate to `/checkin`
  2. Add 10 symptoms with varying severities
  3. Submit check-in
- **Expected:**
  - All symptoms saved correctly
  - Timeline card displays all symptoms (may need scroll or collapse)
  - No UI breaking or overflow issues
  - Dashboard stats update correctly
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-005: Very Long Notes Field
- **Scenario:** Check-in with 500+ characters in notes
- **Steps:**
  1. Navigate to `/checkin`
  2. Add symptom
  3. Enter 500+ characters in notes field
  4. Submit
- **Expected:**
  - Notes saved completely
  - Display truncates with "Read more" or scrollable area
  - No layout breaking
  - Performance remains acceptable
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-006: Many Check-Ins in One Day
- **Scenario:** User creates 10 check-ins on same day
- **Steps:**
  1. Create 10 check-ins throughout the day
  2. Navigate to `/dashboard`
- **Expected:**
  - All check-ins appear in timeline
  - Dashboard stats: "10 check-ins today"
  - Performance remains good
  - Timeline scrolls smoothly
- **Status:** [ ] Pass [ ] Fail

---

### Special Characters

#### TEST-EDGE-007: Symptom Names with Special Characters
- **Scenario:** Use special characters in symptom names
- **Steps:**
  1. Create check-in with symptom: `pain (sharp & burning)`
  2. Create check-in with symptom: `numbness/tingling`
  3. Navigate to `/dashboard`
- **Expected:**
  - Special characters preserved in display
  - No XSS vulnerabilities
  - Symptom selector shows names correctly
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-008: Notes with Emoji and Special Characters
- **Scenario:** Notes contain emoji, quotes, apostrophes
- **Steps:**
  1. Create check-in with notes: `Feeling 😊 better! It's "improving" since yesterday`
  2. Submit and view in timeline
- **Expected:**
  - Emoji displays correctly
  - Quotes and apostrophes preserved
  - No encoding issues
  - No JavaScript errors
- **Status:** [ ] Pass [ ] Fail

---

### Boundary Severity Values

#### TEST-EDGE-009: Severity at Min/Max Boundaries
- **Scenario:** Test severity scale limits (1 and 10)
- **Steps:**
  1. Create check-in: `headache` severity `1` (minimum)
  2. Create check-in: `headache` severity `10` (maximum)
  3. View in dashboard and trends
- **Expected:**
  - Both values accepted and stored
  - Color coding correct (green for 1, red for 10)
  - Charts display correctly at extremes
  - No validation errors
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-010: Invalid Severity Values (Negative Testing)
- **Scenario:** Attempt invalid severity values
- **Steps:**
  1. Try to create check-in with severity `0` (if UI allows)
  2. Try severity `11` (if UI allows)
  3. Try negative value `-5`
- **Expected:**
  - Form validation prevents submission OR
  - Backend rejects with 400 error
  - Clear error message shown
  - No check-in created with invalid data
- **Status:** [ ] Pass [ ] Fail

---

### Long Time Gaps

#### TEST-EDGE-011: Streak After Long Inactivity
- **Scenario:** User has check-ins, then 30-day gap, then new check-in
- **Steps:**
  1. Login with account that has old data
  2. Wait 30+ days (or use test data)
  3. Create new check-in
  4. Check dashboard streak
- **Expected:**
  - Current streak resets to 1
  - Longest streak preserved (shows historical max)
  - No errors in streak calculation
  - Supportive messaging about restarting
- **Status:** [ ] Pass [ ] Fail

---

#### TEST-EDGE-012: Trends Over Large Time Span (90 Days)
- **Scenario:** View trends for maximum time range
- **Steps:**
  1. Navigate to `/trends`
  2. Select symptom with 90+ days of data
  3. Set time range to 90 days
- **Expected:**
  - Chart loads without performance issues
  - X-axis labels readable (date formatting)
  - Data points clear and not overcrowded
  - Statistics accurate over 90-day period
- **Status:** [ ] Pass [ ] Fail

---

## 5. Browser Compatibility Checklist

Test critical flows in each browser:

### Desktop Browsers

#### Chrome (Latest)
- [ ] Authentication flow works
- [ ] Session persistence on refresh
- [ ] Manual check-in creation
- [ ] Dashboard loads all sections
- [ ] Trends charts render correctly
- [ ] No console errors

#### Firefox (Latest)
- [ ] Authentication flow works
- [ ] Session persistence on refresh
- [ ] Manual check-in creation
- [ ] Dashboard loads all sections
- [ ] Trends charts render correctly
- [ ] No console errors

#### Safari (Latest, macOS only)
- [ ] Authentication flow works
- [ ] Session persistence on refresh
- [ ] Manual check-in creation
- [ ] Dashboard loads all sections
- [ ] Trends charts render correctly
- [ ] No console errors
- [ ] localStorage works (Safari private mode issues)

#### Edge (Latest)
- [ ] Authentication flow works
- [ ] Session persistence on refresh
- [ ] Manual check-in creation
- [ ] Dashboard loads all sections
- [ ] Trends charts render correctly

---

### Mobile Browsers

#### Chrome Mobile (Android)
- [ ] Login works on small screen
- [ ] Dashboard sections stack vertically
- [ ] Manual check-in form usable on mobile
- [ ] Timeline scrolls smoothly
- [ ] Charts readable on small screen
- [ ] Touch interactions work (tap, swipe)

#### Safari Mobile (iOS)
- [ ] Login works on iPhone
- [ ] Dashboard responsive layout
- [ ] Check-in form usable
- [ ] Timeline cards expandable
- [ ] Charts render on iOS
- [ ] Session persists in Safari mobile
- [ ] No iOS-specific localStorage issues

---

### Responsive Design Checkpoints

#### Desktop (1920x1080)
- [ ] All sections visible without horizontal scroll
- [ ] Charts use full width effectively
- [ ] Navigation easily accessible

#### Tablet (768x1024)
- [ ] Sections stack appropriately
- [ ] Forms remain usable
- [ ] Charts resize correctly

#### Mobile (375x667 - iPhone SE)
- [ ] All content accessible
- [ ] Buttons large enough to tap
- [ ] Text readable without zoom
- [ ] Forms fit on screen

---

## 6. Known Issues to Verify

Document known bugs and verify their current status:

### Issue #97: Session Persistence BROKEN ⚠️ CRITICAL

**Status:** CLOSED but reportedly STILL BROKEN

**Description:** Session token lost on page refresh or navigation, causing redirect to login

**How to Test:**
1. Login successfully
2. Verify token in localStorage: `Application` tab → `Local Storage` → `auth-storage`
3. Refresh page (F5)
4. **Expected:** Stay on current page, logged in
5. **Actual (if bug present):** Redirected to `/login`

**Verification Checklist:**
- [ ] Token exists in localStorage after login
- [ ] Token persists after page refresh
- [ ] Token persists after navigation
- [ ] Authorization header sent in API requests after refresh
- [ ] User data restored from token on refresh

**Detailed Debugging:**
If bug is present, check:
- DevTools → Application → Local Storage → `auth-storage` (does it exist?)
- DevTools → Network → Select any API request → Headers → `Authorization: Bearer ...` (is token present?)
- Console → Any errors related to authentication?

**Related Files:**
- `frontend/src/stores/authStore.ts`
- `frontend/src/services/api.ts`
- `frontend/src/components/ProtectedRoute.tsx`

---

### Issue #99: Severity Undefined ⚠️ PARTIALLY FIXED

**Status:** CLOSED but PARTIALLY FIXED (new data works, old data doesn't)

**Description:** Check-in cards show "severity undefined" instead of numeric severity values

**How to Test:**
1. Create NEW check-in with symptom `headache` severity `7`
2. Navigate to `/dashboard` → Timeline
3. **Expected:** Badge shows "headache 7" or "headache" with red/amber/green indicator
4. **Actual (if working):** Severity displays correctly
5. **Actual (if bug present):** Shows "headache severity undefined"

**Old Data Test:**
1. Find check-ins from Nov 16 or earlier
2. **Expected:** Either shows severity OR shows symptom name only (no "undefined")
3. **Actual (if bug present):** Shows "severity undefined"

**Verification Checklist:**
- [ ] NEW check-ins (created after fix) display severity correctly
- [ ] OLD check-ins (created before fix) do NOT show "severity undefined"
- [ ] Symptom badges color-coded correctly (red/amber/green)
- [ ] No "undefined" text anywhere in UI

**Related Files:**
- `frontend/src/components/CheckInCard.tsx`
- Backend: `SymptomValue` interface and migration

---

### NEW BUG: Dashboard Inconsistency ⚠️ NEW DISCOVERY

**Status:** NEW BUG FOUND DURING EXPLORATORY TESTING

**Description:** Dashboard shows "Check-ins This Week: 3" but "Top Symptoms: No symptoms recorded"

**How to Test:**
1. Login with account that has 3+ check-ins this week
2. Navigate to `/dashboard`
3. Locate "Weekly Insights" section
4. **Expected:** If check-ins exist, top symptoms should display
5. **Actual (if bug present):** "No symptoms recorded" despite having check-ins

**Verification Checklist:**
- [ ] Check-in count displays correctly (e.g., "3 check-ins this week")
- [ ] Top symptoms list displays (e.g., "headache (5x), nausea (3x)")
- [ ] If check-ins exist, top symptoms NEVER says "No symptoms recorded"
- [ ] Consistency between check-in count and top symptoms

**Debugging:**
- Check Network tab: Does `/api/analysis/quick-stats` return `topSymptoms` array?
- Check console for JavaScript errors
- Verify Weekly Insights component correctly displays `topSymptoms` data

**Related Files:**
- `frontend/src/pages/DashboardPage.tsx` (Weekly Insights section)
- Backend: `GET /api/analysis/quick-stats` endpoint

---

### Issue #98: Invalid Date Display (FIXED)

**Status:** CLOSED and VERIFIED FIXED

**Description:** "Invalid Date" shown in Dashboard next suggested check-in time

**How to Test:**
1. Navigate to `/dashboard`
2. Locate "Daily Momentum" section
3. Find "Next suggested check-in" field
4. **Expected:** Time formatted as "9:00 PM" or "14:00"
5. **Should NOT see:** "Invalid Date"

**Verification:**
- [ ] Next suggested time formatted correctly
- [ ] No "Invalid Date" anywhere on dashboard
- [ ] Date/time formatting consistent throughout app

---

### Issue #96: Analysis Service Crashes (FIXED)

**Status:** CLOSED and VERIFIED FIXED

**Description:** Backend crashes with "Cannot convert undefined or null to object"

**How to Test:**
1. Navigate to `/trends`
2. Select various symptoms
3. Change time ranges
4. Check backend logs for errors
5. **Expected:** No crashes, data loads correctly
6. **Should NOT see:** 500 errors or backend crashes

**Verification:**
- [ ] Trends page loads without 500 errors
- [ ] Quick stats endpoint returns data
- [ ] No backend crashes in logs
- [ ] Null checks present in analysis service

---

### Issue #101: Manual Check-In Validation (FIXED)

**Status:** CLOSED and VERIFIED FIXED

**Description:** Manual check-in validation rejected SymptomValue format (400 error)

**How to Test:**
1. Create manual check-in with symptoms
2. **Expected:** HTTP 201 Created
3. **Should NOT see:** 400 Bad Request error
4. Check-in appears in timeline

**Verification:**
- [ ] Manual check-in submission succeeds
- [ ] SymptomValue format accepted by backend
- [ ] No 400 validation errors on valid input

---

## 7. Test Data Requirements

### Test User Accounts

Create these accounts before testing:

#### Primary Test Account
- **Username:** `testuser`
- **Email:** `testuser@example.com`
- **Password:** `Password123!`
- **Purpose:** Main testing account with existing data

#### New User Account (created during testing)
- **Username:** `newuser123`
- **Email:** `newuser123@test.com`
- **Password:** `SecurePass123!`
- **Purpose:** Test registration and empty states

#### Account with Old Data
- **Username:** `olddata`
- **Email:** `olddata@example.com`
- **Password:** `Password123!`
- **Purpose:** Test data migration and "severity undefined" bug

---

### Sample Check-In Data

Create these check-ins for comprehensive testing:

#### Recent Check-Ins (Today/Yesterday)
```json
{
  "structured": {
    "symptoms": {
      "headache": { "severity": 7 },
      "nausea": { "severity": 5 },
      "fatigue": { "severity": 6 }
    },
    "activities": ["walking", "light housework"],
    "triggers": ["screen time"],
    "notes": "Symptoms worse after 2pm"
  }
}
```

#### Check-In with Maximum Severity
```json
{
  "structured": {
    "symptoms": {
      "pain": { "severity": 10 }
    },
    "notes": "Emergency level pain"
  }
}
```

#### Check-In with Minimum Severity
```json
{
  "structured": {
    "symptoms": {
      "headache": { "severity": 1 }
    },
    "notes": "Very mild, barely noticeable"
  }
}
```

#### Multi-Symptom Check-In
```json
{
  "structured": {
    "symptoms": {
      "headache": { "severity": 8 },
      "nausea": { "severity": 6 },
      "fatigue": { "severity": 7 },
      "dizziness": { "severity": 5 },
      "pain": { "severity": 9 }
    },
    "activities": ["work", "exercise"],
    "triggers": ["stress", "lack of sleep", "weather"],
    "notes": "Very difficult day, multiple symptoms flaring"
  }
}
```

---

### Database State Requirements

For consistent testing, ensure:

#### Minimum Data Requirements
- At least 1 user account with 10+ check-ins
- Check-ins spanning 14+ days for trends testing
- At least 3 check-ins in current week for dashboard stats
- Consecutive daily check-ins for streak testing (3+ days)

#### Data Distribution
- Mix of low (1-3), medium (4-7), and high (8-10) severity values
- Multiple symptom types tracked (headache, nausea, fatigue, pain, etc.)
- Some check-ins with notes, some without
- Some check-ins with activities/triggers, some without

---

## 8. Test Environment Setup

### Prerequisites Checklist

Before starting regression testing, verify:

- [ ] **Node.js** installed (v18+)
- [ ] **npm** installed
- [ ] **MongoDB** running (Podman/Docker)
- [ ] **Redis** running (Podman/Docker)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)

---

### Starting the Application

#### Option 1: Using Makefile (Recommended)
```bash
# Start MongoDB and Redis
make deps-up

# Start backend and frontend in one command
make dev
```

#### Option 2: Manual Start
```bash
# Terminal 1: Start MongoDB and Redis
cd /home/lrabbets/repos/ask-annie
docker-compose up

# Terminal 2: Start backend
cd backend
npm run dev
# Backend should run on http://localhost:3000

# Terminal 3: Start frontend
cd frontend
npm run dev
# Frontend should run on http://localhost:5173
```

---

### Verify Services Running

#### Backend Health Check
```bash
curl http://localhost:3000/api/health
```
**Expected:** `{"status":"ok"}` or similar

#### Frontend Accessibility
Open browser: `http://localhost:5173`
**Expected:** Login page loads without errors

#### MongoDB Connection
```bash
# Using Mongo Express (if configured)
# Open: http://localhost:8081
# Credentials: admin / admin

# Or use mongo shell
mongosh mongodb://localhost:27017/ask-annie
```

#### Check Database Contents
```javascript
// In mongosh
use ask-annie
db.users.countDocuments()  // Should return number of users
db.checkins.countDocuments()  // Should return number of check-ins
```

---

### Environment Variables

Verify `.env` files are configured:

#### Backend `.env`
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ask-annie
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379
```

#### Frontend `.env`
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

---

### Browser DevTools Setup

For each test session, open DevTools:

1. **Console Tab:** Monitor for JavaScript errors
2. **Network Tab:** Verify API requests and responses
3. **Application Tab:** Check localStorage for tokens
4. **Elements Tab:** Inspect DOM if UI issues occur

**Recommended:** Keep DevTools open throughout testing for real-time debugging.

---

### Test Data Seeding (Optional)

If starting with empty database, seed test data:

#### Create Test User via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "Password123!"
  }'
```

#### Create Sample Check-Ins
```bash
# First, login to get token
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

## 9. Regression Test Results Template

### Test Run Information

| Field | Value |
|-------|-------|
| **Test Date** | YYYY-MM-DD |
| **Tester Name** | ________________ |
| **Application Version** | v0.1.0+ |
| **Backend Commit** | `git rev-parse --short HEAD` |
| **Frontend Commit** | `git rev-parse --short HEAD` |
| **Test Environment** | Local Development |
| **Test Duration** | ______ minutes |

---

### Test Execution Summary

| Section | Total Tests | Passed | Failed | Blocked | Pass Rate |
|---------|-------------|--------|--------|---------|-----------|
| **Authentication** | 7 | ___ | ___ | ___ | ___% |
| **Check-In Creation** | 5 | ___ | ___ | ___ | ___% |
| **Dashboard Display** | 5 | ___ | ___ | ___ | ___% |
| **Trends Page** | 5 | ___ | ___ | ___ | ___% |
| **Edge Cases** | 12 | ___ | ___ | ___ | ___% |
| **Browser Compatibility** | ___ | ___ | ___ | ___ | ___% |
| **Known Issues Verification** | 5 | ___ | ___ | ___ | ___% |
| **TOTAL** | **39+** | **___** | **___** | **___** | **___%** |

---

### Critical Test Results

| Test ID | Test Name | Status | Priority | Notes | Blocker? |
|---------|-----------|--------|----------|-------|----------|
| TEST-AUTH-004 | Session Persistence on Refresh | [ ] P [ ] F | CRITICAL | Issue #97 | [ ] Yes |
| TEST-AUTH-005 | Session Persistence on Navigation | [ ] P [ ] F | CRITICAL | Issue #97 | [ ] Yes |
| TEST-CHECKIN-003 | Check-In Displays in Timeline | [ ] P [ ] F | HIGH | Core functionality | [ ] Yes |
| TEST-CHECKIN-004 | Old Check-Ins Show Severity | [ ] P [ ] F | MEDIUM | Issue #99 | [ ] No |
| TEST-DASH-003 | Weekly Insights Consistency | [ ] P [ ] F | MEDIUM | New bug found | [ ] No |
| TEST-TRENDS-002 | Symptom Chart Renders | [ ] P [ ] F | HIGH | Core functionality | [ ] Yes |

**Legend:** P = Pass, F = Fail

---

### Failed Test Details

For each failed test, complete this template:

#### Failed Test #1
- **Test ID:** ________________
- **Test Name:** ________________
- **Expected Result:** ________________
- **Actual Result:** ________________
- **Steps to Reproduce:**
  1. ________________
  2. ________________
  3. ________________
- **Screenshots:** Attach or reference
- **Browser/OS:** ________________
- **Console Errors:** ________________
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
- **Blocks Release:** [ ] Yes [ ] No
- **Assigned To:** ________________
- **Issue Created:** #____

---

### Browser Compatibility Results

| Browser | Version | Auth | Check-In | Dashboard | Trends | Overall Status |
|---------|---------|------|----------|-----------|--------|----------------|
| Chrome | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |
| Firefox | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |
| Safari | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |
| Edge | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |
| Chrome Mobile | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |
| Safari Mobile | ______ | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] P [ ] F | [ ] PASS [ ] FAIL |

---

### Known Issues Status

| Issue # | Description | Expected Status | Actual Status | Verified |
|---------|-------------|-----------------|---------------|----------|
| #97 | Session persistence | FIXED | [ ] FIXED [ ] BROKEN | [ ] ✓ |
| #99 | Severity undefined | PARTIALLY FIXED | [ ] FIXED [ ] BROKEN | [ ] ✓ |
| #98 | Invalid Date | FIXED | [ ] FIXED [ ] BROKEN | [ ] ✓ |
| #96 | Analysis crashes | FIXED | [ ] FIXED [ ] BROKEN | [ ] ✓ |
| #101 | Manual validation | FIXED | [ ] FIXED [ ] BROKEN | [ ] ✓ |
| NEW | Dashboard inconsistency | NEW BUG | [ ] FIXED [ ] BROKEN | [ ] ✓ |

---

### New Bugs Discovered

| Bug # | Description | Severity | Affects | Steps to Reproduce | Screenshot |
|-------|-------------|----------|---------|-------------------|------------|
| 1 | ____________ | [ ] Critical [ ] High [ ] Medium [ ] Low | ________ | ______________ | ________ |
| 2 | ____________ | [ ] Critical [ ] High [ ] Medium [ ] Low | ________ | ______________ | ________ |

---

### Performance Notes

| Page/Feature | Load Time | Notes |
|--------------|-----------|-------|
| Login | _____ ms | ________________ |
| Dashboard | _____ ms | ________________ |
| Trends (chart render) | _____ ms | ________________ |
| Check-in submission | _____ ms | ________________ |

---

### Accessibility Notes (Optional)

| Issue | Description | WCAG Level | Severity |
|-------|-------------|------------|----------|
| _____ | ____________ | A / AA / AAA | ________ |

---

### Tester Comments

**General Observations:**
________________________________________________________________________________
________________________________________________________________________________

**User Experience Feedback:**
________________________________________________________________________________
________________________________________________________________________________

**Recommendations:**
________________________________________________________________________________
________________________________________________________________________________

---

### Sign-Off

**Regression Testing:**
- [ ] All critical tests passed
- [ ] No blocking bugs found
- [ ] Known issues verified and documented
- [ ] Browser compatibility acceptable

**Tester Signature:** ________________
**Date:** ________________

**Release Manager Approval:** ________________
**Date:** ________________

---

## 10. Sign-Off Criteria

### Release Readiness Checklist

Before considering a release ready, verify:

#### Critical Tests (Must Pass)
- [ ] **TEST-AUTH-004:** Session persists on page refresh
- [ ] **TEST-AUTH-005:** Session persists on navigation
- [ ] **TEST-CHECKIN-001:** Manual check-in creation works
- [ ] **TEST-CHECKIN-003:** Check-ins display in timeline with correct severity
- [ ] **TEST-DASH-001:** Dashboard loads all sections without errors
- [ ] **TEST-TRENDS-002:** Trends charts render correctly

**Criteria:** **100% pass rate required** for critical tests. Any failure is a release blocker.

---

#### High Priority Tests (Should Pass)
- [ ] **TEST-AUTH-001:** User registration works
- [ ] **TEST-AUTH-002:** User login works
- [ ] **TEST-CHECKIN-002:** Multi-symptom check-ins work
- [ ] **TEST-DASH-002:** Daily Momentum section accurate
- [ ] **TEST-DASH-004:** Timeline shows recent check-ins
- [ ] **TEST-TRENDS-003:** Time range selection updates chart

**Criteria:** **≥90% pass rate** for high priority tests. Failures must be documented and assessed.

---

#### Medium Priority Tests (Ideally Pass)
- [ ] **TEST-CHECKIN-004:** Old check-ins display correctly (Issue #99)
- [ ] **TEST-DASH-003:** Weekly Insights consistency (new bug)
- [ ] **TEST-EDGE-001:** Empty states display correctly
- [ ] **TEST-TRENDS-004:** Statistics cards accurate

**Criteria:** **≥80% pass rate** for medium priority tests. Failures can be deferred if non-blocking.

---

#### Browser Compatibility (Must Support)
- [ ] **Chrome (Desktop):** All critical flows work
- [ ] **Firefox (Desktop):** All critical flows work
- [ ] **Safari (Desktop):** All critical flows work (if testing on macOS)
- [ ] **Chrome Mobile:** Login, check-in, dashboard responsive

**Criteria:** **Critical flows must work** in Chrome, Firefox, and at least one mobile browser.

---

#### Known Issues Verification
- [ ] **Issue #97:** Session persistence verified WORKING (not broken)
- [ ] **Issue #99:** Severity displays correctly for NEW check-ins
- [ ] **Issue #98:** No "Invalid Date" displayed
- [ ] **Issue #96:** No analysis service crashes
- [ ] **Issue #101:** Manual check-in validation works

**Criteria:** All "CLOSED" issues must be verified as truly fixed. Regressions are release blockers.

---

#### No New Critical Bugs
- [ ] No new CRITICAL severity bugs discovered during testing
- [ ] No new HIGH severity bugs that block core user flows
- [ ] All new bugs documented with issue numbers

**Criteria:** New critical bugs are automatic release blockers. High severity bugs must be assessed.

---

#### Performance Acceptable
- [ ] Dashboard loads in <3 seconds
- [ ] Trends charts render in <2 seconds
- [ ] Check-in submission responds in <1 second
- [ ] No browser freezing or unresponsiveness

**Criteria:** Performance must be acceptable for typical use cases. Severe slowdowns block release.

---

#### No Console Errors
- [ ] No JavaScript errors in browser console during normal use
- [ ] No network errors (failed API calls) during normal use
- [ ] Backend logs show no errors during test execution

**Criteria:** Errors must be investigated. Severe errors or frequent errors block release.

---

### Release Decision Matrix

| Scenario | Decision |
|----------|----------|
| **All critical tests pass, no new critical bugs** | ✅ **APPROVE FOR RELEASE** |
| **1 critical test fails** | ❌ **BLOCK RELEASE** - Fix and retest |
| **1 high priority test fails, non-critical** | ⚠️ **CONDITIONAL** - Assess impact, may defer fix |
| **Session persistence broken (Issue #97 regression)** | ❌ **BLOCK RELEASE** - Critical UX bug |
| **New critical bug discovered** | ❌ **BLOCK RELEASE** - Fix and retest |
| **Browser compatibility: Chrome/Firefox work, Safari fails** | ⚠️ **CONDITIONAL** - Assess user base, may defer Safari fix |
| **Performance degradation >50%** | ❌ **BLOCK RELEASE** - Investigate and optimize |
| **5+ medium bugs found** | ⚠️ **CONDITIONAL** - Assess cumulative impact |

---

### Final Sign-Off Statement

**I certify that:**
- I have completed the regression test plan as outlined in this document
- All critical tests have been executed and results documented
- All known issues have been verified and their status is accurate
- All new bugs discovered have been documented with reproduction steps
- Browser compatibility has been tested in required environments
- The application is [READY / NOT READY] for release based on the criteria above

**Tester Name:** ________________
**Signature:** ________________
**Date:** ________________

**Release Manager Name:** ________________
**Signature:** ________________
**Date:** ________________

---

## Appendix A: Quick Reference

### Useful DevTools Commands

#### Check localStorage Token
```javascript
// In browser console
localStorage.getItem('auth-storage')
```

#### Clear localStorage (Logout)
```javascript
localStorage.clear()
```

#### Check if Logged In
```javascript
// Should return user object if logged in
JSON.parse(localStorage.getItem('auth-storage'))?.state?.user
```

---

### Useful API Calls (for debugging)

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### Login (get token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Password123!"}'
```

#### Get Check-Ins
```bash
curl http://localhost:3000/api/checkins \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get Streak Data
```bash
curl http://localhost:3000/api/analysis/streak \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Common Test Credentials

| Account | Email | Password | Purpose |
|---------|-------|----------|---------|
| Primary | testuser@example.com | Password123! | Main testing |
| New User | newuser123@test.com | SecurePass123! | Registration testing |
| Old Data | olddata@example.com | Password123! | Data migration testing |

---

### Severity Scale Reference

| Severity | Color | Description | Example |
|----------|-------|-------------|---------|
| 1-3 | 🟢 Green | Mild | Slight discomfort |
| 4-6 | 🟡 Amber | Moderate | Noticeable, manageable |
| 7-9 | 🔴 Red | Severe | Significant impact |
| 10 | 🔴 Red | Maximum | Emergency level |

---

### File Locations for Reference

#### Frontend
- Pages: `/home/lrabbets/repos/ask-annie/frontend/src/pages/`
- Components: `/home/lrabbets/repos/ask-annie/frontend/src/components/`
- Auth Store: `/home/lrabbets/repos/ask-annie/frontend/src/stores/authStore.ts`
- API Client: `/home/lrabbets/repos/ask-annie/frontend/src/services/api.ts`

#### Backend
- Routes: `/home/lrabbets/repos/ask-annie/backend/src/routes/`
- Services: `/home/lrabbets/repos/ask-annie/backend/src/services/`
- Models: `/home/lrabbets/repos/ask-annie/backend/src/models/`

---

## Appendix B: Screenshot Guidelines

For effective bug reporting, capture screenshots showing:

1. **Full browser window** (including URL bar and DevTools if relevant)
2. **Console errors** (if JavaScript errors present)
3. **Network tab** (if API errors present)
4. **localStorage** (for session persistence issues)
5. **Highlight the specific issue** with annotations if possible

**Recommended Tools:**
- macOS: Cmd+Shift+4 (area screenshot)
- Windows: Snipping Tool or Windows+Shift+S
- Linux: `gnome-screenshot -a` or Flameshot
- Browser extensions: Awesome Screenshot, Nimbus

**Naming Convention:**
`[TEST-ID]_[feature]_[status]_[timestamp].png`

Example: `TEST-AUTH-004_session-refresh_FAIL_2025-11-23.png`

---

## Appendix C: Troubleshooting

### Common Issues During Testing

#### Backend Won't Start
**Symptoms:** `npm run dev` fails, port 3000 errors

**Solutions:**
1. Check MongoDB is running: `docker ps` or `podman ps`
2. Check port 3000 not in use: `lsof -i :3000` (kill process if needed)
3. Verify `.env` file exists and has correct variables
4. Check backend logs: `cd backend && npm run dev`

---

#### Frontend Won't Start
**Symptoms:** `npm run dev` fails, port 5173 errors

**Solutions:**
1. Check port 5173 not in use: `lsof -i :5173`
2. Verify `.env` file has `VITE_API_BASE_URL=http://localhost:3000/api`
3. Clear node_modules: `rm -rf node_modules && npm install`
4. Check Vite cache: `rm -rf node_modules/.vite`

---

#### "Network Error" in Frontend
**Symptoms:** All API calls fail, "Network Error" in console

**Solutions:**
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in backend
3. Verify `VITE_API_BASE_URL` in frontend `.env`
4. Check browser DevTools Network tab for failed requests
5. Disable browser extensions (ad blockers can interfere)

---

#### Session Lost on Refresh (Issue #97)
**Symptoms:** Redirect to `/login` after F5

**Debugging Steps:**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Check if `auth-storage` key exists
4. Refresh page
5. Check if `auth-storage` still exists
6. Check Console for errors
7. Check Network tab: do requests have `Authorization` header?

**If token exists but still logged out:**
- Problem in auth store restoration logic
- Check `frontend/src/stores/authStore.ts`
- Verify `restoreSession()` is called on app mount

**If token missing after refresh:**
- Problem with persistence middleware
- Check Zustand persist configuration

---

#### "Severity Undefined" Display (Issue #99)
**Symptoms:** Check-in cards show "severity undefined"

**Debugging Steps:**
1. Create new check-in with severity
2. Open DevTools → Network → Find POST `/api/checkins` request
3. Check request payload: is severity included?
4. Check response: is severity in returned data?
5. Navigate to Dashboard
6. Inspect check-in card HTML: what value is severity?
7. Check `CheckInCard.tsx` component logic

---

#### Charts Not Rendering
**Symptoms:** Trends page shows empty or broken charts

**Solutions:**
1. Check Console for errors
2. Verify symptom data exists: check `/api/analysis/symptoms`
3. Check time range: expand to 30 or 90 days
4. Verify Recharts library loaded: check Network tab
5. Try different browser (rule out browser-specific issue)

---

## Appendix D: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | Documentation Agent | Initial comprehensive regression test plan created based on exploratory testing findings |

---

**End of Manual Regression Test Plan**
