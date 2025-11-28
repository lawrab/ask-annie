import { logger } from '../../utils/logger';

// Set environment variable before importing emailService
process.env.RESEND_API_KEY = 'test_api_key';

// Mock Resend before importing emailService
const mockSend = jest.fn();
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

jest.mock('../../utils/logger');

// Now import the emailService after mocks are set up
import { sendMagicLinkEmail, MagicLinkEmailOptions } from '../emailService';

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMagicLinkEmail', () => {
    const validOptions: MagicLinkEmailOptions = {
      email: 'test@example.com',
      token: 'a'.repeat(64),
      expiryMinutes: 15,
    };

    describe('Success Cases', () => {
      it('should successfully send magic link email', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail(validOptions);

        expect(mockSend).toHaveBeenCalledWith({
          from: expect.any(String),
          to: 'test@example.com',
          subject: expect.stringContaining("Log in to Annie's Health Journal"),
          html: expect.stringContaining('a'.repeat(64)),
          text: expect.stringContaining('a'.repeat(64)),
        });
        expect(logger.info).toHaveBeenCalledWith('Sending magic link email', {
          email: 'test@example.com',
          expiryMinutes: 15,
        });
        expect(logger.info).toHaveBeenCalledWith('Magic link email sent successfully', {
          email: 'test@example.com',
          emailId: 'email-123',
        });
      });

      it('should use default expiry time if not provided', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail({
          email: 'test@example.com',
          token: 'a'.repeat(64),
        });

        expect(logger.info).toHaveBeenCalledWith('Sending magic link email', {
          email: 'test@example.com',
          expiryMinutes: 15,
        });
      });

      it('should include magic link in email HTML', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail(validOptions);

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.html).toContain('auth/magic-link?token=');
        expect(callArgs.html).toContain('a'.repeat(64));
        expect(callArgs.html).toContain('15 minutes');
      });

      it('should include magic link in email text', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail(validOptions);

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.text).toContain('auth/magic-link?token=');
        expect(callArgs.text).toContain('a'.repeat(64));
        expect(callArgs.text).toContain('15 minutes');
      });

      it('should include branding in email', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail(validOptions);

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.html).toContain("Annie's Health Journal");
        expect(callArgs.text).toContain("Annie's Health Journal");
      });
    });

    describe('Error Cases', () => {
      it('should throw error when Resend returns error', async () => {
        mockSend.mockResolvedValue({
          data: null,
          error: { message: 'Invalid API key' },
        });

        await expect(sendMagicLinkEmail(validOptions)).rejects.toThrow(
          'Failed to send email: Invalid API key'
        );

        expect(logger.error).toHaveBeenCalledWith('Failed to send magic link email', {
          error: { message: 'Invalid API key' },
          email: 'test@example.com',
        });
        expect(logger.error).toHaveBeenCalledWith('Error sending magic link email', {
          error: expect.any(Error),
          email: 'test@example.com',
        });
      });

      it('should throw error when Resend rejects', async () => {
        const networkError = new Error('Network error');
        mockSend.mockRejectedValue(networkError);

        await expect(sendMagicLinkEmail(validOptions)).rejects.toThrow('Network error');

        expect(logger.error).toHaveBeenCalledWith('Error sending magic link email', {
          error: networkError,
          email: 'test@example.com',
        });
      });

      it('should log error details', async () => {
        const error = new Error('SMTP connection failed');
        mockSend.mockRejectedValue(error);

        await expect(sendMagicLinkEmail(validOptions)).rejects.toThrow('SMTP connection failed');

        expect(logger.error).toHaveBeenCalledWith('Error sending magic link email', {
          error,
          email: 'test@example.com',
        });
      });
    });

    describe('Email Content', () => {
      it('should format HTML email correctly', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail({
          email: 'test@example.com',
          token: 'mytoken123',
          expiryMinutes: 30,
        });

        const callArgs = mockSend.mock.calls[0][0];
        const html = callArgs.html;

        // Check HTML structure
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html>');
        expect(html).toContain('</html>');

        // Check content
        expect(html).toContain('mytoken123');
        expect(html).toContain('30 minutes');
        expect(html).toContain('Log In');

        // Check styling
        expect(html).toContain('background-color');
        expect(html).toContain('#ec4899'); // primary color
      });

      it('should format text email correctly', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'email-123' },
          error: null,
        });

        await sendMagicLinkEmail({
          email: 'test@example.com',
          token: 'mytoken456',
          expiryMinutes: 20,
        });

        const callArgs = mockSend.mock.calls[0][0];
        const text = callArgs.text;

        // Check text content
        expect(text).toContain('mytoken456');
        expect(text).toContain('20 minutes');
        expect(text).toContain("Annie's Health Journal");
        expect(text).toContain('Your daily health companion');
      });
    });
  });
});
