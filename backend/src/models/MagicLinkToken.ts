import mongoose, { Document, Schema } from 'mongoose';

/**
 * Magic Link Token document interface
 * Used for passwordless authentication via email and account deletion confirmation
 */
export interface IMagicLinkToken extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  purpose: 'authentication' | 'account-deletion';
  username?: string; // Optional username for new user registration
  createdAt: Date;
}

/**
 * Magic Link Token schema
 * Stores time-limited tokens for passwordless email authentication
 */
const magicLinkTokenSchema = new Schema<IMagicLinkToken>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      // Index created via TTL index below (line 71)
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['authentication', 'account-deletion'],
      default: 'authentication',
      required: [true, 'Purpose is required'],
      index: true,
    },
    username: {
      type: String,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      // Optional - only provided for new user registration
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Index for cleaning up expired tokens
 * MongoDB TTL index automatically removes documents after expiresAt
 */
magicLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Index for efficient queries
 */
magicLinkTokenSchema.index({ email: 1, createdAt: -1 });

/**
 * Magic Link Token model
 */
const MagicLinkToken = mongoose.model<IMagicLinkToken>('MagicLinkToken', magicLinkTokenSchema);

export default MagicLinkToken;
