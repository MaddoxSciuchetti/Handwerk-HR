/** Set by the axios 401 path before a hard redirect to `/login`. */
export const AUTH_BOUNCE_TO_LOGIN_KEY = 'auth-bounce-to-login';

/** Timestamp of the last successful staging session mint. */
export const STAGING_ENTER_AT_KEY = 'staging-auto-enter-at';

const RECENT_ENTER_MS = 15_000;

export function markAuthBounceToLogin() {
  try {
    sessionStorage.setItem(AUTH_BOUNCE_TO_LOGIN_KEY, '1');
  } catch {
    // ignore quota / private-mode failures
  }
}

export function consumeAuthBounceToLogin() {
  try {
    const bounced = sessionStorage.getItem(AUTH_BOUNCE_TO_LOGIN_KEY) === '1';
    sessionStorage.removeItem(AUTH_BOUNCE_TO_LOGIN_KEY);
    return bounced;
  } catch {
    return false;
  }
}

export function markStagingEnter() {
  try {
    sessionStorage.setItem(STAGING_ENTER_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearStagingEnter() {
  try {
    sessionStorage.removeItem(STAGING_ENTER_AT_KEY);
  } catch {
    // ignore
  }
}

export function wasStagingEnteredRecently() {
  try {
    const raw = sessionStorage.getItem(STAGING_ENTER_AT_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < RECENT_ENTER_MS;
  } catch {
    return false;
  }
}
