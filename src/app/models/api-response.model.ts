export interface ApiResponse<T> {
  message: string;
  data: T | null;
}

export interface ErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
  timestamp?: string;
  status?: number;
  path?: string;
}
