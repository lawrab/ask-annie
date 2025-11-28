import axios, { AxiosInstance, AxiosError } from 'axios';

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
export interface SymptomsAnalysisResponse {
  success: boolean;
  data: Array<{
    name: string;
    count: number;
    averageSeverity: number;
  }>;
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

export default apiClient;
