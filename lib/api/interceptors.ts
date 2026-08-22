import { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { apiClient } from "./client";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import {
  getIsRefreshing,
  setIsRefreshing,
  emitSessionExpired,
} from "@/lib/auth/sessionExpiry";

// ---------------------------------------------------------------------------
// Request interceptor — attach the wallet accessToken
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    useUIStore.getState().setGlobalLoading(true);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.data || "",
      );
    }

    return config;
  },
  (error: AxiosError) => {
    useUIStore.getState().setGlobalLoading(false);
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Response interceptor — handle errors & 401 session expiry
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    useUIStore.getState().setGlobalLoading(false);
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[API Response] ${response.status} ${response.config.url}`,
        response.data,
      );
    }
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    useUIStore.getState().setGlobalLoading(false);

    if (process.env.NODE_ENV === "development") {
      console.error(
        `[API Error] ${error.response?.status} ${error.config?.url}`,
        error.response?.data || error.message,
      );
    }

    // ── 401 Unauthorized → signal session expiry ────────────────────────
    if (error.response?.status === 401 && !getIsRefreshing()) {
      setIsRefreshing(true);

      // Emit so the SessionExpiredModal (or any subscriber) can open the
      // wallet re-authentication flow.  The interceptor does NOT attempt a
      // refresh-token call because the backend does not support one.
      emitSessionExpired(
        error.config as InternalAxiosRequestConfig,
      );

      // After emitting, clear the guard so subsequent 401s can re-trigger.
      // The guard is reset after a short delay to avoid flicker while the
      // re-auth modal is animating open.
      setTimeout(() => setIsRefreshing(false), 500);
    }

    // ── Standardised error shape ────────────────────────────────────────
    const apiError = {
      message:
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred",
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(apiError);
  },
);

export { apiClient };
