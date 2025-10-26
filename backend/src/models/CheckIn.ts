import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Structured data interface for parsed check-in information
 */
export interface IStructured {
  symptoms: { [key: string]: unknown };
  activities: string[];
  triggers: string[];
  notes: string;
}

/**
 * CheckIn document interface extending Mongoose Document
 */
export interface ICheckIn extends Document {
  userId: Types.ObjectId;
  timestamp: Date;
  rawTranscript: string;
  structured: IStructured;
  flaggedForDoctor: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CheckIn schema for symptom tracking entries
 */
const checkInSchema = new Schema<ICheckIn>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true,
    },
    rawTranscript: {
      type: String,
      required: [true, 'Raw transcript is required'],
      default: 'manual entry',
    },
    structured: {
      symptoms: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {},
      },
      activities: {
        type: [String],
        default: [],
      },
      triggers: {
        type: [String],
        default: [],
      },
      notes: {
        type: String,
        default: '',
      },
    },
    flaggedForDoctor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user timeline queries
checkInSchema.index({ userId: 1, timestamp: -1 });

/**
 * CheckIn model
 */
const CheckIn = mongoose.model<ICheckIn>('CheckIn', checkInSchema);

export default CheckIn;
