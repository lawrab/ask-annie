// Core type definitions

export interface User {
  id: string;
  username: string;
  email: string;
  notificationTimes: string[];
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface Symptom {
  [key: string]: string | number | boolean;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: string;
  rawTranscript: string;
  structured: {
    symptoms: Symptom;
    activities: string[];
    triggers: string[];
    notes: string;
  };
  flaggedForDoctor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
