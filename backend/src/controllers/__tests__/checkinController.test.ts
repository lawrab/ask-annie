import { Request, Response, NextFunction } from 'express';
import { createVoiceCheckin, createManualCheckin } from '../checkinController';
import CheckIn from '../../models/CheckIn';
import { transcribeAudio } from '../../services/transcriptionService';
import { parseSymptoms } from '../../services/parsingService';
import fs from 'fs/promises';

// Mock dependencies
jest.mock('../../models/CheckIn');
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
      body: {
        userId: '507f1f77bcf86cd799439011',
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
            id: mockCheckIn._id,
            timestamp: mockCheckIn.timestamp,
            rawTranscript: mockTranscript,
            structured: mockParsed,
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
              structured: expect.objectContaining({
                activities: ['walking'],
                triggers: ['stress'],
              }),
            }),
          })
        );
      });

      it('should use default userId when not provided', async () => {
        // Arrange
        mockReq.body = {}; // No userId provided

        const mockTranscript = 'Test transcript';
        const mockParsed = {
          symptoms: {},
          activities: [],
          triggers: [],
          notes: mockTranscript,
        };
        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          userId: '000000000000000000000000', // Default userId
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
        expect(CheckIn).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: '000000000000000000000000',
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
              rawTranscript: '',
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
              structured: expect.objectContaining({
                symptoms: {},
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
            userId: '507f1f77bcf86cd799439011',
            structured: mockStructured,
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
            id: mockCheckIn._id,
            timestamp: mockCheckIn.timestamp,
            rawTranscript: 'manual entry',
            structured: mockStructured,
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
              structured: expect.objectContaining({
                symptoms: {},
                activities: ['yoga'],
                triggers: ['stress'],
              }),
            }),
          })
        );
      });

      it('should use default userId when not provided', async () => {
        // Arrange
        const mockStructured = {
          symptoms: { energy: 'high' },
          activities: [],
          triggers: [],
          notes: '',
        };

        mockReq = {
          body: {
            structured: mockStructured,
          },
        };

        const mockCheckIn = {
          _id: '507f191e810c19729de860ea',
          userId: '000000000000000000000000',
          timestamp: new Date(),
          rawTranscript: 'manual entry',
          structured: mockStructured,
          save: jest.fn().mockResolvedValue(true),
        };

        (CheckIn as any).mockImplementation(() => mockCheckIn);

        // Act
        await createManualCheckin(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(CheckIn).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: '000000000000000000000000',
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
              structured: expect.objectContaining({
                symptoms: {
                  hand_grip: 'good',
                  pain_level: 3,
                  raynauds_event: true,
                },
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
              structured: mockStructured,
            }),
          })
        );
      });
    });
  });
});
