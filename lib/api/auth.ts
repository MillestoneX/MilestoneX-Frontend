import { apiClient } from "./interceptors";
import type {
  ApiResponse,
  AuthChallenge,
  AuthVerifyRequest,
  AuthVerifyResponse,
  AuthLogoutResponse,
} from "@/types/api";
import type { User } from "@/types";

/**
 * Auth API — wallet challenge-response flow.
 *
 * Matches the MilestoneX-Backend auth contract:
 *   GET  /auth/challenge        → { challenge, account, networkPassphrase }
 *   POST /auth/verify           → { accessToken, tokenType }
 *   POST /auth/logout           → { message }
 *   GET  /users/me              → wallet-based User profile
 */
export const authApi = {
  /**
   * Request a sign-in challenge from the backend.
   * The returned challenge must be signed by the caller's Stellar wallet.
   */
  getChallenge: async (
    walletAddress: string,
  ): Promise<ApiResponse<AuthChallenge>> => {
    const response = await apiClient.get<ApiResponse<AuthChallenge>>(
      "/auth/challenge",
      { params: { walletAddress } },
    );
    return response.data;
  },

  /**
   * Submit the signed challenge to obtain an accessToken.
   */
  verifyWallet: async (
    data: AuthVerifyRequest,
  ): Promise<ApiResponse<AuthVerifyResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthVerifyResponse>>(
      "/auth/verify",
      data,
    );
    return response.data;
  },

  /**
   * Invalidate the current session on the backend.
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  /**
   * Fetch the current authenticated user profile (wallet-based).
   * Falls back to constructing a minimal User from the JWT if the endpoint
   * is unavailable.
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data;
  },
};
