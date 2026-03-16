const env = globalThis.process?.env;
export const API_BASE_URL =
  env?.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000';
