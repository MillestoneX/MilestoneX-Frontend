"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionTimeout } from "@/lib/auth/sessionTimeout";
import { SessionWarningModal, useSessionWarningModal } from "./SessionWarningModal";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth";

interface SessionManagerProps {
  children: React.ReactNode;
}

export function SessionManager({ children }: SessionManagerProps) {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const {
    isOpen,
    timeRemaining,
    isRefreshing,
    showWarning,
    hideWarning,
    setRefreshing,
    updateTimeRemaining,
  } = useSessionWarningModal();

  // Simple toast helper
  const showLogoutNotification = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
      if (typeof window === "undefined") return;
      const notification = document.createElement("div");
      notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === "success"
          ? "bg-green-500 text-white"
          : type === "error"
            ? "bg-red-500 text-white"
            : type === "warning"
              ? "bg-orange-500 text-white"
              : "bg-blue-500 text-white"
      }`;
      const icon =
        type === "success" ? "✓" : type === "error" ? "✕" : type === "warning" ? "⚠" : "ℹ";
      notification.innerHTML = `<div class="flex items-center"><span class="mr-2">${icon}</span><span>${message}</span></div>`;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 5000);
    },
    [],
  );

  // ── Session timeout callbacks ──────────────────────────────────────────

  const handleSessionWarning = useCallback(
    (remainingTime: number) => {
      showWarning(remainingTime);
    },
    [showWarning],
  );

  const handleSessionExpired = useCallback(() => {
    hideWarning();

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-storage");
      sessionStorage.clear();
    }

    showLogoutNotification(
      "Your session has expired. Please sign in with your wallet.",
    );
    router.push("/auth/login");
  }, [hideWarning, router, showLogoutNotification]);

  // ── Timeout monitoring (no refresh token — expiry means re-auth) ───────

  const { getSessionState } = useSessionTimeout({
    onWarning: handleSessionWarning,
    onExpired: handleSessionExpired,
    warningThreshold: 5 * 60 * 1000,
    checkInterval: 30 * 1000,
  });

  // "Stay Logged In" → redirect to login for wallet re-auth
  const handleStayLoggedIn = useCallback(() => {
    hideWarning();
    showLogoutNotification(
      "Please sign in again with your wallet to continue.",
      "info",
    );
    router.push("/auth/login");
  }, [hideWarning, router, showLogoutNotification]);

  // Manual logout
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore — backend may already be unreachable
    } finally {
      hideWarning();
      logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        sessionStorage.clear();
      }
      showLogoutNotification("You have been logged out successfully.");
      router.push("/auth/login");
    }
  }, [hideWarning, logout, router, showLogoutNotification]);

  // Keep the modal's countdown in sync
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        const state = getSessionState();
        updateTimeRemaining(state.timeRemaining);
        if (!state.isWarning) {
          hideWarning();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, getSessionState, updateTimeRemaining, hideWarning]);

  return (
    <>
      {children}
      <SessionWarningModal
        isOpen={isOpen}
        timeRemaining={timeRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
      />
    </>
  );
}

// Export a hook for accessing session manager functionality
export function useSessionManager() {
  const { getSessionState } = useSessionTimeout({
    warningThreshold: 5 * 60 * 1000,
    checkInterval: 30 * 1000,
  });
  return { getSessionState };
}
