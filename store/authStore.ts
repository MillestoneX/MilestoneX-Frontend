import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { AuthStore } from '@/types';

// ---------------------------------------------------------------------------
// Cookie helpers — persist the JWT so middleware / SSR can read it
// ---------------------------------------------------------------------------

const setAuthCookie = (token: string) => {
  if (typeof window === 'undefined') return;
  // Read the session-only flag set during wallet sign-in.  When the user
  // chose *not* to "remember" the session we leave the cookie without an
  // explicit expiry so it is automatically cleared when the browser closes.
  const sessionOnly = sessionStorage.getItem('milestonex-session-only') === 'true';
  const days = sessionOnly ? undefined : 30;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    "token=" + encodeURIComponent(token) + expires + "; path=/; SameSite=Lax; Secure";
};

const deleteAuthCookie = () => {
  if (typeof window === 'undefined') return;
  document.cookie =
    "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure";
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        login: (user, token) => {
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          setAuthCookie(token);
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          deleteAuthCookie();
        },

        setUser: (user) => set({ user }),

        setLoading: (loading) => set({ isLoading: loading }),

        setToken: (token) => {
          set({ token });
          setAuthCookie(token);
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.token) {
            setAuthCookie(state.token);
          }
        },
      },
    ),
    {
      name: 'AuthStore',
    },
  ),
);
