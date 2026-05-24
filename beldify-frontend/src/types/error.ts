export interface ApiError extends Error {
  response?: {
    data?: {
      type?: string;
      message?: string;
      productName?: string;
    };
    status?: number;
  };
}
