import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '../webauthnService';
import * as SimpleWebAuthnServer from '@simplewebauthn/server';
import type { IPasskey } from '../../models/Passkey';

// Mock SimpleWebAuthn server functions
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

describe('WebAuthn Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePasskeyRegistrationOptions', () => {
    it('should generate registration options with correct parameters', async () => {
      const params = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        existingCredentials: [] as IPasskey[],
      };

      const mockOptions = {
        challenge: 'mock-challenge-string',
        rp: {
          name: "Annie's Health Journal",
          id: 'localhost',
        },
        user: {
          id: 'user123',
          name: 'test@example.com',
          displayName: 'testuser',
        },
        pubKeyCredParams: [
          { type: 'public-key' as const, alg: -7 },
          { type: 'public-key' as const, alg: -257 },
        ],
        timeout: 300000,
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: 'preferred' as const,
          userVerification: 'preferred' as const,
        },
      };

      (SimpleWebAuthnServer.generateRegistrationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );

      const result = await generatePasskeyRegistrationOptions(params);

      expect(SimpleWebAuthnServer.generateRegistrationOptions).toHaveBeenCalledWith({
        rpName: "Annie's Health Journal",
        rpID: 'localhost',
        userName: 'test@example.com',
        userDisplayName: 'testuser',
        timeout: 300000,
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257],
      });
      expect(result).toEqual(mockOptions);
    });

    it('should exclude existing credentials from registration', async () => {
      const existingCredentials = [
        {
          credentialId: 'cred-id-1',
          transports: ['internal', 'hybrid'],
        },
        {
          credentialId: 'cred-id-2',
          transports: ['usb'],
        },
      ] as unknown as IPasskey[];

      const params = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        existingCredentials,
      };

      const mockOptions = {
        challenge: 'mock-challenge',
        excludeCredentials: [
          { id: 'cred-id-1', type: 'public-key', transports: ['internal', 'hybrid'] },
          { id: 'cred-id-2', type: 'public-key', transports: ['usb'] },
        ],
      };

      (SimpleWebAuthnServer.generateRegistrationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );

      await generatePasskeyRegistrationOptions(params);

      expect(SimpleWebAuthnServer.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [
            { id: 'cred-id-1', type: 'public-key', transports: ['internal', 'hybrid'] },
            { id: 'cred-id-2', type: 'public-key', transports: ['usb'] },
          ],
        })
      );
    });

    it('should handle errors from SimpleWebAuthn', async () => {
      const params = {
        userId: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        existingCredentials: [] as IPasskey[],
      };

      const error = new Error('SimpleWebAuthn error');
      (SimpleWebAuthnServer.generateRegistrationOptions as jest.Mock).mockRejectedValue(error);

      await expect(generatePasskeyRegistrationOptions(params)).rejects.toThrow(
        'SimpleWebAuthn error'
      );
    });
  });

  describe('verifyPasskeyRegistration', () => {
    it('should verify registration successfully', async () => {
      const params = {
        response: {
          id: 'new-credential-id',
          rawId: 'new-credential-id',
          response: {
            clientDataJSON: 'mock-client-data',
            attestationObject: 'mock-attestation',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'expected-challenge-string',
      };

      const mockVerification = {
        verified: true,
        registrationInfo: {
          fmt: 'packed' as const,
          counter: 0,
          aaguid: 'mock-aaguid',
          credential: {
            id: 'new-credential-id',
            publicKey: new Uint8Array([1, 2, 3, 4, 5]),
            counter: 0,
          },
          credentialType: 'public-key' as const,
          attestationObject: new Uint8Array([6, 7, 8]),
          userVerified: true,
          credentialDeviceType: 'singleDevice' as const,
          credentialBackedUp: false,
        },
      };

      (SimpleWebAuthnServer.verifyRegistrationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      const result = await verifyPasskeyRegistration(params);

      expect(SimpleWebAuthnServer.verifyRegistrationResponse).toHaveBeenCalledWith({
        response: params.response,
        expectedChallenge: 'expected-challenge-string',
        expectedOrigin: ['http://localhost:5173'],
        expectedRPID: 'localhost',
        requireUserVerification: true,
      });
      expect(result.verified).toBe(true);
      expect(result.registrationInfo).toBeDefined();
    });

    it('should return unverified result if verification fails', async () => {
      const params = {
        response: {
          id: 'credential-id',
          rawId: 'credential-id',
          response: {
            clientDataJSON: 'mock-client-data',
            attestationObject: 'mock-attestation',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'expected-challenge',
      };

      const mockVerification = {
        verified: false,
      };

      (SimpleWebAuthnServer.verifyRegistrationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      const result = await verifyPasskeyRegistration(params);

      expect(result.verified).toBe(false);
    });

    it('should handle errors from SimpleWebAuthn', async () => {
      const params = {
        response: {
          id: 'credential-id',
          rawId: 'credential-id',
          response: {
            clientDataJSON: 'mock-client-data',
            attestationObject: 'mock-attestation',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'expected-challenge',
      };

      const error = new Error('Verification error');
      (SimpleWebAuthnServer.verifyRegistrationResponse as jest.Mock).mockRejectedValue(error);

      await expect(verifyPasskeyRegistration(params)).rejects.toThrow('Verification error');
    });
  });

  describe('generatePasskeyAuthenticationOptions', () => {
    it('should generate authentication options with user credentials', async () => {
      const credentials = [
        {
          credentialId: 'cred-id-1',
          transports: ['internal'],
        },
        {
          credentialId: 'cred-id-2',
          transports: ['usb', 'nfc'],
        },
      ] as unknown as IPasskey[];

      const params = {
        credentials,
      };

      const mockOptions = {
        challenge: 'auth-challenge-string',
        timeout: 300000,
        rpId: 'localhost',
        allowCredentials: [
          { id: 'cred-id-1', type: 'public-key', transports: ['internal'] },
          { id: 'cred-id-2', type: 'public-key', transports: ['usb', 'nfc'] },
        ],
        userVerification: 'preferred' as const,
      };

      (SimpleWebAuthnServer.generateAuthenticationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );

      const result = await generatePasskeyAuthenticationOptions(params);

      expect(SimpleWebAuthnServer.generateAuthenticationOptions).toHaveBeenCalledWith({
        rpID: 'localhost',
        timeout: 300000,
        allowCredentials: [
          { id: 'cred-id-1', type: 'public-key', transports: ['internal'] },
          { id: 'cred-id-2', type: 'public-key', transports: ['usb', 'nfc'] },
        ],
        userVerification: 'preferred',
      });
      expect(result).toEqual(mockOptions);
    });

    it('should generate options with no credentials for new user flow', async () => {
      const params = {
        credentials: [] as IPasskey[],
      };

      const mockOptions = {
        challenge: 'auth-challenge',
        timeout: 300000,
        allowCredentials: [],
      };

      (SimpleWebAuthnServer.generateAuthenticationOptions as jest.Mock).mockResolvedValue(
        mockOptions
      );

      const result = await generatePasskeyAuthenticationOptions(params);

      expect(SimpleWebAuthnServer.generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [],
        })
      );
      expect(result.allowCredentials).toEqual([]);
    });

    it('should handle errors from SimpleWebAuthn', async () => {
      const params = {
        credentials: [] as IPasskey[],
      };

      const error = new Error('Generation error');
      (SimpleWebAuthnServer.generateAuthenticationOptions as jest.Mock).mockRejectedValue(error);

      await expect(generatePasskeyAuthenticationOptions(params)).rejects.toThrow(
        'Generation error'
      );
    });
  });

  describe('verifyPasskeyAuthentication', () => {
    it('should verify authentication successfully', async () => {
      const credential = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([1, 2, 3, 4, 5]),
        counter: 5,
        transports: ['internal'],
      } as unknown as IPasskey;

      const params = {
        response: {
          id: 'cred-id-1',
          rawId: 'cred-id-1',
          response: {
            clientDataJSON: 'mock-client-data',
            authenticatorData: 'mock-auth-data',
            signature: 'mock-signature',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'auth-challenge',
        credential,
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 6,
          userVerified: true,
          credentialDeviceType: 'singleDevice' as const,
          credentialBackedUp: false,
        },
      };

      (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      const result = await verifyPasskeyAuthentication(params);

      expect(SimpleWebAuthnServer.verifyAuthenticationResponse).toHaveBeenCalledWith({
        response: params.response,
        expectedChallenge: 'auth-challenge',
        expectedOrigin: ['http://localhost:5173'],
        expectedRPID: 'localhost',
        credential: {
          id: 'cred-id-1',
          publicKey: expect.any(Uint8Array),
          counter: 5,
          transports: ['internal'],
        },
        requireUserVerification: true,
      });
      expect(result.verified).toBe(true);
      expect(result.authenticationInfo.newCounter).toBe(6);
    });

    it('should convert Buffer to Uint8Array for publicKey', async () => {
      const credential = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([10, 20, 30, 40, 50]),
        counter: 0,
        transports: ['usb'],
      } as unknown as IPasskey;

      const params = {
        response: {
          id: 'cred-id-1',
          rawId: 'cred-id-1',
          response: {
            clientDataJSON: 'mock-client-data',
            authenticatorData: 'mock-auth-data',
            signature: 'mock-signature',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'challenge',
        credential,
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'singleDevice' as const,
          credentialBackedUp: false,
        },
      };

      (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      await verifyPasskeyAuthentication(params);

      const callArgs = (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.credential.publicKey).toBeInstanceOf(Uint8Array);
      expect(Array.from(callArgs.credential.publicKey)).toEqual([10, 20, 30, 40, 50]);
    });

    it('should return unverified result if authentication fails', async () => {
      const credential = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 5,
        transports: ['internal'],
      } as unknown as IPasskey;

      const params = {
        response: {
          id: 'cred-id-1',
          rawId: 'cred-id-1',
          response: {
            clientDataJSON: 'mock-client-data',
            authenticatorData: 'mock-auth-data',
            signature: 'wrong-signature',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'challenge',
        credential,
      };

      const mockVerification = {
        verified: false,
      };

      (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      const result = await verifyPasskeyAuthentication(params);

      expect(result.verified).toBe(false);
    });

    it('should handle errors from SimpleWebAuthn', async () => {
      const credential = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 0,
        transports: [],
      } as unknown as IPasskey;

      const params = {
        response: {
          id: 'cred-id-1',
          rawId: 'cred-id-1',
          response: {
            clientDataJSON: 'mock-client-data',
            authenticatorData: 'mock-auth-data',
            signature: 'mock-signature',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'challenge',
        credential,
      };

      const error = new Error('Authentication verification error');
      (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mockRejectedValue(error);

      await expect(verifyPasskeyAuthentication(params)).rejects.toThrow(
        'Authentication verification error'
      );
    });

    it('should handle credentials with undefined transports', async () => {
      const credential = {
        credentialId: 'cred-id-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 0,
        transports: undefined,
      } as unknown as IPasskey;

      const params = {
        response: {
          id: 'cred-id-1',
          rawId: 'cred-id-1',
          response: {
            clientDataJSON: 'mock-client-data',
            authenticatorData: 'mock-auth-data',
            signature: 'mock-signature',
          },
          type: 'public-key' as const,
          clientExtensionResults: {},
        },
        expectedChallenge: 'challenge',
        credential,
      };

      const mockVerification = {
        verified: true,
        authenticationInfo: {
          newCounter: 1,
          userVerified: true,
          credentialDeviceType: 'singleDevice' as const,
          credentialBackedUp: false,
        },
      };

      (SimpleWebAuthnServer.verifyAuthenticationResponse as jest.Mock).mockResolvedValue(
        mockVerification
      );

      const result = await verifyPasskeyAuthentication(params);

      expect(result.verified).toBe(true);
    });
  });
});
