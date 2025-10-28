import { Request } from 'express';
import { audioUpload } from '../upload';
import path from 'path';

describe('Upload Middleware', () => {
  describe('Multer Configuration', () => {
    it('should have correct storage configuration', () => {
      expect(audioUpload).toBeDefined();
      expect(typeof audioUpload.single).toBe('function');
    });

    it('should have correct file size limit', () => {
      const limits = (audioUpload as any).limits;
      expect(limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
    });
  });

  describe('File Filter', () => {
    let mockReq: Partial<Request>;
    let mockFile: Express.Multer.File;

    beforeEach(() => {
      mockReq = {};
      mockFile = {
        fieldname: 'audio',
        originalname: 'test.webm',
        encoding: '7bit',
        mimetype: 'audio/webm',
        size: 1000,
        destination: '/tmp',
        filename: 'test.webm',
        path: '/tmp/test.webm',
        buffer: Buffer.from(''),
        stream: {} as any,
      };
    });

    it('should accept audio/webm files', (done) => {
      mockFile.mimetype = 'audio/webm';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null, accepted: boolean) => {
        expect(error).toBeNull();
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept audio/wav files', (done) => {
      mockFile.mimetype = 'audio/wav';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null, accepted: boolean) => {
        expect(error).toBeNull();
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept audio/mpeg files', (done) => {
      mockFile.mimetype = 'audio/mpeg';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null, accepted: boolean) => {
        expect(error).toBeNull();
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should accept audio/ogg files', (done) => {
      mockFile.mimetype = 'audio/ogg';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null, accepted: boolean) => {
        expect(error).toBeNull();
        expect(accepted).toBe(true);
        done();
      });
    });

    it('should reject non-audio files (video)', (done) => {
      mockFile.mimetype = 'video/mp4';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Only audio files are allowed');
        done();
      });
    });

    it('should reject non-audio files (image)', (done) => {
      mockFile.mimetype = 'image/png';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Only audio files are allowed');
        done();
      });
    });

    it('should reject non-audio files (text)', (done) => {
      mockFile.mimetype = 'text/plain';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Only audio files are allowed');
        done();
      });
    });

    it('should reject application files', (done) => {
      mockFile.mimetype = 'application/pdf';

      const fileFilter = (audioUpload as any).fileFilter;
      fileFilter(mockReq, mockFile, (error: Error | null) => {
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Only audio files are allowed');
        done();
      });
    });
  });

  describe('Storage Configuration', () => {
    let mockReq: Partial<Request>;
    let mockFile: Express.Multer.File;

    beforeEach(() => {
      mockReq = {};
      mockFile = {
        fieldname: 'audio',
        originalname: 'test.webm',
        encoding: '7bit',
        mimetype: 'audio/webm',
        size: 1000,
        destination: '/tmp',
        filename: 'test.webm',
        path: '/tmp/test.webm',
        buffer: Buffer.from(''),
        stream: {} as any,
      };
    });

    it('should use /tmp as destination', (done) => {
      const storage = (audioUpload as any).storage;
      storage.getDestination(mockReq, mockFile, (error: Error | null, destination: string) => {
        expect(error).toBeNull();
        expect(destination).toBe('/tmp');
        done();
      });
    });

    it('should generate unique filename with timestamp', (done) => {
      mockFile.originalname = 'test-audio.webm';

      const storage = (audioUpload as any).storage;
      const beforeTimestamp = Date.now();

      storage.getFilename(mockReq, mockFile, (error: Error | null, filename: string) => {
        const afterTimestamp = Date.now();

        expect(error).toBeNull();
        expect(filename).toMatch(/^audio-\d+-\d+\.webm$/);
        expect(filename).toContain('.webm');

        // Extract timestamp from filename
        const match = filename.match(/^audio-(\d+)-/);
        expect(match).not.toBeNull();
        if (match) {
          const timestamp = parseInt(match[1], 10);
          expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
          expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
        }

        done();
      });
    });

    it('should preserve file extension', (done) => {
      mockFile.originalname = 'recording.mp3';

      const storage = (audioUpload as any).storage;
      storage.getFilename(mockReq, mockFile, (error: Error | null, filename: string) => {
        expect(error).toBeNull();
        expect(filename).toMatch(/^audio-\d+-\d+\.mp3$/);
        expect(path.extname(filename)).toBe('.mp3');
        done();
      });
    });

    it('should handle files without extension', (done) => {
      mockFile.originalname = 'audiofile';

      const storage = (audioUpload as any).storage;
      storage.getFilename(mockReq, mockFile, (error: Error | null, filename: string) => {
        expect(error).toBeNull();
        expect(filename).toMatch(/^audio-\d+-\d+$/);
        done();
      });
    });

    it('should handle files with multiple dots', (done) => {
      mockFile.originalname = 'my.audio.file.wav';

      const storage = (audioUpload as any).storage;
      storage.getFilename(mockReq, mockFile, (error: Error | null, filename: string) => {
        expect(error).toBeNull();
        expect(filename).toMatch(/^audio-\d+-\d+\.wav$/);
        expect(path.extname(filename)).toBe('.wav');
        done();
      });
    });
  });
});
