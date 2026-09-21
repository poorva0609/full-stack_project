import axios, { type AxiosRequestConfig } from "axios";
import apiClient from "./ApiClient";
import type { ApiResponse, ApiError } from "../types/api";

let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);

    return response.data;
  } catch (error: unknown) {
    // --------------------------------
    // Not an Axios error
    // --------------------------------
    if (!axios.isAxiosError<ApiError>(error)) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Something went wrong",
        },
      };
    }

    const status = error.response?.status;
    const code = error.response?.data?.error?.code;

    // --------------------------------
    // Only these errors can trigger refresh
    // --------------------------------
    const shouldRefresh =
      status === 401 &&
      (code === "TOKEN_EXPIRED" || code === "TOKEN_NOT_FOUND");

    // --------------------------------
    // Normal error
    // --------------------------------
    if (!shouldRefresh) {
      if (error.response?.data) {
        return error.response.data;
      }

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Unable to connect to server",
        },
      };
    }

    // --------------------------------
    // Try refresh ONCE
    // --------------------------------
    try {
      await refreshAccessToken();
    } catch (refreshError: unknown) {
      // Refresh failed → STOP HERE.
      // Do NOT call apiRequest again.

      if (axios.isAxiosError<ApiError>(refreshError)) {
        if (refreshError.response?.data) {
          return refreshError.response.data;
        }
      }

      return {
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Authentication failed",
        },
      };
    }

    // --------------------------------
    // Retry ORIGINAL request ONCE
    // --------------------------------
    try {
      const retryResponse =
        await apiClient.request<ApiResponse<T>>(config);

      return retryResponse.data;
    } catch (retryError: unknown) {
      // IMPORTANT:
      // Do NOT refresh again here.

      if (axios.isAxiosError<ApiError>(retryError)) {
        if (retryError.response?.data) {
          return retryError.response.data;
        }
      }

      return {
        success: false,
        error: {
          code: "REQUEST_FAILED",
          message: "Request failed",
        },
      };
    }
  }
};