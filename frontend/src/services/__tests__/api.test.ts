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

import { authApi, checkInsApi } from '../api';

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
                  symptoms: { pain: 7 },
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
            symptoms: { pain: 7 },
            activities: ['walking'],
            triggers: ['stress'],
            notes: 'test notes',
          },
        });

        expect(result.success).toBe(true);
        expect(result.data.checkIn.structured.symptoms.pain).toBe(7);
      });
    });
  });
});
