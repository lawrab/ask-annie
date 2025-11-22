import { describe, it, expect, beforeEach, vi } from 'vitest';

// Setup mock functions using vi.hoisted to avoid hoisting issues
const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}));

// Mock axios module
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        post: mockPost,
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      })),
    },
  };
});

import { authApi, checkInsApi, analysisApi } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('authApi', () => {
    describe('register', () => {
      it('should successfully register a new user', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              user: {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                notificationTimes: ['08:00', '14:00', '20:00'],
                notificationsEnabled: true,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
              token: 'mock-jwt-token',
            },
          },
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await authApi.register({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result.success).toBe(true);
        expect(result.data.user.username).toBe('testuser');
        expect(result.data.token).toBe('mock-jwt-token');
      });
    });

    describe('login', () => {
      it('should successfully login a user', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              user: {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                notificationTimes: ['08:00', '14:00', '20:00'],
                notificationsEnabled: true,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
              token: 'mock-jwt-token',
            },
          },
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await authApi.login({
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result.success).toBe(true);
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.token).toBe('mock-jwt-token');
      });
    });

    describe('logout', () => {
      it('should logout and clear localStorage', async () => {
        localStorage.setItem('token', 'mock-token');
        localStorage.setItem('user', JSON.stringify({ id: '123' }));

        mockPost.mockResolvedValue({ data: { success: true } });

        await authApi.logout();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
      });
    });
  });

  describe('checkInsApi', () => {
    describe('getAll', () => {
      it('should fetch all check-ins', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              checkIns: [
                {
                  _id: '1',
                  userId: '123',
                  timestamp: '2024-01-01T12:00:00.000Z',
                  structured: {
                    symptoms: { pain: 5 },
                    activities: [],
                    triggers: [],
                    notes: '',
                  },
                  flaggedForDoctor: false,
                  createdAt: '2024-01-01T12:00:00.000Z',
                  updatedAt: '2024-01-01T12:00:00.000Z',
                },
              ],
              pagination: {
                total: 1,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        const result = await checkInsApi.getAll();

        expect(result.success).toBe(true);
        expect(result.data.checkIns).toHaveLength(1);
        expect(result.data.pagination.total).toBe(1);
      });

      it('should pass query parameters', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              checkIns: [],
              pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await checkInsApi.getAll({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          symptom: 'pain',
        });

        expect(mockGet).toHaveBeenCalledWith('/checkins', {
          params: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            symptom: 'pain',
          },
        });
      });
    });

    describe('createVoice', () => {
      it('should upload voice check-in', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              checkIn: {
                _id: '1',
                userId: '123',
                timestamp: '2024-01-01T12:00:00.000Z',
                rawTranscript: 'test transcript',
                structured: {
                  symptoms: { pain: 5 },
                  activities: [],
                  triggers: [],
                  notes: 'test transcript',
                },
                flaggedForDoctor: false,
                createdAt: '2024-01-01T12:00:00.000Z',
                updatedAt: '2024-01-01T12:00:00.000Z',
              },
            },
          },
        };

        mockPost.mockResolvedValue(mockResponse);

        const mockFile = new File(['audio'], 'test.webm', { type: 'audio/webm' });
        const result = await checkInsApi.createVoice(mockFile);

        expect(result.success).toBe(true);
        expect(result.data.checkIn.rawTranscript).toBe('test transcript');
      });
    });

    describe('createManual', () => {
      it('should create manual check-in', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              checkIn: {
                _id: '1',
                userId: '123',
                timestamp: '2024-01-01T12:00:00.000Z',
                structured: {
                  symptoms: { pain: { severity: 7 } },
                  activities: ['walking'],
                  triggers: ['stress'],
                  notes: 'test notes',
                },
                flaggedForDoctor: false,
                createdAt: '2024-01-01T12:00:00.000Z',
                updatedAt: '2024-01-01T12:00:00.000Z',
              },
            },
          },
        };

        mockPost.mockResolvedValue(mockResponse);

        const result = await checkInsApi.createManual({
          structured: {
            symptoms: { pain: { severity: 7 } },
            activities: ['walking'],
            triggers: ['stress'],
            notes: 'test notes',
          },
        });

        expect(result.success).toBe(true);
        expect(result.data.checkIn.structured.symptoms.pain.severity).toBe(7);
      });
    });
  });

  describe('analysisApi', () => {
    describe('getSymptomsAnalysis', () => {
      it('should fetch symptoms analysis', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: [
              { name: 'Headache', count: 10, averageSeverity: 6.5 },
              { name: 'Fatigue', count: 8, averageSeverity: 5.0 },
              { name: 'Nausea', count: 5, averageSeverity: 4.2 },
            ],
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        const result = await analysisApi.getSymptomsAnalysis();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
        expect(result.data[0].name).toBe('Headache');
        expect(result.data[0].count).toBe(10);
        expect(result.data[0].averageSeverity).toBe(6.5);
      });

      it('should make GET request to /analysis/symptoms', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: [],
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomsAnalysis();

        expect(mockGet).toHaveBeenCalledWith('/analysis/symptoms');
      });

      it('should handle empty symptoms list', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: [],
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        const result = await analysisApi.getSymptomsAnalysis();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });
    });

    describe('getSymptomTrend', () => {
      it('should fetch symptom trend data', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Headache',
              dateRange: {
                start: '2025-01-08',
                end: '2025-01-14',
              },
              dataPoints: [
                { date: '2025-01-08', value: 7 },
                { date: '2025-01-09', value: 6 },
                { date: '2025-01-10', value: 5 },
              ],
              statistics: {
                average: 6.0,
                min: 5,
                max: 7,
                median: 6.0,
                standardDeviation: 0.82,
              },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        const result = await analysisApi.getSymptomTrend('Headache', 7);

        expect(result.success).toBe(true);
        expect(result.data.symptom).toBe('Headache');
        expect(result.data.dataPoints).toHaveLength(3);
        expect(result.data.statistics.average).toBe(6.0);
      });

      it('should make GET request with symptom and days parameters', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Headache',
              dateRange: { start: '2025-01-08', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomTrend('Headache', 7);

        expect(mockGet).toHaveBeenCalledWith('/analysis/trends/Headache', {
          params: { days: 7 },
        });
      });

      it('should URL encode symptom name', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Back Pain',
              dateRange: { start: '2025-01-08', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomTrend('Back Pain', 30);

        expect(mockGet).toHaveBeenCalledWith('/analysis/trends/Back%20Pain', {
          params: { days: 30 },
        });
      });

      it('should use default days parameter of 7', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Headache',
              dateRange: { start: '2025-01-08', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomTrend('Headache');

        expect(mockGet).toHaveBeenCalledWith('/analysis/trends/Headache', {
          params: { days: 7 },
        });
      });

      it('should handle different time ranges', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Fatigue',
              dateRange: { start: '2024-10-15', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomTrend('Fatigue', 90);

        expect(mockGet).toHaveBeenCalledWith('/analysis/trends/Fatigue', {
          params: { days: 90 },
        });
      });

      it('should handle symptoms with special characters', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Joint Pain (Knee)',
              dateRange: { start: '2025-01-08', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        await analysisApi.getSymptomTrend('Joint Pain (Knee)', 14);

        expect(mockGet).toHaveBeenCalledWith('/analysis/trends/Joint%20Pain%20(Knee)', {
          params: { days: 14 },
        });
      });

      it('should handle empty data points', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              symptom: 'Headache',
              dateRange: { start: '2025-01-08', end: '2025-01-14' },
              dataPoints: [],
              statistics: { average: 0, min: 0, max: 0, median: 0, standardDeviation: 0 },
            },
          },
        };

        mockGet.mockResolvedValue(mockResponse);

        const result = await analysisApi.getSymptomTrend('Headache', 7);

        expect(result.success).toBe(true);
        expect(result.data.dataPoints).toHaveLength(0);
      });
    });
  });
});
