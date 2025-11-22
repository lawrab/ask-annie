# Voice Parsing Test Scripts

## Test Script 1: Complex Multi-Symptom (from Issue #105)

### What to Say:
> "Today I'm experiencing a moderate headache, probably a 6 out of 10, mostly in my temples. I also have some mild nausea, maybe a 3. I've been working on the computer for about 4 hours and I'm feeling pretty fatigued. I think the headache was triggered by not drinking enough water and too much screen time. I did take a short walk outside which helped a little."

### Expected Results:
```json
{
  "symptoms": {
    "headache": {
      "severity": 6,
      "location": "temples"
    },
    "nausea": {
      "severity": 3
    },
    "fatigue": {
      "severity": 5
    }
  },
  "activities": [
    "working on computer",
    "walk outside"
  ],
  "triggers": [
    "dehydration",
    "screen time"
  ]
}
```

---

## Test Script 2: Categorical Severities

### What to Say:
> "I'm having a terrible migraine today, probably a 9 out of 10, right behind my eyes. My neck is also really stiff. I think it was caused by stress at work and not sleeping well last night. I tried doing some light stretching but it didn't help much."

### Expected Results:
```json
{
  "symptoms": {
    "migraine": {
      "severity": 9,
      "location": "behind eyes"
    },
    "neck_stiffness": {
      "severity": 7
    }
  },
  "activities": [
    "stretching"
  ],
  "triggers": [
    "stress",
    "lack of sleep"
  ]
}
```

---

## Test Script 3: Multiple Pain Points

### What to Say:
> "My lower back pain is about a 7 today. My hands are feeling pretty weak, maybe a 4, having trouble gripping things. I did some gardening this morning which probably didn't help. Also had a mild headache earlier but it's mostly gone now, down to a 2."

### Expected Results:
```json
{
  "symptoms": {
    "lower_back_pain": {
      "severity": 7
    },
    "hand_weakness": {
      "severity": 4
    },
    "headache": {
      "severity": 2
    }
  },
  "activities": [
    "gardening"
  ],
  "triggers": []
}
```

---

## Test Script 4: Good Day (Low Severities)

### What to Say:
> "Feeling pretty good today. Just a little bit of joint stiffness in the morning, maybe a 2, but it went away after my morning walk. Energy levels are good, did some light housework and cooking without any issues."

### Expected Results:
```json
{
  "symptoms": {
    "joint_stiffness": {
      "severity": 2
    }
  },
  "activities": [
    "walking",
    "housework",
    "cooking"
  ],
  "triggers": []
}
```

---

## Test Script 5: Negative Assertions (Should NOT Extract)

### What to Say:
> "No headache today, which is great. I'm not experiencing any pain at all. I did some yoga and went for a short run. Feeling pretty energetic."

### Expected Results:
```json
{
  "symptoms": {},
  "activities": [
    "yoga",
    "running"
  ],
  "triggers": []
}
```

**Note:** Should NOT extract "headache" or "pain" since they're negated.

---

## Test Script 6: Weather Trigger

### What to Say:
> "My knee is aching today, about a 6. It's been raining and the weather changed suddenly yesterday. I think that's what triggered it. I've just been resting on the couch, haven't done much activity."

### Expected Results:
```json
{
  "symptoms": {
    "knee_pain": {
      "severity": 6
    }
  },
  "activities": [
    "resting"
  ],
  "triggers": [
    "weather",
    "rain"
  ]
}
```

---

## Test Script 7: Raynaud's Event

### What to Say:
> "Had a Raynaud's episode this morning. My fingers went completely white and numb for about 10 minutes. It happened when I was outside in the cold getting the mail. Also feeling pretty tired today, maybe a 7 on the fatigue scale."

### Expected Results:
```json
{
  "symptoms": {
    "raynauds_event": {
      "severity": 7,
      "location": "fingers"
    },
    "fatigue": {
      "severity": 7
    }
  },
  "activities": [
    "outside"
  ],
  "triggers": [
    "cold"
  ]
}
```

---

## How to Test

### Option 1: Manual Check-In (Recommended for first test)
1. Start your dev servers (backend + frontend)
2. Login to the app
3. Go to "Manual Check-In" page
4. Type one of the scripts above into the notes field
5. Submit the check-in
6. View it on the Dashboard to see if parsing worked

### Option 2: Voice Check-In (After manual test passes)
1. Start your dev servers
2. Login to the app
3. Go to "Voice Check-In" page
4. Click record
5. Read one of the scripts above
6. Stop recording
7. Submit
8. View parsed results on Dashboard

### Option 3: Direct API Test (Fastest)
```bash
# Test the parsing service directly
cd backend
node -e "
const { parseSymptoms } = require('./dist/services/parsingService.js');

const transcript = \"Today I'm experiencing a moderate headache, probably a 6 out of 10, mostly in my temples. I also have some mild nausea, maybe a 3.\";

parseSymptoms(transcript).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
});
"
```

---

## What to Check

For each test:
- ✅ **Symptoms extracted correctly** (name, severity, location if mentioned)
- ✅ **Severities mapped correctly** (numbers preserved, words mapped to scale)
- ✅ **Activities detected** (normalized, no duplicates)
- ✅ **Triggers identified** (from signal words like "triggered by")
- ✅ **Negations handled** (don't extract "no pain" as "pain")
- ✅ **Original transcript preserved** in notes field

---

## Expected Behavior

### Success Indicators:
- GPT-4o-mini extracts all explicitly mentioned symptoms
- Numeric severities preserved exactly (6 out of 10 → 6)
- Categorical severities mapped reasonably (mild → 2-3, severe → 8-9)
- Locations associated with correct symptoms
- Activities and triggers detected from context
- Negations properly ignored

### Failure Indicators:
- Missing obvious symptoms
- Incorrect severity mappings
- Extracting symptoms from negations ("no pain" → "pain")
- Hallucinating symptoms not mentioned
- Wrong locations
- Missing clear triggers

---

## Cost Tracking

Each check-in costs approximately **$0.00009** (~0.009 cents):
- Input: ~200 tokens @ $0.15/1M = $0.00003
- Output: ~100 tokens @ $0.60/1M = $0.00006

**Test all 7 scripts:** ~$0.0006 (0.06 cents total)

---

## Debugging

If results don't match expectations:

1. **Check backend logs** for GPT responses:
   ```bash
   # In backend terminal, look for:
   info: Parsing transcript with GPT-4o-mini
   info: Parsing complete { symptomCount: X, activityCount: Y, triggerCount: Z }
   ```

2. **Check for API errors**:
   ```bash
   error: GPT parsing failed { error: '...' }
   ```

3. **Verify API key is set**:
   ```bash
   cd backend
   echo $OPENAI_API_KEY  # or check .env file
   ```

4. **Test direct OpenAI call**:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "gpt-4o-mini",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

---

## After Testing

Once you confirm parsing works well:
1. Commit changes
2. Push to GitHub
3. Create PR
4. Close Issue #106
5. Celebrate! 🎉 All alpha blockers complete!
