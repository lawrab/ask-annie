import { parseSymptoms, calculateConfidence } from '../parsingService';

// Mock OpenAI module - must be done before any imports
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('ParsingService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockCreate.mockReset();
  });

  describe('parseSymptoms', () => {
    describe('Successful Parsing', () => {
      it('should extract symptoms with severity and location', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'headache',
                            severity: 6,
                            location: 'temples',
                          },
                        ],
                        activities: [],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('I have a headache in my temples, about 6 out of 10');

        expect(result.symptoms.headache).toEqual({
          severity: 6,
          location: 'temples',
        });
      });

      it('should extract multiple symptoms with varying severities', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'headache',
                            severity: 6,
                            location: 'temples',
                          },
                          {
                            name: 'nausea',
                            severity: 3,
                          },
                          {
                            name: 'fatigue',
                            severity: 5,
                          },
                        ],
                        activities: ['working'],
                        triggers: ['dehydration', 'screen time'],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const transcript =
          "Today I'm experiencing a moderate headache, probably a 6 out of 10, mostly in my temples. I also have some mild nausea, maybe a 3. I've been working on the computer for about 4 hours and I'm feeling pretty fatigued. I think the headache was triggered by not drinking enough water and too much screen time. I did take a short walk outside which helped a little.";

        const result = await parseSymptoms(transcript);

        expect(result.symptoms.headache).toEqual({
          severity: 6,
          location: 'temples',
        });
        expect(result.symptoms.nausea).toEqual({
          severity: 3,
        });
        expect(result.symptoms.fatigue).toEqual({
          severity: 5,
        });
        expect(result.activities).toContain('working');
        expect(result.triggers).toContain('dehydration');
        expect(result.triggers).toContain('screen time');
        expect(result.notes).toBe(transcript);
      });

      it('should extract activities', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: {},
                        activities: ['walking', 'yoga', 'cooking'],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms(
          'Today I went walking, did yoga, and spent time cooking'
        );

        expect(result.activities).toContain('walking');
        expect(result.activities).toContain('yoga');
        expect(result.activities).toContain('cooking');
      });

      it('should extract triggers', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: {},
                        activities: [],
                        triggers: ['stress', 'lack of sleep', 'caffeine'],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms(
          'I was very stressed today, had lack of sleep, and too much caffeine'
        );

        expect(result.triggers).toContain('stress');
        expect(result.triggers).toContain('lack of sleep');
        expect(result.triggers).toContain('caffeine');
      });

      it('should preserve original transcript as notes', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: {},
                        activities: [],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const transcript = 'This is my original transcript';
        const result = await parseSymptoms(transcript);

        expect(result.notes).toBe(transcript);
      });

      it('should handle symptoms with additional notes', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'lower_back_pain',
                            severity: 7,
                            location: 'lower back',
                            notes: 'Sharp pain when bending',
                          },
                        ],
                        activities: [],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('Sharp pain in lower back when bending, about 7/10');

        expect(result.symptoms.lower_back_pain).toEqual({
          severity: 7,
          location: 'lower back',
          notes: 'Sharp pain when bending',
        });
      });

      it('should clamp severity values outside valid range [1-10]', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'migraine',
                            severity: 0, // Invalid: below minimum
                          },
                          {
                            name: 'fatigue',
                            severity: 15, // Invalid: above maximum
                          },
                          {
                            name: 'nausea',
                            severity: 5, // Valid: within range
                          },
                        ],
                        activities: [],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('migraine severity 0, fatigue 15, nausea 5');

        // Severity 0 should be clamped to 1
        expect(result.symptoms.migraine).toEqual({
          severity: 1,
        });

        // Severity 15 should be clamped to 10
        expect(result.symptoms.fatigue).toEqual({
          severity: 10,
        });

        // Severity 5 should remain unchanged
        expect(result.symptoms.nausea).toEqual({
          severity: 5,
        });
      });
    });

    describe('Error Handling', () => {
      it('should fail gracefully when OpenAI API throws error', async () => {
        mockCreate.mockRejectedValueOnce(new Error('API Error'));

        const transcript = 'Test transcript';
        const result = await parseSymptoms(transcript);

        expect(result.symptoms).toEqual({});
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
        expect(result.notes).toBe(transcript);
      });

      it('should fail gracefully when no tool call in response', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: undefined,
              },
            },
          ],
        });

        const transcript = 'Test transcript';
        const result = await parseSymptoms(transcript);

        expect(result.symptoms).toEqual({});
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
        expect(result.notes).toBe(transcript);
      });

      it('should fail gracefully when function arguments are missing', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: undefined,
                    },
                  },
                ],
              },
            },
          ],
        });

        const transcript = 'Test transcript';
        const result = await parseSymptoms(transcript);

        expect(result.symptoms).toEqual({});
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
        expect(result.notes).toBe(transcript);
      });

      it('should fail gracefully when JSON parsing fails', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: 'invalid json',
                    },
                  },
                ],
              },
            },
          ],
        });

        const transcript = 'Test transcript';
        const result = await parseSymptoms(transcript);

        expect(result.symptoms).toEqual({});
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
        expect(result.notes).toBe(transcript);
      });

      it('should handle partial data from GPT response', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'headache',
                            severity: 5,
                          },
                        ],
                        // Missing activities and triggers
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('I have a headache');

        expect(result.symptoms.headache).toEqual({ severity: 5 });
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
      });
    });

    describe('Issue #105 Test Case', () => {
      it('should correctly parse the complex example from Issue #105', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'headache',
                            severity: 6,
                            location: 'temples',
                            notes: 'moderate intensity',
                          },
                          {
                            name: 'nausea',
                            severity: 3,
                            notes: 'mild',
                          },
                          {
                            name: 'fatigue',
                            severity: 5,
                          },
                        ],
                        activities: ['working on computer', 'walking'],
                        triggers: ['dehydration', 'screen time'],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const transcript =
          "Today I'm experiencing a moderate headache, probably a 6 out of 10, mostly in my temples. I also have some mild nausea, maybe a 3. I've been working on the computer for about 4 hours and I'm feeling pretty fatigued. I think the headache was triggered by not drinking enough water and too much screen time. I did take a short walk outside which helped a little.";

        const result = await parseSymptoms(transcript);

        // Verify headache extraction
        expect(result.symptoms.headache).toBeDefined();
        expect(result.symptoms.headache.severity).toBe(6);
        expect(result.symptoms.headache.location).toBe('temples');

        // Verify nausea extraction
        expect(result.symptoms.nausea).toBeDefined();
        expect(result.symptoms.nausea.severity).toBe(3);

        // Verify fatigue extraction (estimated ~5 for "pretty fatigued")
        expect(result.symptoms.fatigue).toBeDefined();
        expect(result.symptoms.fatigue.severity).toBeGreaterThanOrEqual(4);
        expect(result.symptoms.fatigue.severity).toBeLessThanOrEqual(6);

        // Verify activities
        expect(result.activities.length).toBeGreaterThan(0);

        // Verify triggers
        expect(result.triggers.length).toBeGreaterThan(0);

        // Verify original preserved
        expect(result.notes).toBe(transcript);
      });
    });

    describe('Real-world Scenarios', () => {
      it('should handle empty transcript', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: {},
                        activities: [],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('');

        expect(result.symptoms).toEqual({});
        expect(result.activities).toEqual([]);
        expect(result.triggers).toEqual([]);
      });

      it('should handle transcript with no symptoms', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: {},
                        activities: ['resting'],
                        triggers: [],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms('Feeling great today, just resting');

        expect(Object.keys(result.symptoms)).toHaveLength(0);
        expect(result.activities).toContain('resting');
      });

      it('should handle medical terminology', async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    type: 'function',
                    function: {
                      arguments: JSON.stringify({
                        symptoms: [
                          {
                            name: 'migraine',
                            severity: 8,
                            location: 'left hemisphere',
                            notes: 'with aura',
                          },
                        ],
                        activities: [],
                        triggers: ['photophobia'],
                      }),
                    },
                  },
                ],
              },
            },
          ],
        });

        const result = await parseSymptoms(
          'Migraine with aura, left hemisphere, severity 8, photophobia'
        );

        expect(result.symptoms.migraine).toBeDefined();
        expect(result.symptoms.migraine.severity).toBe(8);
        expect(result.triggers).toContain('photophobia');
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
});
