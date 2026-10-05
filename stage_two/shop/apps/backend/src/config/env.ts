export type BackendEnvironment = {
  nodeEnv: string;
  databaseUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  mailgunApiKey?: string;
};

export function getBackendEnvironment(): BackendEnvironment {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseUrl: process.env.DATABASE_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
  };
}
