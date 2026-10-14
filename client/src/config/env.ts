type RuntimeEnv = Record<string, string | undefined>;

const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnv }).env;
const nodeEnv = (globalThis as { process?: { env?: RuntimeEnv } }).process?.env;

const runtimeEnv: RuntimeEnv = {
  ...(nodeEnv ?? {}),
  ...(viteEnv ?? {}),
};

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = runtimeEnv[key] ?? defaultValue;

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

// The session cookie is SameSite=Lax. localhost and 127.0.0.1 are different
// sites, so a page on one host will not send a cookie set by the other.
export function alignLocalApiUrl(
  configured: string,
  pageHostname?: string
): string {
  if (!pageHostname || !LOCAL_HOSTS.has(pageHostname)) return configured;
  try {
    const url = new URL(configured);
    if (!LOCAL_HOSTS.has(url.hostname) || url.hostname === pageHostname) {
      return configured;
    }
    url.hostname = pageHostname;
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

const configuredApiUrl = getEnv('VITE_API_URL', 'http://localhost:3000');
const pageHostname =
  typeof window !== 'undefined' ? window.location.hostname : undefined;

export const API_URL = alignLocalApiUrl(configuredApiUrl, pageHostname);
