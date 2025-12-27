# Weekly Email Engagement Feature - Design Document

## Overview
An empathetic, template-based email system that keeps users engaged with their health journaling practice without being intrusive or AI-sounding. All communications feel like they're personally from Annie, not a corporate product.

## Philosophy

This feature serves people managing chronic health conditions. Our emails must be:

1. **Genuinely helpful** - Provide real value, not just engagement metrics
2. **Empathetic** - Recognize that absence might mean they're struggling
3. **Non-judgmental** - Never make people feel guilty for not checking in
4. **Personal** - Sound like Annie (a caring friend), not a corporation
5. **Brief** - Respect their time and mental energy
6. **Human** - Use templates with variation, not LLM-generated content

## Email Types

### 1. Weekly Summary (Active Users)

**Trigger**: User completed 1+ check-ins in the past week
**Send Time**: Sunday at 8 PM (their local timezone if stored, otherwise UTC)
**Tone**: Warm, encouraging, celebratory

**Content Structure**:
- Personal greeting with their name
- Check-ins completed this week
- Streak status (if applicable, ≥3 days)
- One meaningful insight based on their data
- Brief forward look
- Signature: "- Annie"

**Template Variations** (selected by logic):

**Opening** - Based on check-in count:
- 6-7 check-ins: "What a week! You checked in {count} times this week. That's dedication."
- 3-5 check-ins: "You checked in {count} times this week. That's wonderful."
- 1-2 check-ins: "Even one check-in is worth celebrating. You did that this week."

**Insight** - Based on data patterns:
- Streak ≥7 days: "You're on a {streak}-day streak! {streak_encouragement}"
  - 7-13 days: "That's a solid week!"
  - 14-29 days: "Two weeks strong!"
  - 30+ days: "That's incredible consistency."
- Symptom trend improving: "I noticed you mentioned {top_symptom} less this week than last. I hope that means you're feeling a bit better."
- Consistent activity: "You mentioned {activity} {count} times this week. It seems to be part of what's helping you."
- Multiple symptoms tracked: "You're tracking {symptom_count} different symptoms. That level of awareness is really valuable."
- Default: "Every check-in helps you see patterns over time. You're building a really useful record."

**Forward Look** - Rotated:
- "Here's to the week ahead."
- "I'll be here whenever you need me this week."
- "Looking forward to being here with you next week."

**Subject Line Variations**:
- "Your week of {date_range}"
- "This week with you - {date_range}"
- "{name}, your weekly check-in summary"

---

### 2. "Thinking of You" Email (Inactive Week 1-2)

**Trigger**: User hasn't checked in for 1-2 weeks
**Send Time**:
- Week 1: Wednesday at 6 PM
- Week 2: Monday at 6 PM
**Tone**: Concerned friend, understanding, not pushy

**Content Structure**:
- Acknowledge absence gently
- Two possible interpretations (rough week OR feeling better)
- Simple re-engagement option
- Reminder of value without pressure

**Template Variations**:

**For previously regular users** (≥3 check-ins/week before):
```
Hi {name},

I noticed I haven't heard from you this week.

That might mean you're going through a rough patch and checking in feels like too much right now. If that's the case, I get it. Some weeks are just harder.

Or maybe it means things are actually going better and you don't feel the need to track as closely. I hope that's it.

Either way, I'm here when you need me. Your journal is waiting whenever you're ready.

- Annie

P.S. Sometimes just one quick check-in can help you feel a bit more in control. No pressure though.
```

**For previously sporadic users**:
```
Hi {name},

Just wanted to say hi. It's been about {weeks} week since your last check-in.

No judgment at all - I know consistency is hard, especially when you're not feeling well.

I'm here whenever you want to check in. Even once a week helps you see patterns you might otherwise miss.

- Annie
```

**Subject Line Variations**:
- "Thinking of you, {name}"
- "Hey {name}"
- "Still here for you"

---

### 3. "Still Here For You" Email (Inactive 3+ Weeks)

**Trigger**: User hasn't checked in for 3+ weeks
**Send Time**:
- Weeks 3-4: Every 2 weeks, Wednesday at 6 PM
- Month 2+: Monthly, first Monday at 6 PM
**Tone**: Patient, understanding, supportive, very low pressure

**Template Variations**:

**Month 1 (3-4 weeks)**:
```
Hi {name},

It's been a few weeks since your last check-in. I wanted to reach out.

I know staying consistent with health tracking is tough. Life happens. Health happens. Sometimes you just need a break.

Your journal is still here waiting for you. No catching up required - just start fresh whenever you're ready.

I'll check in with you again in a couple weeks.

- Annie
```

**Month 2+**:
```
Hi {name},

I hope you're doing okay. It's been about {weeks} weeks since we last connected.

I'll be honest - I miss hearing from you. But I also know that everyone's health journey is different. Maybe you've found what works for you, or maybe now's just not the right time for tracking.

If you ever want to come back, your journal will be here. All your previous check-ins are still saved and waiting.

I'll send you a note like this once a month, just so you know I'm here.

- Annie

P.S. If you'd prefer not to get these emails, that's totally okay. You can unsubscribe below.
```

**Subject Line**:
- "Your journal is here, {name}"
- "Checking in on you"
- "Still here when you need me"

---

## Communication Cadence Logic

```
IF user.emailNotificationsEnabled === false:
  → Send NO emails

IF user checked in within last 7 days:
  → Send Weekly Summary (Sunday 8 PM)

IF user has NOT checked in:

  Days 7-13 (Week 1):
    → Send "Thinking of You" (Wednesday 6 PM)
    → Template: Based on previous engagement pattern

  Days 14-20 (Week 2):
    → Send "Thinking of You - Week 2" (Monday 6 PM)
    → Template: More understanding variation

  Days 21-34 (Weeks 3-4):
    → Send "Still Here" (Every 14 days, Wednesday 6 PM)

  Day 35+ (Month 2+):
    → Send "Still Here - Long Term" (Every 30 days, first Monday 6 PM)

RULES:
- Maximum 1 email per user per week
- Never send if last check-in was within 24 hours
- Check SentEmail log to prevent duplicates
- Respect unsubscribe immediately
```

## Technical Architecture

### Database Schema Changes

#### User Model Updates
```typescript
// Add to existing User model
emailNotificationsEnabled: {
  type: Boolean,
  default: true
},
emailPreferences: {
  weeklySummary: {
    type: Boolean,
    default: true
  },
  inactiveReminders: {
    type: Boolean,
    default: true
  },
  monthlyCheckins: {
    type: Boolean,
    default: true
  }
},
lastEmailSentAt: Date,
timezone: String // For future: send at appropriate local time
```

#### New SentEmail Model
```typescript
{
  userId: ObjectId,
  emailType: 'weekly_summary' | 'inactive_week1' | 'inactive_week2' | 'inactive_month',
  templateVariant: String, // Which template variation was used
  sentAt: Date,
  metadata: {
    checkInCount: Number,
    weeksSinceActive: Number,
    statsIncluded: Object
  }
}
// Compound index on (userId, sentAt) for efficient queries
// TTL index to auto-delete after 90 days
```

#### New UnsubscribeToken Model
```typescript
{
  userId: ObjectId,
  token: String, // Signed token for one-click unsubscribe
  expiresAt: Date,
  used: Boolean,
  createdAt: Date
}
// TTL index on expiresAt
```

---

### Email Template System

**Location**: `/backend/src/templates/engagement/`

**Structure**:
```
/templates/engagement/
  ├── weeklySummary.ts       # Template logic + variations
  ├── inactiveWeek1.ts       # Week 1 templates
  ├── inactiveWeek2.ts       # Week 2 templates
  ├── inactiveMonth.ts       # Long-term templates
  ├── templateHelpers.ts     # Shared utilities
  └── types.ts               # TypeScript interfaces
```

**Template Interface**:
```typescript
interface EmailTemplate {
  selectVariant(context: UserEmailContext): TemplateVariant;
  render(variant: TemplateVariant, data: UserData): {
    subject: string;
    html: string;
    text: string;
  };
}

interface UserEmailContext {
  userId: string;
  checkInCount: number;
  weeksSinceActive: number;
  streak: number;
  topSymptoms: Array<{ name: string; count: number }>;
  topActivities: Array<{ name: string; count: number }>;
  previousEngagementLevel: 'regular' | 'sporadic' | 'new';
  lastCheckInDate: Date;
}
```

**Template Selection Logic** (not LLM):
1. Analyze user context data
2. Apply rules to select appropriate variant
3. Interpolate variables into template
4. Render both HTML and plain text
5. Add unsubscribe footer

---

### Scheduling Infrastructure

**Recommended**: Bull + Redis (job queue)

**Alternative**: node-cron (simpler, no Redis dependency)

**Jobs**:

1. **Weekly Summary Job**
   - Runs: Every Sunday at 7 PM UTC
   - Process:
     ```
     1. Query all users with emailNotificationsEnabled = true
     2. For each user, check check-ins in past 7 days
     3. If check-ins > 0:
        - Calculate stats
        - Select template variant
        - Queue email send job
     4. Rate limit: 100 emails/batch with 5-second delay between batches
     ```

2. **Inactive User Check Job**
   - Runs: Daily at 5 PM UTC
   - Process:
     ```
     1. Query users with emailNotificationsEnabled = true
     2. Calculate days since last check-in
     3. Apply cadence rules (Week 1, Week 2, Bi-weekly, Monthly)
     4. Check SentEmail log to prevent duplicates
     5. Queue appropriate email type
     ```

3. **Email Sender Job**
   - Processes email queue with rate limiting
   - Uses existing Resend service
   - Logs to SentEmail collection
   - Handles failures with retry logic (max 3 attempts)

**Rate Limiting**:
- Resend free tier: 100 emails/day
- Resend paid tier: 10,000 emails/day
- Implement: 600ms delay between sends (~1.6 emails/sec)
- Track daily quota usage

---

### API Endpoints

#### Email Preferences Management

**GET** `/api/user/email-preferences`
- Returns: Current email notification settings
- Auth: Required (JWT)

**PATCH** `/api/user/email-preferences`
- Body:
  ```json
  {
    "emailNotificationsEnabled": true,
    "emailPreferences": {
      "weeklySummary": true,
      "inactiveReminders": true,
      "monthlyCheckins": false
    }
  }
  ```
- Auth: Required (JWT)
- Validation: All fields optional

#### Unsubscribe

**POST** `/api/user/unsubscribe/:token`
- One-click unsubscribe (no auth required)
- Verifies signed token
- Sets emailNotificationsEnabled = false
- Returns: Confirmation page/JSON

**POST** `/api/user/resubscribe`
- Re-enable email notifications
- Auth: Required (JWT)

---

### Email Service Extensions

**File**: `/backend/src/services/engagementEmailService.ts`

**Functions**:

```typescript
// Main orchestration
async function sendWeeklySummary(userId: string): Promise<void>

async function sendInactiveReminder(
  userId: string,
  weeksSinceActive: number
): Promise<void>

// Helper functions
async function calculateUserStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UserStats>

function selectTemplate(
  emailType: EmailType,
  context: UserEmailContext
): TemplateVariant

async function generateUnsubscribeToken(userId: string): Promise<string>

async function recordSentEmail(
  userId: string,
  emailType: string,
  metadata: any
): Promise<void>

async function hasRecentEmail(
  userId: string,
  hours: number
): Promise<boolean>
```

---

## Privacy & User Experience

### Unsubscribe Mechanism

1. **Every Email Includes**:
   - Unsubscribe link in footer
   - Link to manage preferences
   - Clear, visible placement

2. **One-Click Unsubscribe**:
   - No login required
   - Signed token in URL
   - Immediate effect (no "allow 7-10 days")
   - Confirmation page shown

3. **Granular Control**:
   - Toggle weekly summaries separately
   - Toggle inactive reminders separately
   - Toggle monthly check-ins separately
   - OR disable all at once

4. **Re-subscription**:
   - Available in user settings
   - No friction, no shame
   - Takes effect immediately

### Data Privacy

1. **Email Content**:
   - Only use aggregated stats (counts, averages)
   - Never quote specific check-in text verbatim
   - General patterns only ("you mentioned walks 3 times")
   - No sensitive symptom details

2. **Storage**:
   - SentEmail logs auto-expire after 90 days (TTL index)
   - No permanent email content storage
   - Only metadata for preventing duplicates

3. **Third-Party**:
   - Resend API handles delivery
   - No email content shared beyond Resend
   - Track only: sent/bounced/failed status

### Frequency Capping

1. **Absolute Rules**:
   - Maximum 1 email per user per week
   - Exception: Monthly emails can overlap if timing aligns
   - Never send within 24h of last check-in

2. **Smart Scheduling**:
   - If user checks in after inactive email queued → Cancel email
   - If user unsubscribes while email in queue → Remove from queue
   - Idempotency check before sending

---

## Template Examples (Full)

### Weekly Summary - High Engagement

**Subject**: Your week of Dec 8-14

**HTML/Text**:
```
Hi Sarah,

What a week! You checked in 6 times this week. That's dedication.

You're on a 21-day streak! Three weeks strong!

I noticed you mentioned yoga 4 times this week. It seems to be part of what's helping you.

Here's to the week ahead.

- Annie

---
Manage your email preferences: [link]
Unsubscribe from all emails: [link]
```

### Weekly Summary - New User

**Subject**: This week with you - Dec 8-14

**HTML/Text**:
```
Hi Marcus,

You checked in 3 times this week. That's wonderful.

Every check-in helps you see patterns over time. You're building a really useful record.

Looking forward to being here with you next week.

- Annie

---
Manage your email preferences: [link]
Unsubscribe from all emails: [link]
```

### Inactive Week 1 - Regular User

**Subject**: Thinking of you, Jessica

**HTML/Text**:
```
Hi Jessica,

I noticed I haven't heard from you this week.

That might mean you're going through a rough patch and checking in feels like too much right now. If that's the case, I get it. Some weeks are just harder.

Or maybe it means things are actually going better and you don't feel the need to track as closely. I hope that's it.

Either way, I'm here when you need me. Your journal is waiting whenever you're ready.

- Annie

P.S. Sometimes just one quick check-in can help you feel a bit more in control. No pressure though.

---
Manage your email preferences: [link]
Unsubscribe from all emails: [link]
```

### Inactive Month 2+

**Subject**: Still here when you need me

**HTML/Text**:
```
Hi Alex,

I hope you're doing okay. It's been about 8 weeks since we last connected.

I'll be honest - I miss hearing from you. But I also know that everyone's health journey is different. Maybe you've found what works for you, or maybe now's just not the right time for tracking.

If you ever want to come back, your journal will be here. All your previous check-ins are still saved and waiting.

I'll send you a note like this once a month, just so you know I'm here.

- Annie

P.S. If you'd prefer not to get these emails, that's totally okay. You can unsubscribe below.

---
Manage your email preferences: [link]
Unsubscribe from all emails: [link]
```

---

## Implementation Phases

### Phase 1: Foundation (Infrastructure)
- Add database fields to User model
- Create SentEmail and UnsubscribeToken models
- Set up Bull + Redis (or node-cron alternative)
- Create basic job scheduler framework
- API endpoints for preferences
- API endpoint for unsubscribe

### Phase 2: Templates
- Create template system structure
- Implement all 3 email types with variations
- Template selection logic
- Variable interpolation
- HTML/text rendering
- Unsubscribe footer generation

### Phase 3: Email Logic
- Create engagementEmailService
- Implement stats calculation
- Implement template selection
- Integration with existing emailService (Resend)
- Sent email logging
- Duplicate prevention

### Phase 4: Scheduling Jobs
- Weekly summary job
- Inactive user check job
- Email sender job (queue processor)
- Rate limiting implementation
- Error handling and retry logic
- Job monitoring/logging

### Phase 5: Testing & Refinement
- Unit tests for template selection
- Integration tests for email sending
- Test all cadence scenarios
- Verify unsubscribe flow
- Load testing with mock user base
- Email deliverability testing

### Phase 6: Frontend (Settings UI)
- Email preferences page
- Granular toggle controls
- Unsubscribe confirmation page
- Re-subscribe option
- Preview email samples

---

## Success Metrics (Future)

Track these metrics to evaluate effectiveness:

1. **Engagement Metrics**:
   - Email open rate by type
   - Click-through rate to app
   - Re-engagement rate after inactive email
   - Time to re-engagement

2. **User Satisfaction**:
   - Unsubscribe rate by email type
   - Re-subscribe rate
   - Support tickets related to emails

3. **Retention Impact**:
   - 30-day retention: with vs without emails
   - 90-day retention: email recipients vs control
   - Check-in frequency before/after email

4. **Technical Health**:
   - Email delivery rate
   - Bounce rate
   - Job success rate
   - Average processing time

---

## Testing Strategy

### Unit Tests
- Template selection logic for all scenarios
- Stats calculation accuracy
- Token generation and verification
- Cadence calculation logic

### Integration Tests
- Full email send flow (with test inbox)
- Job scheduling and execution
- Unsubscribe flow end-to-end
- Preference updates

### Manual Testing Scenarios
1. New user: Gets weekly summary after first check-in
2. Regular user: Gets summary every Sunday
3. User stops checking in: Receives Week 1, Week 2, Month 1 sequence
4. User re-engages: Stops receiving inactive emails
5. User unsubscribes: Receives no further emails
6. User re-subscribes: Resumes email flow
7. User with granular prefs: Only receives enabled types

---

## Risks & Mitigations

### Risk 1: Email Fatigue
- **Mitigation**: Frequency caps, granular controls, clear unsubscribe
- **Monitoring**: Track unsubscribe rates

### Risk 2: Seeming Insensitive
- **Mitigation**: Careful template writing, empathetic tone, multiple reviews
- **Monitoring**: User feedback, support tickets

### Risk 3: Technical Failures
- **Mitigation**: Robust error handling, retry logic, monitoring
- **Monitoring**: Job failure alerts, delivery reports

### Risk 4: Cost (Email Volume)
- **Mitigation**: Template-based (no LLM), rate limiting, Resend pricing tier
- **Estimation**:
  - 1000 active users = ~800 emails/week
  - 200 inactive users = ~50 emails/week
  - Total: ~850 emails/week = 3,400/month (well within free tier)

### Risk 5: Spam Classification
- **Mitigation**:
  - Proper SPF/DKIM/DMARC setup (via Resend)
  - Respect unsubscribes immediately
  - Include physical address (Resend default)
  - Clear "from" name (Annie's Health Journal)
  - Consistent sending domain

---

## Future Enhancements

1. **Timezone Support**: Send at user's local time
2. **A/B Testing**: Test subject lines and content variations
3. **Personalized Insights**: More sophisticated pattern detection
4. **Email Analytics**: Track opens/clicks (via Resend webhooks)
5. **SMS Alternative**: Offer text message option
6. **In-App Notifications**: Complement email with push notifications
7. **Weekly Digest Customization**: Let users choose what stats to include
8. **Celebration Emails**: Milestone achievements (30-day streak, etc.)

---

## Open Questions

1. Should we send from "Annie <annie@annieshealth.com>" or "Annie's Health Journal <hello@annieshealth.com>"?
2. What should the unsubscribe confirmation page look like?
3. Should we offer a "pause" option (temporary unsubscribe for 1-2 months)?
4. Should admins get a weekly digest of email stats?
5. What happens if user deletes account while emails are queued?

---

## Conclusion

This engagement email system is designed to genuinely support users in their health journaling practice, not just boost metrics. Every decision prioritizes user experience, empathy, and respect for their journey. The template-based approach keeps costs low while maintaining a personal, human touch.

The system is built to scale gracefully, with clear phases for implementation and monitoring for continuous improvement.
