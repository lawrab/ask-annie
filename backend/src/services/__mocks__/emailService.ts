/**
 * Mock implementation of emailService for testing
 */

export interface MagicLinkEmailOptions {
  email: string;
  token: string;
  expiryMinutes?: number;
}

export const sendMagicLinkEmail = jest.fn().mockResolvedValue(undefined);
