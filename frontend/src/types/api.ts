export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
    error: {
     message: string;
     code: string;
    }
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;