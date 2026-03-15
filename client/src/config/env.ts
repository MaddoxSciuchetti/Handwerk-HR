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

export const API_URL = getEnv('VITE_API_URL', 'http://localhost:3000');
