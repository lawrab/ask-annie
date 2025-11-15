/**
 * TypeScript type augmentation for Express Request
 * Adds user property populated by authentication middleware
 */

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
    }
  }
}

export {};
