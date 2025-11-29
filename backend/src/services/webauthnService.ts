import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { logger } from '../utils/logger';
import type { IPasskey } from '../models/Passkey';

/**
 * WebAuthn/Passkey service for FIDO2 authentication
 * Uses SimpleWebAuthn for registration and authentication flows
 */

// Relying Party (RP) configuration
const RP_NAME = process.env.RP_NAME || "Annie's Health Journal";
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

// Expected origin must match the frontend URL
const EXPECTED_ORIGINS = [ORIGIN];

// Warn if using default configuration
if (RP_ID === 'localhost') {
  logger.warn(
    'Using default RP_ID (localhost). For production, set RP_ID to your domain in .env file.'
  );
}

export interface RegistrationOptionsParams {
  userId: string;
  username: string;
  email: string;
  existingCredentials: IPasskey[];
}

export interface VerifyRegistrationParams {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
}

export interface AuthenticationOptionsParams {
  credentials: IPasskey[];
}

export interface VerifyAuthenticationParams {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  credential: IPasskey;
}

/**
 * Generate registration options for passkey creation
 */
export async function generatePasskeyRegistrationOptions(
  params: RegistrationOptionsParams
): Promise<ReturnType<typeof generateRegistrationOptions>> {
  try {
    const { userId, username, email, existingCredentials } = params;

    logger.info('Generating passkey registration options', { userId, username });

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: email,
      userDisplayName: username,
      // Timeout after 5 minutes
      timeout: 300000,
      // Exclude already registered credentials to prevent duplicates
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
      // but allow cross-platform (security keys)
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      // Support modern algorithms
      supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);

    logger.info('Passkey registration options generated', { userId, challenge: options.challenge });

    return options;
  } catch (error) {
    logger.error('Error generating passkey registration options', { error });
    throw error;
  }
}

/**
 * Verify passkey registration response
 */
export async function verifyPasskeyRegistration(
  params: VerifyRegistrationParams
): Promise<VerifiedRegistrationResponse> {
  try {
    const { response, expectedChallenge } = params;

    logger.info('Verifying passkey registration response', {
      credentialId: response.id,
      challenge: expectedChallenge,
    });

    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified) {
      logger.info('Passkey registration verified successfully', {
        credentialId: response.id,
        aaguid: verification.registrationInfo?.aaguid,
      });
    } else {
      logger.warn('Passkey registration verification failed', {
        credentialId: response.id,
      });
    }

    return verification;
  } catch (error) {
    logger.error('Error verifying passkey registration', { error });
    throw error;
  }
}

/**
 * Generate authentication options for passkey login
 */
export async function generatePasskeyAuthenticationOptions(
  params: AuthenticationOptionsParams
): Promise<ReturnType<typeof generateAuthenticationOptions>> {
  try {
    const { credentials } = params;

    logger.info('Generating passkey authentication options', {
      credentialCount: credentials.length,
    });

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      // Timeout after 5 minutes
      timeout: 300000,
      // Allow any of the user's registered credentials
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
    };

    const options = await generateAuthenticationOptions(opts);

    logger.info('Passkey authentication options generated', {
      challenge: options.challenge,
    });

    return options;
  } catch (error) {
    logger.error('Error generating passkey authentication options', { error });
    throw error;
  }
}

/**
 * Verify passkey authentication response
 */
export async function verifyPasskeyAuthentication(
  params: VerifyAuthenticationParams
): Promise<VerifiedAuthenticationResponse> {
  try {
    const { response, expectedChallenge, credential } = params;

    logger.info('Verifying passkey authentication response', {
      credentialId: response.id,
      challenge: expectedChallenge,
    });

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey), // Convert Buffer to Uint8Array
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified) {
      logger.info('Passkey authentication verified successfully', {
        credentialId: response.id,
        newCounter: verification.authenticationInfo.newCounter,
      });
    } else {
      logger.warn('Passkey authentication verification failed', {
        credentialId: response.id,
      });
    }

    return verification;
  } catch (error) {
    logger.error('Error verifying passkey authentication', { error });
    throw error;
  }
}
