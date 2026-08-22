/**
 * Session expiry signalling.
 *
 * When the API response interceptor receives a 401 it calls
 * {@link emitSessionExpired}.  Any component (e.g. SessionExpiredModal) can
 * subscribe via {@link onSessionExpired} to show the wallet re-auth flow.
 */

import { InternalAxiosRequestConfig } from "axios";

// ---------------------------------------------------------------------------
// Listener (single subscriber – the SessionExpiredModal)
// ---------------------------------------------------------------------------

type SessionExpiredListener = (config: InternalAxiosRequestConfig) => void;

let sessionExpiredListener: SessionExpiredListener | null = null;

/** Register the component that should open when the session expires. */
export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListener = listener;
}

/** Called by the response interceptor on 401. */
export function emitSessionExpired(config: InternalAxiosRequestConfig) {
  sessionExpiredListener?.(config);
}

// ---------------------------------------------------------------------------
// Refreshing guard — prevents multiple 401 handlers from stacking up
// (used by the interceptor while the re-auth modal is opening)
// ---------------------------------------------------------------------------

let isRefreshing = false;

export function getIsRefreshing() {
  return isRefreshing;
}

export function setIsRefreshing(value: boolean) {
  isRefreshing = value;
}
