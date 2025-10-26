import mongoose, { Document, Schema } from 'mongoose';

/**
 * User document interface extending Mongoose Document
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  notificationTimes: string[];
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema for authentication and notification preferences
 */
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    notificationTimes: {
      type: [String],
      default: ['08:00', '14:00', '20:00'],
      validate: {
        validator: function (times: string[]) {
          return times.every((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time));
        },
        message: 'Notification times must be in HH:MM format (24-hour)',
      },
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

/**
 * User model
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;
