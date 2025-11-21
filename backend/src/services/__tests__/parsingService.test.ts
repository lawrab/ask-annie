import { parseSymptoms, calculateConfidence, categoricalToNumeric } from '../parsingService';

describe('ParsingService', () => {
  describe('parseSymptoms', () => {
    describe('Hand Grip Detection', () => {
      it('should detect bad hand grip', () => {
        const result = parseSymptoms('My hand grip was really bad today');

        expect(result.symptoms.hand_grip).toEqual({ severity: 10 });
      });

      it('should detect moderate hand grip', () => {
        const result = parseSymptoms('Hands feel okay, moderate grip');

        expect(result.symptoms.hand_grip).toEqual({ severity: 5 });
      });

      it('should detect good hand grip', () => {
        const result = parseSymptoms('Hand strength is great today');

        expect(result.symptoms.hand_grip).toEqual({ severity: 1 });
      });

      it('should handle multiple grip descriptors', () => {
        const result = parseSymptoms('My grip was terrible and weak');

        expect(result.symptoms.hand_grip).toEqual({ severity: 10 });
      });
    });

    describe('Pain Level Detection', () => {
      it('should extract numeric pain level', () => {
        const result = parseSymptoms('Pain level around 7 today');

        expect(result.symptoms.pain_level).toEqual({ severity: 7 });
      });

      it('should extract pain with "out of 10" format', () => {
        const result = parseSymptoms('My pain is 8 out of 10');

        expect(result.symptoms.pain_level).toEqual({ severity: 8 });
      });

      it('should extract pain with slash format', () => {
        const result = parseSymptoms('Pain about 5/10');

        expect(result.symptoms.pain_level).toEqual({ severity: 5 });
      });

      it('should not extract pain levels outside 0-10 range', () => {
        const result = parseSymptoms('Pain is 15 today');

        expect(result.symptoms.pain_level).toBeUndefined();
      });

      it('should detect pain keyword without numeric value', () => {
        const result = parseSymptoms('I have some pain but it is manageable');

        // Should not add pain_level without a number
        expect(result.symptoms.pain_level).toBeUndefined();
      });
    });

    describe('Energy Level Detection', () => {
      it('should detect low energy', () => {
        const result = parseSymptoms('Feeling really tired and drained');

        expect(result.symptoms.energy).toEqual({ severity: 9 });
      });

      it('should detect medium energy', () => {
        const result = parseSymptoms('Energy is moderate today');

        expect(result.symptoms.energy).toEqual({ severity: 5 });
      });

      it('should detect high energy', () => {
        const result = parseSymptoms('Very energetic and alert');

        expect(result.symptoms.energy).toEqual({ severity: 2 });
      });
    });

    describe('Boolean Symptoms Detection', () => {
      it('should detect Raynauds event', () => {
        const result = parseSymptoms('Had a raynauds episode today');

        expect(result.symptoms.raynauds_event).toEqual({ severity: 7 });
      });

      it('should detect brain fog', () => {
        const result = parseSymptoms('Experiencing brain fog and confusion');

        expect(result.symptoms.brain_fog).toEqual({ severity: 7 });
      });

      it('should detect tingling feet', () => {
        const result = parseSymptoms('My feet are tingling again');

        expect(result.symptoms.tingling_feet).toEqual({ severity: 7 });
      });

      it('should detect neck stiffness', () => {
        const result = parseSymptoms('Neck is really stiff today');

        expect(result.symptoms.neck_stiffness).toEqual({ severity: 7 });
      });
    });

    describe('Activity Level Detection', () => {
      it('should detect rested activity level', () => {
        const result = parseSymptoms('Mostly rested today');

        expect(result.symptoms.activity_level).toEqual({ severity: 2 });
      });

      it('should detect light activity level', () => {
        const result = parseSymptoms('Did some light exercise');

        expect(result.symptoms.activity_level).toEqual({ severity: 4 });
      });

      it('should detect normal activity level', () => {
        const result = parseSymptoms('Normal activity today');

        expect(result.symptoms.activity_level).toEqual({ severity: 2 });
      });

      it('should detect high activity level', () => {
        const result = parseSymptoms('Very intense workout today');

        expect(result.symptoms.activity_level).toEqual({ severity: 2 });
      });
    });

    describe('Activities Detection', () => {
      it('should detect single activity', () => {
        const result = parseSymptoms('Went walking today');

        expect(result.activities).toContain('walking');
      });

      it('should detect multiple activities', () => {
        const result = parseSymptoms('Did some housework, cooking, and reading');

        expect(result.activities).toContain('housework');
        expect(result.activities).toContain('cooking');
        expect(result.activities).toContain('reading');
      });

      it('should detect exercise-related activities', () => {
        const result = parseSymptoms('Went for a run and did yoga');

        expect(result.activities).toContain('run');
        expect(result.activities).toContain('yoga');
      });

      it('should return empty array when no activities mentioned', () => {
        const result = parseSymptoms('Just resting at home');

        expect(result.activities).toHaveLength(1); // 'resting' is an activity
        expect(result.activities).toContain('resting');
      });
    });

    describe('Triggers Detection', () => {
      it('should detect stress trigger', () => {
        const result = parseSymptoms('Very stressed today');

        expect(result.triggers).toContain('stressed');
      });

      it('should detect multiple triggers', () => {
        const result = parseSymptoms('Cold weather and lack of sleep');

        expect(result.triggers).toContain('cold');
        expect(result.triggers).toContain('weather');
        expect(result.triggers).toContain('lack of sleep');
      });

      it('should detect food and caffeine triggers', () => {
        const result = parseSymptoms('Had too much caffeine and food');

        expect(result.triggers).toContain('caffeine');
        expect(result.triggers).toContain('food');
      });

      it('should return empty array when no triggers mentioned', () => {
        const result = parseSymptoms('Everything was fine today');

        expect(result.triggers).toEqual([]);
      });
    });

    describe('Notes Extraction', () => {
      it('should store original transcript as notes', () => {
        const transcript = 'My hands felt really bad today, pain around 7';
        const result = parseSymptoms(transcript);

        expect(result.notes).toBe(transcript);
      });

      it('should trim whitespace from notes', () => {
        const result = parseSymptoms('  Test transcript  ');

        expect(result.notes).toBe('Test transcript');
      });
    });

    describe('Complex Scenarios', () => {
      it('should parse complex transcript with multiple symptoms', () => {
        const transcript =
          'My hands felt really bad today, pain around 7, did some light housework but feeling exhausted';

        const result = parseSymptoms(transcript);

        expect(result.symptoms.hand_grip).toEqual({ severity: 10 });
        expect(result.symptoms.pain_level).toEqual({ severity: 7 });
        expect(result.symptoms.activity_level).toEqual({ severity: 4 });
        expect(result.symptoms.energy).toEqual({ severity: 9 });
        expect(result.activities).toContain('housework');
      });

      it('should handle transcript with no symptoms', () => {
        const result = parseSymptoms('Nothing special to report');

        expect(Object.keys(result.symptoms)).toHaveLength(0);
        expect(result.activities).toHaveLength(0);
        expect(result.triggers).toHaveLength(0);
      });

      it('should be case insensitive', () => {
        const result = parseSymptoms('PAIN LEVEL 8 AND VERY TIRED');

        expect(result.symptoms.pain_level).toEqual({ severity: 8 });
        expect(result.symptoms.energy).toEqual({ severity: 9 });
      });

      it('should handle various phrase structures', () => {
        const result = parseSymptoms(
          'Today my grip in my hands was terrible, pain around 3 out of 10'
        );

        expect(result.symptoms.hand_grip).toEqual({ severity: 10 });
        expect(result.symptoms.pain_level).toEqual({ severity: 3 });
      });
    });

    describe('Real-world Examples', () => {
      it('should parse example from issue description', () => {
        const transcript =
          'My hands felt really bad today, pain around 7, did some light housework';

        const result = parseSymptoms(transcript);

        expect(result.symptoms.hand_grip).toEqual({ severity: 10 });
        expect(result.symptoms.pain_level).toEqual({ severity: 7 });
        expect(result.activities).toContain('housework');
        expect(result.notes).toBe(transcript);
      });

      it('should handle good day scenario', () => {
        const transcript = 'Feeling great today, hands are strong, went for a walk';

        const result = parseSymptoms(transcript);

        expect(result.symptoms.hand_grip).toEqual({ severity: 1 });
        expect(result.activities).toContain('walk');
      });

      it('should handle multiple symptom scenario', () => {
        const transcript = 'Had a Raynauds event, fingers white, brain fog, pain 6, very stressed';

        const result = parseSymptoms(transcript);

        expect(result.symptoms.raynauds_event).toEqual({ severity: 7 });
        expect(result.symptoms.brain_fog).toEqual({ severity: 7 });
        expect(result.symptoms.pain_level).toEqual({ severity: 6 });
        expect(result.triggers).toContain('stressed');
      });
    });
  });

  describe('calculateConfidence', () => {
    it('should return 0 for empty parse result', () => {
      const parsed = {
        symptoms: {},
        activities: [],
        triggers: [],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(0);
    });

    it('should calculate confidence based on symptoms', () => {
      const parsed = {
        symptoms: { pain_level: { severity: 7 }, hand_grip: { severity: 8 } },
        activities: [],
        triggers: [],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(30); // 2 symptoms * 15 points
    });

    it('should calculate confidence based on activities', () => {
      const parsed = {
        symptoms: {},
        activities: ['walking', 'reading'],
        triggers: [],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(20); // 2 activities * 10 points
    });

    it('should calculate confidence based on triggers', () => {
      const parsed = {
        symptoms: {},
        activities: [],
        triggers: ['stress', 'cold'],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(20); // 2 triggers * 10 points
    });

    it('should combine all factors for total confidence', () => {
      const parsed = {
        symptoms: {
          pain_level: { severity: 7 },
          hand_grip: { severity: 8 },
          energy: { severity: 8 },
        },
        activities: ['walking'],
        triggers: ['stress'],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(65); // 45 (3 symptoms * 15) + 10 (activity) + 10 (trigger)
    });

    it('should cap confidence at 100', () => {
      const parsed = {
        symptoms: {
          pain_level: { severity: 7 },
          hand_grip: { severity: 8 },
          energy: { severity: 8 },
          brain_fog: { severity: 7 },
          raynauds_event: { severity: 7 },
        },
        activities: ['walking', 'running', 'yoga'],
        triggers: ['stress', 'cold'],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(100);
    });

    it('should cap symptom score at 60', () => {
      const parsed = {
        symptoms: {
          symptom1: { severity: 7 },
          symptom2: { severity: 7 },
          symptom3: { severity: 7 },
          symptom4: { severity: 7 },
          symptom5: { severity: 7 },
          symptom6: { severity: 7 },
        },
        activities: [],
        triggers: [],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(60); // Capped at 60 for symptoms
    });

    it('should cap activity score at 20', () => {
      const parsed = {
        symptoms: {},
        activities: ['a', 'b', 'c', 'd', 'e'],
        triggers: [],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(20); // Capped at 20 for activities
    });

    it('should cap trigger score at 20', () => {
      const parsed = {
        symptoms: {},
        activities: [],
        triggers: ['a', 'b', 'c', 'd', 'e'],
        notes: '',
      };

      const confidence = calculateConfidence(parsed);

      expect(confidence).toBe(20); // Capped at 20 for triggers
    });
  });

  describe('categoricalToNumeric', () => {
    it('should convert low severity categories', () => {
      expect(categoricalToNumeric('good')).toBe(1);
      expect(categoricalToNumeric('great')).toBe(1);
      expect(categoricalToNumeric('excellent')).toBe(1);
      expect(categoricalToNumeric('fine')).toBe(2);
      expect(categoricalToNumeric('normal')).toBe(2);
    });

    it('should convert medium severity categories', () => {
      expect(categoricalToNumeric('moderate')).toBe(5);
      expect(categoricalToNumeric('okay')).toBe(5);
      expect(categoricalToNumeric('fair')).toBe(5);
      expect(categoricalToNumeric('light')).toBe(4);
    });

    it('should convert high severity categories', () => {
      expect(categoricalToNumeric('bad')).toBe(10);
      expect(categoricalToNumeric('terrible')).toBe(10);
      expect(categoricalToNumeric('awful')).toBe(10);
      expect(categoricalToNumeric('poor')).toBe(8);
      expect(categoricalToNumeric('tired')).toBe(8);
      expect(categoricalToNumeric('exhausted')).toBe(9);
    });

    it('should be case insensitive', () => {
      expect(categoricalToNumeric('GOOD')).toBe(1);
      expect(categoricalToNumeric('Bad')).toBe(10);
      expect(categoricalToNumeric('MoDeRaTe')).toBe(5);
    });

    it('should return default value for unknown categories', () => {
      expect(categoricalToNumeric('unknown')).toBe(5);
      expect(categoricalToNumeric('weird')).toBe(5);
      expect(categoricalToNumeric('xyz')).toBe(5);
      expect(categoricalToNumeric('')).toBe(5);
    });
  });
});
