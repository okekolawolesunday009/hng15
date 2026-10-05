export type BackendEnvironment = {
  nodeEnv: string;
  databaseUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleMobileClientIds: string[];
  mailgunApiKey?: string;
}

export function getBackendEnvironment(): BackendEnvironment {
  const googleMobileClientIds = (process.env.GOOGLE_MOBILE_CLIENT_IDS ?? "")
    .split(",")
    .map((clientId) => clientId.trim())
    .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleMobileClientIds,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
  };
}
