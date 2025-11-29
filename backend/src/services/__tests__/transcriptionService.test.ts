import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { transcribeAudio, cleanupAudioFile, checkWhisperHealth } from '../transcriptionService';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TranscriptionService', () => {
  const testAudioPath = path.join(__dirname, 'test-audio.wav');

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock audio file for testing
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, 'mock audio data');
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testAudioPath)) {
      fs.unlinkSync(testAudioPath);
    }
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio file', async () => {
      const mockResponse = {
        data: {
          text: 'This is a test transcription',
          language: 'en',
          duration: 5.2,
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await transcribeAudio(testAudioPath);

      expect(result.text).toBe('This is a test transcription');
      expect(result.language).toBe('en');
      expect(result.duration).toBe(5.2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/audio/transcriptions'),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.any(Object),
          timeout: 60000,
        })
      );
    });

    it('should transcribe with specified language', async () => {
      const mockResponse = {
        data: {
          text: 'Hola, este es una prueba',
          language: 'es',
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await transcribeAudio(testAudioPath, 'es');

      expect(result.text).toBe('Hola, este es una prueba');
      expect(result.language).toBe('es');
    });

    it('should handle empty transcription text', async () => {
      const mockResponse = {
        data: {
          text: '',
        },
        status: 200,
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await transcribeAudio(testAudioPath);

      expect(result.text).toBe('');
    });

    it('should throw error if file does not exist', async () => {
      const nonExistentPath = '/path/to/nonexistent/file.wav';

      await expect(transcribeAudio(nonExistentPath)).rejects.toThrow();
    });

    it('should handle axios errors with response', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: 'Invalid audio format',
          },
        },
        message: 'Request failed with status code 400',
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(transcribeAudio(testAudioPath)).rejects.toThrow(
        'Transcription failed: Invalid audio format'
      );
    });

    it('should handle axios errors without response data', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
        },
        message: 'Network error',
      };

      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(transcribeAudio(testAudioPath)).rejects.toThrow(
        'Transcription failed: Network error'
      );
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Unknown error');

      mockedAxios.post.mockRejectedValueOnce(mockError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(transcribeAudio(testAudioPath)).rejects.toThrow(
        'Failed to transcribe audio file'
      );
    });

    it('should use correct timeout', async () => {
      const mockResponse = {
        data: { text: 'Test' },
        status: 200,
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await transcribeAudio(testAudioPath);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('cleanupAudioFile', () => {
    it('should successfully delete audio file', async () => {
      const tempFile = path.join(__dirname, 'temp-audio.wav');
      fs.writeFileSync(tempFile, 'temp data');

      await cleanupAudioFile(tempFile);

      expect(fs.existsSync(tempFile)).toBe(false);
    });

    it('should not throw error if file does not exist', async () => {
      const nonExistentPath = '/path/to/nonexistent/file.wav';

      await expect(cleanupAudioFile(nonExistentPath)).resolves.not.toThrow();
    });

    it('should handle permission errors gracefully', async () => {
      // This test simulates a permission error by mocking fs.promises.unlink
      jest
        .spyOn(fs.promises, 'unlink')
        .mockRejectedValueOnce(new Error('EACCES: permission denied'));

      await expect(cleanupAudioFile(testAudioPath)).resolves.not.toThrow();
    });
  });

  describe('checkWhisperHealth', () => {
    it('should return true when service is healthy', async () => {
      const mockResponse = {
        status: 200,
        data: { status: 'ok' },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await checkWhisperHealth();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should return false when service returns non-200 status', async () => {
      const mockResponse = {
        status: 500,
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await checkWhisperHealth();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkWhisperHealth();

      expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('timeout'));

      const result = await checkWhisperHealth();

      expect(result).toBe(false);
    });

    it('should use correct timeout for health check', async () => {
      const mockResponse = {
        status: 200,
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await checkWhisperHealth();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });

  describe('OpenAI Whisper API mode', () => {
    const originalEnv = process.env.OPENAI_API_KEY;

    afterAll(() => {
      // Restore original environment
      process.env.OPENAI_API_KEY = originalEnv;
      jest.resetModules();
      jest.unmock('openai');
    });

    beforeEach(() => {
      jest.clearAllMocks();

      // Create a mock audio file for testing
      if (!fs.existsSync(testAudioPath)) {
        fs.writeFileSync(testAudioPath, 'mock audio data');
      }
    });

    it('should use OpenAI API when OPENAI_API_KEY is set', async () => {
      const mockTranscription = {
        text: 'OpenAI transcription result',
        language: 'en',
        duration: 10.5,
      };

      const mockCreate = jest.fn().mockResolvedValueOnce(mockTranscription);

      // Setup dynamic mock before requiring module
      jest.resetModules();
      process.env.OPENAI_API_KEY = 'test-api-key';

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          audio: {
            transcriptions: {
              create: mockCreate,
            },
          },
        }));
      });

      // Mock fs.createReadStream to avoid file read errors
      const mockStream = { pipe: jest.fn(), on: jest.fn() };

      jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(mockStream as any);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { transcribeAudio: transcribeWithOpenAI } = require('../transcriptionService');

      const result = await transcribeWithOpenAI(testAudioPath);

      expect(result.text).toBe('OpenAI transcription result');
      expect(result.language).toBe('en');
      expect(result.duration).toBe(10.5);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'whisper-1',
          response_format: 'verbose_json',
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      const mockCreate = jest.fn().mockRejectedValueOnce(new Error('OpenAI API error'));

      jest.resetModules();
      process.env.OPENAI_API_KEY = 'test-api-key';

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          audio: {
            transcriptions: {
              create: mockCreate,
            },
          },
        }));
      });

      // Mock fs.createReadStream to avoid file read errors
      const mockStream = { pipe: jest.fn(), on: jest.fn() };

      jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(mockStream as any);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { transcribeAudio: transcribeWithOpenAI } = require('../transcriptionService');

      await expect(transcribeWithOpenAI(testAudioPath)).rejects.toThrow(
        'OpenAI transcription failed'
      );
    });

    it('should pass language parameter to OpenAI API', async () => {
      const mockTranscription = {
        text: 'Hola mundo',
        language: 'es',
        duration: 5.0,
      };

      const mockCreate = jest.fn().mockResolvedValueOnce(mockTranscription);

      jest.resetModules();
      process.env.OPENAI_API_KEY = 'test-api-key';

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          audio: {
            transcriptions: {
              create: mockCreate,
            },
          },
        }));
      });

      // Mock fs.createReadStream to avoid file read errors
      const mockStream = { pipe: jest.fn(), on: jest.fn() };

      jest.spyOn(fs, 'createReadStream').mockReturnValueOnce(mockStream as any);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { transcribeAudio: transcribeWithOpenAI } = require('../transcriptionService');

      await transcribeWithOpenAI(testAudioPath, 'es');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'es',
          model: 'whisper-1',
        })
      );
    });

    it('should return true for health check when using OpenAI', async () => {
      jest.resetModules();
      process.env.OPENAI_API_KEY = 'test-api-key';

      jest.doMock('openai', () => {
        return jest.fn().mockImplementation(() => ({
          audio: {
            transcriptions: {
              create: jest.fn(),
            },
          },
        }));
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { checkWhisperHealth: checkOpenAIHealth } = require('../transcriptionService');

      const result = await checkOpenAIHealth();

      expect(result).toBe(true);
    });
  });
});
