import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  notificationTimes: string[];
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface SymptomValue {
  severity: number; // 1-10 scale
  location?: string;
  notes?: string;
}

export interface CheckIn {
  _id: string;
  userId: string;
  timestamp: string;
  rawTranscript?: string;
  structured: {
    symptoms: Record<string, SymptomValue>;
    activities: string[];
    triggers: string[];
    notes: string;
  };
  flaggedForDoctor: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInsResponse {
  success: boolean;
  data: {
    checkIns: CheckIn[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface InsightCard {
  type: 'data_context' | 'validation' | 'pattern' | 'community';
  title: string;
  message: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

export interface CheckInResponse {
  success: boolean;
  data: {
    checkIn: CheckIn;
    insight: InsightCard;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
}

// Check-In Context Types (for pre-check-in guidance)
export interface LastCheckInSymptom {
  name: string;
  severity: number;
}

export interface RecentSymptom {
  name: string;
  frequency: number;
  avgSeverity: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface StreakInfo {
  current: number;
  message?: string;
}

export interface CheckInContext {
  lastCheckIn?: {
    timestamp: string;
    timeAgo: string;
    symptoms: LastCheckInSymptom[];
  };
  recentSymptoms: RecentSymptom[];
  streak: StreakInfo;
  suggestedTopics: string[];
}

export interface CheckInContextResponse {
  success: boolean;
  data: CheckInContext;
}

// Daily Status Types
export interface DailyStatusResponse {
  success: boolean;
  data: {
    today: {
      date: string;
      scheduledTimes: string[];
      completedLogs: Array<{
        time: string;
        checkInId: string;
      }>;
      nextSuggested: string | null;
      isComplete: boolean;
    };
    stats: {
      todayCount: number;
      scheduledCount: number;
    };
  };
}

// Streak Types
export interface StreakResponse {
  success: boolean;
  data: {
    currentStreak: number;
    longestStreak: number;
    activeDays: number;
    totalDays: number;
    streakStartDate: string | null;
    lastLogDate: string | null;
  };
}

// Latest Check-In Comparison Types
export interface LatestSymptomComparison {
  name: string;
  latestValue: number;
  averageValue: number;
  trend: 'above' | 'below' | 'equal';
}

export interface LatestCheckInData {
  timestamp: Date;
  symptoms: LatestSymptomComparison[];
}

// Quick Stats Types
export interface QuickStatsResponse {
  success: boolean;
  data: {
    period: {
      current: {
        start: string;
        end: string;
        days: number;
      };
      previous: {
        start: string;
        end: string;
        days: number;
      };
    };
    checkInCount: {
      current: number;
      previous: number;
      change: number;
      percentChange: number;
    };
    topSymptoms: Array<{
      name: string;
      frequency: number;
      avgSeverity: number | null;
      trend: 'improving' | 'worsening' | 'stable';
    }>;
    averageSeverity: {
      current: number;
      previous: number;
      change: number;
      trend: 'improving' | 'worsening' | 'stable';
    };
    latestCheckIn?: LatestCheckInData;
  };
}

// Symptoms Analysis Types
export interface SymptomStats {
  name: string;
  count: number;
  percentage: number;
  type: 'numeric' | 'categorical' | 'boolean';
  min?: number;
  max?: number;
  average?: number;
  values?: unknown[];
}

export interface SymptomsAnalysisResponse {
  success: boolean;
  data: {
    symptoms: SymptomStats[];
    totalCheckins: number;
  };
}

// Symptom Trend Types
export interface SymptomTrendResponse {
  success: boolean;
  data: {
    symptom: string;
    dateRange: {
      start: string;
      end: string;
    };
    dataPoints: Array<{
      date: string;
      value: number;
      count: number;
    }>;
    statistics: {
      average: number;
      min: number;
      max: number;
      median: number;
      standardDeviation: number;
    };
  };
}

// Auth API
export const authApi = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Check-ins API
export const checkInsApi = {
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    symptom?: string;
    limit?: number;
    offset?: number;
  }): Promise<CheckInsResponse> => {
    const response = await apiClient.get<CheckInsResponse>('/checkins', { params });
    return response.data;
  },

  createVoice: async (audioFile: File): Promise<CheckInResponse> => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await apiClient.post<CheckInResponse>('/checkins', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createManual: async (data: {
    structured: {
      symptoms: Record<string, SymptomValue>;
      activities: string[];
      triggers: string[];
      notes: string;
    };
  }): Promise<CheckInResponse> => {
    const response = await apiClient.post<CheckInResponse>('/checkins/manual', data);
    return response.data;
  },

  getStatus: async (): Promise<DailyStatusResponse> => {
    const response = await apiClient.get<DailyStatusResponse>('/checkins/status');
    return response.data;
  },

  getContext: async (): Promise<CheckInContextResponse> => {
    const response = await apiClient.get<CheckInContextResponse>('/checkins/context');
    return response.data;
  },
};

// Analysis API
export const analysisApi = {
  getStreak: async (): Promise<StreakResponse> => {
    const response = await apiClient.get<StreakResponse>('/analysis/streak');
    return response.data;
  },

  getQuickStats: async (days: number = 7): Promise<QuickStatsResponse> => {
    const response = await apiClient.get<QuickStatsResponse>('/analysis/quick-stats', {
      params: { days },
    });
    return response.data;
  },

  getSymptomsAnalysis: async (): Promise<SymptomsAnalysisResponse> => {
    const response = await apiClient.get<SymptomsAnalysisResponse>('/analysis/symptoms');
    return response.data;
  },

  getSymptomTrend: async (symptom: string, days: number = 7): Promise<SymptomTrendResponse> => {
    const response = await apiClient.get<SymptomTrendResponse>(
      `/analysis/trends/${encodeURIComponent(symptom)}`,
      { params: { days } }
    );
    return response.data;
  },
};

// User API
export interface ExportDataResponse {
  exportDate: string;
  exportVersion: string;
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    notificationTimes: string[];
    notificationsEnabled: boolean;
  };
  checkIns: Array<{
    id: string;
    timestamp: string;
    type: 'manual' | 'voice';
    transcription: string;
    structured: {
      symptoms: Record<string, SymptomValue>;
      activities: string[];
      triggers: string[];
      notes?: string;
    };
    flaggedForDoctor: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  symptoms: string[];
  activities: string[];
  triggers: string[];
  statistics: {
    totalCheckIns: number;
    totalSymptoms: number;
    totalActivities: number;
    totalTriggers: number;
    accountAgeDays: number;
    firstCheckIn: string | null;
    lastCheckIn: string | null;
  };
}

export interface RequestDeletionResponse {
  success: boolean;
  message?: string;
  error?: string;
  deletionToken?: string; // Only in development
}

export const userApi = {
  exportData: async (): Promise<ExportDataResponse> => {
    const response = await apiClient.get<ExportDataResponse>('/user/export');
    return response.data;
  },

  requestDeletion: async (): Promise<RequestDeletionResponse> => {
    const response = await apiClient.post<RequestDeletionResponse>('/user/request-deletion');
    return response.data;
  },
};

// Passkey API Types
export interface Passkey {
  id: string;
  credentialId: string;
  deviceName: string;
  lastUsedAt: string;
  createdAt: string;
  transports: string[];
}

export interface PasskeyListResponse {
  success: boolean;
  data: Passkey[];
}

export interface PasskeyRegistrationOptionsResponse {
  success: boolean;
  data: PublicKeyCredentialCreationOptionsJSON;
}

export interface PasskeyAuthenticationOptionsResponse {
  success: boolean;
  data: PublicKeyCredentialRequestOptionsJSON | null;
  message?: string;
}

export interface PasskeyVerificationResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
}

// Passkey API
export const passkeysApi = {
  // Generate registration options for adding a new passkey
  getRegistrationOptions: async (): Promise<PasskeyRegistrationOptionsResponse> => {
    const response = await apiClient.post<PasskeyRegistrationOptionsResponse>(
      '/auth/passkey/registration-options'
    );
    return response.data;
  },

  // Verify passkey registration
  verifyRegistration: async (data: {
    response: unknown; // RegistrationResponseJSON from @simplewebauthn/browser
    deviceName?: string;
  }): Promise<PasskeyVerificationResponse> => {
    const response = await apiClient.post<PasskeyVerificationResponse>(
      '/auth/passkey/registration-verification',
      data
    );
    return response.data;
  },

  // Generate authentication options for passkey login
  getAuthenticationOptions: async (email: string): Promise<PasskeyAuthenticationOptionsResponse> => {
    const response = await apiClient.post<PasskeyAuthenticationOptionsResponse>(
      '/auth/passkey/authentication-options',
      { email }
    );
    return response.data;
  },

  // Verify passkey authentication
  verifyAuthentication: async (data: {
    response: unknown; // AuthenticationResponseJSON from @simplewebauthn/browser
    email: string;
  }): Promise<PasskeyVerificationResponse> => {
    const response = await apiClient.post<PasskeyVerificationResponse>(
      '/auth/passkey/authentication-verification',
      data
    );
    return response.data;
  },

  // List all passkeys for authenticated user
  list: async (): Promise<PasskeyListResponse> => {
    const response = await apiClient.get<PasskeyListResponse>('/auth/passkeys');
    return response.data;
  },

  // Delete a specific passkey
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/auth/passkeys/${id}`
    );
    return response.data;
  },

  // Update passkey device name
  updateDeviceName: async (
    id: string,
    deviceName: string
  ): Promise<{ success: boolean; data: Passkey }> => {
    const response = await apiClient.patch<{ success: boolean; data: Passkey }>(
      `/auth/passkeys/${id}`,
      { deviceName }
    );
    return response.data;
  },
};

export default apiClient;
