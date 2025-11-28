# Annie's Health Journal - Alpha Release Scope

**Version:** 0.2.0-alpha
**Release Date:** November 22, 2025
**Status:** Released

---

## Alpha Tester Profile

**Tester:** Single user (wife)
**Primary Device:** Mobile (iOS/Android)
**Secondary Device:** PC (for verification)
**Data Policy:** Can wipe/reset data as needed
**Issue Reporting:** Direct communication → GitHub issues
**Historic Data:** May re-import if needed (process TBD)

---

## Deployment

**Platform:** Railway
**Environment:** Production-like (separate from dev)
**Database:** MongoDB Atlas or Railway MongoDB
**Domain:** TBD (Railway subdomain or custom)
**Persistence:** Data can be wiped between iterations

---

## Alpha Scope: What's In

### Core User Journey (Must Work Perfectly)

1. **User Onboarding**
   - Register account
   - Login with credentials
   - Session persists across page refreshes ✨ **(MUST FIX)**
   - Logout functionality

2. **Voice Check-In Flow** (Primary Use Case)
   - Record voice check-in
   - Upload successfully
   - Parse symptoms, severities, triggers accurately ✨ **(MUST FIX)**
   - Display parsed data correctly
   - See check-in appear in timeline

3. **Manual Check-In Flow** (Backup/Alternative)
   - Open manual check-in form
   - Enter symptoms with severities
   - Add notes/triggers
   - Submit successfully
   - See check-in in timeline

4. **Dashboard View** (Daily Use)
   - **Section A: Daily Momentum**
     - See today's check-in status
     - View current streak
     - Get next suggested check-in time (no "Invalid Date") ✨ **(MUST FIX)**
   - **Section B: Weekly Insights**
     - View week-over-week stats
     - See top symptoms
     - Understand trends (improving/worsening/stable)
   - **Section C: Timeline**
     - See recent check-ins
     - View symptom details (no "severity undefined") ✨ **(MUST FIX)**
     - Understand notes/triggers ✨ **(MUST DECIDE UX)**

5. **Trends Analysis** (Weekly Use)
   - Select a symptom
   - View severity chart over time
   - Change time range (7/14/30 days)
   - Understand patterns

### Technical Requirements

- ✅ Mobile-responsive (primary device)
- ✅ Works on PC (secondary verification)
- ✅ HTTPS/secure connection
- ✅ Fast load times (<3 seconds)
- ✅ No console errors visible to user
- ✅ Graceful error handling

---

## Alpha Scope: What's Out

### Features Explicitly Deferred

- ❌ Edit check-in functionality (#69)
- ❌ Delete check-in functionality
- ❌ Doctor summary/sharing (#20, #17, #40)
- ❌ Settings page (#28)
- ❌ User preferences (timezone, units, etc.)
- ❌ Email notifications/digests (#42)
- ❌ Push notifications (#13)
- ❌ Advanced filtering/search (#79)
- ❌ Toast notifications (#71) - Use basic alerts if needed
- ❌ Loading skeletons (#30) - Simple "Loading..." is fine
- ❌ Medication tracking (#36)
- ❌ Wearable integration (#37)
- ❌ Multi-user accounts (#39)
- ❌ ML predictions (#38, #41)
- ❌ Password reset flow
- ❌ Profile editing
- ❌ Data export functionality

### Quality Improvements Deferred

- ❌ Full accessibility audit (#70) - Basic a11y only
- ❌ Comprehensive E2E tests (#34) - Manual testing sufficient
- ❌ CI/CD pipeline (#33) - Manual deployment fine
- ❌ Performance optimization (#35) - Fast enough is good enough
- ❌ Error boundaries (#29) - Handle critical paths only
- ❌ Advanced analytics/insights
- ❌ Offline support

---

## Blocker Issues: Must Fix for Alpha

These issues will prevent successful alpha testing and must be resolved:

### 🚨 Critical Priority

**Issue #97 - Session Persistence**
- **Problem:** Users logged out on every page refresh
- **Impact:** App completely unusable
- **Acceptance Criteria:**
  - Login once, session persists for 7 days
  - Page refresh maintains logged-in state
  - Only logout on explicit logout or token expiry
- **Estimated Fix:** 1-2 hours

**Issue #105/106 - Voice Parsing Accuracy**
- **Problem:** Voice check-ins don't extract symptoms/severities reliably
- **Impact:** Core feature broken, data unreliable
- **Options:**
  - #105: Improve current regex-based parsing
  - #106: Replace with Amazon Nova Micro (Bedrock)
- **Acceptance Criteria:**
  - 90%+ accuracy on typical check-ins
  - Correctly parse: symptom name, severity (1-10), triggers
  - Handle conversational input
  - Fail gracefully with clear errors
- **Estimated Fix:** 6-8 hours (Nova approach preferred)

### 🟠 High Priority

**Issue #98 - Invalid Date Display**
- **Problem:** Dashboard shows "Next suggested: Invalid Date"
- **Impact:** Looks broken, unprofessional
- **Acceptance Criteria:**
  - Shows time in user-friendly format (e.g., "8:00 PM")
  - Handles null/undefined gracefully
  - Correct timezone handling
- **Estimated Fix:** 30 minutes

**Issue #99 - Severity Display**
- **Problem:** CheckInCard shows "severity undefined"
- **Impact:** Can't read check-in data properly
- **Acceptance Criteria:**
  - Display numeric severity (1-10) for each symptom
  - Handle SymptomValue format correctly
  - Show severity in compact mode
- **Estimated Fix:** 1 hour

**Issue #103 - CheckInCard Notes UX**
- **Problem:** Unclear what to show when no notes present
- **Impact:** Inconsistent/confusing UI
- **Acceptance Criteria:**
  - Decide: show empty state, hide section, or placeholder
  - Implement consistently across all check-ins
  - Document decision for future reference
- **Estimated Fix:** 30 min decision + 1 hour implementation

---

## Quality Issues: Should Fix for Alpha

These improve quality but aren't strict blockers:

### 🟡 Medium Priority

**Issue #85 - Security Vulnerabilities**
- **Action:** Run `npm audit fix`, review critical vulnerabilities
- **Estimated Fix:** 2-3 hours

**Issue #100 - Mongoose Index Warnings**
- **Action:** Clean up duplicate schema definitions
- **Estimated Fix:** 15 minutes

---

## Alpha Release Checklist

### Phase 1: Fix Blockers (Day 1-2)
- [ ] Fix Issue #97 (session persistence)
- [ ] Fix Issue #98 (Invalid Date)
- [ ] Fix Issue #99 (severity display)
- [ ] Decide Issue #103 (notes UX)
- [ ] Fix Issue #105 OR implement Issue #106 (voice parsing)
- [ ] Run full test suite (backend + frontend)
- [ ] Manual smoke test on localhost

### Phase 2: Quality & Polish (Day 2)
- [ ] Implement Issue #103 decision
- [ ] Address Issue #85 (security audit)
- [ ] Fix Issue #100 (Mongoose warnings)
- [ ] Mobile responsiveness check (Chrome DevTools)
- [ ] Test on real mobile device (if possible)

### Phase 3: Deployment Prep (Day 2-3)
- [ ] Set up Railway project
- [ ] Configure MongoDB (Atlas or Railway)
- [ ] Set environment variables
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Railway
- [ ] Configure custom domain (optional)
- [ ] Test deployed version end-to-end

### Phase 4: Pre-Alpha Testing (Day 3)
- [ ] Create test account on production
- [ ] Test voice check-in end-to-end
- [ ] Test manual check-in end-to-end
- [ ] Verify dashboard displays correctly
- [ ] Verify trends page displays correctly
- [ ] Test on mobile browser
- [ ] Test on PC browser
- [ ] Verify session persistence
- [ ] Check error handling

### Phase 5: Alpha Tester Onboarding (Day 3)
- [ ] Create alpha tester guide (see below)
- [ ] Send credentials and access link
- [ ] Brief tester on what to focus on
- [ ] Set up issue reporting process
- [ ] Be available for initial questions

---

## Alpha Tester Guide (Draft)

**To be provided to alpha tester:**

### Welcome to Annie's Health Journal Alpha!

You're testing an early version of Annie's Health Journal, a voice-first symptom tracker for chronic illness.

**What to Test:**
1. **Voice Check-Ins** (Primary Flow)
   - Tap "Voice Check-In"
   - Record your symptoms naturally (e.g., "My headache is a 7, and I have mild nausea at a 3")
   - See if it captures symptoms and severities correctly
   - Report any parsing errors or missed symptoms

2. **Dashboard** (Daily Use)
   - Check if your streak is accurate
   - Review weekly insights
   - Browse your check-in timeline
   - Look for anything confusing or broken

3. **Trends Page** (Weekly Use)
   - Select a symptom you've logged
   - View the chart over time
   - Try different time ranges (7/14/30 days)
   - See if insights make sense

**What's NOT Ready:**
- No edit or delete functionality (check-ins are permanent for now)
- No settings page (can't change preferences yet)
- No doctor sharing/summaries
- Some mobile UI might be rough

**How to Report Issues:**
- Text/tell me directly
- Include: what you did, what you expected, what actually happened
- Screenshots are super helpful
- I'll add confirmed issues to GitHub

**Known Limitations:**
- Data may be wiped between updates
- If something breaks, try logging out and back in
- Voice parsing is still being refined

**Questions?**
- Ask anytime - this is YOUR app, I want your honest feedback!

---

## Success Criteria for Alpha

Alpha is successful if:

✅ **Core flows work reliably:**
- Voice check-in works 90%+ of the time
- Manual check-in works 100% of the time
- Dashboard loads without errors
- Trends page displays data correctly
- Session persists across refreshes

✅ **Mobile experience is usable:**
- Buttons are tappable
- Text is readable
- Forms are fillable
- Navigation is clear

✅ **Data quality is good:**
- Symptoms parsed correctly
- Severities recorded accurately
- Trends reflect actual patterns
- Streaks calculated properly

✅ **Tester can use it daily:**
- App is fast enough (<3s loads)
- No critical bugs block usage
- Trust the data enough to use it
- Would consider using long-term

---

## Alpha Exit Criteria

Alpha phase ends when:

1. All blocker issues (#97, #98, #99, #103, #105/106) are resolved
2. One week of daily use by alpha tester with no critical bugs
3. Voice parsing accuracy >90% on real usage
4. Mobile experience is smooth
5. Tester feedback is "I'd use this daily"

**After Alpha:**
- Collect learnings
- Plan Beta scope (2-5 testers)
- Address alpha feedback
- Consider additional features for Beta

---

## Timeline Estimate

**Phase 1 (Blockers):** 1.5-2 days
**Phase 2 (Quality):** 0.5 day
**Phase 3 (Deployment):** 0.5-1 day
**Phase 4 (Testing):** 0.5 day
**Total:** 3-4 days to alpha-ready

**Alpha Testing Period:** 1-2 weeks

---

## Notes

- Keep scope tight - resist feature creep
- Focus on mobile experience (primary device)
- Data wipes are okay - treat as disposable
- Fast iteration is more valuable than perfection
- One happy alpha tester > ten features

---

**Document Status:** Draft
**Next Review:** After blocker issues fixed
**Owner:** lrabbets
**Last Updated:** 2025-11-22
