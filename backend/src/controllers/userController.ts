import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import CheckIn from '../models/CheckIn';
import MagicLinkToken from '../models/MagicLinkToken';
import { logger } from '../utils/logger';
import { sendDeletionConfirmationEmail } from '../services/emailService';
import { AUTH_CONSTANTS } from '../constants';

/**
 * GET /api/user/export
 * Export all user data in JSON format (GDPR compliance - Right to data portability)
 * Requires authentication
 */
export async function exportUserData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    logger.info('User data export requested', { userId });

    // Fetch user data
    const user = await User.findById(userId).select('-__v').lean();
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Fetch all check-ins
    const checkIns = await CheckIn.find({ userId }).sort({ timestamp: -1 }).select('-__v').lean();

    // Extract unique symptoms from all check-ins
    const symptomsSet = new Set<string>();
    const activitiesSet = new Set<string>();
    const triggersSet = new Set<string>();

    checkIns.forEach((checkIn) => {
      if (checkIn.structured) {
        // Add symptoms
        if (checkIn.structured.symptoms) {
          Object.keys(checkIn.structured.symptoms).forEach((symptom) => symptomsSet.add(symptom));
        }
        // Add activities
        if (checkIn.structured.activities) {
          checkIn.structured.activities.forEach((activity) => activitiesSet.add(activity));
        }
        // Add triggers
        if (checkIn.structured.triggers) {
          checkIn.structured.triggers.forEach((trigger) => triggersSet.add(trigger));
        }
      }
    });

    // Calculate statistics
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Build export data structure
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0.0',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        notificationTimes: user.notificationTimes,
        notificationsEnabled: user.notificationsEnabled,
      },
      checkIns: checkIns.map((checkIn) => ({
        id: checkIn._id.toString(),
        timestamp: checkIn.timestamp,
        type: checkIn.rawTranscript === 'manual entry' ? 'manual' : 'voice',
        transcription: checkIn.rawTranscript,
        structured: checkIn.structured,
        flaggedForDoctor: checkIn.flaggedForDoctor,
        createdAt: checkIn.createdAt,
        updatedAt: checkIn.updatedAt,
      })),
      symptoms: Array.from(symptomsSet).sort(),
      activities: Array.from(activitiesSet).sort(),
      triggers: Array.from(triggersSet).sort(),
      statistics: {
        totalCheckIns: checkIns.length,
        totalSymptoms: symptomsSet.size,
        totalActivities: activitiesSet.size,
        totalTriggers: triggersSet.size,
        accountAgeDays,
        firstCheckIn: checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null,
        lastCheckIn: checkIns.length > 0 ? checkIns[0].timestamp : null,
      },
    };

    // Calculate export size and log performance warnings
    const exportSizeBytes = JSON.stringify(exportData).length;
    const exportSizeMB = exportSizeBytes / (1024 * 1024);

    logger.info('User data export completed', {
      userId,
      checkInCount: checkIns.length,
      symptomCount: symptomsSet.size,
      exportSizeMB: exportSizeMB.toFixed(2),
    });

    // Warn if dataset is getting large
    if (checkIns.length > 1000) {
      logger.warn('Large dataset export: high check-in count', {
        userId,
        checkInCount: checkIns.length,
        recommendation: 'Consider implementing pagination or streaming for exports',
      });
    }

    if (exportSizeMB > 10) {
      logger.warn('Large dataset export: export size exceeds 10MB', {
        userId,
        exportSizeMB: exportSizeMB.toFixed(2),
        recommendation: 'Consider implementing streaming response or background job processing',
      });
    }

    if (exportSizeMB > 50) {
      logger.error('Very large dataset export: export size exceeds 50MB', {
        userId,
        exportSizeMB: exportSizeMB.toFixed(2),
        recommendation: 'Implement background job processing with email delivery',
      });
    }

    // Set headers for file download
    const filename = `annies-health-journal-data-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).json(exportData);
  } catch (error) {
    logger.error('Error exporting user data', { error });
    next(error);
  }
}

/**
 * DELETE /api/user/account
 * Permanently delete user account and all associated data (GDPR compliance - Right to erasure)
 * Requires authentication and deletion token from magic link
 */
export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;
    const { deletionToken } = req.body;

    logger.info('Account deletion requested', { userId });

    // Verify deletion token
    if (!deletionToken) {
      res.status(400).json({
        success: false,
        error: 'Deletion token is required',
      });
      return;
    }

    // Find the deletion token
    const tokenDoc = await MagicLinkToken.findOne({
      token: deletionToken,
      purpose: 'account-deletion',
    });

    if (!tokenDoc) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired deletion token',
      });
      return;
    }

    // Verify token belongs to the authenticated user
    const user = await User.findById(userId);
    if (!user || user.email !== tokenDoc.email) {
      res.status(403).json({
        success: false,
        error: 'Token does not match authenticated user',
      });
      return;
    }

    // Check if token is expired (15 minutes)
    const fifteenMinutesAgo = new Date(
      Date.now() - AUTH_CONSTANTS.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
    );
    if (tokenDoc.createdAt < fifteenMinutesAgo) {
      await MagicLinkToken.deleteOne({ _id: tokenDoc._id });
      res.status(400).json({
        success: false,
        error: 'Deletion token has expired',
      });
      return;
    }

    // Begin deletion process
    logger.info('Starting account deletion', { userId, email: user.email });

    // Delete all check-ins
    const checkInResult = await CheckIn.deleteMany({ userId });
    logger.info('Deleted check-ins', { userId, count: checkInResult.deletedCount });

    // Delete all magic link tokens for this user
    const tokenResult = await MagicLinkToken.deleteMany({ email: user.email });
    logger.info('Deleted magic link tokens', { userId, count: tokenResult.deletedCount });

    // Delete the user account
    await User.findByIdAndDelete(userId);
    logger.info('Deleted user account', { userId, email: user.email });

    // Log deletion for audit trail (anonymized - no PII)
    logger.info('Account deletion completed', {
      timestamp: new Date().toISOString(),
      checkInsDeleted: checkInResult.deletedCount,
      tokensDeleted: tokenResult.deletedCount,
    });

    res.status(200).json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
    });
  } catch (error) {
    logger.error('Error deleting account', { error });
    next(error);
  }
}

/**
 * POST /api/user/request-deletion
 * Request account deletion - sends confirmation email with magic link
 * Requires authentication
 */
export async function requestDeletion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req.user as { id: string })!.id;

    logger.info('Account deletion request initiated', { userId });

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check for rate limiting - only allow one deletion request per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await MagicLinkToken.find({
      email: user.email,
      purpose: 'account-deletion',
      createdAt: { $gte: oneHourAgo },
    });

    if (recentTokens.length > 0) {
      res.status(429).json({
        success: false,
        error: 'Deletion request already sent. Please check your email or try again in an hour.',
      });
      return;
    }

    // Generate secure deletion token
    const deletionToken = crypto.randomBytes(AUTH_CONSTANTS.TOKEN_LENGTH_BYTES).toString('hex');

    // Save token to database (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
    await MagicLinkToken.create({
      email: user.email,
      token: deletionToken,
      purpose: 'account-deletion',
      expiresAt,
    });

    logger.info('Deletion token created', { userId, email: user.email });

    // Send deletion confirmation email
    await sendDeletionConfirmationEmail({ email: user.email, token: deletionToken });

    res.status(200).json({
      success: true,
      message: 'Deletion confirmation email sent. Please check your email.',
      // Return token in development for testing
      deletionToken: process.env.NODE_ENV === 'development' ? deletionToken : undefined,
    });
  } catch (error) {
    logger.error('Error requesting account deletion', { error });
    next(error);
  }
}
