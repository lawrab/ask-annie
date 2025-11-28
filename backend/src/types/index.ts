// Common types and interfaces

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export type InsightType = 'data_context' | 'validation' | 'pattern' | 'community';

export interface InsightCard {
  type: InsightType;
  title: string;
  message: string;
  icon: string;
  metadata?: Record<string, unknown>;
}
