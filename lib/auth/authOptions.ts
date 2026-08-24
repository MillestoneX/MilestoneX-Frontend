import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

/**
 * NextAuth configuration.
 *
 * NOTE: Social login (Google / GitHub) is *not* wired to the backend yet.
 * The backend only supports Stellar wallet challenge-response auth.  Social
 * providers are kept here as a placeholder so the UI can surface the buttons
 * and we can integrate them once the backend adds social login support.
 *
 * Until then the signIn callback simply allows the OAuth sign-in to proceed
 * without attempting to call a non-existent `/auth/social-login` endpoint.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    /**
     * Social login is out-of-scope for the wallet-auth issue.
     * We allow the OAuth sign-in to succeed locally, but it will NOT produce
     * a backend accessToken until the backend adds social login support.
     */
    async signIn() {
      // TODO: once backend adds social login, call authApi.socialLogin here
      // and store the returned accessToken in the auth store.
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
