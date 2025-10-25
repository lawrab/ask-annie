// Common types and interfaces

export interface ApiResponse<T = any> {
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
