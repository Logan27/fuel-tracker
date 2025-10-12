// Get API URL and ensure it doesn't end with slash
const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || '/api/v1';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const ENV = {
  API_URL: getApiUrl(),
  ENV: import.meta.env.VITE_ENV || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

