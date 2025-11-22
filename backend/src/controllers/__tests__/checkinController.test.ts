import { Request, Response, NextFunction } from 'express';
import {
  createVoiceCheckin,
  createManualCheckin,
  getCheckins,
  getStatus,
} from '../checkinController';
import CheckIn from '../../models/CheckIn';
import User from '../../models/User';
import { transcribeAudio } from '../../services/transcriptionService';
import { parseSymptoms } from '../../services/parsingService';
import fs from 'fs/promises';

// Mock dependencies
jest.mock('../../models/CheckIn');
jest.mock('../../models/User');
jest.mock('../../services/transcriptionService');
jest.mock('../../services/parsingService');
jest.mock('fs/promises');

describe('CheckinController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request
    mockReq = {
      file: {
        path: '/tmp/audio-123456.webm',
        originalname: 'test-audio.webm',
        size: 50000,
        mimetype: 'audio/webm',
        fieldname: 'audio',
        encoding: '7bit',
        destination: '/tmp',
        filename: 'audio-123456.webm',
        stream: {} as any,
        buffer: Buffer.from(''),
      },
      body: {},
      user: {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock fs.unlink to resolve successfully
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createVoiceCheckin', () => {
    describe('Success Cases', () => {
      it('should successfully create a voice check-in', async () => {
        // Arrange
        const mockTranscript = 'My hands felt really bad today, pain around 7';
        const mockParsed = {
          symptoms: {
            hand_grip: 'bad',
            pain_level: 7,
          },
          activities: [],
          triggers: [],
          notes: mockTranscript,
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          userId: '507f1f77bcf86cd799439011',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          rawTranscript: mockTranscript,
          structured: mockParsed,
          flaggedForDoctor: false,
          save: jest.fn().mockResolvedValue(true),
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
          language: 'en',
          duration: 5.2,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(transcribeAudio).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(parseSymptoms).toHaveBeenCalledWith(mockTranscript);
        expect(mockCheckIn.save).toHaveBeenCalled();
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            checkIn: {
              id: mockCheckIn._id,
              timestamp: mockCheckIn.timestamp,
              rawTranscript: mockTranscript,
              structured: mockParsed,
            },
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle check-in with activities and triggers', async () => {
        // Arrange
        const mockTranscript = 'Did some walking today, stress was high';
        const mockParsed = {
          symptoms: {},
          activities: ['walking'],
          triggers: ['stress'],
          notes: mockTranscript,
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          userId: '507f1f77bcf86cd799439011',
          timestamp: new Date(),
          rawTranscript: mockTranscript,
          structured: mockParsed,
          save: jest.fn().mockResolvedValue(true),
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                structured: expect.objectContaining({
                  activities: ['walking'],
                  triggers: ['stress'],
                }),
              }),
            }),
          })
        );
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when no audio file is provided', async () => {
        // Arrange
        mockReq.file = undefined;

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Audio file is required',
        });
        expect(transcribeAudio).not.toHaveBeenCalled();
        expect(parseSymptoms).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Transcription Errors', () => {
      it('should handle transcription service errors', async () => {
        // Arrange
        const transcriptionError = new Error('Transcription failed');
        (transcribeAudio as jest.Mock).mockRejectedValue(transcriptionError);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(transcribeAudio).toHaveBeenCalled();
        expect(parseSymptoms).not.toHaveBeenCalled();
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(mockNext).toHaveBeenCalledWith(transcriptionError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should cleanup audio file even if transcription fails', async () => {
        // Arrange
        (transcribeAudio as jest.Mock).mockRejectedValue(new Error('Transcription failed'));

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
      });
    });

    describe('Parsing Errors', () => {
      it('should handle parsing service errors', async () => {
        // Arrange
        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: 'Test transcript',
        });

        const parsingError = new Error('Parsing failed');
        (parseSymptoms as jest.Mock).mockImplementation(() => {
          throw parsingError;
        });

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(parseSymptoms).toHaveBeenCalled();
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(mockNext).toHaveBeenCalledWith(parsingError);
      });
    });

    describe('Database Errors', () => {
      it('should handle database save errors', async () => {
        // Arrange
        const mockTranscript = 'Test transcript';
        const mockParsed = {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: mockTranscript,
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);

        const dbError = new Error('Database connection failed');
        const mockCheckIn = {
          save: jest.fn().mockRejectedValue(dbError),
        };
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockCheckIn.save).toHaveBeenCalled();
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });

    describe('File Cleanup', () => {
      it('should continue if cleanup fails after successful save', async () => {
        // Arrange
        const mockTranscript = 'Test transcript';
        const mockParsed = {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: mockTranscript,
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: mockTranscript,
          structured: mockParsed,
          save: jest.fn().mockResolvedValue(true),
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);
        (CheckIn as any).mockImplementation(() => mockCheckIn);
        (fs.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should attempt cleanup even if cleanup fails after error', async () => {
        // Arrange
        (transcribeAudio as jest.Mock).mockRejectedValue(new Error('Transcription failed'));
        (fs.unlink as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(fs.unlink).toHaveBeenCalledWith('/tmp/audio-123456.webm');
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Transcription failed',
          })
        );
      });
    });

    describe('Integration Scenarios', () => {
      it('should handle empty transcript', async () => {
        // Arrange
        const mockTranscript = '';
        const mockParsed = {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: '',
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: mockTranscript,
          structured: mockParsed,
          save: jest.fn().mockResolvedValue(true),
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                rawTranscript: '',
              }),
            }),
          })
        );
      });

      it('should handle transcript with no recognized symptoms', async () => {
        // Arrange
        const mockTranscript = 'Just a normal day, nothing special';
        const mockParsed = {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: mockTranscript,
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: mockTranscript,
          structured: mockParsed,
          save: jest.fn().mockResolvedValue(true),
        };

        (transcribeAudio as jest.Mock).mockResolvedValue({
          text: mockTranscript,
        });
        (parseSymptoms as jest.Mock).mockReturnValue(mockParsed);
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createVoiceCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                structured: expect.objectContaining({
                  symptoms: {},
                }),
              }),
            }),
          })
        );
      });
    });
  });

  describe('createManualCheckin', () => {
    describe('Success Cases', () => {
      it('should successfully create a manual check-in', async () => {
        // Arrange
        const mockStructured = {
          symptoms: {
            hand_grip: 'moderate',
            pain_level: 5,
          },
          activities: ['walking'],
          triggers: [],
          notes: 'Felt okay today',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          userId: '507f1f77bcf86cd799439011',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          rawTranscript: 'manual entry',
          structured: mockStructured,
          flaggedForDoctor: false,
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockCheckIn.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            checkIn: {
              id: mockCheckIn._id,
              timestamp: mockCheckIn.timestamp,
              rawTranscript: 'manual entry',
              structured: mockStructured,
            },
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle check-in with empty symptoms', async () => {
        // Arrange
        const mockStructured = {
          symptoms: {},
          activities: ['yoga'],
          triggers: ['stress'],
          notes: 'Just tracking activities',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: 'manual entry',
          structured: mockStructured,
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                structured: expect.objectContaining({
                  symptoms: {},
                  activities: ['yoga'],
                  triggers: ['stress'],
                }),
              }),
            }),
          })
        );
      });

      it('should handle various symptom value types', async () => {
        // Arrange
        const mockStructured = {
          symptoms: {
            hand_grip: 'good', // string
            pain_level: 3, // number
            raynauds_event: true, // boolean
          },
          activities: [],
          triggers: [],
          notes: 'Mixed types',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: 'manual entry',
          structured: mockStructured,
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                structured: expect.objectContaining({
                  symptoms: {
                    hand_grip: 'good',
                    pain_level: 3,
                    raynauds_event: true,
                  },
                }),
              }),
            }),
          })
        );
      });

      it('should handle missing optional fields with defaults', async () => {
        // Arrange
        mockReq = {
          body: {
            structured: {
              symptoms: { energy: 'low' },
              // Missing activities, triggers, notes
            },
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: 'manual entry',
          structured: {
            symptoms: { energy: 'low' },
            activities: [],
            triggers: [],
            notes: '',
          },
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn).toHaveBeenCalledWith(
          expect.objectContaining({
            structured: expect.objectContaining({
              activities: [],
              triggers: [],
              notes: '',
            }),
          })
        );
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when structured data is missing', async () => {
        // Arrange
        mockReq = {
          body: {},
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Structured check-in data is required',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should return 400 when structured is null', async () => {
        // Arrange
        mockReq = {
          body: {
            structured: null,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Structured check-in data is required',
        });
      });
    });

    describe('Database Errors', () => {
      it('should handle database save errors', async () => {
        // Arrange
        const mockStructured = {
          symptoms: { energy: 'medium' },
          activities: [],
          triggers: [],
          notes: 'Test',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const dbError = new Error('Database connection failed');
        const mockCheckIn = {
          save: jest.fn().mockRejectedValue(dbError),
        };
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockCheckIn.save).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should handle validation errors from model', async () => {
        // Arrange
        mockReq = {
          body: {
            structured: {
              symptoms: {},
              activities: [],
              triggers: [],
              notes: '',
            },
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const validationError = new Error('Validation failed');
        const mockCheckIn = {
          save: jest.fn().mockRejectedValue(validationError),
        };
        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(validationError);
      });
    });

    describe('Integration Scenarios', () => {
      it('should handle complex symptom tracking', async () => {
        // Arrange
        const mockStructured = {
          symptoms: {
            hand_grip: 'bad',
            pain_level: 8,
            energy: 'low',
            brain_fog: true,
            raynauds_event: true,
            tingling_feet: false,
            activity_level: 'light',
          },
          activities: ['walking', 'housework', 'rest'],
          triggers: ['stress', 'cold', 'caffeine'],
          notes: 'Really challenging day with multiple symptoms',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          timestamp: new Date(),
          rawTranscript: 'manual entry',
          structured: mockStructured,
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              checkIn: expect.objectContaining({
                structured: mockStructured,
              }),
            }),
          })
        );
      });
    });
  });

  describe('getCheckins', () => {
    let mockGetReq: Partial<Request>;

    beforeEach(() => {
      mockGetReq = {
        query: {},
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
        },
      };
    });

    describe('Success Cases', () => {
      it('should retrieve check-ins with default pagination', async () => {
        // Arrange
        const mockCheckIns = [
          {
            _id: '507f191e810c19729de860ea',
            userId: '507f1f77bcf86cd799439011',
            timestamp: new Date('2024-01-02T12:00:00Z'),
            rawTranscript: 'manual entry',
            structured: {
              symptoms: { pain_level: 5 },
              activities: ['walking'],
              triggers: [],
              notes: '',
            },
            flaggedForDoctor: false,
          },
          {
            _id: '507f191e810c19729de860eb',
            userId: '507f1f77bcf86cd799439011',
            timestamp: new Date('2024-01-01T12:00:00Z'),
            rawTranscript: 'My hands hurt',
            structured: {
              symptoms: { hand_grip: 'bad' },
              activities: [],
              triggers: [],
              notes: 'My hands hurt',
            },
            flaggedForDoctor: false,
          },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCheckIns),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(2);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
        });
        expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: 'desc' });
        expect(mockQuery.limit).toHaveBeenCalledWith(20);
        expect(mockQuery.skip).toHaveBeenCalledWith(0);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            checkIns: mockCheckIns,
            pagination: {
              total: 2,
              limit: 20,
              offset: 0,
              hasMore: false,
            },
          },
        });
      });

      it('should apply date range filtering', async () => {
        // Arrange
        mockGetReq.query = {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          timestamp: {
            $gte: new Date('2024-01-01T00:00:00Z'),
            $lte: new Date('2024-01-31T23:59:59Z'),
          },
        });
      });

      it('should apply activity filtering', async () => {
        // Arrange
        mockGetReq.query = {
          activity: 'walking',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          'structured.activities': { $in: ['walking'] },
        });
      });

      it('should apply multiple activity filters', async () => {
        // Arrange
        mockGetReq.query = {
          activity: ['walking', 'running'],
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          'structured.activities': { $in: ['walking', 'running'] },
        });
      });

      it('should apply trigger filtering', async () => {
        // Arrange
        mockGetReq.query = {
          trigger: 'stress',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          'structured.triggers': { $in: ['stress'] },
        });
      });

      it('should apply flaggedForDoctor filtering (true)', async () => {
        // Arrange
        mockGetReq.query = {
          flaggedForDoctor: 'true',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          flaggedForDoctor: true,
        });
      });

      it('should apply flaggedForDoctor filtering (false)', async () => {
        // Arrange
        mockGetReq.query = {
          flaggedForDoctor: 'false',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          flaggedForDoctor: false,
        });
      });

      it('should apply symptom filtering', async () => {
        // Arrange
        mockGetReq.query = {
          symptom: 'pain',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          'structured.symptoms': { $exists: true },
        });
      });

      it('should respect custom limit and offset', async () => {
        // Arrange
        mockGetReq.query = {
          limit: '10',
          offset: '5',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(50);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(mockQuery.skip).toHaveBeenCalledWith(5);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            checkIns: [],
            pagination: {
              total: 50,
              limit: 10,
              offset: 5,
              hasMore: true,
            },
          },
        });
      });

      it('should enforce max limit of 100', async () => {
        // Arrange
        mockGetReq.query = {
          limit: '500',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockQuery.limit).toHaveBeenCalledWith(100);
      });

      it('should apply ascending sort order', async () => {
        // Arrange
        mockGetReq.query = {
          sortOrder: 'asc',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: 'asc' });
      });

      it('should handle complex query with multiple filters', async () => {
        // Arrange
        mockGetReq.query = {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
          activity: ['walking', 'running'],
          trigger: 'stress',
          flaggedForDoctor: 'false',
          limit: '50',
          offset: '10',
          sortOrder: 'asc',
        };

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(100);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          timestamp: {
            $gte: new Date('2024-01-01T00:00:00Z'),
            $lte: new Date('2024-01-31T23:59:59Z'),
          },
          'structured.activities': { $in: ['walking', 'running'] },
          'structured.triggers': { $in: ['stress'] },
          flaggedForDoctor: false,
        });
        expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: 'asc' });
        expect(mockQuery.limit).toHaveBeenCalledWith(50);
        expect(mockQuery.skip).toHaveBeenCalledWith(10);
      });

      it('should handle empty results', async () => {
        // Arrange
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            checkIns: [],
            pagination: {
              total: 0,
              limit: 20,
              offset: 0,
              hasMore: false,
            },
          },
        });
      });
    });

    describe('Database Errors', () => {
      it('should handle database query errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(dbError),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockResolvedValue(0);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should handle count query errors', async () => {
        // Arrange
        const dbError = new Error('Count query failed');

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);
        (CheckIn.countDocuments as jest.Mock).mockRejectedValue(dbError);

        // Act
        await getCheckins(mockGetReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('getStatus', () => {
    let mockStatusReq: Partial<Request>;

    beforeEach(() => {
      mockStatusReq = {
        user: {
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
        },
      };
    });

    describe('Success Cases', () => {
      it('should return status with no check-ins today', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: ['08:00', '14:00', '20:00'],
        };

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(CheckIn.find).toHaveBeenCalledWith({
          userId: '507f1f77bcf86cd799439011',
          timestamp: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        const response = (mockRes.json as jest.Mock).mock.calls[0][0];
        expect(response).toMatchObject({
          success: true,
          data: {
            today: {
              date: expect.any(String),
              scheduledTimes: ['08:00', '14:00', '20:00'],
              completedLogs: [],
              nextSuggested: expect.any(String), // Will depend on current time
              isComplete: false,
            },
            stats: {
              todayCount: 0,
              scheduledCount: 3,
            },
          },
        });
      });

      it('should return status with check-ins completed', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: ['08:00', '14:00', '20:00'],
        };

        const mockCheckIns = [
          {
            _id: '507f191e810c19729de860ea',
            timestamp: new Date('2025-11-22T08:15:00Z'),
          },
          {
            _id: '507f191e810c19729de860eb',
            timestamp: new Date('2025-11-22T14:30:00Z'),
          },
        ];

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCheckIns),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        const response = (mockRes.json as jest.Mock).mock.calls[0][0];
        expect(response).toMatchObject({
          success: true,
          data: {
            today: {
              date: expect.any(String),
              scheduledTimes: ['08:00', '14:00', '20:00'],
              completedLogs: expect.arrayContaining([
                expect.objectContaining({
                  checkInId: '507f191e810c19729de860ea',
                }),
                expect.objectContaining({
                  checkInId: '507f191e810c19729de860eb',
                }),
              ]),
              nextSuggested: expect.any(String),
              isComplete: false,
            },
            stats: {
              todayCount: 2,
              scheduledCount: 3,
            },
          },
        });
      });

      it('should return status when all scheduled times completed', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: ['08:00', '14:00', '20:00'],
        };

        const mockCheckIns = [
          {
            _id: '507f191e810c19729de860ea',
            timestamp: new Date('2025-11-22T08:15:00Z'),
          },
          {
            _id: '507f191e810c19729de860eb',
            timestamp: new Date('2025-11-22T14:30:00Z'),
          },
          {
            _id: '507f191e810c19729de860ec',
            timestamp: new Date('2025-11-22T20:45:00Z'),
          },
        ];

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCheckIns),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        const response = (mockRes.json as jest.Mock).mock.calls[0][0];
        expect(response).toMatchObject({
          success: true,
          data: {
            today: {
              date: expect.any(String),
              scheduledTimes: ['08:00', '14:00', '20:00'],
              completedLogs: expect.any(Array),
              nextSuggested: expect.any(String), // Could be tomorrow's first time or null
              isComplete: true,
            },
            stats: {
              todayCount: 3,
              scheduledCount: 3,
            },
          },
        });
        expect(response.data.today.completedLogs).toHaveLength(3);
      });

      it('should handle user with no notification times', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: [],
        };

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: {
            today: {
              date: expect.any(String), // Don't rely on exact date
              scheduledTimes: [],
              completedLogs: [],
              nextSuggested: null,
              isComplete: false,
            },
            stats: {
              todayCount: 0,
              scheduledCount: 0,
            },
          },
        });
      });

      it('should handle more check-ins than scheduled times', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: ['08:00', '14:00'],
        };

        const mockCheckIns = [
          {
            _id: '507f191e810c19729de860ea',
            timestamp: new Date('2025-11-22T08:15:00Z'),
          },
          {
            _id: '507f191e810c19729de860eb',
            timestamp: new Date('2025-11-22T14:30:00Z'),
          },
          {
            _id: '507f191e810c19729de860ec',
            timestamp: new Date('2025-11-22T16:00:00Z'),
          },
        ];

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCheckIns),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        const response = (mockRes.json as jest.Mock).mock.calls[0][0];
        expect(response).toMatchObject({
          success: true,
          data: {
            today: {
              isComplete: true,
            },
            stats: {
              todayCount: 3,
              scheduledCount: 2,
            },
          },
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 404 if user not found', async () => {
        // Arrange
        (User.findById as jest.Mock).mockResolvedValue(null);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'User not found',
        });
      });

      it('should handle database errors', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        (User.findById as jest.Mock).mockRejectedValue(dbError);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('should handle check-in query errors', async () => {
        // Arrange
        const mockUser = {
          _id: '507f1f77bcf86cd799439011',
          notificationTimes: ['08:00', '14:00', '20:00'],
        };

        (User.findById as jest.Mock).mockResolvedValue(mockUser);

        const dbError = new Error('CheckIn query failed');
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(dbError),
        };

        (CheckIn.find as jest.Mock).mockReturnValue(mockQuery);

        // Act
        await getStatus(mockStatusReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockRes.status).not.toHaveBeenCalled();
      });
    });
  });
});
