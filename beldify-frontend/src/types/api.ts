export interface ApiError extends Error {
  response?: {
    data?: {
      type?: string;
      message?: string;
    };
    status?: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}
