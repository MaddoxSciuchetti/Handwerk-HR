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

// Local session cookies require the page and API to use the same hostname.
const defaultApiUrl =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3000'
    : 'http://localhost:3000';

export const API_URL = getEnv('VITE_API_URL', defaultApiUrl);
