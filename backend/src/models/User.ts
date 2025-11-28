import mongoose, { Document, Schema } from 'mongoose';

/**
 * User document interface extending Mongoose Document
 */
export interface IUser extends Document {
  username: string;
  email: string;
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

/**
 * User model
 * Note: Indexes for email and username are automatically created via unique: true
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User;
