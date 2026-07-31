type ClientEnv = {
  API_URL: string;
  WS_URL: string;
  POSTHOG_KEY?: string;
  POSTHOG_HOST: string;
};

const readRequiredUrl = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`);
  }
};

const readOptionalUrl = (key: keyof ImportMetaEnv, fallback: string): string => {
  const value = import.meta.env[key]?.trim() || fallback;

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL`);
  }
};

export const env: ClientEnv = {
  API_URL: readRequiredUrl("VITE_API_URL"),
  WS_URL: readOptionalUrl("VITE_WS_URL", "ws://localhost:3000"),
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY?.trim() || undefined,
  POSTHOG_HOST: readOptionalUrl("VITE_POSTHOG_HOST", "https://app.posthog.com"),
};
