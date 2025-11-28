import mongoose, { Document, Schema } from 'mongoose';

/**
 * Magic Link Token document interface
 * Used for passwordless authentication via email
 */
export interface IMagicLinkToken extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
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
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
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
