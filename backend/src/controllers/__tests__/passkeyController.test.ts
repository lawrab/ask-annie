import { Request, Response, NextFunction } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  listPasskeys,
  deletePasskey,
  updatePasskey,
} from '../passkeyController';
import User from '../../models/User';
import Passkey from '../../models/Passkey';
import WebAuthnChallenge from '../../models/WebAuthnChallenge';
import * as webauthnService from '../../services/webauthnService';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/Passkey');
jest.mock('../../models/WebAuthnChallenge');
jest.mock('../../services/webauthnService');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
}));

describe('Passkey Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 'user123' } as any,
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('generateRegistrationOptions', () => {
    it('should generate registration options successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      const mockPasskeys = [
        {
          credentialId: 'existing-cred-id',
          transports: ['internal'],
        },
      ];

      const mockOptions = {
        challenge: 'mock-challenge',
        rp: { name: "Annie's Health Journal", id: 'localhost' },
        user: {
          id: 'user123',
          name: 'test@example.com',
          displayName: 'testuser',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 300000,
        excludeCredentials: [
          {
            id: 'existing-cred-id',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Passkey.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPasskeys),
      });
      (webauthnService.generatePasskeyRegistrationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );
      (WebAuthnChallenge.create as jest.Mock).mockResolvedValue({});

      await generateRegistrationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(Passkey.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(webauthnService.generatePasskeyRegistrationOptions).toHaveBeenCalledWith({
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        existingCredentials: mockPasskeys,
      });
      expect(WebAuthnChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          challenge: 'mock-challenge',
          type: 'registration',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOptions,
      });
    });

    it('should return 404 if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await generateRegistrationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (User.findById as jest.Mock).mockRejectedValue(error);

      await generateRegistrationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyRegistration', () => {
    it('should verify registration successfully', async () => {
      mockReq.body = {
        response: {
          id: 'new-cred-id',
          response: {
            transports: ['internal', 'hybrid'],
          },
        },
        deviceName: 'iPhone 15',
      };

      const mockChallenge = {
        _id: 'challenge123',
        challenge: 'mock-challenge',
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-cred-id',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
          },
        },
      };

      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenge),
      });
      (webauthnService.verifyPasskeyRegistration as jest.Mock).mockResolvedValue(mockVerification);
      (Passkey.create as jest.Mock).mockResolvedValue({});
      (WebAuthnChallenge.deleteOne as jest.Mock).mockResolvedValue({});

      await verifyRegistration(mockReq as Request, mockRes as Response, mockNext);

      expect(WebAuthnChallenge.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'registration',
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(webauthnService.verifyPasskeyRegistration).toHaveBeenCalledWith({
        response: mockReq.body.response,
        expectedChallenge: 'mock-challenge',
      });
      expect(Passkey.create).toHaveBeenCalledWith({
        userId: 'user123',
        credentialId: 'new-cred-id',
        publicKey: expect.any(Buffer),
        counter: 0,
        transports: ['internal', 'hybrid'],
        deviceName: 'iPhone 15',
        lastUsedAt: expect.any(Date),
      });
      expect(WebAuthnChallenge.deleteOne).toHaveBeenCalledWith({ _id: 'challenge123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey registered successfully',
      });
    });

    it('should return 400 if response is missing', async () => {
      mockReq.body = {};

      await verifyRegistration(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Registration response is required',
      });
    });

    it('should return 400 if no valid challenge found', async () => {
      mockReq.body = { response: { id: 'cred-id' } };

      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      await verifyRegistration(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired registration challenge. Please start over.',
      });
    });

    it('should return 400 if verification fails', async () => {
      mockReq.body = { response: { id: 'cred-id' } };

      const mockChallenge = {
        _id: 'challenge123',
        challenge: 'mock-challenge',
      };

      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenge),
      });
      (webauthnService.verifyPasskeyRegistration as jest.Mock).mockResolvedValue({
        verified: false,
      });

      await verifyRegistration(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Registration verification failed',
      });
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('should generate authentication options successfully', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const mockPasskeys = [
        {
          credentialId: 'cred-id-1',
          transports: ['internal'],
        },
      ];

      const mockOptions = {
        challenge: 'auth-challenge',
        timeout: 300000,
        allowCredentials: [
          {
            id: 'cred-id-1',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Passkey.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPasskeys),
      });
      (webauthnService.generatePasskeyAuthenticationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );
      (WebAuthnChallenge.create as jest.Mock).mockResolvedValue({});

      await generateAuthenticationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(Passkey.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(webauthnService.generatePasskeyAuthenticationOptions).toHaveBeenCalledWith({
        credentials: mockPasskeys,
      });
      expect(WebAuthnChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
          challenge: 'auth-challenge',
          type: 'authentication',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOptions,
      });
    });

    it('should return 400 if email is missing', async () => {
      mockReq.body = {};

      await generateAuthenticationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      });
    });

    it('should return null data if user not found', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await generateAuthenticationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'No passkeys found for this email',
      });
    });

    it('should return null data if no passkeys registered', async () => {
      mockReq.body = { email: 'test@example.com' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Passkey.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await generateAuthenticationOptions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'No passkeys found for this email',
      });
    });
  });

  describe('verifyAuthentication', () => {
    it('should verify authentication successfully and return JWT', async () => {
      mockReq.body = {
        response: { id: 'cred-id-1' },
        email: 'test@example.com',
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: [],
        notificationsEnabled: true,
        createdAt: new Date(),
      };

      const mockChallenge = {
        _id: 'challenge123',
        challenge: 'auth-challenge',
      };

      const mockPasskey = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 0,
        transports: ['internal'],
        save: jest.fn().mockResolvedValue({}),
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 1,
        },
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenge),
      });
      (Passkey.findOne as jest.Mock).mockResolvedValue(mockPasskey);
      (webauthnService.verifyPasskeyAuthentication as jest.Mock).mockResolvedValue(
        mockVerification
      );
      (WebAuthnChallenge.deleteOne as jest.Mock).mockResolvedValue({});

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(WebAuthnChallenge.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'authentication',
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(Passkey.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        credentialId: 'cred-id-1',
      });
      expect(webauthnService.verifyPasskeyAuthentication).toHaveBeenCalled();
      expect(mockPasskey.counter).toBe(1);
      expect(mockPasskey.save).toHaveBeenCalled();
      expect(WebAuthnChallenge.deleteOne).toHaveBeenCalledWith({ _id: 'challenge123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com',
          }),
          token: 'mock-jwt-token',
        },
      });
    });

    it('should return 400 if response or email is missing', async () => {
      mockReq.body = { response: {} };

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Response and email are required',
      });
    });

    it('should return 401 if user not found', async () => {
      mockReq.body = {
        response: { id: 'cred-id' },
        email: 'nonexistent@example.com',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
      });
    });

    it('should return 400 if no valid challenge found', async () => {
      mockReq.body = {
        response: { id: 'cred-id' },
        email: 'test@example.com',
      };

      const mockUser = { _id: 'user123', email: 'test@example.com' };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired authentication challenge. Please start over.',
      });
    });

    it('should return 401 if passkey not found', async () => {
      mockReq.body = {
        response: { id: 'unknown-cred-id' },
        email: 'test@example.com',
      };

      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const mockChallenge = { _id: 'challenge123', challenge: 'auth-challenge' };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenge),
      });
      (Passkey.findOne as jest.Mock).mockResolvedValue(null);

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
      });
    });

    it('should return 401 if verification fails', async () => {
      mockReq.body = {
        response: { id: 'cred-id-1' },
        email: 'test@example.com',
      };

      const mockUser = { _id: 'user123', email: 'test@example.com' };
      const mockChallenge = { _id: 'challenge123', challenge: 'auth-challenge' };
      const mockPasskey = { credentialId: 'cred-id-1', publicKey: Buffer.from([1, 2, 3]) };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (WebAuthnChallenge.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockChallenge),
      });
      (Passkey.findOne as jest.Mock).mockResolvedValue(mockPasskey);
      (webauthnService.verifyPasskeyAuthentication as jest.Mock).mockResolvedValue({
        verified: false,
      });

      await verifyAuthentication(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication failed',
      });
    });
  });

  describe('listPasskeys', () => {
    it('should list all passkeys for authenticated user', async () => {
      const mockPasskeys = [
        {
          _id: 'passkey1',
          credentialId: 'cred-id-1',
          deviceName: 'iPhone 15',
          lastUsedAt: new Date('2024-06-15'),
          createdAt: new Date('2024-06-01'),
          transports: ['internal', 'hybrid'],
        },
        {
          _id: 'passkey2',
          credentialId: 'cred-id-2',
          deviceName: null,
          lastUsedAt: new Date('2024-06-14'),
          createdAt: new Date('2024-05-01'),
          transports: ['usb'],
        },
      ];

      (Passkey.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockPasskeys),
          }),
        }),
      });

      await listPasskeys(mockReq as Request, mockRes as Response, mockNext);

      expect(Passkey.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            id: 'passkey1',
            credentialId: 'cred-id-1',
            deviceName: 'iPhone 15',
            lastUsedAt: expect.any(Date),
            createdAt: expect.any(Date),
            transports: ['internal', 'hybrid'],
          },
          {
            id: 'passkey2',
            credentialId: 'cred-id-2',
            deviceName: 'Unnamed Device',
            lastUsedAt: expect.any(Date),
            createdAt: expect.any(Date),
            transports: ['usb'],
          },
        ],
      });
    });

    it('should return empty array if no passkeys found', async () => {
      (Passkey.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await listPasskeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (Passkey.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      await listPasskeys(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePasskey', () => {
    it('should delete passkey successfully', async () => {
      mockReq.params = { id: 'passkey123' };

      const mockPasskey = {
        _id: 'passkey123',
        credentialId: 'cred-id-1',
      };

      (Passkey.findOneAndDelete as jest.Mock).mockResolvedValue(mockPasskey);

      await deletePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(Passkey.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'passkey123',
        userId: 'user123',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Passkey deleted successfully',
      });
    });

    it('should return 400 if id is missing', async () => {
      mockReq.params = {};

      await deletePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Passkey ID is required',
      });
    });

    it('should return 404 if passkey not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      (Passkey.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deletePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Passkey not found',
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'passkey123' };
      const error = new Error('Database error');

      (Passkey.findOneAndDelete as jest.Mock).mockRejectedValue(error);

      await deletePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updatePasskey', () => {
    it('should update passkey device name successfully', async () => {
      mockReq.params = { id: 'passkey123' };
      mockReq.body = { deviceName: 'MacBook Pro' };

      const mockPasskey = {
        _id: 'passkey123',
        credentialId: 'cred-id-1',
        deviceName: 'MacBook Pro',
        lastUsedAt: new Date(),
        createdAt: new Date(),
        transports: ['usb'],
      };

      (Passkey.findOneAndUpdate as jest.Mock).mockResolvedValue(mockPasskey);

      await updatePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(Passkey.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'passkey123', userId: 'user123' },
        { deviceName: 'MacBook Pro' },
        { new: true, runValidators: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'passkey123',
          credentialId: 'cred-id-1',
          deviceName: 'MacBook Pro',
          lastUsedAt: expect.any(Date),
          createdAt: expect.any(Date),
          transports: ['usb'],
        },
      });
    });

    it('should return 400 if id is missing', async () => {
      mockReq.params = {};
      mockReq.body = { deviceName: 'Device' };

      await updatePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Passkey ID is required',
      });
    });

    it('should return 400 if deviceName is missing', async () => {
      mockReq.params = { id: 'passkey123' };
      mockReq.body = {};

      await updatePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Device name is required',
      });
    });

    it('should return 404 if passkey not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { deviceName: 'Device' };

      (Passkey.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await updatePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Passkey not found',
      });
    });

    it('should handle errors', async () => {
      mockReq.params = { id: 'passkey123' };
      mockReq.body = { deviceName: 'Device' };
      const error = new Error('Database error');

      (Passkey.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      await updatePasskey(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
