"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

// Session timeout configuration
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionTimeoutOptions {
  onWarning?: (timeRemaining: number) => void;
  onExpired?: () => void;
  warningThreshold?: number;
  checkInterval?: number;
}

export interface SessionTimeoutState {
  isWarning: boolean;
  timeRemaining: number;
}

// ---------------------------------------------------------------------------
// JWT utilities
// ---------------------------------------------------------------------------

// JWT token utilities
// NOTE: These helpers only decode the payload for UX purposes (warning timers,
// auto-refresh triggers). They do NOT verify the signature and must not be used
// for security decisions. Signature verification is handled server-side by
// `verifyJwt` in `lib/auth/jwt.ts`.
const getTokenExpirationTime = (token: string): number | null => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const payload = JSON.parse(atob(payloadSegment));
    return payload.exp * 1000; // → milliseconds
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  return Date.now() >= expirationTime;
};

const getTimeRemaining = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  return Math.max(0, expirationTime - Date.now());
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Monitors the stored JWT and fires callbacks when it is about to expire or
 * has already expired.  Because the backend only issues a short-lived
 * accessToken (≈15 min) with no refresh token, expiry means the user must
 * re-authenticate via wallet challenge-response.
 */
export function useSessionTimeout(options: SessionTimeoutOptions = {}) {
  const {
    onWarning,
    onExpired,
    warningThreshold = WARNING_THRESHOLD,
    checkInterval = CHECK_INTERVAL,
  } = options;

  const { token, logout } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Called when the token has expired or is about to expire
  const handleExpiration = useCallback(() => {
    cleanup();
    logout();
    onExpired?.();
  }, [cleanup, logout, onExpired]);

  // Start periodic token monitoring
  const startMonitoring = useCallback(() => {
    if (!token) return;
    cleanup();

    // Token already expired
    if (isTokenExpired(token)) {
      handleExpiration();
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!token) {
        cleanup();
        return;
      }

      const remaining = getTimeRemaining(token);

      if (remaining === 0) {
        handleExpiration();
        return;
      }

      // Warn once when approaching expiry
      if (remaining <= warningThreshold && !warningTimeoutRef.current) {
        onWarning?.(remaining);

        // When the exact expiry hits, trigger expiration
        warningTimeoutRef.current = setTimeout(() => {
          handleExpiration();
        }, remaining);
      }
    }, checkInterval);
  }, [token, cleanup, handleExpiration, onWarning, warningThreshold, checkInterval]);

  // Kick off monitoring whenever the token changes
  useEffect(() => {
    if (token) {
      startMonitoring();
    } else {
      cleanup();
    }
    return cleanup;
  }, [token, startMonitoring, cleanup]);

  // Imperatively read the current session state
  const getSessionState = useCallback((): SessionTimeoutState => {
    if (!token) {
      return { isWarning: false, timeRemaining: 0 };
    }
    const remaining = getTimeRemaining(token);
    return {
      isWarning: remaining > 0 && remaining <= warningThreshold,
      timeRemaining: remaining,
    };
  }, [token, warningThreshold]);

  return { getSessionState, cleanup };
}

// ---------------------------------------------------------------------------
// Public utilities
// ---------------------------------------------------------------------------

export const sessionUtils = {
  getTokenExpirationTime,
  isTokenExpired,
  getTimeRemaining,
  formatTimeRemaining: (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
};
