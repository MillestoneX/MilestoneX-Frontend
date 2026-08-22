"use client";

import { useEffect, useState, useCallback } from "react";
import { LogIn, X, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { authApi } from "@/lib/api/auth";
import {
  connectForAuth,
  signChallenge,
} from "@/lib/stellar/walletAuth";
import { onSessionExpired, setIsRefreshing } from "@/lib/auth/sessionExpiry";
import type { User } from "@/types";

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout } = useAuthStore();
  const { connect: connectWallet } = useWalletStore();
  const { error: toastError, success: toastSuccess, warning } = useToast();

  useEffect(() => {
    onSessionExpired(() => {
      warning("Session expired. Please sign in again with your wallet.");
      setIsOpen(true);
    });
  }, [warning]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsRefreshing(false);
  }, []);

  const handleWalletReAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      // Clear expired session first
      logout();

      // 1. Connect wallet and get address
      const { walletAddress } = await connectForAuth();

      // 2. Request a challenge
      const challengeRes = await authApi.getChallenge(walletAddress);
      const { challenge } = challengeRes.data;

      // 3. Sign the challenge
      const signedChallenge = await signChallenge(challenge);

      // 4. Verify → get new accessToken
      const verifyRes = await authApi.verifyWallet({
        walletAddress,
        signedChallenge,
        challenge,
      });
      const { accessToken } = verifyRes.data;

      // 5. Fetch user profile
      useAuthStore.getState().setToken(accessToken);
      let user: User;
      try {
        const meRes = await authApi.getMe();
        user = meRes.data as unknown as User;
      } catch {
        user = {
          id: walletAddress,
          walletAddress,
          displayName: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`,
        };
      }

      // 6. Store new session
      connectWallet("freighter", walletAddress);
      login(user, accessToken);

      toastSuccess("Signed in. Resuming where you left off.");
      setIsOpen(false);
    } catch (err) {
      console.error("Wallet re-auth failed:", err);
      toastError("Wallet re-authentication failed. Please try again or sign in from the login page.");
    } finally {
      setIsLoading(false);
    }
  }, [login, logout, connectWallet, toastSuccess, toastError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <Card className="p-6 shadow-2xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Session Expired</h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Your session has expired. Sign in again with your Stellar wallet to continue — your unsaved work is safe.
          </p>

          <Button
            type="button"
            fullWidth
            isLoading={isLoading}
            onClick={handleWalletReAuth}
            className="mt-1"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 mr-2" />
                Re-authenticate with Wallet
              </span>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
