import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Passkey from '../models/Passkey';
import WebAuthnChallenge from '../models/WebAuthnChallenge';
import { logger } from '../utils/logger';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '../services/webauthnService';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * POST /api/auth/passkey/registration-options
 * Generate registration options for adding a new passkey
 * Requires authentication
 */
export async function generateRegistrationOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    logger.info('Passkey registration options requested', { userId });

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get existing passkeys to exclude from registration
    const existingPasskeys = await Passkey.find({ userId }).lean();

    // Generate registration options
    const options = await generatePasskeyRegistrationOptions({
      userId,
      username: user.username,
      email: user.email,
      existingCredentials: existingPasskeys as IPasskey[],
    });

    // Store challenge for verification
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await WebAuthnChallenge.create({
      userId,
      challenge: options.challenge,
      type: 'registration',
      expiresAt,
    });

    logger.info('Passkey registration options generated', { userId, challenge: options.challenge });

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    logger.error('Error generating passkey registration options', { error });
    next(error);
  }
}

/**
 * POST /api/auth/passkey/registration-verification
 * Verify and complete passkey registration
 * Requires authentication
 */
export async function verifyRegistration(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;
    const { response, deviceName } = req.body;

    if (!response) {
      res.status(400).json({
        success: false,
        error: 'Registration response is required',
      });
      return;
    }

    logger.info('Passkey registration verification attempt', { userId });

    // Find the challenge
    const challengeDoc = await WebAuthnChallenge.findOne({
      userId,
      type: 'registration',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challengeDoc) {
      logger.warn('No valid registration challenge found', { userId });
      res.status(400).json({
        success: false,
        error: 'Invalid or expired registration challenge. Please start over.',
      });
      return;
    }

    // Verify the registration response
    const verification = await verifyPasskeyRegistration({
      response,
      expectedChallenge: challengeDoc.challenge,
    });

    if (!verification.verified || !verification.registrationInfo) {
      logger.warn('Passkey registration verification failed', { userId });
      res.status(400).json({
        success: false,
        error: 'Registration verification failed',
      });
      return;
    }

    // Save the new passkey (v13 structure: credential is nested)
    const { credential } = verification.registrationInfo;

    await Passkey.create({
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: response.response.transports || [],
      deviceName: deviceName || undefined,
      lastUsedAt: new Date(),
    });

    // Delete the challenge (one-time use)
    await WebAuthnChallenge.deleteOne({ _id: challengeDoc._id });

    logger.info('Passkey registered successfully', {
      userId,
      credentialId: credential.id,
      deviceName,
    });

    res.status(200).json({
      success: true,
      message: 'Passkey registered successfully',
    });
  } catch (error) {
    logger.error('Error verifying passkey registration', { error });
    next(error);
  }
}

/**
 * POST /api/auth/passkey/authentication-options
 * Generate authentication options for passkey login
 * Public endpoint (no authentication required)
 */
export async function generateAuthenticationOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    logger.info('Passkey authentication options requested', { email });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security)
      logger.info('User not found for passkey auth', { email });
      res.status(200).json({
        success: true,
        data: null,
        message: 'No passkeys found for this email',
      });
      return;
    }

    // Get user's passkeys
    const passkeys = await Passkey.find({ userId: user._id }).lean();

    if (passkeys.length === 0) {
      logger.info('No passkeys registered for user', { userId: user._id });
      res.status(200).json({
        success: true,
        data: null,
        message: 'No passkeys found for this email',
      });
      return;
    }

    // Generate authentication options
    const options = await generatePasskeyAuthenticationOptions({
      credentials: passkeys as IPasskey[],
    });

    // Store challenge for verification
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await WebAuthnChallenge.create({
      userId: user._id,
      email: user.email,
      challenge: options.challenge,
      type: 'authentication',
      expiresAt,
    });

    logger.info('Passkey authentication options generated', {
      userId: user._id,
      challenge: options.challenge,
    });

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    logger.error('Error generating passkey authentication options', { error });
    next(error);
  }
}

/**
 * POST /api/auth/passkey/authentication-verification
 * Verify passkey authentication and log in user
 * Public endpoint (no authentication required)
 */
export async function verifyAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { response, email } = req.body;

    if (!response || !email) {
      res.status(400).json({
        success: false,
        error: 'Response and email are required',
      });
      return;
    }

    logger.info('Passkey authentication verification attempt', { email });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
      return;
    }

    // Find the challenge
    const challengeDoc = await WebAuthnChallenge.findOne({
      userId: user._id,
      type: 'authentication',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challengeDoc) {
      logger.warn('No valid authentication challenge found', { userId: user._id });
      res.status(400).json({
        success: false,
        error: 'Invalid or expired authentication challenge. Please start over.',
      });
      return;
    }

    // Find the passkey being used
    const passkey = await Passkey.findOne({
      userId: user._id,
      credentialId: response.id,
    });

    if (!passkey) {
      logger.warn('Passkey not found for credential ID', {
        userId: user._id,
        credentialId: response.id,
      });
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
      return;
    }

    // Verify the authentication response
    const verification = await verifyPasskeyAuthentication({
      response,
      expectedChallenge: challengeDoc.challenge,
      credential: passkey as IPasskey,
    });

    if (!verification.verified) {
      logger.warn('Passkey authentication verification failed', { userId: user._id });
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
      return;
    }

    // Update passkey counter and last used timestamp
    passkey.counter = verification.authenticationInfo.newCounter;
    passkey.lastUsedAt = new Date();
    await passkey.save();

    // Delete the challenge (one-time use)
    await WebAuthnChallenge.deleteOne({ _id: challengeDoc._id });

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as StringValue;
    const jwtToken = jwt.sign({ id: user._id }, secret, {
      expiresIn,
      algorithm: 'HS256',
    });

    logger.info('Passkey authentication successful', {
      userId: user._id,
      credentialId: passkey.credentialId,
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          notificationTimes: user.notificationTimes,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt,
        },
        token: jwtToken,
      },
    });
  } catch (error) {
    logger.error('Error verifying passkey authentication', { error });
    next(error);
  }
}

/**
 * GET /api/auth/passkeys
 * List all registered passkeys for the authenticated user
 * Requires authentication
 */
export async function listPasskeys(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    logger.info('Listing passkeys', { userId });

    // Get all passkeys for the user
    const passkeys = await Passkey.find({ userId })
      .select('credentialId deviceName lastUsedAt createdAt transports')
      .sort({ createdAt: -1 })
      .lean();

    logger.info('Passkeys retrieved', { userId, count: passkeys.length });

    res.status(200).json({
      success: true,
      data: passkeys.map((passkey) => ({
        id: passkey._id,
        credentialId: passkey.credentialId,
        deviceName: passkey.deviceName || 'Unnamed Device',
        lastUsedAt: passkey.lastUsedAt,
        createdAt: passkey.createdAt,
        transports: passkey.transports || [],
      })),
    });
  } catch (error) {
    logger.error('Error listing passkeys', { error });
    next(error);
  }
}

/**
 * DELETE /api/auth/passkeys/:id
 * Delete a specific passkey
 * Requires authentication
 */
export async function deletePasskey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Passkey ID is required',
      });
      return;
    }

    logger.info('Deleting passkey', { userId, passkeyId: id });

    // Find and delete the passkey (ensuring it belongs to the user)
    const passkey = await Passkey.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!passkey) {
      res.status(404).json({
        success: false,
        error: 'Passkey not found',
      });
      return;
    }

    logger.info('Passkey deleted successfully', {
      userId,
      passkeyId: id,
      credentialId: passkey.credentialId,
    });

    res.status(200).json({
      success: true,
      message: 'Passkey deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting passkey', { error });
    next(error);
  }
}

/**
 * PATCH /api/auth/passkeys/:id
 * Update passkey device name
 * Requires authentication
 */
export async function updatePasskey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;
    const { id } = req.params;
    const { deviceName } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Passkey ID is required',
      });
      return;
    }

    if (!deviceName) {
      res.status(400).json({
        success: false,
        error: 'Device name is required',
      });
      return;
    }

    logger.info('Updating passkey device name', { userId, passkeyId: id, deviceName });

    // Find and update the passkey (ensuring it belongs to the user)
    const passkey = await Passkey.findOneAndUpdate(
      { _id: id, userId },
      { deviceName },
      { new: true, runValidators: true }
    );

    if (!passkey) {
      res.status(404).json({
        success: false,
        error: 'Passkey not found',
      });
      return;
    }

    logger.info('Passkey updated successfully', { userId, passkeyId: id, deviceName });

    res.status(200).json({
      success: true,
      data: {
        id: passkey._id,
        credentialId: passkey.credentialId,
        deviceName: passkey.deviceName,
        lastUsedAt: passkey.lastUsedAt,
        createdAt: passkey.createdAt,
        transports: passkey.transports,
      },
    });
  } catch (error) {
    logger.error('Error updating passkey', { error });
    next(error);
  }
}
