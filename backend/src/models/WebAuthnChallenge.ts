import mongoose, { Document, Schema } from 'mongoose';

/**
 * WebAuthn challenge document interface
 * Temporary storage for WebAuthn challenges during registration/authentication flows
 */
export interface IWebAuthnChallenge extends Document {
  userId?: mongoose.Types.ObjectId; // Optional: set for authentication challenges
  email?: string; // Optional: set for registration challenges (new users)
  challenge: string; // Base64URL-encoded challenge
  type: 'registration' | 'authentication';
  expiresAt: Date;
  createdAt: Date;
}

/**
 * WebAuthn challenge schema for temporary challenge storage
 * Challenges are automatically cleaned up after expiration via TTL index
 */
const webauthnChallengeSchema = new Schema<IWebAuthnChallenge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    challenge: {
      type: String,
      required: [true, 'Challenge is required'],
      unique: true,
      index: true, // Fast lookups during verification
    },
    type: {
      type: String,
      required: [true, 'Challenge type is required'],
      enum: {
        values: ['registration', 'authentication'],
        message: 'Challenge type must be either registration or authentication',
      },
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: automatically delete challenges after expiration
webauthnChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient user challenge queries
webauthnChallengeSchema.index({ userId: 1, type: 1 });
webauthnChallengeSchema.index({ email: 1, type: 1 });

/**
 * WebAuthnChallenge model
 * Stores temporary challenges for WebAuthn registration/authentication flows
 * Challenges expire after 5 minutes and are automatically cleaned up
 */
const WebAuthnChallenge = mongoose.model<IWebAuthnChallenge>(
  'WebAuthnChallenge',
  webauthnChallengeSchema
);

export default WebAuthnChallenge;
