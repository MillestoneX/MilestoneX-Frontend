"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Wallet, Loader2, AlertCircle } from "lucide-react";

import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { connectForAuth, signChallenge, isFreighterInstalled } from "@/lib/stellar/walletAuth";
import { useRedirectToIntended } from "@/lib/auth/ProtectedRoute";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ApiError } from "@/types/api";
import type { User } from "@/types";

// ---------------------------------------------------------------------------
// Wallet sign-in flow
// ---------------------------------------------------------------------------

async function walletSignIn(): Promise<{ user: User; token: string }> {
  // 1. Connect wallet and get address
  const { walletAddress } = await connectForAuth();

  // 2. Request a challenge from the backend
  const challengeRes = await authApi.getChallenge(walletAddress);
  const { challenge } = challengeRes.data;

  // 3. Sign the challenge with the connected wallet
  const signedChallenge = await signChallenge(challenge);

  // 4. Verify the signed challenge to obtain an accessToken
  const verifyRes = await authApi.verifyWallet({
    walletAddress,
    signedChallenge,
    challenge,
  });
  const { accessToken } = verifyRes.data;

  // 5. Fetch the user profile using the new token
  //    (temporarily patch the store so the request goes through)
  const prevToken = useAuthStore.getState().token;
  useAuthStore.getState().setToken(accessToken);
  try {
    const meRes = await authApi.getMe();
    return { user: meRes.data as unknown as User, token: accessToken };
  } catch {
    // If /users/me is unavailable, construct a minimal wallet-based user
    const user: User = {
      id: walletAddress,
      walletAddress,
      displayName: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`,
    };
    return { user, token: accessToken };
  } finally {
    // If something went wrong before login(), restore previous state
    if (!useAuthStore.getState().isAuthenticated && prevToken) {
      useAuthStore.getState().setToken(prevToken);
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, setLoading, isLoading } = useAuthStore();
  const { connect: connectWallet } = useWalletStore();
  const { redirect } = useRedirectToIntended();

  const [error, setError] = useState<string | null>(null);
  const [freighterAvailable, setFreighterAvailable] = useState<boolean | null>(null);

  // Store redirect query param if provided
  useEffect(() => {
    const redirectParam = searchParams?.get("redirect");
    if (redirectParam) {
      sessionStorage.setItem("intended-destination", redirectParam);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      redirect();
    }
  }, [isAuthenticated, redirect]);

  // Detect Freighter on mount
  useEffect(() => {
    isFreighterInstalled().then(setFreighterAvailable).catch(() => setFreighterAvailable(false));
  }, []);

  // ── Wallet sign-in handler ────────────────────────────────────────────

  const handleWalletSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { user, token } = await walletSignIn();

      // Persist the wallet in the wallet store as well
      connectWallet("freighter", user.walletAddress);

      login(user, token);

      // Remember-me: default to session-only unless the user opts in
      sessionStorage.setItem("milestonex-session-only", "true");

      redirect();
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.status === 401 || apiError.status === 400) {
        setError("Wallet signature was rejected or is invalid. Please try again.");
      } else {
        setError(apiError.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card variant="elevated" padding="lg" className="w-full max-w-sm">
      {/* Brand header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-lg bg-[#1a3a6b] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-base leading-none">M</span>
        </div>
        <span className="text-lg font-semibold text-gray-900">MilestoneX</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
        <p className="text-sm text-gray-500">
          Connect your Stellar wallet to sign in
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-300 text-danger-700 text-sm flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary CTA — wallet sign-in */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
        onClick={handleWalletSignIn}
        className="bg-[#1a3a6b] hover:bg-[#15305a] focus:ring-[#1a3a6b] mt-2 text-base font-semibold"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet & Sign In
          </span>
        )}
      </Button>

      {/* Freighter hint */}
      {freighterAvailable === false && (
        <p className="text-xs text-center text-gray-400 mt-3">
          Freighter wallet extension not detected.{" "}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Install Freighter
          </a>
        </p>
      )}

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-400">or</span>
        </div>
      </div>

      {/* Social login buttons — kept but disabled until backend adds social login */}
      <div className="space-y-3">
        <button
          type="button"
          disabled
          aria-label="Continue with Google (coming soon)"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          disabled
          aria-label="Continue with GitHub (coming soon)"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          Continue with GitHub
        </button>
      </div>

      {/* Note about social logins */}
      <p className="text-xs text-center text-gray-400 mt-3">
        Social logins are coming soon — use your Stellar wallet to sign in today.
      </p>
    </Card>
  );
}
