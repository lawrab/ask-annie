import mongoose, { Document, Schema } from 'mongoose';

/**
 * Passkey document interface for WebAuthn/FIDO2 credentials
 * Following industry best practice: credentials in separate collection with foreign key to User
 */
export interface IPasskey extends Document {
  userId: mongoose.Types.ObjectId;
  credentialId: string; // Base64URL-encoded credential ID (indexed as TEXT)
  publicKey: Buffer; // Public key bytes (stored as BLOB/BYTEA)
  counter: number; // Signature counter for replay protection
  transports?: string[]; // Authenticator transports (usb, nfc, ble, internal, hybrid)
  deviceName?: string; // Optional user-friendly name (e.g., "iPhone 15", "YubiKey")
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Passkey schema for storing WebAuthn credentials
 */
const passkeySchema = new Schema<IPasskey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    credentialId: {
      type: String,
      required: [true, 'Credential ID is required'],
      unique: true,
      index: true, // Fast lookups during authentication
    },
    publicKey: {
      type: Buffer,
      required: [true, 'Public key is required'],
    },
    counter: {
      type: Number,
      required: [true, 'Counter is required'],
      default: 0,
      min: [0, 'Counter must be non-negative'],
    },
    transports: {
      type: [String],
      default: [],
      validate: {
        validator: function (transports: string[]) {
          const validTransports = ['usb', 'nfc', 'ble', 'internal', 'hybrid'];
          return transports.every((t) => validTransports.includes(t));
        },
        message: 'Invalid authenticator transport type',
      },
    },
    deviceName: {
      type: String,
      trim: true,
      maxlength: [50, 'Device name must not exceed 50 characters'],
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user credential queries
passkeySchema.index({ userId: 1, credentialId: 1 });

/**
 * Passkey model
 * Stores WebAuthn credentials separately from User model (industry best practice)
 */
const Passkey = mongoose.model<IPasskey>('Passkey', passkeySchema);

export default Passkey;
