import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Standardized symptom value with numeric severity
 */
export interface SymptomValue {
  severity: number; // Required: 1-10 scale
  location?: string; // Optional: body location (e.g., "lower back", "left hand")
  notes?: string; // Optional: additional context
}

/**
 * Structured data interface for parsed check-in information
 */
export interface IStructured {
  symptoms: { [key: string]: SymptomValue };
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
 * Symptom value schema for nested Map validation
 */
const symptomValueSchema = new Schema(
  {
    severity: {
      type: Number,
      required: [true, 'Symptom severity is required'],
      min: [1, 'Severity must be at least 1'],
      max: [10, 'Severity must not exceed 10'],
    },
    location: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { _id: false } // Disable _id for subdocuments
);

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
        of: symptomValueSchema,
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
